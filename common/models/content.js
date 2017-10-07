module.exports = function(Content) {

	/**
     * Search Content by Place 
    **/
    Content.search = function (key, cb) {
        
        if(key != null && key != ''){    		
            
            // var regex = new RegExp( '^'+String(key), 'i' );
            var regex = new RegExp( String(key), 'i' );

	        Content.app.models.content.find(              
                {
                    where: {or: [
                        {title: {like: regex}}, 
                        {channelTitle: {like: regex}}
                    ]},
                    include: {
                        relation: 'audios'                    
                    }  
                },  
                function (err, res, ctx) 
            {	    		        	

	        	if(res != null){
		        	cb( null, res);        		
	        	}

			});
    	}
    };  

    Content.remoteMethod(
        'search',
        {
            description: 'search search by keyword',
            accepts: [
                {arg: 'key', type: 'string', required: true}
            ],
            returns: {
                type:"object", root: true
            },                    
            http: {verb: 'get'}
        }
    );
};

// module.exports = function(Content) {

//     /**
//      * Search Content by Place 
//     **/
//     Content.search = function (key, cb) {
        
//         if(key != null && key != ''){           
            
//             // var regex = new RegExp( '^'+String(key), 'i' );
//             var regex = new RegExp( String(key), 'i' );

//             Content.app.models.content.find(                    
//                     {
//                         include: { // include orders for the owner
//                         relation: 'audios', 
//                         scope: {
//                           where: 
//                             {or: [
//                                 {title: {like: regex}}, 
//                                 {channelTitle: {like: regex}}
//                             ]} 
//                         }
//                     },

//                     // {include: 'audios'},         
//                     // { where: 
//                     //     {or: [
//                     //         {title: {like: regex}}, 
//                     //         {channelTitle: {like: regex}}
//                     //     ]} 
//                     // }, 
//                     function (err, res, ctx) 
//             {                           

//                 if(res != null){
//                     cb( null, res);             
//                 }

//             });
//         }
//     };  

//     Content.remoteMethod(
//         'search',
//         {
//             description: 'search search by keyword',
//             accepts: [
//                 {arg: 'key', type: 'string', required: true}
//             ],
//             returns: {
//                 type:"object", root: true
//             },                    
//             http: {verb: 'get'}
//         }
//     );
// };