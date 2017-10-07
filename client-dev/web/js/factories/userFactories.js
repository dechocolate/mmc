angular.module('app')
.factory(
    "User",
    ['LoopBackResource', 'LoopBackAuth', '$injector', function (Resource, LoopBackAuth, $injector) {

        var urlBase = "/api";                

        var R = Resource(
            urlBase + "/Users/:userId",
            {'userId': '@userId'},
            {
                "login": {
                    url: urlBase + "/Users/login",
                    method: "POST",
                    params: {
                        include: "user"
                    },
                    interceptor: {
                        response: function (response) {
                            var accessToken = response.data;
                            LoopBackAuth.setUser(accessToken.id, accessToken.userId, accessToken.user);
                            LoopBackAuth.rememberMe = response.config.params.rememberMe !== false;
                            LoopBackAuth.save();
                            return response.resource;
                        }
                    }
                },


                "logout": {
                    url: urlBase + "/Users/logout",
                    method: "POST",
                    interceptor: {
                        response: function (response) {
                            LoopBackAuth.clearUser();
                            LoopBackAuth.rememberMe = true;
                            LoopBackAuth.save();
                            return response.resource;
                        }
                    }
                },

                "notification": {  
                    url: urlBase + "/Users/:userId/notifications",
                    method: "GET",
                    isArray: true
                },                    

                "cleanNotification": {  
                    url: urlBase + "/Users/:userId/notifications",
                    method: "PUT"
                },                    

                /* INTERNAL. Use User.notification.count() instead. */
                "::notification::count": {
                    url: urlBase + "/Users/:userId/notifications/count",
                    method: "GET"
                },

                "collection": {  
                    url: urlBase + "/Users/:userId/collection",
                    method: "GET"
                },

                "content": {  
                    url: urlBase + "/Users/:userId/content",
                    method: "GET",
                    isArray: true,
                },

                "comments": {  
                    url: urlBase + "/Users/:userId/comments",
                    method: "GET",
                    isArray: true
                },
                
                "deleteComments": {  
                    url: urlBase + "/Users/:userId/comments",
                    method: "PUT"
                },

                /* INTERNAL. Use User.comment.delete() instead. */
                "::comments::delete": {
                    url: urlBase + "/Users/:userId/comments",
                    method: "DELETE"
                },          

                "create": {  
                    url: urlBase + "/Users",
                    method: "POST"
                },

                "update": {  
                    url: urlBase + "/Users/:userId",
                    method: "PUT"
                },

                "picture": {  
                    url: urlBase + "/Users/:userId/picture",
                    method: "GET"
                },

                "info": {  
                    url: urlBase + "/Users/:userId/info",
                    method: "GET"
                },

                "search": {
                    url: urlBase + "/Users/search?key=:key",
                    method: "GET",
                    isArray: true
                },
               
                "exists": {
                    url: urlBase + "/Users/:userId/exists",
                    method: "GET",
                },     

                "getCurrent": {
                    url: urlBase + "/Users" + "/:id",
                    method: "GET",
                    params: {
                        id: function () {
                            var id = LoopBackAuth.currentUserId;
                            if (id == null) id = '__anonymous__';
                            return id;
                        },
                    },
                    interceptor: {
                        response: function (response) {
                            LoopBackAuth.currentUserData = response.data;
                            return response.resource;
                        }
                    },
                    __isGetCurrentUser__: true
                }
            }
        );

        R["updateOrCreate"] = R["upsert"];        
        R["update"] = R["updateAll"]; 
        R["destroyById"] = R["deleteById"];
        R["removeById"] = R["deleteById"];


        R.getCachedCurrent = function () {
            var data = LoopBackAuth.currentUserData;
            return data ? new R(data) : null;
        };

        R.isAuthenticated = function () {
            return this.getCurrentId() != null;
        };

        R.getCurrentId = function () {
            return LoopBackAuth.currentUserId;
        };


        R.modelName = "User";

        return R;
    }]);
