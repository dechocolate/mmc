var app = require('../../server/server');
var util = require('./util');
var fs = require('fs');
var path = require('path');
var YouTube = require('youtube-node');
var youtubedl = require('youtube-dl');
var request = require('request');
var Promise = require('bluebird');


var content = app.models.content; 
var collection = app.models.collection; 
var audio = app.models.audio; 

var youTube = new YouTube();
    youTube.setKey('AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw');

var items = null;
var data  = [];
var count = 0;



// https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=boyceavenue&key=AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw
// https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UCgc00bfF_PvO_2AvqJZHXFg&key=AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw

/**
 *  Find Collection info
**/
function findCollection(data){
    
    var filter = null; 

    if(data.isAll)
    {
        filter = { fields: {type: true, channelId: true, pageInfo: true} }
    } 
    else
    {
        filter = { fields: {type: true, channelId: true, pageInfo: true}, where: {channelId: data.channelId} }
    } 

    collection.find(filter,  function(err, result) { 

        for (var i=0; i<result.length; i++) 
        {
            var obj = result[i];

            collection.updateAll({channelId: obj.channelId}, {state: true},  function(err, res){
                        

                if(obj.type === 'youtube')
                {                    
                    callJob(obj.channelId, null);                
                }            
            });    

        }// end for
    });
};



/**
 *  Jov trriger
**/
function callJob(channelId, pageToken){

    collectYoutube(channelId, pageToken)
    .then(function(res){        
        if(res.PageToken != null) callJob(channelId, res.PageToken);
        else 
        {
            collection.updateAll({channelId: channelId}, {state: false},  function(err, result){
                console.log("Create Suceess :: " + count); 
                util.logger('info').info("Create Suceess :: " + count); 
            });  
        }
    });
};



/**
 *  Youtube API
**/
function collectYoutube(channelId, pageToken){

    return new Promise(function(resolve, reject){
        
        /**
        * Videos data from query
        * @param {string} channelId
        * @param {int} maxResults
        * @param {string} pageToken
        * @param {string} order
        * @param {function} callback
        */
        youTube.channel(channelId, 1, pageToken, 'date', function(error, result) {
            if (error) 
            {
                util.logger('error').error(JSON.stringify(error, null, 2));                    
            }
            else 
            {
                // console.log("-----------------------------------------------------------------------------");
                // console.log(JSON.stringify(result.pageInfo, null, 2));
                // console.log(result.nextPageToken);            
                // console.log(result.items.length);       
                // console.log("-----------------------------------------------------------------------------");                     
                
                items = result.items;

                //Check items length
                if(items.length === 0) return resolve( {PageToken: null} );                            

                for (var i=0; i<items.length; i++) 
                {
                    var videoId = items[i].id.videoId;
                    // console.log(JSON.stringify(items[i], null, 2));

                    if(null != items[i].id.videoId)
                    {
                        checkExist(items[i])
                        .then(function(res){                    

                            if(res.res)
                            {
                                return resolve( {PageToken: result.nextPageToken, pageInfo: result.pageInfo} );                            
                            }
                            else
                            {                                
                                data.push(res.data);
                                createContent(data)              
                                .then(function(res){                                      
                                    data = [];
                                    return resolve( {PageToken: result.nextPageToken, pageInfo: result.pageInfo} );
                                    // return resolve( {PageToken: null, pageInfo: result.pageInfo} );
                                }); // End createContent    
                            }
                        });  // End checkExist               

                    }
                    else
                    {
                        return resolve( {PageToken: result.nextPageToken, pageInfo: result.pageInfo} );
                    }
                } // end for                

            }
        });
        
    })

};


/**
 *  Prevent overlap insert
**/
function checkExist(obj){    

    return new Promise(function(resolve, reject){

        content.find({ where: {videoId: obj.id.videoId} },  function(err, result) { 

            if(result.length > 0) return resolve({res:true});
            else return resolve({
                    res:false, 
                    data : {
                        type: 'youtube',
                        channelId: obj.snippet.channelId,
                        channelTitle: obj.snippet.channelTitle,     
                        title: obj.snippet.title,
                        description: obj.snippet.description,
                        thumbnails: obj.snippet.thumbnails,
                        videoId: obj.id.videoId,
                        publishedAt: obj.snippet.publishedAt                        
                    }
                });                 

        });        
    });  
};


/**
 * Insert Content
**/
function createContent(data){    

    return new Promise(function(resolve, reject){


        for (var i=0; i<data.length; i++) 
        {
            content.create({
                type: data[i].type,  
                channelId: data[i].channelId,
                channelTitle: data[i].channelTitle,      
                title: data[i].title,
                description: data[i].description,
                thumbnails: data[i].thumbnails,
                videoId: data[i].videoId,
                publishedAt: data[i].publishedAt,
                views: 0,
                created: new Date().toJSON(),
                updated: null,
                deleted: false
            },function (err, obj) {
                if (err !== null) {
                    util.logger('error').error(JSON.stringify(err, null, 2));                    
                }
                else {    
                    createMp3(obj.id, obj.channelId, obj.videoId, obj.title)
                    // getMp3(obj.id, obj.channelId, obj.videoId, obj.title)
                    // .then(function(res){                    
                    //     console.log(res);
                    //     return resolve(null);
                    // });
                }
            });              
        }
        
    });
};


