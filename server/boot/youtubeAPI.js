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
var temp = app.models.temp; 

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

        var filter = { fields: {tags: true}, skip: skip, limit: '100' }

        content.find(filter,  function(err, result) {             

            if(err) return resolve({res:false});   

            if(result.length != 0)
            {
                
                for (var i=0; i<result.length; i++) 
                {   
                    console.log('result', result[i].tags)
                    
                    if(null != result[i].tags){
                        for (var  j=0; j<result[i].tags.length; j++) 
                        {   
                            upsertKeyword(result[i].tags[j])
                            .then(function(res){          
                                if(i == result.length) resolve({res:true});           
                            });
                        }
                    }
                }// end for
            }
            else
            {
                return resolve({res:false});   
            }

        });
    });      

};


function upsertKeyword(name){

    return new Promise(function(resolve, reject){
       
        temp.create({name: name, count:0},  function(err, result) { 
            if(err) {
                increaseKeyword(name)
                .then(function(res){                    
                    resolve({res:true});           
                });
            }
            else resolve({res:true});           
        });

    });      
};

function increaseKeyword(name){

    console.log('increaseKeyword', name);

    return new Promise(function(resolve, reject){

        temp.updateAll({name: name}, {'$inc': {'count': 1}},  function(err, result) { 
            if(err) console.log('increaseKeyword err', err);
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
    
    console.log('init ..')

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

