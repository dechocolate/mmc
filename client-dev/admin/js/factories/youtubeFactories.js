angular.module('app')
.factory(
    "Youtube",
    ['LoopBackResource', '$injector', function (Resource, $injector) {

        var urlBase = "https://www.googleapis.com/youtube/v3";

        var R = Resource(
            urlBase + "key=:key&part=:part",
            {'key': '@key', 'part': '@part'},
            {                                                              
                "channel": {
                    url: urlBase + '/channels',
                    method: "GET"
                },                    
                "myChannel": {                                                
                    url: urlBase + '/channels?mine=true',
                    method: "GET"
                }
            }
        );
    
        R["updateOrCreate"] = R["upsert"];
        R["update"] = R["updateAll"];
        R["destroyById"] = R["deleteById"];
        R["removeById"] = R["deleteById"];

        R.modelName = "Youtube";

        return R;
    }]);