/**
 *  Get Mp3 File From http://www.youtubemp3script.com
**/
function getMp3(id, channelId, videoId, title){
    
    var dir = path.join(__dirname + '/../storage/' + channelId);

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }    

    return new Promise(function(resolve, reject){

        getYoutubeMp3Script(videoId)
        .then(function(url){    

            console.log(url);

            if(null == url)
            {
                setTimeout(function () {                  
                    getMp3(id, channelId, videoId, title);
                }, 5000);
            }
            else
            {

                var stream = request
                    .get('http:'+url)
                    .on('error', function(err) {
                        util.logger('error').error("youtubedl.exec :: " + JSON.stringify(err, null, 2)); 

                        content.destroyAll({id: id},function (err, obj) {
                            
                            if (err) {
                                util.logger('error').error("content.destroyAll :: " + JSON.stringify(err, null, 2)); 
                            }                    
                            
                            return resolve(null);          
                        });
                    })
                    .pipe(fs.createWriteStream((__dirname, 'server/storage/' + channelId + '/' + videoId + '.mp3')));

                stream.on('finish', function () {                    
                    getFilesizeInBytes(dir + "/" + videoId + ".mp3")
                    .then(function(res){   

                        util.logger('info').info("getFilesizeInBytes  :: " + JSON.stringify(res, null, 2)); 

                        audio.create({           
                            contenId: id, 
                            name: title, 
                            created: new Date().toJSON(),
                            size: res.size, 
                            alias: title,                    
                            url: "/" + channelId + "/" + videoId + ".mp3"            
                        },function (err, obj) {
                            if (err !== null) {
                                util.logger('error').error("audio.create :: " + JSON.stringify(err, null, 2)); 
                                return resolve(null);  
                            }
                            else {
                                count++;
                                return resolve(null);                
                            }
                        });  

                    });
                });     

            };


            
        });
      
    });

};



/**
 * Create Mp3 File
**/
function createMp3(id, channelId, videoId, title){
    
    return new Promise(function(resolve, reject){

        var dir = path.join(__dirname + '/../storage/' + channelId);

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        
        var url = 'https://www.youtube.com/watch?v=' + videoId;            

        //Convert to MP3
        // youtubedl.exec(url, ['-x', '-o'+videoId+'.%(ext)s','--audio-format', 'mp3'], {cwd: (__dirname, 'server/storage/' + channelId)}, function(err, output) {
        youtubedl.exec(url, ['-x', '-o'+videoId+'.%(ext)s','--audio-format', 'mp3'], {cwd: (__dirname, 'server/storage/' + channelId)}, function(err, output) {
            if (err) {  

                util.logger('error').error("youtubedl.exec :: " + id); 
                util.logger('error').error("youtubedl.exec :: " + JSON.stringify(err, null, 2)); 

                content.destroyAll({id: id},function (err, obj) {
                    
                    if (err) {
                        util.logger('error').error("content.destroyAll :: " + JSON.stringify(err, null, 2)); 
                    }                    
                    
                    return resolve(null);          
                });
            }

            util.logger('info').info("youtubedl.exec output :: " + JSON.stringify(output, null, 2)); 

            getFilesizeInBytes(dir + "/" + videoId + ".mp3")
            .then(function(res){   

                util.logger('info').info("getFilesizeInBytes  :: " + JSON.stringify(res, null, 2)); 

                audio.create({           
                    contenId: id, 
                    name: title, 
                    created: new Date().toJSON(),
                    size: res.size, 
                    alias: title,                    
                    url: "/" + channelId + "/" + videoId + ".mp3"            
                },function (err, obj) {
                    if (err !== null) {
                        util.logger('error').error("audio.create :: " + JSON.stringify(err, null, 2)); 
                        return resolve(null);  
                    }
                    else {
                        count++;
                        return resolve(null);                
                    }
                });  

            });


        });

    });
};


function getFilesizeInBytes(filename) {

    return new Promise(function(resolve, reject){
        var stats = fs.statSync(filename);        
        return resolve({size: stats["size"]});                
    });
};

function getYoutubeMp3Script(videoId) {

    return new Promise(function(resolve, reject){
        
        var options = {
            uri: 'http://www.yt-mp3.com/fetch?v='+videoId,
            method: 'GET',
            timeout: 120000           
        }

        request(options, function(error, response, body){
            if (!error && response.statusCode == 200) 
            {
                console.log('getMp3 :: ',body);

                var data = JSON.parse(body);                  
                return resolve(data.url); 
            }
            else
            {
                util.logger('error').error("youtubedl.exec :: " + id); 
                util.logger('error').error("youtubedl.exec :: " + JSON.stringify(err, null, 2)); 

                content.destroyAll({id: id},function (err, obj) {
                    
                    if (err) {
                        util.logger('error').error("content.destroyAll :: " + JSON.stringify(err, null, 2)); 
                    }                    
                    
                    return resolve(null);          
                });
            }
        });    

    });
};

exports.executeAll = function(data){
    findCollection({isAll:true});
}; 


exports.executeById = function(data){
    findCollection({isAll:false, channelId:data.channelId});
}; 