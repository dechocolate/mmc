var app = require('../../server/server');
var util = require('./util');
var fs = require('fs');
var path = require('path');
var YouTube = require('youtube-node');
// var youtubedl = require('youtube-dl');
var request = require('request');
var Promise = require('bluebird');

var content = app.models.content; 
var collection = app.models.collection; 
var audio = app.models.audio; 
var container = app.models.container; 

var youTube = new YouTube();
    youTube.setKey('AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw');


// https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=boyceavenue&key=AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw
// https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UCgc00bfF_PvO_2AvqJZHXFg&key=AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw

/**
 *  Create Collector
**/
function Collector(channelId, pageToken, pageInfo){
    this.channelId = channelId;
    this.pageToken = pageToken;
    this.pageInfo = pageInfo;
    this.items = null;
    this.data = [];
    this.count = 0;
    this.checkCount = 0;
    this.totalCount = 0;
    this.flag = true;
};


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
                    var collector = new Collector(obj.channelId, null, null);                                                 
                    callJob(collector);                
                }                            
            });    

        }// end for
    });
};



/**
 *  Job trriger
**/
function callJob(collector){

    collectYoutube(collector)
    .then(function(collector){        
        if(collector.pageToken != null) callJob(collector);
        else 
        {
            collection.updateAll({channelId: collector.channelId}, {state: false},  function(err, result){
                delete collector;
                util.logger('info').info("Create Suceess ::", collector.channelId, collector.totalCount, collector.checkCount, collector.count);                 
            });  
        }
    });

};



