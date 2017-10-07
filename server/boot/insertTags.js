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


var arr_keyword = [];


/**
 *  Find Collection info
**/
function selectContent(skip){

    console.log('selectContent', skip)
    
    return new Promise(function(resolve, reject){

        var filter = { fields: {id: true, tags: true}, skip: skip, limit: '100' }

        content.find(filter,  function(err, result) {             


            if(err) return resolve({res:false});   

            if(result.length != 0)
            {
                
                for (var i=0; i<result.length; i++) 
                {                       
                    if(null != result[i].tags){

                        var arr_old = result[i].tags.map(Function.prototype.call.bind(String.prototype.trim));
                        arr_old = arr_old.toString().toLowerCase().split(",");

                        matchKeyword(result[i].id, arr_old)
                        .then(function(res){       

                            upsertKeyword(res.id, res.tag)
                            .then(function(res){                    
                                resolve({res:true});   
                            });    
                        });
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



function matchKeyword(id, tags){

    return new Promise(function(resolve, reject){
        var arr_new = [];

        // console.log(tags);

        for (var i=0; i<tags.length; i++) {
            
            // console.log(i, arr_keyword.length);

            // if(tags.indexOf(arr_keyword[i]) > -1){
            //     if(arr_new.indexOf(arr_keyword[i]) < 0){
            //         arr_new.push(arr_keyword[i]);                         
            //     }
            // }

            // if(i === arr_keyword.length-1){
            //     console.log('done');
            //     arr_new = [];
            //     resolve({id: id, tag: arr_new});                               
            // } 

            for (var j=0; j<arr_keyword.length; j++) {

                // console.log(tags[i], arr_keyword[j]);

                if(tags[i].includes(arr_keyword[j])){

                    // console.log(arr_new, arr_keyword[j]);

                    if(arr_new.indexOf(arr_keyword[j]) < 0){
                        arr_new.push(arr_keyword[j]);
                    }
                }
            }
        }

        resolve({id: id, tag: arr_new});                               
        arr_new = [];
        
    });      
};



function upsertKeyword(id, tags){

    return new Promise(function(resolve, reject){
       
        content.update(
           { id:id },
           { tags: tags },
           { upsert: true }
        ).then(function(res){                                                
            console.log(res);
            resolve({res:true});  
        });  

    });      
};



function init(){
    
    temp.find({ fields: {name: true}},  function(err, result) { 
   
        for (var i=0; i<result.length; i++) 
        {   
            arr_keyword.push(result[i].name);
        }// end for

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
    });
}


// temp.create([
//     {name : "electronic"}, 
//     {name : "electronica"}, 
//     {name : "ambient"}, 
//     {name : "classical"}, 
//     {name : "metal"}, 
//     {name : "experimental"}, 
//     {name : "folk"}, 
//     {name : "punk"}, 
//     {name : "instrumental"}, 
//     {name : "british"}, 
//     {name : "hardcore"},
//     {name : "80s"}, 
//     {name : "90s"}, 
//     {name : "heavy"}, 
//     {name : "soul"}, 
//     {name : "psychedelic"}, 
//     {name : "japanese"}, 
//     {name : "post"}, 
//     {name : "german"}, 
//     {name : "wave"}, 
//     {name : "cover"},  
//     {name : "classic"},  
//     {name : "bluse"},  
//     {name : "jazz"},  
//     {name : "acoustic"}, 
//     {name : "pop"}, 
//     {name : "live"}, 
//     {name : "dance"}, 
//     {name : "guitar"}, 
//     {name : "house"}, 
//     {name : "rock"}, 
//     {name : "alternative"}, 
//     {name : "piano"}, 
//     {name : "fingerstyle"}, 
//     {name : "remix"}, 
//     {name : "r&b"}, 
//     {name : "kpop"}, 
//     {name : "mama"}, 
//     {name : "jam"}, 
//     {name : "indie"}, 
//     {name : "세로라이브"}, 
//     {name : "딩고뮤직"}, 
//     {name : "electro"}, 
//     {name : "progressive"}, 
//     {name : "커버"}, 
//     {name : "노래방라이브"}, 
//     {name : "음주라이브"}, 
//     {name : "edm"}, 
//     {name : "beatbox"}, 
//     {name : "x-factor"}, 
//     {name : "rap"}, 
//     {name : "hardrock"}, 
//     {name : "hard"}, 
//     {name : "hiphop"}, 
//     {name : "힙합"}], function(err, result) {      

//     if(err) console.log(err)
//     console.log(result)
// });


var skip = 0;
// init();