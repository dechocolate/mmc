var fs = require('fs');
var moment = require('moment');
var path = require('path');
var Promise = require('bluebird');

var log4js = require("log4js");
log4js.configure(__dirname+'/../log4js_configuration.json');

var file = path.join(__dirname + './../../server/datasources.json');
fs.readFile(file, 'utf8', function (err, data) {
    if (err) throw err;
    
    var obj = JSON.parse(data);
    var Globals = {
        storagePath: obj.storage.root
    }
    
    exports.Globals = Globals;
});


/**
 *   Return log4js object
 **/
exports.logger = function(type){
    return log4js.getLogger(type);
};


/**
 *   Check Date and folder
 **/
exports.getDate = function(){

    var date = moment(new Date()).format('YYYYMMDD');

    //Create storage datefolder
    var date_dir = path.join(__dirname + './../../server/storage/' + date);
    if (!fs.existsSync(date_dir)){
        fs.mkdirSync(date_dir);
    }

    return date;
};

/**
*	Get value from Cookies
*/
exports.parseCookies = function(res) {
    var list = {},
        rc = res.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
};

/**
*	Resize image file
*/
exports.resizeImg = function(container, fileName){
	
    var path = __dirname+'/../storage/';
    var opt, timeStarted = new Date;    

    im.resize(opt = {
        srcPath: path +container+ '/' +fileName,
        dstPath: path +container+ '/' +fileName,
        width: 300
    }, function (err, stdout, stderr){
    	
        console.log("--------");
        
        if (err) {            
            console.error(err.stack || err);
            //return Promise.resolve(false);
        }else{
            console.log('crop(',opt,') ->', stdout);
            console.log('Real time spent: '+(new Date() - timeStarted) + ' ms');            

            //return Promise.resolve(stdout);
        }        
    });
}; 



