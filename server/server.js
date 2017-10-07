// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-example-passport
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

var path = require('path');
var fs = require('fs');
var cookieParser = require('cookie-parser');
// var multer = require('multer');
// var session = require('express-session');


/*
 * body-parser is a piece of express middleware that
 *   reads a form's input and stores it as a javascript
 *   object accessible through `req.body`
 */
var bodyParser = require('body-parser');

/**
 * Flash messages for passport
 *
 * Setting the failureFlash option to true instructs Passport to flash an
 * error message using the message given by the strategy's verify callback,
 * if any. This is often the best approach, because the verify callback
 * can make the most accurate determination of why authentication failed.
 */
var flash = require('express-flash');


/*
 * Create Folders if folder does not exists;
 */
//Create storage folder
var dir = path.join(__dirname + '/storage');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
//Create log folder
dir = path.join(__dirname + '/../log');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}


/**
 *  loopback inject bootOptions
**/
// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
var bootOptions = { "appRootDir": __dirname, 
                "bootScripts" : ["./boot/controller/streaming/streamController.js",
                                 "./boot/passportController.js",
                                 "./boot/youtubeAPI.js",
                                 "./boot/youtubeTags.js",
                                 "./boot/insertTags.js",
                                 "./boot/keyword.js"] };

boot(app, bootOptions, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module) {
            app.start();
    }
});




// The access token is only available after boot
app.use(loopback.token({
    model: app.models.accessToken
}));


// configure body parser
app.use(loopback.context());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
//app.use(multer()); // for parsing multipart/form-data


// LoopBack public root 
app.use(loopback.static(path.resolve(__dirname, '../client')));
// app.use(loopback.static(path.resolve(__dirname, '../client-dev')));
app.use(loopback.static(path.resolve(__dirname, '../server/storage')));
// app.use(loopback.static(path.resolve(__dirname, '../bower_components')));
// app.use(loopback.static(path.join(__dirname, '../public')));




app.all('/admin/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    // res.sendFile('admin/index.html', { root: path.resolve(__dirname, '..', 'client-dev') });
    res.sendFile('admin/index.html', { root: path.resolve(__dirname, '..', 'client') });
});

app.all('/web/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    // res.sendFile('web/index.html', { root: path.resolve(__dirname, '..', 'client-dev') });
    res.sendFile('web/index.html', { root: path.resolve(__dirname, '..', 'client') });
});

app.get('/', function(req, res, next) {
    res.redirect('/web/home');
});




/**
 *  loopback start
**/
app.start = function() {
    // start the web server
    return app.listen(function() {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};