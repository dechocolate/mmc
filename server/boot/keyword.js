// var app = require('../../server/server');
// var util = require('./util');
// var fs = require('fs');
// var path = require('path');
// var YouTube = require('youtube-node');
// // var youtubedl = require('youtube-dl');
// var request = require('request');
// var Promise = require('bluebird');

// var content = app.models.content; 
// var keyword = app.models.keyword; 

// var youTube = new YouTube();
//     youTube.setKey('AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw');


// /**
//  *  Find Collection info
// **/
// function selectContent(skip){

//     console.log('selectContent', skip)
    
//     return new Promise(function(resolve, reject){

//         var filter = { fields: {title: true}, skip: skip, limit: '100' }

//         content.find(filter,  function(err, result) { 

//             if(err) console.log('selectContent err', err);

//             if(result.length != 0)
//             {
//                 for (var i=0; i<result.length; i++) 
//                 {                   
//                     if(null != result[i].title)
//                     {                        
//                         breakeWord(result[i].title)
//                         .then(function(res){                    
//                             resolve({res:true});           
//                         });
//                     }
//                 }// end for
//             }
//             else
//             {
//                 return resolve({res:false});   
//             }
//         });
//     });      

// };

// function breakeWord(title){

//     return new Promise(function(resolve, reject){
        
//         var arr = title.split(' - ');

//         for (var i=0; i<arr.length; i++) 
//         {
//             // var key = arr[i].replace(/[^\w\s]/gi, '');
//             if(i == 0) createKeyword(arr[i]);
//             if(i == 1)
//             {
//                 var arr2 = arr[i].split(' (');
//                 createKeyword(arr2[0]);
//             } 
            
//         }

//         resolve({res:true});
//     });
// };

// function createKeyword(name){

//     return new Promise(function(resolve, reject){

//         keyword.create({name: name, count:0},  function(err, result) { 
//             increaseKeyword(name)
//             .then(function(res){                    
//                 resolve({res:true});           
//             });        
//         });  
//     });  
// };

// function increaseKeyword(name){

//     console.log('increaseKeyword', name);

//     return new Promise(function(resolve, reject){

//         keyword.updateAll({name: name}, {'$inc': {'count': 1}},  function(err, result) { 
//             if(err) console.log('increaseKeyword err', err);
//             resolve({res:true});  
//         });

//     });
// };


// exports.getYoutubeKeyword = function(){
    
//     var skip = 0;

//     selectContent(skip)
//     .then(function(res){                    
        
//         if(res)
//         {
//             skip += 100
//             selectContent(skip)
//         }
//         else return;
    
//     });
// }; 



// function init(){
    
//     selectContent(skip)
//     .then(function(res){      

//         if(res.res)
//         {
//             skip += 100;            
//             if(res.res) init();
//             else{console.log('finish'); return;}  
//         }
//         else{
//             console.log('finish'); return;
//         } 

//     });
// }

// var skip = 0;
// init();



// // var key = "adf - dife * *3  @#& () {} ' fd".replace(/[^\w\s]/gi, '');

// // console.log(key);