/**
 *  Youtube API
**/
function collectYoutube(collector){

    // console.log('collectYoutube', collector.channelId, collector.pageToken);
    util.logger('debug').debug('collectYoutube', collector.channelId, collector.pageToken);

    return new Promise(function(resolve, reject){
        
        /**
        * Videos data from query
        * @param {string} channelId
        * @param {int} maxResults
        * @param {string} pageToken
        * @param {string} order
        * @param {function} callback
        */
        youTube.channel(collector.channelId, 1, collector.pageToken, 'date', function(error, result) {
            if (error) 
            {
                util.logger('error').error("collectYoutube ::", JSON.stringify(error, null, 2));  

                setTimeout(function () {                  
                    return resolve(collector);                                            
                }, 30000);                      
            }
            else 
            {
                collector.items = result.items;
                collector.totalCount++;

                util.logger('debug').debug('collectYoutube', collector.channelId, collector.items);

                //Check items length
                if(collector.items.length > 0)
                {
                    for (var i=0; i<collector.items.length; i++) 
                    {
                        if(null != collector.items[i].id.videoId)
                        {
                            collector.checkCount++;

                            checkExist(collector.items[i])
                            .then(function(res){                    

                                if(res.res)
                                {
                                    collector.pageToken = result.nextPageToken;
                                    collector.pageInfo = result.pageInfo;
                                    return resolve(collector);                            
                                }
                                else
                                {                                
                                    collector.data.push(res.data);
                                    createContent(collector)              
                                    .then(function(res){                                      
                                        if(res){
                                            collector.data = [];
                                            collector.pageToken = result.nextPageToken;
                                            collector.pageInfo = result.pageInfo;
                                            return resolve(collector);                                        
                                        }
                                    }); // End createContent    
                                }
                            });  // End checkExist               
                        }
                        else
                        {
                            collector.pageToken = result.nextPageToken;
                            collector.pageInfo = result.pageInfo;
                            return resolve(collector);
                        }
                    } // end for                                    
                }
                else
                {
                    collector.pageToken = result.nextPageToken;
                    collector.pageInfo = result.pageInfo;
                    return resolve(collector);                            
                } 
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
function createContent(collector){    

    return new Promise(function(resolve, reject){
 
        for (var i=0; i<collector.data.length; i++) 
        {
            content.create({
                type: collector.data[i].type,  
                channelId: collector.data[i].channelId,
                channelTitle: collector.data[i].channelTitle,      
                title: collector.data[i].title,
                description: collector.data[i].description,
                thumbnails: collector.data[i].thumbnails,
                videoId: collector.data[i].videoId,
                publishedAt: collector.data[i].publishedAt,
                views: 0,
                created: new Date().toJSON(),
                updated: null,
                display: true, 
                deleted: false
            },function (err, obj) {
                if (err !== null) {
                    util.logger('error').error("createContent ::", JSON.stringify(err, null, 2));                    
                }
                else {                        
                    callYoutubeMp3Script(obj.id, obj.channelId, obj.videoId, obj.title, collector)
                    .then(function(res){    
                        if(res) return resolve(true);          
                    });    
                }
            });              
        }
        
    });
};


/**
 *  Call Mp3 API From http://www.youtubemp3script.com
**/
function callYoutubeMp3Script(id, channelId, videoId, title, collector){

    return new Promise(function(resolve, reject){

        getMp3(id, channelId, videoId, title, collector)
        .then(function(res){                    

            if(res.res)
            {
                if(collector.flag){
                    return resolve(true);   
                } 
                else{                
                    collector.flag = true;
                    collector.data = [];
                    callJob(collector);    
                }
            }            
            else
            {
                collector.flag = false;

                var timeout = 1000 * 20;

                if(null != res.timeout) timeout = res.timeout * 1000;                

                setTimeout(function () {                  
                    callYoutubeMp3Script(id, channelId, videoId, title, collector);
                }, timeout);    

            }            
        });
    });
};


/**
 *  Get Mp3 File From http://www.youtubemp3script.com
**/
function getMp3(id, channelId, videoId, title, collector){
        
    // var dir = path.join(__dirname + '/../storage/' + channelId);
    var dir = util.Globals.storagePath +'/'+ channelId;

    console.log('dir', dir);

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }    

    return new Promise(function(resolve, reject){

        getYoutubeMp3Script(videoId)
        .then(function(res){    

            if(null == res.url)
            {   
                if(null == res.timeout)
                {                    
                    // skip video, when res.url, res.timeout is null.
                    util.logger('debug').debug("getYoutubeMp3Script null :: ", videoId, channelId, title, JSON.stringify(res, null, 2));     
                    content.destroyAll({id: id},function (err, obj) {                            
                        if (err) {
                            util.logger('error').error("getMp3.destroyAll :: ", JSON.stringify(err, null, 2)); 
                        }                    
                        
                        return resolve({res:true});                        
                    });
                }
                else return resolve({res:false, timeout:res.timeout});   
            }
            else
            {

                var stream = request
                    .get('http:'+res.url)
                    .on('error', function(err) {
                        util.logger('error').error("getMp3 ::", JSON.stringify(err, null, 2)); 

                        content.destroyAll({id: id},function (err, obj) {
                            
                            if (err) {
                                util.logger('error').error("getMp3.destroyAll :: ", JSON.stringify(err, null, 2)); 
                            }                    
                            
                            return resolve({res:true});                        
                        });
                    })
                    .pipe(fs.createWriteStream((util.Globals.storagePath +'/'+ channelId + '/' + videoId + '.mp3')));
                    // .pipe(fs.createWriteStream((__dirname, 'server/storage/' + channelId + '/' + videoId + '.mp3')));

                stream.on('finish', function () {                    
                    getFilesizeInBytes(dir + "/" + videoId + ".mp3")
                    .then(function(result){                           

                        audio.create({           
                            // channelId: channelId, 
                            // videoId: videoId,
                            contenId: id, 
                            length: res.length,
                            name: title, 
                            created: new Date().toJSON(),
                            size: result.size, 
                            alias: title,  
                            // url: "/" + channelId + "/" + videoId + ".mp3"            
                            url: "/api/containers/" + channelId + "/download/" + videoId + ".mp3"            
                        },function (err, obj) {
                            if (err !== null) {
                                util.logger('error').error("audio.create :: ", JSON.stringify(err, null, 2)); 
                                return resolve({res:true});                 
                            }
                            else {

                                collector.count++;
                                util.logger('info').info("getMp3.audio.create  ::", JSON.stringify(obj, null, 2)); 
                                // console.log('count', collector.channelId, collector.count);
                                util.logger('debug').debug('count', collector.channelId, collector.count);
                                return resolve({res:true});          
                            }
                        });  

                    });
                });     

            };


            
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
            uri: 'http://www.yt-mp3.com/fetch?v='+videoId+'&apikey=1234567',
            method: 'GET',
            timeout: 120000           
        }

        request(options, function(error, response, body){
            
            // console.log('getYoutubeMp3Script :: ', body);
            util.logger('debug').debug('getYoutubeMp3Script :: ', body);
            
            //if(!error && response.statusCode == 200 && null != body)
            if(null != body)
            {
                var data = JSON.parse(body);                  
                // console.log('body.status', data.status)
                util.logger('debug').debug('body.status', data.status);


                if(data.status === 'ok') 
                {
                    if(data.ready) return resolve({url:data.url, length:data.length, view_count:data.view_count}); 
                    else return resolve({url:null, timeout: 5});  
                }
                else if(data.status === 'timeout') 
                {
                    return resolve({url:null, timeout: data.timeout});          
                }
                else if(data.status === 'error') 
                {
                    return resolve({url:null, timeout:null, message:data.message});          
                }
                else
                {
                    return resolve({url:null, timeout:null, message:data.message});                    
                }
            }
            else
            {
                util.logger('error').error("getYoutubeMp3Script ::", body); 
                return resolve({url:null, timeout:null, body:body});
            }

        });    

    });
};

exports.executeAll = function(data){
    findCollection({isAll:true});
}; 


exports.executeById = function(data){  

    container.upload(data.req, data.res, {}, function (err, fileObj, next) {
        if(err) console.log('err', err);
    });

    findCollection({isAll:false, channelId:data.channelId});
}; 

















function getCustomYoutube(contentId, videoId) {
    
    return new Promise(function(resolve, reject){

        // var dir = path.join(__dirname + '/../storage/custom');
        var dir = util.Globals.storagePath +'/UCQIP6tGA4AQEIkABgb1Alh1';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        var options = {
            // uri: 'http://www.youtubeinmp3.com/fetch/?format=JSON&video=https://www.youtube.com/watch?v='+videoId,
            uri: 'http://www.yt-mp3.com/fetch?v='+videoId+'&apikey=1234567',
            method: 'GET',
            timeout: 120000
        }

        request(options, function(error, response, body){

            console.log('getYoutubeMp3Script :: ', body);
            util.logger('debug').debug('getYoutubeMp3Script :: ', body);

            //if(!error && response.statusCode == 200 && null != body)
            if(null != body)
            {
                var data = JSON.parse(body);
                downloadCustomFile(contentId, videoId, data, dir);
                util.logger('debug').debug('body.status', data);
            }
            else
            {
                util.logger('error').error("getYoutubeMp3Script ::", body);
                return resolve({url:null, timeout:null, body:body});
            }

        });

    });
};
    



function downloadCustomFile(contentId, videoId, data, dir){

    console.log('downloadCustomFile : ', data)

    var stream = request
        // .get(data.link)
        .get('http:'+data.url)
        .on('error', function(err) {
            util.logger('error').error("getMp3 ::", JSON.stringify(err, null, 2));

            content.destroyAll({id: videoId},function (err, obj) {

                if (err) {
                    util.logger('error').error("getMp3.destroyAll :: ", JSON.stringify(err, null, 2));
                }

                return resolve({res:true});
            });
        })
        .pipe(fs.createWriteStream((util.Globals.storagePath +'/UCQIP6tGA4AQEIkABgb1Alh1/' + videoId + '.mp3')));
        // .pipe(fs.createWriteStream((__dirname, 'server/storage/' + channelId + '/' + videoId + '.mp3')));

    stream.on('finish', function () {
        getFilesizeInBytes(dir + "/" + videoId + ".mp3")
        .then(function(result){

            audio.create({
                // channelId: channelId,
                // videoId: videoId,
                contenId: contentId,
                length: data.length,
                name: data.title,
                created: new Date().toJSON(),
                size: result.size,
                alias: data.title,
                // url: "/" + channelId + "/" + videoId + ".mp3"
                url: "/api/containers/UCQIP6tGA4AQEIkABgb1Alh1/download/" + videoId + ".mp3"
            },function (err, obj) {
                if (err) util.logger('error').error("audio.create :: ", JSON.stringify(err, null, 2));
                console.log('downloadFile : ', obj )
            });

        });
    });
}






// custom
exports.executeCustom = function(videoId){  
    console.log('data', videoId);

    youTube.getById(videoId, function(error, result) {
        if (error) console.log(error);    

        content.create({
            type: 'youtube',  
            channelId: 'UCQIP6tGA4AQEIkABgb1Alh1',
            channelTitle: '1 Recommand',      
            title: result.items[0].snippet.title,
            description: result.items[0].snippet.description,        
            thumbnails: result.items[0].snippet.thumbnails,        
            tags: result.items[0].snippet.tags,        
            videoId: videoId,
            views: 0,
            publishedAt: new Date().toJSON(),
            created: new Date().toJSON(),
            updated: null,
            display: true, 
            deleted: false
        },function (err, obj) {
            if (err) util.logger('error').error("createContent ::", JSON.stringify(err, null, 2));                        
            
            getCustomYoutube(obj.id, videoId);
        });        
    });    

}; 