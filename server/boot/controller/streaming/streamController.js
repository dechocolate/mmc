var path = require('path');
var util = require('util');
var fs = require('fs');
var youtubedl = require('youtube-dl');
var collector = require('./../../collector');
var request = require('request');
var util = require('./../../util');
//var through2 = require('through2');

var mp3 = require('youtube-mp3');
var http = require('http');	


var app = require('../../../../server/server');
var content = app.models.content; 
var collection = app.models.collection; 

module.exports = function(app) {	


	app.get('/reset', function(req, res) {
		
		console.log("reset");

        content.update(
		   {},
		   { views: 0, type: 'youtube' },
		   { upsert: true, multi: true }
		);

		collection.update(
		   {},
		   { views: 0},
		   { upsert: true, multi: true }
		);

		res.send();
	});


	app.get('/contentDisplay', function(req, res) {
		

		console.log(req.query.display);
		var display = req.query.display;

        content.update(
		   {},
		   { display: display },
		   { upsert: true, multi: true }
		);

		collection.update(
		   {},
		   { display: display },
		   { upsert: true, multi: true }
		);

		res.send();
	});


	app.get('/test', function(req, res) {
		
		var options = {
		    uri: 'http://www.yt-mp3.com/fetch?v=7N8b3NZSJoY',
		    method: 'GET'		    
		}

		request(options, function(error, response, body){
		   	if (!error && response.statusCode == 200) {		        
		        
		   		console.log(body);

		        var data = JSON.parse(body);		        
		        // console.log(data.url);

		        var stream = request
					.get('http:'+data.url)
					.on('error', function(err) {
					    console.log(err)
					})
					.pipe(fs.createWriteStream((__dirname, 'server/storage/' + data.id+'.mp3')))				

				stream.on('finish', function () {
					res.send();		    					
				});	

		    } 	

		    else res.send(error);		    
		});


		// var file = fs.createWriteStream("file.mp3");
		// var request = http.get("http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg", function(response) {
		//   response.pipe(file);
		// });

		// res.send();
	});


	app.get('/executeAll', function(req, res) {
		
		collector.executeAll();

		res.send();
	});


	// app.post('/executeCustom', function(req, res) {
		
	// 	collector.executeCustom(req.body.videoId);
	// 	res.send();
		
	// });

	app.post('/executeCustom', function(req, res) {
		
		var channelId = req.body.channelId;		
		var options = {
            uri: 'http://localhost:8888/executeById',
            form: {videoId:req.body.videoId},
            method: 'POST',
            timeout: 3000           
        }

        request(options, function(error, response, body){                        
            if(error){
            	util.logger('error').error('executeById :: error', channelId, error);                 
            	console.log("executeById :: error", channelId, error);
            }else{
            	util.logger('debug').debug('executeById :: response', channelId, response);                 
            	console.log("executeById :: response", channelId, response);
            }            

        });    

		res.send();
	});

	// app.post('/executeById', function(req, res) {
		
	// 	console.log("executeById :: " + JSON.stringify(req.body));

	// 	var channelId = req.body.channelId;		

	// 	if(null != channelId){
	// 		// collector.executeById({channelId:channelId});
	// 		collector.executeById({channelId:channelId, req:req, res:res});
	// 	}	

	// 	res.send();
	// });

	app.post('/executeById', function(req, res) {
		
		console.log("executeById :: " + JSON.stringify(req.body));

		var channelId = req.body.channelId;		
		var options = {
            uri: 'http://localhost:8888/executeById',
            form: {channelId:channelId},
            method: 'POST',
            timeout: 3000           
        }

        request(options, function(error, response, body){                        
            if(error){
            	util.logger('error').error('executeById :: error', channelId, error);                 
            	console.log("executeById :: error", channelId, error);
            }else{
            	util.logger('debug').debug('executeById :: response', channelId, response);                 
            	console.log("executeById :: response", channelId, response);
            }            

        });    

		res.send();
	});	


	app.get('/stream', function(req, res) {
		
		var channelId = req.query.channelId;
		var videoId = req.query.videoId;

		console.log(channelId);
		console.log(videoId);

		var filePath = path.join(__dirname + '../../../../../server/storage/'+channelId, videoId+'.mp3');		
	    var stat = fs.statSync(filePath);

	    res.writeHead(200, {
	        'Content-Type': 'audio/mpeg', 
	        'Content-Length': stat.size
	    });
	    
	    var readStream = fs.createReadStream(filePath);
	    readStream.on('data', function(data) {
	        res.write(data);
	    });
	    
	    readStream.on('end', function() {
	    	console.log('end');
	        res.end();        
	    });



	 //   res.set({'Content-Type': 'audio/mpeg'});
		// var readStream = fs.createReadStream(filePath);
		// readStream.pipe(res);

	  
	    
	 //    readStream.on('data', function(data) {
	 //        res.write(data);
	 //    });
	    
	 //    readStream.on('end', function() {
	 //    	console.log('end');
	 //        res.end();        
	 //    });
	});




	//list
	app.get('/mp3', function(req, res) {

		var url = 'https://www.youtube.com/watch?v=LKiDgFySXg8';		 	

		youtubedl.exec(url, ['-x', '-otest.%(ext)s','--audio-format', 'mp3'], {cwd: (__dirname, 'server/storage/')}, function(err, output) {
 			if (err) throw err;
  			console.log(output.join('\n'));
			console.log('done');
			
			// var filePath = path.join(__dirname + '../../../../../server/storage', 'test.mp3');		
		 //    var stat = fs.statSync(filePath);
			// // console.log(stat);

		 //    res.writeHead(200, {
		 //        'Content-Type': 'audio/mpeg', 
		 //        'Content-Length': stat.size
		 //    });
		    
		 //    var readStream = fs.createReadStream(filePath);
		 //    readStream.on('data', function(data) {
		 //        res.write(data);
		 //    });
		    
		 //    readStream.on('end', function() {
		 //    	console.log('end');
		 //        res.end();        
		 //    });



		   // res.set({'Content-Type': 'audio/mpeg'});
    	// 	var readStream = fs.createReadStream(filePath);
    	// 	readStream.pipe(res);

		  
		    
		    // readStream.on('data', function(data) {
		    //     res.write(data);
		    // });
		    
		    // readStream.on('end', function() {
		    // 	console.log('end');
		    //     res.end();        
		    // });



  // fs.createReadStream('/tmp/important.dat')
  // .pipe(through2({ objectMode: true, allowHalfOpen: false },
  //   function (chunk, enc, cb) {     
  //    })
  // .pipe(fs.createWriteStream('/tmp/wut.txt'));

		 // 	var stream = fs.createReadStream(filePath);
			// var writeStream = fs.createWriteStream(filePath);

			// var writable = true;
			// var doRead = function () {
			// 	var data = stream.read();
			// 	//만약 wriable이 false 를 리턴한다면, buffer가 꽉 차있다는 뜻이다.
			// 	writable = writeStream.write(data);
			// }

			// stream.on('readable', function () {
			// 	if(writable) {
			// 		doRead()
			// 	} else {
			// 		// stream buffur가 꽉 찼으니 drain 이벤트가 발생할 때까지 대기
			// 		writeStream.removeAllListeners('drain');
			// 		writeStream.once('drain', doRead)
			// 	}
			// });

			// stream.on('end', function () {
			// 	writeStream.end();
			// });

		});
	});



};
