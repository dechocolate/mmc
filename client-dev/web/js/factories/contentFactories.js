angular.module('app')
.factory(
    "Content",
    ['LoopBackResource', '$injector', function (Resource, $injector) {

        var urlBase = "/api";

        var R = Resource(
            urlBase + "/contents/:id",
            {'id': '@id'},
            {                                                              
                "find": {
                    url: urlBase + "/contents",
                    method: "GET",
                    isArray: true,
                },

                "create": {
                    url: urlBase + "/contents",
                    method: "POST",
                },

                "count": {
                    url: urlBase + "/contents/count",
                    method: "GET",
                }
            }
        );
    
        R["updateOrCreate"] = R["upsert"];
        R["update"] = R["updateAll"];
        R["destroyById"] = R["deleteById"];
        R["removeById"] = R["deleteById"];

        R.modelName = "content";

        return R;
    }]);
