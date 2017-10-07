var app = require('../../server/server');
var util = require('./util');
var fs = require('fs');
var path = require('path');
var YouTube = require('youtube-node');
// var youtubedl = require('youtube-dl');
var request = require('request');
var Promise = require('bluebird');

var content = app.models.content; 
var keyword = app.models.keyword; 

var youTube = new YouTube();
    youTube.setKey('AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw');


// https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=boyceavenue&key=AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw
// https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UCgc00bfF_PvO_2AvqJZHXFg&key=AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw




/**
 *  Find Collection info
**/
function selectContent(skip){

    console.log('selectContent', skip)
    
    return new Promise(function(resolve, reject){

        var filter = { fields: {id: true, videoId: true}, skip: skip, limit: '100', where:{tags: {exists: false}}}

        content.find(filter,  function(err, result) { 

            if(err) console.log('selectContent err', err);

            if(result.length != 0)
            {
                for (var i=0; i<result.length; i++) 
                {   
                    callYoutube(result[i].id, result[i].videoId)
                    .then(function(res){                    
                        resolve({res:true});           
                    });
                }// end for
            }
            else
            {
                return resolve({res:false});   
            }
        });
    });      

};

function callYoutube(id, videoId){

    return new Promise(function(resolve, reject){

        youTube.getById(videoId, function(err, result) {

            if(err) console.log('callYoutube err', err);
            else resolve({res:true});   

            if(result.items.length > 0)
            {            
                if(null != result.items[0].snippet.tags)
                {
                    var arr = result.items[0].snippet.tags;

                    insertTags(id, arr)
                    .then(function(res){                                                
                        resolve({res:true});  
                    });  

                } 
                else
                {
                	insertTags(id, [])
                    .then(function(res){                                                
                        resolve({res:true});  
                    });  
                }                 	
            }
            else resolve({res:true});   
        });


    });
};

function insertTags(id, arr){

    return new Promise(function(resolve, reject){
       
    	console.log(arr);

        content.update(
		   { id:id },
		   { tags: arr },
		   { upsert: true }
		).then(function(res){                                                
			console.log(res);
            resolve({res:true});  
        });  

    });      
};



exports.getYoutubeKeyword = function(){
    
    var skip = 0;

    selectContent(skip)
    .then(function(res){                    
        
        if(res)
        {
            skip += 100
            selectContent(skip)
        }
        else return;
    
    });
}; 



function init(){
    
    selectContent(skip)
    .then(function(res){      

        if(res.res)
        {
            skip += 100;            
            if(res.res) init();
            else{console.log('finish'); return;}  
        }
        else{
            console.log('finish'); return;
        } 

    });
}

var skip = 0;
// init();

