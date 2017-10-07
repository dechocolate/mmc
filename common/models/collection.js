var fs = require('fs');
var path = require('path');
var rmdir = require('rmdir');
var util = require('./../../server/boot/util.js');
var Promise = require('bluebird');

module.exports = function(Collection) {


    Collection.observe('after delete', function(ctx, next) {        

      	var audio = Collection.app.models.audio;     	
        var content = Collection.app.models.content;  

        console.log('Deleted %s matching %j', ctx.Model.pluralModelName, ctx.where);


        content.destroyAll({
            channelId: ctx.where.id
        },function (err,obj) {
            if (err !== null) cb(err);
            else 
            {
            	audio.destroyAll({
                    channelId: ctx.where.id
                },function (err,obj) {
                    if (err !== null) cb(err);
                    else 
                    {                    	
                        var dir = util.Globals.storagePath  +'/'+ ctx.where.id;                            
                        fs.exists(dir, function(exists) {
                            if (exists) {
                                rmdir(dir, function (err, dirs, files) {
                                    console.log('all files are removed');
                                });
                            }
                        });

                    }
                });    
            }; //end if
        });        


        next();
	});



    /**
     * Search Content by Place 
    **/
    Collection.updateAllContents = function (id, display, cb) {
        
        var content = Collection.app.models.content;  

        if(display !== null && display !== null){           

            console.log('id', id, display);

            content.update(
               { channelId: id },
               { display: display },
               { upsert: true, multi: true }
            );

        }

        cb(null);
    };  

    Collection.remoteMethod('updateAllContents',{


        description: 'update related items',
        http: { path: '/:id/content', verb: 'put' },        
        accepts: [
            {arg: 'id', type: 'string', required: true},
            {arg: 'display', type: 'boolean', required: true}
        ],
        returns: {
            type:"object", root: true
        },                    
    });

};