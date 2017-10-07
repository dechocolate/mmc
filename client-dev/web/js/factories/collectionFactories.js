angular.module('app')
.factory(
    "Collection",
    ['LoopBackResource', '$injector', function (Resource, LoopBackAuth, $injector) {

        var urlBase = "/api";

        var R = Resource(
            urlBase + "/collections/:id",
            {'id': '@id'},
            {                                                              
                "find": {
                    url: urlBase + "/collections",
                    method: "GET",
                    isArray: true,
                },
                "create": {
                    url: urlBase + "/collections",
                    method: "POST",
                },
                "update": {
                    url: urlBase + "/collections/:id",
                    method: "PUT",
                },
                "delete": {
                    url: urlBase + "/collections/:id",
                    method: "DELETE",
                }
            }
        );
    
        R["updateOrCreate"] = R["upsert"];
        R["destroyById"] = R["deleteById"];
        R["removeById"] = R["deleteById"];

        R.modelName = "collection";

        return R;
    }]);
