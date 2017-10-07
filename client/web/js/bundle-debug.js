"use strict";

angular.module('app', [ 
                        // 'contentControllers', 
                        // 'collectionControllers',
                        // 'mypageControllers',
                        // 'testControllers',
                        
                        'loopBackAuthFactories',
                        // 'userFactories',
                        // 'contentFactories',  
                        // 'collectionFactories',  
                        // 'youtubeFactories',  

                        'ui.router',
                        'ui.bootstrap',
                        'ngCookies',
                        'satellizer',
                        'angularModalService'
                    ])

.value('Config', {
    youtubeKey : 'AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw'     
})

// .run(function (User) {

    // console.log(User.getCachedCurrent());
    //Check if User is authenticated
    // if (User.getCachedCurrent() == null) {
    //     User.getCurrent();
    // }
// })

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
    
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'views/content.html',
            controller: 'ContentCtrl'
        })

        .state('collect', {
            url: '/collect',
            templateUrl: 'views/collection.html',
            controller: 'CollectionCtrl'
        })

        .state('mypage', {
            url: '/mypage',
            templateUrl: 'views/mypage.html',
            controller: 'MypageCtrl'
        })

        .state('test', {
            url: '/test',
            templateUrl: 'views/test.html',
            controller: 'TestCtrl'
        })
        ;

    $urlRouterProvider.otherwise('home');

    $locationProvider.html5Mode(true);
}])

.config(['satellizer.config', '$authProvider', function (config, $authProvider) {

    config.authHeader = 'Satellizer';
    config.httpInterceptor = false;

    $authProvider.facebook({
        clientId: '652372928198212'
    });

    $authProvider.google({
        clientId: '968064961666-g85aklkfvmi4du3i7f7qr51oq01umgov.apps.googleusercontent.com' //product
        // clientId: '968064961666-g7anqugef7brfkie8p33t884mgj8ve0d.apps.googleusercontent.com' //test    
    });

}])

.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}]);
angular.module('app')
.controller('CollectionCtrl', 
    ['$scope', '$window', '$http', 'Collection', 'Content', 'Config', 'Youtube', 'ModalService',
    function($scope, $window, $http, Collection, Content, Config, Youtube, ModalService) { 

    /**
     *  Collection List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];
        $scope.filter.skip = 0;
        $scope.disabled = false;        
        $scope.loadMore();
    };

    $scope.loadMore = function(){     

        $scope.disabled = true; 

        Collection
        .find({
            filter: $scope.filter    
        })
        .$promise
        .then(
        function (res) {                  
            
            if(res.length > 0) 
            {            
                angular.forEach(res, function (values) {                      
                    
                    Youtube
                    .channel({
                        'key': Config.youtubeKey,
                        'id': values.channelId,
                        'part': 'statistics'
                    })
                    .$promise
                    .then(
                    function (res) {
                        var data = res.items[0].statistics;                

                        values.viewCount = data.viewCount;                           
                        values.commentCount = data.commentCount;
                        values.subscriberCount = data.subscriberCount;
                        values.videoCount = data.videoCount;
                    });

                    getCount(values.channelId)
                    .then(function(count){                                            
                        values.count = count;
                    });

                    $scope.contents.push(values); 
                                                 
                });  // end foreach    
                $scope.disabled = false;
            } 
            else 
            {                
                $scope.disabled = true; // Disable further calls if there are no more items
            }
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        })
        .finally(function () {                                
            $scope.filter.skip = $scope.filter.skip + 15;  
        });        
    };


    var getCount = function(id){

        var promise = 
                Content
                .count({    
                    where: {
                        channelId: id                                       
                    }
                })
                .$promise
                .then(
                function (res) {                                   
                    return res.count;   
                },
                function (err) {                
                    console.log("err :: " + JSON.stringify(err));
                })
                .finally(function () {                                

                });      

        return promise;
    };

    $scope.filter = {                 
            order: name,
            limit: '15',
            skip: $scope.skip
        }

    $scope.reset();



    /**
     *  Collect Youtube Infomation
    **/
    $scope.CollectById = function (index, e) {

        var id = $(e.target).data('id');

        console.log($scope.contents[index]);
        $scope.contents[index].state = true;

        $http({
            method: 'POST' ,
            url: '/executeById',                        
            headers: {'Content-Type': 'application/json; charset=utf-8'}, 
            data: {channelId:id},
            type: 'json'
        }).success(function(res) {
            
            var data = JSON.parse(JSON.stringify(res));
            console.log(data);                    

        }).finally(function() {
            console.log('Complete');
        });
    };    

    $scope.deleteCollection = function(id, channelId){

        ModalService.showModal({
            templateUrl: "views/modal/confirm/confirm.html",
            controller: "ConfirmModalControllers"
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {

                if(result){
                    Collection
                    .delete({
                        id: id
                    })
                    .$promise
                    .then(
                    function (res) {               
                        $window.location.reload(); 
                    },
                    function (err) {                
                        console.log("err :: " + JSON.stringify(err));
                    })
                    .finally(function () {                                

                    });                    
                }

            });
        });    
    };

    $scope.updateCollection = function(id, channelId){

        Collection
        .update({
            id: id,
            state: false
        })
        .$promise
        .then(
        function (res) {               
            console.log(res);
            $window.location.reload(); 
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        });

    };



    window.onscroll = function(ev) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            
            // you're at the bottom of the page                        
            if(!$scope.disabled){      
                $scope.loadMore();
            }
        };
    };

}]);



angular.module('app')
.controller('ContentCtrl', 
    ['$rootScope', '$scope', 'Content', 'Collection', 'Youtube', 'Config',
    function($rootScope, $scope, Content, Collection, Youtube, Config) { 

    $rootScope.$on('selectFilter', function(event, data) {                
        $scope.selectChannel(data);
    });

    /**
     *  Banner 
    **/    
    $scope.banners = [];

    Collection
    .find({
        filter: {                 
            fields: {
                channelId: true, 
                thumbnails: true,
                channelTitle: true
            }, 
            order: name,
            limit: '5'
        }
    })
    .$promise
    .then(
    function (res) {                  
        
        angular.forEach(res, function (values) {                      
                                                 
            Youtube
            .channel({
                'key': Config.youtubeKey,
                'id': values.channelId,
                'part': 'brandingSettings'
            })
            .$promise
            .then(
            function (data) {
                // console.log(data.items[0].brandingSettings.image.bannerMobileMediumHdImageUrl);
                values.bannerImg = data.items[0].brandingSettings.image.bannerMobileMediumHdImageUrl
            });

        });

        $scope.banners = $scope.banners.concat(res);        
    });        



    /**
     *  Content List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];
        $scope.filter.skip = 0;
        $scope.disabled = false;        
        $scope.loadMore();
    };

    $scope.loadMore = function(){     

        $scope.disabled = true; 

        Content
        .find({
            filter: $scope.filter    
        })
        .$promise
        .then(
        function (res) {            

            if(res.length > 0) 
            {
                $scope.contents = $scope.contents.concat(res);
                $scope.disabled = false;
            } 
            else 
            {
                $scope.disabled = true; // Disable further calls if there are no more items
            }

            // console.log('more', $scope.contents);      

            //  angular.forEach(res, function (values) {                      
            //     $scope.contents.push(values);                                          
            // }); 
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        })
        .finally(function () {                                
            $scope.filter.skip = $scope.filter.skip + 15;    
        });        
    };

    $scope.selectChannel = function(channelId){

        if(channelId === 'all')
        {
            $scope.filter = {           
                include : ['audios'],            
                order: 'publishedAt DESC',
                limit: '15',
                skip: 0, 
                where: {             
                    deleted: false                                       
                }
            }
        }else
        {
            $scope.filter = {          
                include : ['audios'],             
                order: 'publishedAt DESC',
                limit: '15',
                skip: 0, 
                where: {
                    channelId: channelId,
                    deleted: false                                       
                }
            }
        }

        $scope.reset();
    };   

    $scope.filter = {      
        include : ['audios'],                 
        order: 'publishedAt DESC',
        limit: '15',
        skip: $scope.skip, 
        where: {
            deleted: false                                       
        }
    }

    $scope.reset();


    window.onscroll = function(ev) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            
            // you're at the bottom of the page                        
            if(!$scope.disabled){      
                $scope.loadMore();
            }
        };
    };


}]);



angular.module('app')
.controller('MypageCtrl', 
    ['$rootScope', '$scope', '$window', 'User', 'Content', 'Config', 'Youtube', 'ModalService', 'LoopBackAuth',
    function($rootScope, $scope, $window, User, Content, Config, Youtube, ModalService, LoopBackAuth) { 

    $rootScope.$on('selectMyChannel', function(event, data) {                
        
        $scope.filter = {          
            include : ['audios'],             
            order: 'publishedAt DESC',
            limit: '15',
            skip: 0, 
            where: {
                channelId: data,
                deleted: false                                       
            }
        }
        $scope.reset();
    });

	$scope.LoopBackAuth = LoopBackAuth;	

	/**
     *  Content List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];
        $scope.filter.skip = 0;
        $scope.disabled = false;        
        $scope.loadMore();
    };

    $scope.loadMore = function(){     

        $scope.disabled = true; 

        Content
        .find({
            filter: $scope.filter    
        })
        .$promise
        .then(
        function (res) {            

            console.log(res);
 
            if(res.length > 0) 
            {
                $scope.contents = $scope.contents.concat(res);
                $scope.disabled = false;
            } 
            else 
            {
                $scope.disabled = true; // Disable further calls if there are no more items
            }
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        })
        .finally(function () {                                
            $scope.filter.skip = $scope.filter.skip + 15;    
        });        
    };

    $scope.filter = {          
        include : ['audios'],             
        order: 'publishedAt DESC',
        limit: '15',
        skip: 0, 
        where: {
            channelId: $scope.LoopBackAuth.channelId            
        }
    }


    window.onscroll = function(ev) {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            
            // you're at the bottom of the page                        
            if(!$scope.disabled){      
                $scope.loadMore();
            }
        };
    };

}]);

angular.module('app')
.controller('TestCtrl', ['$scope', function($scope) { 


}]);

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

(function (window, angular, undefined) {
    'use strict';
    
    var authHeader = 'authorization';
    var module = angular.module("loopBackAuthFactories", ['ngResource']);
  
    module
        .factory('LoopBackAuth', function () {
            var props = ['accessTokenId', 'currentUserId', 'currentUserEmail', 'youtubeAccessToken'];

            function LoopBackAuth() {
                var self = this;
                props.forEach(function (name) {
                    self[name] = load(name);
                });
                this.rememberMe = undefined;                
            }

            LoopBackAuth.prototype.save = function () {
                var self = this;
                var storage = this.rememberMe ? localStorage : sessionStorage;
                props.forEach(function (name) {
                    save(storage, name, self[name]);
                });
            };

            LoopBackAuth.prototype.setUser = function (accessTokenId, userId, userEmail, youtubeAccessToken) {
                this.accessTokenId = accessTokenId;
                this.currentUserId = userId;
                this.currentUserEmail = userEmail;
                this.youtubeAccessToken = youtubeAccessToken;
            }

            LoopBackAuth.prototype.clearUser = function () {
                this.accessTokenId = null;
                this.currentUserId = null;
                this.currentUserEmail = null;
                this.youtubeAccessToken = null;
            }

            return new LoopBackAuth();

            // Note: LocalStorage converts the value to string
            // We are using empty string as a marker for null/undefined values.
            function save(storage, name, value) {
                var key = '$LoopBack$' + name;
                if (value == null) value = '';
                storage[key] = value;
            }

            function load(name) {
                var key = '$LoopBack$' + name;
                return localStorage[key] || sessionStorage[key] || null;
            }
        })
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.interceptors.push('LoopBackAuthRequestInterceptor');
        }])
        .factory('LoopBackAuthRequestInterceptor', ['$q', 'LoopBackAuth', '$rootScope', 
            function ($q, LoopBackAuth, $rootScope) {
                
                // var urlBase = $rootScope.urlBase + "/api";
                var urlBase = "/api";    

                return {
                    'request': function (config) {

                        // filter out non urlBase requests
                        if (config.url.substr(0, urlBase.length) !== urlBase) {
                            return config;
                        }

                        if (LoopBackAuth.accessTokenId) {
                            config.headers[authHeader] = LoopBackAuth.accessTokenId;                            
                        } else if (config.__isGetCurrentUser__) {
                            // Return a stub 401 error for User.getCurrent() when
                            // there is no user logged in
                            var res = {
                                body: {error: {status: 401}},
                                status: 401,
                                config: config,
                                headers: function () {
                                    return undefined;
                                }
                            };
                            return $q.reject(res);
                        }
                        return config || $q.when(config);
                    }
                }
            }])

    /**
     * @ngdoc object
     * @name lbServices.LoopBackResourceProvider
     * @header lbServices.LoopBackResourceProvider
     * @description
     * Use `LoopBackResourceProvider` to change the global configuration
     * settings used by all models. Note that the provider is available
     * to Configuration Blocks only, see
     * {@link https://docs.angularjs.org/guide/module#module-loading-dependencies Module Loading & Dependencies}
     * for more details.
     *
     * ## Example
     *
     * ```js
     * angular.module('app')
     *  .config(function(LoopBackResourceProvider) {
   *     LoopBackResourceProvider.setAuthHeader('X-Access-Token');
   *  });
     * ```
     */
        .provider('LoopBackResource', function LoopBackResourceProvider() {
            /**
             * @ngdoc method
             * @name lbServices.LoopBackResourceProvider#setAuthHeader
             * @methodOf lbServices.LoopBackResourceProvider
             * @param {string} header The header name to use, e.g. `X-Access-Token`
             * @description
             * Configure the REST transport to use a different header for sending
             * the authentication token. It is sent in the `Authorization` header
             * by default.
             */
            this.setAuthHeader = function (header) {
                authHeader = header;
            };

            /**
             * @ngdoc method
             * @name lbServices.LoopBackResourceProvider#setUrlBase
             * @methodOf lbServices.LoopBackResourceProvider
             * @param {string} url The URL to use, e.g. `/api` or `//example.com/api`.
             * @description
             * Change the URL of the REST API server. By default, the URL provided
             * to the code generator (`lb-ng` or `grunt-loopback-sdk-angular`) is used.
             */
            this.setUrlBase = function (url) {
                urlBase = url;
            };

            this.$get = ['$resource', function ($resource) {
                return function (url, params, actions) {
                    var resource = $resource(url, params, actions);

                    // Angular always calls POST on $save()
                    // This hack is based on
                    // http://kirkbushell.me/angular-js-using-ng-resource-in-a-more-restful-manner/
                    resource.prototype.$save = function (success, error) {
                        // Fortunately, LoopBack provides a convenient `upsert` method
                        // that exactly fits our needs.
                        var result = resource.upsert.call(this, {}, this, success, error);
                        return result.$promise || result;
                    };
                    return resource;
                };
            }];
        });

})(window, window.angular);

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

angular.module('app')
.directive('footer', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				// replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/footer/footer.html",
				controller: ['$scope', '$filter', function ($scope, $filter) {
								

				}]
		}
});

angular.module('app')
.directive('header', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				// replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/header/header.html",
				controller: ['$scope', '$rootScope', '$location', '$filter', 'Collection', 'ModalService', 'LoopBackAuth', 'User',
				function ($scope, $rootScope, $location, $filter, Collection, ModalService, LoopBackAuth, User) {
					
					$scope.LoopBackAuth = LoopBackAuth;

					$scope.login = function () {

				         ModalService.showModal({
				            templateUrl: "views/modal/login/login.html",
				            controller: "LoginModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {
				            					               
				            });
				        });				        
				    };			

				    $scope.logout = function () {
				    	
				    	User
				        .logout({access_token: LoopBackAuth.accessTokenId})
				        .$promise
				        .then(
				        function (res, header) { 
							// console.log('res', res);				        
							$location.url('/home');
				        },
				        function (err) { 
				            console.log("login err", JSON.stringify(err));              
				        });
				        				        
				    };

				}]
		}
});

angular.module('app')
.directive('sidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/sidebar/content-sidebar.html",
				// controller: "ContentCtrl"				
				controller: ['$rootScope', '$scope', '$filter', 'Collection', 
				function ($rootScope, $scope, $filter, Collection) {
					
					$scope.categories = [];					
					
					$scope.states = {};
    				$scope.states.activeItem = 'all';

					Collection
			        .find({			        	
			            filter: {
			            	fields:{
			            		channelId:true,
				        		channelTitle:true
				        	},                 
			                order: name			       
			            }			        	
			        })
			        .$promise
			        .then(
			        function (res) {                  			           
			            $scope.categories = $scope.categories.concat(res);
			        });
			        
			        $scope.selectChannel = function(channelId){   			         	
			        	$rootScope.$emit('selectFilter', channelId);     
			        };

				}]
		}
})
.directive('collectionSidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/sidebar/collection-sidebar.html",
				// controller: "CollectionCtrl"
				controller: ['$rootScope', '$scope', '$filter', '$window', 'ModalService', 'Collection', 
				function ($rootScope, $scope, $filter, $window, ModalService, Collection) {
								
					/**
				     *   Modal
				    **/
				    $scope.open = function (size) {

				         ModalService.showModal({
				            templateUrl: "views/modal/channel/channel-add.html",
				            controller: "ChannelModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {
				                if(null != result) createCollection(result);
				            });
				        });
				        
				    };

				    var createCollection = function(param){

				        Collection
				        .create(param)
				        .$promise
				        .then(
				        function (res) {               
				            console.log(res);
				            $window.location.reload(); 
				        },
				        function (err) {                
				            console.log("err :: " + JSON.stringify(err));
				        })
				        .finally(function () {                                

				        });

				    };
					
				}]
		}
})
.directive('mypageSidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/sidebar/mypage-sidebar.html",				
				controller: ['$rootScope', '$window', '$scope', '$filter', '$http', 'Collection', 'LoopBackAuth', 'ModalService', 'User', 'Youtube', 'Config', 'Content',
				function ($rootScope, $window, $scope, $filter, $http, Collection, LoopBackAuth, ModalService, User, Youtube, Config, Content) {

					$scope.LoopBackAuth = LoopBackAuth;														
					$scope.myCollection = {};					

					User					
			        .collection({
			            userId: LoopBackAuth.currentUserId
			        })
			        .$promise
			        .then(
			        function (result) {                  			            

			            if(null != result) 
			            {            

			            	$rootScope.$emit('selectMyChannel', result.channelId);     

			                Youtube
		                    .channel({
		                        'key': Config.youtubeKey,
		                        'id': result.channelId,
		                        'part': 'statistics'
		                    })
		                    .$promise
		                    .then(
		                    function (res) {
		                        var data = res.items[0].statistics;                

		                        $scope.myCollection.viewCount = data.viewCount;                           
		                        $scope.myCollection.commentCount = data.commentCount;
		                        $scope.myCollection.subscriberCount = data.subscriberCount;
		                        $scope.myCollection.videoCount = data.videoCount;
		                    });

		                    getCount(result.channelId)
		                    .then(function(count){                                            
		                        $scope.myCollection.count = count;
		                    });			                    

		                    $scope.myCollection = result;
			            } 			            
			        },
			        function (err) {                
			            console.log("err :: " + JSON.stringify(err));
			        });


			        /**
				     *  Collect My Youtube Infomation
				    **/
				    $scope.CollectById = function () {

				    	$scope.myCollection.state = true;

				        $http({
				            method: 'POST' ,
				            url: '/executeById',                        
				            headers: {'Content-Type': 'application/json; charset=utf-8'}, 
				            data: { channelId: $scope.myCollection.channelId },
				            type: 'json'
				        }).success(function(res) {
				            
				            var data = JSON.parse(JSON.stringify(res));
				            console.log(data);                    

				        }).finally(function() {
				            console.log('Complete');
				        });
				    };    


					$scope.colletMyYoutube = function (size) {

				        ModalService.showModal({
				            templateUrl: "views/modal/channel/my-channel-add.html",
				            controller: "MyChannelModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {
				                if(result) createCollection(result);
				            });
				        });				        
				    };

				    $scope.deleteCollection = function(id, channelId){

				        ModalService.showModal({
				            templateUrl: "views/modal/confirm/confirm.html",
				            controller: "ConfirmModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {

				                if(result){
				                    Collection
				                    .delete({
				                        id: id
				                    })
				                    .$promise
				                    .then(
				                    function (res) {               
				                        $window.location.reload(); 
				                    },
				                    function (err) {                
				                        console.log("err :: " + JSON.stringify(err));
				                    });
				                }

				            });
				        });    
				    };

				    var createCollection = function(param){

				        Collection
				        .create(param)
				        .$promise
				        .then(
				        function (res) {               
				            console.log(res);
				            $window.location.reload(); 
				        },
				        function (err) {                
				            console.log("err :: " + JSON.stringify(err));
				        })
				        .finally(function () {                                

				        });				        
				    };

				    var getCount = function(id){

				        var promise = 
				                Content
				                .count({    
				                    where: {
				                        channelId: id                                       
				                    }
				                })
				                .$promise
				                .then(
				                function (res) {                                   
				                    return res.count;   
				                },
				                function (err) {                
				                    console.log("err :: " + JSON.stringify(err));
				                });

				        return promise;
				    };


				}]
		}
});
angular.module('app')
.controller('ChannelModalControllers', ['$scope', 'close', 'Youtube', 'Config', function($scope, close, Youtube, Config) {


     function findChannel(param){

        return new Promise(function(resolve, reject){

            Youtube
            .channel(param)
            .$promise
            .then(
            function (data) {
                return resolve(data);  
            })

        });       
    };


    $scope.channelDetail = function(data){

        $scope.resultText = null;
        $scope.enroll_button = true;

        $scope.param = {
            type: "youtube",
            id: data.items[0].id,
            channelId: data.items[0].id,
            channelTitle: data.items[0].snippet.title,
            publishedAt: data.items[0].snippet.publishedAt,
            thumbnails: data.items[0].snippet.thumbnails,
            description: data.items[0].snippet.description,
            pageInfo: data.pageInfo,
            state: false
        };               

        $scope.$apply(); 
    };


  	$scope.close = function(result) {
	  	close(null, 500); // close, but give 500ms for bootstrap to animate
  	};

  	$scope.ok = function () {                    

        $scope.resultText = 'Searching...';
        
        findChannel({
            'key': Config.youtubeKey,
            'id': $scope.addChannel,
            'part': 'snippet'
        })
        .then(
        function (data) {            

            if(data.items.length > 0) $scope.channelDetail(data);
            else
            {
                findChannel({
                    'key': Config.youtubeKey,
                    'forUsername': $scope.addChannel,
                    'part': 'snippet'
                })
                .then(
                function (data) {
                    if(data.items.length > 0) $scope.channelDetail(data);
                    else{
                        $scope.resultText = 'Youtube ID Not Found!';                    
                        $scope.$apply(); 
                    } 
                });                    
            }
        });

    };


    $scope.enroll = function () {
        close($scope.param, 500); // close, but give 500ms for bootstrap to animate
    };

}]);
angular.module('app')
.controller('MyChannelModalControllers', ['$scope', '$http', 'close', 'Youtube', 'Config', 'LoopBackAuth',
    function($scope, $http, close, Youtube, Config, LoopBackAuth) {

    if(null != LoopBackAuth.youtubeAccessToken){
        
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + LoopBackAuth.youtubeAccessToken;

        Youtube
        .myChannel({
            'part': 'snippet'
        })
        .$promise
        .then(
        function (data) {

            $scope.resultText = null;
            $scope.enroll_button = true;

            $scope.param = {
                userId: LoopBackAuth.currentUserId,
                type: "youtube",
                id: data.items[0].id,
                channelId: data.items[0].id,
                channelTitle: data.items[0].snippet.title,
                publishedAt: data.items[0].snippet.publishedAt,
                thumbnails: data.items[0].snippet.thumbnails,
                description: data.items[0].snippet.description,
                pageInfo: data.pageInfo,
                state: false
            };               
        });
    }

    $scope.cancel = function() {
        close(false, 500); // close, but give 500ms for bootstrap to animate
    };

    $scope.enroll = function () {
        close($scope.param, 500); // close, but give 500ms for bootstrap to animate
    };

}]);
angular.module('app')
.controller('ConfirmModalControllers', ['$scope', 'close', function($scope, close) {

    $scope.cancel = function() {
      	close(false, 500); // close, but give 500ms for bootstrap to animate
    };

    $scope.ok = function () {                                
    	close(true, 500); // close, but give 500ms for bootstrap to animate
    };

}]);
angular.module('app')
.controller('LoginModalControllers', ['$scope', '$http', '$auth', '$document', '$location', 'close', 'Youtube', 'Config', 'LoopBackAuth',
    function($scope, $http, $auth, $document, $location, close, Youtube, Config, LoopBackAuth) {

    
    console.log('LoopBackAuth', LoopBackAuth);

    $scope.authenticate = function (provider) {
      
        $auth
        .authenticate(provider)
        .then(function (res) {

            LoopBackAuth.setUser(res.data.token, res.data.id, res.data.email, res.data.youtubeAccessToken);
            LoopBackAuth.rememberMe = true;
            LoopBackAuth.save();

            //  Now close as normal, but give 500ms for bootstrap to animate
            angular.element($document[0].getElementsByClassName('modal-backdrop')).remove();
            $location.url('/mypage');
        });
    };


    $scope.close = function(result) {
        close(null, 500); // close, but give 500ms for bootstrap to animate
    };


    $scope.ok = function () {                                        
        console.log('LoopBackAuth', LoopBackAuth);        
    };


    $scope.enroll = function () {
        close($scope.param, 500); // close, but give 500ms for bootstrap to animate
    };


}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbnRyb2xsZXJzL2NvbGxlY3Rpb25Db250cm9sbGVycy5qcyIsImNvbnRyb2xsZXJzL2NvbnRlbnRDb250cm9sbGVycy5qcyIsImNvbnRyb2xsZXJzL215cGFnZUNvbnRyb2xsZXJzLmpzIiwiY29udHJvbGxlcnMvdGVzdENvbnRyb2xsZXJzLmpzIiwiZmFjdG9yaWVzL2NvbGxlY3Rpb25GYWN0b3JpZXMuanMiLCJmYWN0b3JpZXMvY29udGVudEZhY3Rvcmllcy5qcyIsImZhY3Rvcmllcy9sb29wQmFja0F1dGhGYWN0b3JpZXMuanMiLCJmYWN0b3JpZXMvdXNlckZhY3Rvcmllcy5qcyIsImZhY3Rvcmllcy95b3V0dWJlRmFjdG9yaWVzLmpzIiwiZGlyZWN0aXZlcy9mb290ZXIvZm9vdGVyLmpzIiwiZGlyZWN0aXZlcy9oZWFkZXIvaGVhZGVyLmpzIiwiZGlyZWN0aXZlcy9zaWRlYmFyL3NpZGViYXIuanMiLCJtb2RhbC9jaGFubmVsL2NoYW5uZWxNb2RhbENvbnRyb2xsZXJzLmpzIiwibW9kYWwvY2hhbm5lbC9teUNoYW5uZWxNb2RhbENvbnRyb2xsZXJzLmpzIiwibW9kYWwvY29uZmlybS9jb25maXJtTW9kYWxDb250cm9sbGVycy5qcyIsIm1vZGFsL2xvZ2luL2xvZ2luTW9kYWxDb250cm9sbGVycy5qcyJdLCJuYW1lcyI6WyJhbmd1bGFyIiwibW9kdWxlIiwidmFsdWUiLCJ5b3V0dWJlS2V5IiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsInN0YXRlIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwib3RoZXJ3aXNlIiwiaHRtbDVNb2RlIiwiJGF1dGhQcm92aWRlciIsImF1dGhIZWFkZXIiLCJodHRwSW50ZXJjZXB0b3IiLCJmYWNlYm9vayIsImNsaWVudElkIiwiZ29vZ2xlIiwiZmlsdGVyIiwic2Vjb25kcyIsIkRhdGUiLCJzZXRTZWNvbmRzIiwiJHNjb3BlIiwiJHdpbmRvdyIsIiRodHRwIiwiQ29sbGVjdGlvbiIsIkNvbnRlbnQiLCJDb25maWciLCJZb3V0dWJlIiwiTW9kYWxTZXJ2aWNlIiwicmVzZXQiLCJjb250ZW50cyIsInNraXAiLCJkaXNhYmxlZCIsImxvYWRNb3JlIiwiZmluZCIsIiRwcm9taXNlIiwidGhlbiIsInJlcyIsImxlbmd0aCIsImZvckVhY2giLCJ2YWx1ZXMiLCJjaGFubmVsIiwia2V5IiwiaWQiLCJjaGFubmVsSWQiLCJwYXJ0IiwiZGF0YSIsIml0ZW1zIiwic3RhdGlzdGljcyIsInZpZXdDb3VudCIsImNvbW1lbnRDb3VudCIsInN1YnNjcmliZXJDb3VudCIsInZpZGVvQ291bnQiLCJnZXRDb3VudCIsImNvdW50IiwicHVzaCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiZmluYWxseSIsInByb21pc2UiLCJ3aGVyZSIsIm9yZGVyIiwibmFtZSIsImxpbWl0IiwiQ29sbGVjdEJ5SWQiLCJpbmRleCIsImUiLCIkIiwidGFyZ2V0IiwibWV0aG9kIiwiaGVhZGVycyIsIkNvbnRlbnQtVHlwZSIsInR5cGUiLCJzdWNjZXNzIiwicGFyc2UiLCJkZWxldGVDb2xsZWN0aW9uIiwic2hvd01vZGFsIiwibW9kYWwiLCJlbGVtZW50IiwiY2xvc2UiLCJyZXN1bHQiLCJkZWxldGUiLCJsb2NhdGlvbiIsInJlbG9hZCIsInVwZGF0ZUNvbGxlY3Rpb24iLCJ1cGRhdGUiLCJ3aW5kb3ciLCJvbnNjcm9sbCIsImV2IiwiaW5uZXJIZWlnaHQiLCJzY3JvbGxZIiwiZG9jdW1lbnQiLCJib2R5Iiwib2Zmc2V0SGVpZ2h0IiwiJHJvb3RTY29wZSIsIiRvbiIsImV2ZW50Iiwic2VsZWN0Q2hhbm5lbCIsImJhbm5lcnMiLCJmaWVsZHMiLCJ0aHVtYm5haWxzIiwiY2hhbm5lbFRpdGxlIiwiYmFubmVySW1nIiwiYnJhbmRpbmdTZXR0aW5ncyIsImltYWdlIiwiYmFubmVyTW9iaWxlTWVkaXVtSGRJbWFnZVVybCIsImNvbmNhdCIsImluY2x1ZGUiLCJkZWxldGVkIiwiVXNlciIsIkxvb3BCYWNrQXV0aCIsImZhY3RvcnkiLCJSZXNvdXJjZSIsIiRpbmplY3RvciIsInVybEJhc2UiLCJSIiwiaXNBcnJheSIsImNyZWF0ZSIsIm1vZGVsTmFtZSIsInVuZGVmaW5lZCIsInNlbGYiLCJ0aGlzIiwicHJvcHMiLCJsb2FkIiwicmVtZW1iZXJNZSIsInNhdmUiLCJzdG9yYWdlIiwibG9jYWxTdG9yYWdlIiwic2Vzc2lvblN0b3JhZ2UiLCJwcm90b3R5cGUiLCJzZXRVc2VyIiwiYWNjZXNzVG9rZW5JZCIsInVzZXJJZCIsInVzZXJFbWFpbCIsInlvdXR1YmVBY2Nlc3NUb2tlbiIsImN1cnJlbnRVc2VySWQiLCJjdXJyZW50VXNlckVtYWlsIiwiY2xlYXJVc2VyIiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsIiRxIiwicmVxdWVzdCIsInN1YnN0ciIsIl9faXNHZXRDdXJyZW50VXNlcl9fIiwiZXJyb3IiLCJzdGF0dXMiLCJyZWplY3QiLCJ3aGVuIiwicHJvdmlkZXIiLCJzZXRBdXRoSGVhZGVyIiwiaGVhZGVyIiwic2V0VXJsQmFzZSIsIiRnZXQiLCIkcmVzb3VyY2UiLCJwYXJhbXMiLCJhY3Rpb25zIiwicmVzb3VyY2UiLCIkc2F2ZSIsInVwc2VydCIsImNhbGwiLCJsb2dpbiIsImludGVyY2VwdG9yIiwicmVzcG9uc2UiLCJhY2Nlc3NUb2tlbiIsInVzZXIiLCJsb2dvdXQiLCJub3RpZmljYXRpb24iLCJjbGVhbk5vdGlmaWNhdGlvbiIsIjo6bm90aWZpY2F0aW9uOjpjb3VudCIsImNvbGxlY3Rpb24iLCJjb250ZW50IiwiY29tbWVudHMiLCJkZWxldGVDb21tZW50cyIsIjo6Y29tbWVudHM6OmRlbGV0ZSIsInBpY3R1cmUiLCJpbmZvIiwic2VhcmNoIiwiZXhpc3RzIiwiZ2V0Q3VycmVudCIsImN1cnJlbnRVc2VyRGF0YSIsImdldENhY2hlZEN1cnJlbnQiLCJpc0F1dGhlbnRpY2F0ZWQiLCJnZXRDdXJyZW50SWQiLCJteUNoYW5uZWwiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwiJGZpbHRlciIsIiRsb2NhdGlvbiIsImFjY2Vzc190b2tlbiIsInJlcGxhY2UiLCJjYXRlZ29yaWVzIiwic3RhdGVzIiwiYWN0aXZlSXRlbSIsIiRlbWl0Iiwib3BlbiIsInNpemUiLCJjcmVhdGVDb2xsZWN0aW9uIiwicGFyYW0iLCJteUNvbGxlY3Rpb24iLCJjb2xsZXRNeVlvdXR1YmUiLCJmaW5kQ2hhbm5lbCIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2hhbm5lbERldGFpbCIsInJlc3VsdFRleHQiLCJlbnJvbGxfYnV0dG9uIiwic25pcHBldCIsInRpdGxlIiwicHVibGlzaGVkQXQiLCJkZXNjcmlwdGlvbiIsInBhZ2VJbmZvIiwiJGFwcGx5Iiwib2siLCJhZGRDaGFubmVsIiwiZm9yVXNlcm5hbWUiLCJlbnJvbGwiLCJkZWZhdWx0cyIsImNvbW1vbiIsImNhbmNlbCIsIiRhdXRoIiwiJGRvY3VtZW50IiwiYXV0aGVudGljYXRlIiwidG9rZW4iLCJlbWFpbCIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiJBQUFBLFlBRUFBLFNBQUFDLE9BQUEsT0FNQSx3QkFNQSxZQUNBLGVBQ0EsWUFDQSxhQUNBLHdCQUdBQyxNQUFBLFVBQ0FDLFdBQUEsNENBWUFDLFFBQUEsaUJBQUEscUJBQUEsb0JBQUEsU0FBQUMsRUFBQUMsRUFBQUMsR0FFQUYsRUFDQUcsTUFBQSxRQUNBQyxJQUFBLFFBQ0FDLFlBQUEscUJBQ0FDLFdBQUEsZ0JBR0FILE1BQUEsV0FDQUMsSUFBQSxXQUNBQyxZQUFBLHdCQUNBQyxXQUFBLG1CQUdBSCxNQUFBLFVBQ0FDLElBQUEsVUFDQUMsWUFBQSxvQkFDQUMsV0FBQSxlQUdBSCxNQUFBLFFBQ0FDLElBQUEsUUFDQUMsWUFBQSxrQkFDQUMsV0FBQSxhQUlBTCxFQUFBTSxVQUFBLFFBRUFMLEVBQUFNLFdBQUEsTUFHQVQsUUFBQSxvQkFBQSxnQkFBQSxTQUFBQSxFQUFBVSxHQUVBVixFQUFBVyxXQUFBLGFBQ0FYLEVBQUFZLGlCQUFBLEVBRUFGLEVBQUFHLFVBQ0FDLFNBQUEsb0JBR0FKLEVBQUFLLFFBQ0FELFNBQUEsZ0ZBTUFFLE9BQUEscUJBQUEsV0FDQSxNQUFBLFVBQUFDLEdBQ0EsTUFBQSxJQUFBQyxNQUFBLEtBQUEsRUFBQSxHQUFBQyxXQUFBRixPQ3JGQXJCLFFBQUFDLE9BQUEsT0FDQVUsV0FBQSxrQkFDQSxTQUFBLFVBQUEsUUFBQSxhQUFBLFVBQUEsU0FBQSxVQUFBLGVBQ0EsU0FBQWEsRUFBQUMsRUFBQUMsRUFBQUMsRUFBQUMsRUFBQUMsRUFBQUMsRUFBQUMsR0FLQVAsRUFBQVEsTUFBQSxXQUNBUixFQUFBUyxZQUNBVCxFQUFBSixPQUFBYyxLQUFBLEVBQ0FWLEVBQUFXLFVBQUEsRUFDQVgsRUFBQVksWUFHQVosRUFBQVksU0FBQSxXQUVBWixFQUFBVyxVQUFBLEVBRUFSLEVBQ0FVLE1BQ0FqQixPQUFBSSxFQUFBSixTQUVBa0IsU0FDQUMsS0FDQSxTQUFBQyxHQUVBQSxFQUFBQyxPQUFBLEdBRUF6QyxRQUFBMEMsUUFBQUYsRUFBQSxTQUFBRyxHQUVBYixFQUNBYyxTQUNBQyxJQUFBaEIsRUFBQTFCLFdBQ0EyQyxHQUFBSCxFQUFBSSxVQUNBQyxLQUFBLGVBRUFWLFNBQ0FDLEtBQ0EsU0FBQUMsR0FDQSxHQUFBUyxHQUFBVCxFQUFBVSxNQUFBLEdBQUFDLFVBRUFSLEdBQUFTLFVBQUFILEVBQUFHLFVBQ0FULEVBQUFVLGFBQUFKLEVBQUFJLGFBQ0FWLEVBQUFXLGdCQUFBTCxFQUFBSyxnQkFDQVgsRUFBQVksV0FBQU4sRUFBQU0sYUFHQUMsRUFBQWIsRUFBQUksV0FDQVIsS0FBQSxTQUFBa0IsR0FDQWQsRUFBQWMsTUFBQUEsSUFHQWpDLEVBQUFTLFNBQUF5QixLQUFBZixLQUdBbkIsRUFBQVcsVUFBQSxHQUlBWCxFQUFBVyxVQUFBLEdBR0EsU0FBQXdCLEdBQ0FDLFFBQUFDLElBQUEsVUFBQUMsS0FBQUMsVUFBQUosTUFFQUssUUFBQSxXQUNBeEMsRUFBQUosT0FBQWMsS0FBQVYsRUFBQUosT0FBQWMsS0FBQSxLQUtBLElBQUFzQixHQUFBLFNBQUFWLEdBRUEsR0FBQW1CLEdBQ0FyQyxFQUNBNkIsT0FDQVMsT0FDQW5CLFVBQUFELEtBR0FSLFNBQ0FDLEtBQ0EsU0FBQUMsR0FDQSxNQUFBQSxHQUFBaUIsT0FFQSxTQUFBRSxHQUNBQyxRQUFBQyxJQUFBLFVBQUFDLEtBQUFDLFVBQUFKLE1BRUFLLFFBQUEsYUFJQSxPQUFBQyxHQUdBekMsR0FBQUosUUFDQStDLE1BQUFDLEtBQ0FDLE1BQUEsS0FDQW5DLEtBQUFWLEVBQUFVLE1BR0FWLEVBQUFRLFFBT0FSLEVBQUE4QyxZQUFBLFNBQUFDLEVBQUFDLEdBRUEsR0FBQTFCLEdBQUEyQixFQUFBRCxFQUFBRSxRQUFBekIsS0FBQSxLQUVBVyxTQUFBQyxJQUFBckMsRUFBQVMsU0FBQXNDLElBQ0EvQyxFQUFBUyxTQUFBc0MsR0FBQS9ELE9BQUEsRUFFQWtCLEdBQ0FpRCxPQUFBLE9BQ0FsRSxJQUFBLGVBQ0FtRSxTQUFBQyxlQUFBLG1DQUNBNUIsTUFBQUYsVUFBQUQsR0FDQWdDLEtBQUEsU0FDQUMsUUFBQSxTQUFBdkMsR0FFQSxHQUFBUyxHQUFBYSxLQUFBa0IsTUFBQWxCLEtBQUFDLFVBQUF2QixHQUNBb0IsU0FBQUMsSUFBQVosS0FFQWUsUUFBQSxXQUNBSixRQUFBQyxJQUFBLGVBSUFyQyxFQUFBeUQsaUJBQUEsU0FBQW5DLEVBQUFDLEdBRUFoQixFQUFBbUQsV0FDQXhFLFlBQUEsbUNBQ0FDLFdBQUEsNEJBQ0E0QixLQUFBLFNBQUE0QyxHQUNBQSxFQUFBQyxRQUFBRCxRQUNBQSxFQUFBRSxNQUFBOUMsS0FBQSxTQUFBK0MsR0FFQUEsR0FDQTNELEVBQ0E0RCxRQUNBekMsR0FBQUEsSUFFQVIsU0FDQUMsS0FDQSxTQUFBQyxHQUNBZixFQUFBK0QsU0FBQUMsVUFFQSxTQUFBOUIsR0FDQUMsUUFBQUMsSUFBQSxVQUFBQyxLQUFBQyxVQUFBSixNQUVBSyxRQUFBLG1CQVNBeEMsRUFBQWtFLGlCQUFBLFNBQUE1QyxFQUFBQyxHQUVBcEIsRUFDQWdFLFFBQ0E3QyxHQUFBQSxFQUNBdEMsT0FBQSxJQUVBOEIsU0FDQUMsS0FDQSxTQUFBQyxHQUNBb0IsUUFBQUMsSUFBQXJCLEdBQ0FmLEVBQUErRCxTQUFBQyxVQUVBLFNBQUE5QixHQUNBQyxRQUFBQyxJQUFBLFVBQUFDLEtBQUFDLFVBQUFKLE9BT0FpQyxPQUFBQyxTQUFBLFNBQUFDLEdBQ0FGLE9BQUFHLFlBQUFILE9BQUFJLFNBQUFDLFNBQUFDLEtBQUFDLGVBR0EzRSxFQUFBVyxVQUNBWCxFQUFBWSxnQkM3TEFwQyxRQUFBQyxPQUFBLE9BQ0FVLFdBQUEsZUFDQSxhQUFBLFNBQUEsVUFBQSxhQUFBLFVBQUEsU0FDQSxTQUFBeUYsRUFBQTVFLEVBQUFJLEVBQUFELEVBQUFHLEVBQUFELEdBRUF1RSxFQUFBQyxJQUFBLGVBQUEsU0FBQUMsRUFBQXJELEdBQ0F6QixFQUFBK0UsY0FBQXRELEtBTUF6QixFQUFBZ0YsV0FFQTdFLEVBQ0FVLE1BQ0FqQixRQUNBcUYsUUFDQTFELFdBQUEsRUFDQTJELFlBQUEsRUFDQUMsY0FBQSxHQUVBeEMsTUFBQUMsS0FDQUMsTUFBQSxPQUdBL0IsU0FDQUMsS0FDQSxTQUFBQyxHQUVBeEMsUUFBQTBDLFFBQUFGLEVBQUEsU0FBQUcsR0FFQWIsRUFDQWMsU0FDQUMsSUFBQWhCLEVBQUExQixXQUNBMkMsR0FBQUgsRUFBQUksVUFDQUMsS0FBQSxxQkFFQVYsU0FDQUMsS0FDQSxTQUFBVSxHQUVBTixFQUFBaUUsVUFBQTNELEVBQUFDLE1BQUEsR0FBQTJELGlCQUFBQyxNQUFBQyxpQ0FLQXZGLEVBQUFnRixRQUFBaEYsRUFBQWdGLFFBQUFRLE9BQUF4RSxLQVFBaEIsRUFBQVEsTUFBQSxXQUNBUixFQUFBUyxZQUNBVCxFQUFBSixPQUFBYyxLQUFBLEVBQ0FWLEVBQUFXLFVBQUEsRUFDQVgsRUFBQVksWUFHQVosRUFBQVksU0FBQSxXQUVBWixFQUFBVyxVQUFBLEVBRUFQLEVBQ0FTLE1BQ0FqQixPQUFBSSxFQUFBSixTQUVBa0IsU0FDQUMsS0FDQSxTQUFBQyxHQUVBQSxFQUFBQyxPQUFBLEdBRUFqQixFQUFBUyxTQUFBVCxFQUFBUyxTQUFBK0UsT0FBQXhFLEdBQ0FoQixFQUFBVyxVQUFBLEdBSUFYLEVBQUFXLFVBQUEsR0FTQSxTQUFBd0IsR0FDQUMsUUFBQUMsSUFBQSxVQUFBQyxLQUFBQyxVQUFBSixNQUVBSyxRQUFBLFdBQ0F4QyxFQUFBSixPQUFBYyxLQUFBVixFQUFBSixPQUFBYyxLQUFBLE1BSUFWLEVBQUErRSxjQUFBLFNBQUF4RCxHQUVBLFFBQUFBLEVBRUF2QixFQUFBSixRQUNBNkYsU0FBQSxVQUNBOUMsTUFBQSxtQkFDQUUsTUFBQSxLQUNBbkMsS0FBQSxFQUNBZ0MsT0FDQWdELFNBQUEsSUFLQTFGLEVBQUFKLFFBQ0E2RixTQUFBLFVBQ0E5QyxNQUFBLG1CQUNBRSxNQUFBLEtBQ0FuQyxLQUFBLEVBQ0FnQyxPQUNBbkIsVUFBQUEsRUFDQW1FLFNBQUEsSUFLQTFGLEVBQUFRLFNBR0FSLEVBQUFKLFFBQ0E2RixTQUFBLFVBQ0E5QyxNQUFBLG1CQUNBRSxNQUFBLEtBQ0FuQyxLQUFBVixFQUFBVSxLQUNBZ0MsT0FDQWdELFNBQUEsSUFJQTFGLEVBQUFRLFFBR0E0RCxPQUFBQyxTQUFBLFNBQUFDLEdBQ0FGLE9BQUFHLFlBQUFILE9BQUFJLFNBQUFDLFNBQUFDLEtBQUFDLGVBR0EzRSxFQUFBVyxVQUNBWCxFQUFBWSxnQkNsSkFwQyxRQUFBQyxPQUFBLE9BQ0FVLFdBQUEsY0FDQSxhQUFBLFNBQUEsVUFBQSxPQUFBLFVBQUEsU0FBQSxVQUFBLGVBQUEsZUFDQSxTQUFBeUYsRUFBQTVFLEVBQUFDLEVBQUEwRixFQUFBdkYsRUFBQUMsRUFBQUMsRUFBQUMsRUFBQXFGLEdBRUFoQixFQUFBQyxJQUFBLGtCQUFBLFNBQUFDLEVBQUFyRCxHQUVBekIsRUFBQUosUUFDQTZGLFNBQUEsVUFDQTlDLE1BQUEsbUJBQ0FFLE1BQUEsS0FDQW5DLEtBQUEsRUFDQWdDLE9BQ0FuQixVQUFBRSxFQUNBaUUsU0FBQSxJQUdBMUYsRUFBQVEsVUFHQVIsRUFBQTRGLGFBQUFBLEVBS0E1RixFQUFBUSxNQUFBLFdBQ0FSLEVBQUFTLFlBQ0FULEVBQUFKLE9BQUFjLEtBQUEsRUFDQVYsRUFBQVcsVUFBQSxFQUNBWCxFQUFBWSxZQUdBWixFQUFBWSxTQUFBLFdBRUFaLEVBQUFXLFVBQUEsRUFFQVAsRUFDQVMsTUFDQWpCLE9BQUFJLEVBQUFKLFNBRUFrQixTQUNBQyxLQUNBLFNBQUFDLEdBRUFvQixRQUFBQyxJQUFBckIsR0FFQUEsRUFBQUMsT0FBQSxHQUVBakIsRUFBQVMsU0FBQVQsRUFBQVMsU0FBQStFLE9BQUF4RSxHQUNBaEIsRUFBQVcsVUFBQSxHQUlBWCxFQUFBVyxVQUFBLEdBR0EsU0FBQXdCLEdBQ0FDLFFBQUFDLElBQUEsVUFBQUMsS0FBQUMsVUFBQUosTUFFQUssUUFBQSxXQUNBeEMsRUFBQUosT0FBQWMsS0FBQVYsRUFBQUosT0FBQWMsS0FBQSxNQUlBVixFQUFBSixRQUNBNkYsU0FBQSxVQUNBOUMsTUFBQSxtQkFDQUUsTUFBQSxLQUNBbkMsS0FBQSxFQUNBZ0MsT0FDQW5CLFVBQUF2QixFQUFBNEYsYUFBQXJFLFlBS0E2QyxPQUFBQyxTQUFBLFNBQUFDLEdBQ0FGLE9BQUFHLFlBQUFILE9BQUFJLFNBQUFDLFNBQUFDLEtBQUFDLGVBR0EzRSxFQUFBVyxVQUNBWCxFQUFBWSxnQkNoRkFwQyxRQUFBQyxPQUFBLE9BQ0FVLFdBQUEsWUFBQSxTQUFBLFNBQUFhLE9DREF4QixRQUFBQyxPQUFBLE9BQ0FvSCxRQUNBLGNBQ0EsbUJBQUEsWUFBQSxTQUFBQyxFQUFBRixFQUFBRyxHQUVBLEdBQUFDLEdBQUEsT0FFQUMsRUFBQUgsRUFDQUUsRUFBQSxvQkFDQTFFLEdBQUEsUUFFQVQsTUFDQTVCLElBQUErRyxFQUFBLGVBQ0E3QyxPQUFBLE1BQ0ErQyxTQUFBLEdBRUFDLFFBQ0FsSCxJQUFBK0csRUFBQSxlQUNBN0MsT0FBQSxRQUVBZ0IsUUFDQWxGLElBQUErRyxFQUFBLG1CQUNBN0MsT0FBQSxPQUVBWSxRQUNBOUUsSUFBQStHLEVBQUEsbUJBQ0E3QyxPQUFBLFdBV0EsT0FOQThDLEdBQUEsZUFBQUEsRUFBQSxPQUNBQSxFQUFBLFlBQUFBLEVBQUEsV0FDQUEsRUFBQSxXQUFBQSxFQUFBLFdBRUFBLEVBQUFHLFVBQUEsYUFFQUgsS0NyQ0F6SCxRQUFBQyxPQUFBLE9BQ0FvSCxRQUNBLFdBQ0EsbUJBQUEsWUFBQSxTQUFBQyxFQUFBQyxHQUVBLEdBQUFDLEdBQUEsT0FFQUMsRUFBQUgsRUFDQUUsRUFBQSxpQkFDQTFFLEdBQUEsUUFFQVQsTUFDQTVCLElBQUErRyxFQUFBLFlBQ0E3QyxPQUFBLE1BQ0ErQyxTQUFBLEdBR0FDLFFBQ0FsSCxJQUFBK0csRUFBQSxZQUNBN0MsT0FBQSxRQUdBbEIsT0FDQWhELElBQUErRyxFQUFBLGtCQUNBN0MsT0FBQSxRQVlBLE9BUEE4QyxHQUFBLGVBQUFBLEVBQUEsT0FDQUEsRUFBQSxPQUFBQSxFQUFBLFVBQ0FBLEVBQUEsWUFBQUEsRUFBQSxXQUNBQSxFQUFBLFdBQUFBLEVBQUEsV0FFQUEsRUFBQUcsVUFBQSxVQUVBSCxLQ3BDQSxTQUFBN0IsRUFBQTVGLEVBQUE2SCxHQUdBLEdBQUE5RyxHQUFBLGdCQUNBZCxFQUFBRCxFQUFBQyxPQUFBLHlCQUFBLGNBRUFBLEdBQ0FvSCxRQUFBLGVBQUEsV0FHQSxRQUFBRCxLQUNBLEdBQUFVLEdBQUFDLElBQ0FDLEdBQUF0RixRQUFBLFNBQUEwQixHQUNBMEQsRUFBQTFELEdBQUE2RCxFQUFBN0QsS0FFQTJELEtBQUFHLFdBQUFMLEVBNkJBLFFBQUFNLEdBQUFDLEVBQUFoRSxFQUFBbEUsR0FDQSxHQUFBMkMsR0FBQSxhQUFBdUIsQ0FDQSxPQUFBbEUsSUFBQUEsRUFBQSxJQUNBa0ksRUFBQXZGLEdBQUEzQyxFQUdBLFFBQUErSCxHQUFBN0QsR0FDQSxHQUFBdkIsR0FBQSxhQUFBdUIsQ0FDQSxPQUFBaUUsY0FBQXhGLElBQUF5RixlQUFBekYsSUFBQSxLQTVDQSxHQUFBbUYsSUFBQSxnQkFBQSxnQkFBQSxtQkFBQSxxQkFnQ0EsT0F0QkFaLEdBQUFtQixVQUFBSixLQUFBLFdBQ0EsR0FBQUwsR0FBQUMsS0FDQUssRUFBQUwsS0FBQUcsV0FBQUcsYUFBQUMsY0FDQU4sR0FBQXRGLFFBQUEsU0FBQTBCLEdBQ0ErRCxFQUFBQyxFQUFBaEUsRUFBQTBELEVBQUExRCxPQUlBZ0QsRUFBQW1CLFVBQUFDLFFBQUEsU0FBQUMsRUFBQUMsRUFBQUMsRUFBQUMsR0FDQWIsS0FBQVUsY0FBQUEsRUFDQVYsS0FBQWMsY0FBQUgsRUFDQVgsS0FBQWUsaUJBQUFILEVBQ0FaLEtBQUFhLG1CQUFBQSxHQUdBeEIsRUFBQW1CLFVBQUFRLFVBQUEsV0FDQWhCLEtBQUFVLGNBQUEsS0FDQVYsS0FBQWMsY0FBQSxLQUNBZCxLQUFBZSxpQkFBQSxLQUNBZixLQUFBYSxtQkFBQSxNQUdBLEdBQUF4QixLQWVBaEgsUUFBQSxnQkFBQSxTQUFBNEksR0FDQUEsRUFBQUMsYUFBQXZGLEtBQUEscUNBRUEyRCxRQUFBLGtDQUFBLEtBQUEsZUFBQSxhQUNBLFNBQUE2QixFQUFBOUIsRUFBQWhCLEdBR0EsR0FBQW9CLEdBQUEsTUFFQSxRQUNBMkIsUUFBQSxTQUFBL0ksR0FHQSxHQUFBQSxFQUFBSyxJQUFBMkksT0FBQSxFQUFBNUIsRUFBQS9FLFVBQUErRSxFQUNBLE1BQUFwSCxFQUdBLElBQUFnSCxFQUFBcUIsY0FDQXJJLEVBQUF3RSxRQUFBN0QsR0FBQXFHLEVBQUFxQixrQkFDQSxJQUFBckksRUFBQWlKLHFCQUFBLENBR0EsR0FBQTdHLElBQ0EwRCxNQUFBb0QsT0FBQUMsT0FBQSxNQUNBQSxPQUFBLElBQ0FuSixPQUFBQSxFQUNBd0UsUUFBQSxXQUNBLE1BQUFpRCxJQUdBLE9BQUFxQixHQUFBTSxPQUFBaEgsR0FFQSxNQUFBcEMsSUFBQThJLEVBQUFPLEtBQUFySixRQXlCQXNKLFNBQUEsbUJBQUEsV0FXQTNCLEtBQUE0QixjQUFBLFNBQUFDLEdBQ0E3SSxFQUFBNkksR0FZQTdCLEtBQUE4QixXQUFBLFNBQUFwSixHQUNBK0csUUFBQS9HLEdBR0FzSCxLQUFBK0IsTUFBQSxZQUFBLFNBQUFDLEdBQ0EsTUFBQSxVQUFBdEosRUFBQXVKLEVBQUFDLEdBQ0EsR0FBQUMsR0FBQUgsRUFBQXRKLEVBQUF1SixFQUFBQyxFQVdBLE9BTkFDLEdBQUEzQixVQUFBNEIsTUFBQSxTQUFBcEYsRUFBQXVFLEdBR0EsR0FBQWhFLEdBQUE0RSxFQUFBRSxPQUFBQyxLQUFBdEMsUUFBQUEsS0FBQWhELEVBQUF1RSxFQUNBLE9BQUFoRSxHQUFBaEQsVUFBQWdELEdBRUE0RSxRQUtBdEUsT0FBQUEsT0FBQTVGLFNDOUpBQSxRQUFBQyxPQUFBLE9BQ0FvSCxRQUNBLFFBQ0EsbUJBQUEsZUFBQSxZQUFBLFNBQUFDLEVBQUFGLEVBQUFHLEdBRUEsR0FBQUMsR0FBQSxPQUVBQyxFQUFBSCxFQUNBRSxFQUFBLGtCQUNBa0IsT0FBQSxZQUVBNEIsT0FDQTdKLElBQUErRyxFQUFBLGVBQ0E3QyxPQUFBLE9BQ0FxRixRQUNBL0MsUUFBQSxRQUVBc0QsYUFDQUMsU0FBQSxTQUFBQSxHQUNBLEdBQUFDLEdBQUFELEVBQUF2SCxJQUlBLE9BSEFtRSxHQUFBb0IsUUFBQWlDLEVBQUEzSCxHQUFBMkgsRUFBQS9CLE9BQUErQixFQUFBQyxNQUNBdEQsRUFBQWMsV0FBQXNDLEVBQUFwSyxPQUFBNEosT0FBQTlCLGNBQUEsRUFDQWQsRUFBQWUsT0FDQXFDLEVBQUFOLFlBTUFTLFFBQ0FsSyxJQUFBK0csRUFBQSxnQkFDQTdDLE9BQUEsT0FDQTRGLGFBQ0FDLFNBQUEsU0FBQUEsR0FJQSxNQUhBcEQsR0FBQTJCLFlBQ0EzQixFQUFBYyxZQUFBLEVBQ0FkLEVBQUFlLE9BQ0FxQyxFQUFBTixZQUtBVSxjQUNBbkssSUFBQStHLEVBQUEsK0JBQ0E3QyxPQUFBLE1BQ0ErQyxTQUFBLEdBR0FtRCxtQkFDQXBLLElBQUErRyxFQUFBLCtCQUNBN0MsT0FBQSxPQUlBbUcseUJBQ0FySyxJQUFBK0csRUFBQSxxQ0FDQTdDLE9BQUEsT0FHQW9HLFlBQ0F0SyxJQUFBK0csRUFBQSw0QkFDQTdDLE9BQUEsT0FHQXFHLFNBQ0F2SyxJQUFBK0csRUFBQSx5QkFDQTdDLE9BQUEsTUFDQStDLFNBQUEsR0FHQXVELFVBQ0F4SyxJQUFBK0csRUFBQSwwQkFDQTdDLE9BQUEsTUFDQStDLFNBQUEsR0FHQXdELGdCQUNBekssSUFBQStHLEVBQUEsMEJBQ0E3QyxPQUFBLE9BSUF3RyxzQkFDQTFLLElBQUErRyxFQUFBLDBCQUNBN0MsT0FBQSxVQUdBZ0QsUUFDQWxILElBQUErRyxFQUFBLFNBQ0E3QyxPQUFBLFFBR0FnQixRQUNBbEYsSUFBQStHLEVBQUEsaUJBQ0E3QyxPQUFBLE9BR0F5RyxTQUNBM0ssSUFBQStHLEVBQUEseUJBQ0E3QyxPQUFBLE9BR0EwRyxNQUNBNUssSUFBQStHLEVBQUEsc0JBQ0E3QyxPQUFBLE9BR0EyRyxRQUNBN0ssSUFBQStHLEVBQUEseUJBQ0E3QyxPQUFBLE1BQ0ErQyxTQUFBLEdBR0E2RCxRQUNBOUssSUFBQStHLEVBQUEsd0JBQ0E3QyxPQUFBLE9BR0E2RyxZQUNBL0ssSUFBQStHLEVBQUEsYUFDQTdDLE9BQUEsTUFDQXFGLFFBQ0FsSCxHQUFBLFdBQ0EsR0FBQUEsR0FBQXNFLEVBQUF5QixhQUVBLE9BREEsT0FBQS9GLElBQUFBLEVBQUEsaUJBQ0FBLElBR0F5SCxhQUNBQyxTQUFBLFNBQUFBLEdBRUEsTUFEQXBELEdBQUFxRSxnQkFBQWpCLEVBQUF2SCxLQUNBdUgsRUFBQU4sV0FHQWIsc0JBQUEsSUEyQkEsT0F0QkE1QixHQUFBLGVBQUFBLEVBQUEsT0FDQUEsRUFBQSxPQUFBQSxFQUFBLFVBQ0FBLEVBQUEsWUFBQUEsRUFBQSxXQUNBQSxFQUFBLFdBQUFBLEVBQUEsV0FHQUEsRUFBQWlFLGlCQUFBLFdBQ0EsR0FBQXpJLEdBQUFtRSxFQUFBcUUsZUFDQSxPQUFBeEksR0FBQSxHQUFBd0UsR0FBQXhFLEdBQUEsTUFHQXdFLEVBQUFrRSxnQkFBQSxXQUNBLE1BQUEsT0FBQTVELEtBQUE2RCxnQkFHQW5FLEVBQUFtRSxhQUFBLFdBQ0EsTUFBQXhFLEdBQUF5QixlQUlBcEIsRUFBQUcsVUFBQSxPQUVBSCxLQ2pLQXpILFFBQUFDLE9BQUEsT0FDQW9ILFFBQ0EsV0FDQSxtQkFBQSxZQUFBLFNBQUFDLEVBQUFDLEdBRUEsR0FBQUMsR0FBQSx3Q0FFQUMsRUFBQUgsRUFDQUUsRUFBQSx1QkFDQTNFLElBQUEsT0FBQUcsS0FBQSxVQUVBSixTQUNBbkMsSUFBQStHLEVBQUEsWUFDQTdDLE9BQUEsT0FFQWtILFdBQ0FwTCxJQUFBK0csRUFBQSxzQkFDQTdDLE9BQUEsUUFZQSxPQVBBOEMsR0FBQSxlQUFBQSxFQUFBLE9BQ0FBLEVBQUEsT0FBQUEsRUFBQSxVQUNBQSxFQUFBLFlBQUFBLEVBQUEsV0FDQUEsRUFBQSxXQUFBQSxFQUFBLFdBRUFBLEVBQUFHLFVBQUEsVUFFQUgsS0M3QkF6SCxRQUFBQyxPQUFBLE9BQ0E2TCxVQUFBLFNBQUEsV0FDQSxPQUNBQyxTQUFBLElBRUFDLE9BQUF0QixLQUFBLEtBQ0FoSyxZQUFBLHNDQUNBQyxZQUFBLFNBQUEsVUFBQSxTQUFBYSxFQUFBeUssU0NQQWpNLFFBQUFDLE9BQUEsT0FDQTZMLFVBQUEsU0FBQSxXQUNBLE9BQ0FDLFNBQUEsSUFFQUMsT0FBQXRCLEtBQUEsS0FDQWhLLFlBQUEsc0NBQ0FDLFlBQUEsU0FBQSxhQUFBLFlBQUEsVUFBQSxhQUFBLGVBQUEsZUFBQSxPQUNBLFNBQUFhLEVBQUE0RSxFQUFBOEYsRUFBQUQsRUFBQXRLLEVBQUFJLEVBQUFxRixFQUFBRCxHQUVBM0YsRUFBQTRGLGFBQUFBLEVBRUE1RixFQUFBOEksTUFBQSxXQUVBdkksRUFBQW1ELFdBQ0F4RSxZQUFBLCtCQUNBQyxXQUFBLDBCQUNBNEIsS0FBQSxTQUFBNEMsR0FDQUEsRUFBQUMsUUFBQUQsUUFDQUEsRUFBQUUsTUFBQTlDLEtBQUEsU0FBQStDLFNBTUE5RCxFQUFBbUosT0FBQSxXQUVBeEQsRUFDQXdELFFBQUF3QixhQUFBL0UsRUFBQXFCLGdCQUNBbkcsU0FDQUMsS0FDQSxTQUFBQyxFQUFBb0gsR0FFQXNDLEVBQUF6TCxJQUFBLFVBRUEsU0FBQWtELEdBQ0FDLFFBQUFDLElBQUEsWUFBQUMsS0FBQUMsVUFBQUosWUNwQ0EzRCxRQUFBQyxPQUFBLE9BQ0E2TCxVQUFBLFVBQUEsV0FDQSxPQUNBQyxTQUFBLElBQ0FLLFNBQUEsRUFDQUosT0FBQXRCLEtBQUEsS0FDQWhLLFlBQUEsZ0RBRUFDLFlBQUEsYUFBQSxTQUFBLFVBQUEsYUFDQSxTQUFBeUYsRUFBQTVFLEVBQUF5SyxFQUFBdEssR0FFQUgsRUFBQTZLLGNBRUE3SyxFQUFBOEssVUFDQTlLLEVBQUE4SyxPQUFBQyxXQUFBLE1BRUE1SyxFQUNBVSxNQUNBakIsUUFDQXFGLFFBQ0ExRCxXQUFBLEVBQ0E0RCxjQUFBLEdBRUF4QyxNQUFBQyxRQUdBOUIsU0FDQUMsS0FDQSxTQUFBQyxHQUNBaEIsRUFBQTZLLFdBQUE3SyxFQUFBNkssV0FBQXJGLE9BQUF4RSxLQUdBaEIsRUFBQStFLGNBQUEsU0FBQXhELEdBQ0FxRCxFQUFBb0csTUFBQSxlQUFBekosU0FNQStJLFVBQUEsb0JBQUEsV0FDQSxPQUNBQyxTQUFBLElBQ0FLLFNBQUEsRUFDQUosT0FBQXRCLEtBQUEsS0FDQWhLLFlBQUEsbURBRUFDLFlBQUEsYUFBQSxTQUFBLFVBQUEsVUFBQSxlQUFBLGFBQ0EsU0FBQXlGLEVBQUE1RSxFQUFBeUssRUFBQXhLLEVBQUFNLEVBQUFKLEdBS0FILEVBQUFpTCxLQUFBLFNBQUFDLEdBRUEzSyxFQUFBbUQsV0FDQXhFLFlBQUEsdUNBQ0FDLFdBQUEsNEJBQ0E0QixLQUFBLFNBQUE0QyxHQUNBQSxFQUFBQyxRQUFBRCxRQUNBQSxFQUFBRSxNQUFBOUMsS0FBQSxTQUFBK0MsR0FDQSxNQUFBQSxHQUFBcUgsRUFBQXJILE9BTUEsSUFBQXFILEdBQUEsU0FBQUMsR0FFQWpMLEVBQ0FnRyxPQUFBaUYsR0FDQXRLLFNBQ0FDLEtBQ0EsU0FBQUMsR0FDQW9CLFFBQUFDLElBQUFyQixHQUNBZixFQUFBK0QsU0FBQUMsVUFFQSxTQUFBOUIsR0FDQUMsUUFBQUMsSUFBQSxVQUFBQyxLQUFBQyxVQUFBSixNQUVBSyxRQUFBLG9CQVNBOEgsVUFBQSxnQkFBQSxXQUNBLE9BQ0FDLFNBQUEsSUFDQUssU0FBQSxFQUNBSixPQUFBdEIsS0FBQSxLQUNBaEssWUFBQSwrQ0FDQUMsWUFBQSxhQUFBLFVBQUEsU0FBQSxVQUFBLFFBQUEsYUFBQSxlQUFBLGVBQUEsT0FBQSxVQUFBLFNBQUEsVUFDQSxTQUFBeUYsRUFBQTNFLEVBQUFELEVBQUF5SyxFQUFBdkssRUFBQUMsRUFBQXlGLEVBQUFyRixFQUFBb0YsRUFBQXJGLEVBQUFELEVBQUFELEdBRUFKLEVBQUE0RixhQUFBQSxFQUNBNUYsRUFBQXFMLGdCQUVBMUYsRUFDQTRELFlBQ0FyQyxPQUFBdEIsRUFBQXlCLGdCQUVBdkcsU0FDQUMsS0FDQSxTQUFBK0MsR0FFQSxNQUFBQSxJQUdBYyxFQUFBb0csTUFBQSxrQkFBQWxILEVBQUF2QyxXQUVBakIsRUFDQWMsU0FDQUMsSUFBQWhCLEVBQUExQixXQUNBMkMsR0FBQXdDLEVBQUF2QyxVQUNBQyxLQUFBLGVBRUFWLFNBQ0FDLEtBQ0EsU0FBQUMsR0FDQSxHQUFBUyxHQUFBVCxFQUFBVSxNQUFBLEdBQUFDLFVBRUEzQixHQUFBcUwsYUFBQXpKLFVBQUFILEVBQUFHLFVBQ0E1QixFQUFBcUwsYUFBQXhKLGFBQUFKLEVBQUFJLGFBQ0E3QixFQUFBcUwsYUFBQXZKLGdCQUFBTCxFQUFBSyxnQkFDQTlCLEVBQUFxTCxhQUFBdEosV0FBQU4sRUFBQU0sYUFHQUMsRUFBQThCLEVBQUF2QyxXQUNBUixLQUFBLFNBQUFrQixHQUNBakMsRUFBQXFMLGFBQUFwSixNQUFBQSxJQUdBakMsRUFBQXFMLGFBQUF2SCxJQUdBLFNBQUEzQixHQUNBQyxRQUFBQyxJQUFBLFVBQUFDLEtBQUFDLFVBQUFKLE1BT0FuQyxFQUFBOEMsWUFBQSxXQUVBOUMsRUFBQXFMLGFBQUFyTSxPQUFBLEVBRUFrQixHQUNBaUQsT0FBQSxPQUNBbEUsSUFBQSxlQUNBbUUsU0FBQUMsZUFBQSxtQ0FDQTVCLE1BQUFGLFVBQUF2QixFQUFBcUwsYUFBQTlKLFdBQ0ErQixLQUFBLFNBQ0FDLFFBQUEsU0FBQXZDLEdBRUEsR0FBQVMsR0FBQWEsS0FBQWtCLE1BQUFsQixLQUFBQyxVQUFBdkIsR0FDQW9CLFNBQUFDLElBQUFaLEtBRUFlLFFBQUEsV0FDQUosUUFBQUMsSUFBQSxlQUtBckMsRUFBQXNMLGdCQUFBLFNBQUFKLEdBRUEzSyxFQUFBbUQsV0FDQXhFLFlBQUEsMENBQ0FDLFdBQUEsOEJBQ0E0QixLQUFBLFNBQUE0QyxHQUNBQSxFQUFBQyxRQUFBRCxRQUNBQSxFQUFBRSxNQUFBOUMsS0FBQSxTQUFBK0MsR0FDQUEsR0FBQXFILEVBQUFySCxRQUtBOUQsRUFBQXlELGlCQUFBLFNBQUFuQyxFQUFBQyxHQUVBaEIsRUFBQW1ELFdBQ0F4RSxZQUFBLG1DQUNBQyxXQUFBLDRCQUNBNEIsS0FBQSxTQUFBNEMsR0FDQUEsRUFBQUMsUUFBQUQsUUFDQUEsRUFBQUUsTUFBQTlDLEtBQUEsU0FBQStDLEdBRUFBLEdBQ0EzRCxFQUNBNEQsUUFDQXpDLEdBQUFBLElBRUFSLFNBQ0FDLEtBQ0EsU0FBQUMsR0FDQWYsRUFBQStELFNBQUFDLFVBRUEsU0FBQTlCLEdBQ0FDLFFBQUFDLElBQUEsVUFBQUMsS0FBQUMsVUFBQUosVUFRQSxJQUFBZ0osR0FBQSxTQUFBQyxHQUVBakwsRUFDQWdHLE9BQUFpRixHQUNBdEssU0FDQUMsS0FDQSxTQUFBQyxHQUNBb0IsUUFBQUMsSUFBQXJCLEdBQ0FmLEVBQUErRCxTQUFBQyxVQUVBLFNBQUE5QixHQUNBQyxRQUFBQyxJQUFBLFVBQUFDLEtBQUFDLFVBQUFKLE1BRUFLLFFBQUEsZUFLQVIsRUFBQSxTQUFBVixHQUVBLEdBQUFtQixHQUNBckMsRUFDQTZCLE9BQ0FTLE9BQ0FuQixVQUFBRCxLQUdBUixTQUNBQyxLQUNBLFNBQUFDLEdBQ0EsTUFBQUEsR0FBQWlCLE9BRUEsU0FBQUUsR0FDQUMsUUFBQUMsSUFBQSxVQUFBQyxLQUFBQyxVQUFBSixLQUdBLE9BQUFNLFNDcFBBakUsUUFBQUMsT0FBQSxPQUNBVSxXQUFBLDJCQUFBLFNBQUEsUUFBQSxVQUFBLFNBQUEsU0FBQWEsRUFBQTZELEVBQUF2RCxFQUFBRCxHQUdBLFFBQUFrTCxHQUFBSCxHQUVBLE1BQUEsSUFBQUksU0FBQSxTQUFBQyxFQUFBekQsR0FFQTFILEVBQ0FjLFFBQUFnSyxHQUNBdEssU0FDQUMsS0FDQSxTQUFBVSxHQUNBLE1BQUFnSyxHQUFBaEssT0FPQXpCLEVBQUEwTCxjQUFBLFNBQUFqSyxHQUVBekIsRUFBQTJMLFdBQUEsS0FDQTNMLEVBQUE0TCxlQUFBLEVBRUE1TCxFQUFBb0wsT0FDQTlILEtBQUEsVUFDQWhDLEdBQUFHLEVBQUFDLE1BQUEsR0FBQUosR0FDQUMsVUFBQUUsRUFBQUMsTUFBQSxHQUFBSixHQUNBNkQsYUFBQTFELEVBQUFDLE1BQUEsR0FBQW1LLFFBQUFDLE1BQ0FDLFlBQUF0SyxFQUFBQyxNQUFBLEdBQUFtSyxRQUFBRSxZQUNBN0csV0FBQXpELEVBQUFDLE1BQUEsR0FBQW1LLFFBQUEzRyxXQUNBOEcsWUFBQXZLLEVBQUFDLE1BQUEsR0FBQW1LLFFBQUFHLFlBQ0FDLFNBQUF4SyxFQUFBd0ssU0FDQWpOLE9BQUEsR0FHQWdCLEVBQUFrTSxVQUlBbE0sRUFBQTZELE1BQUEsU0FBQUMsR0FDQUQsRUFBQSxLQUFBLE1BR0E3RCxFQUFBbU0sR0FBQSxXQUVBbk0sRUFBQTJMLFdBQUEsZUFFQUosR0FDQWxLLElBQUFoQixFQUFBMUIsV0FDQTJDLEdBQUF0QixFQUFBb00sV0FDQTVLLEtBQUEsWUFFQVQsS0FDQSxTQUFBVSxHQUVBQSxFQUFBQyxNQUFBVCxPQUFBLEVBQUFqQixFQUFBMEwsY0FBQWpLLEdBR0E4SixHQUNBbEssSUFBQWhCLEVBQUExQixXQUNBME4sWUFBQXJNLEVBQUFvTSxXQUNBNUssS0FBQSxZQUVBVCxLQUNBLFNBQUFVLEdBQ0FBLEVBQUFDLE1BQUFULE9BQUEsRUFBQWpCLEVBQUEwTCxjQUFBakssSUFFQXpCLEVBQUEyTCxXQUFBLHdCQUNBM0wsRUFBQWtNLGVBU0FsTSxFQUFBc00sT0FBQSxXQUNBekksRUFBQTdELEVBQUFvTCxNQUFBLFNDaEZBNU0sUUFBQUMsT0FBQSxPQUNBVSxXQUFBLDZCQUFBLFNBQUEsUUFBQSxRQUFBLFVBQUEsU0FBQSxlQUNBLFNBQUFhLEVBQUFFLEVBQUEyRCxFQUFBdkQsRUFBQUQsRUFBQXVGLEdBRUEsTUFBQUEsRUFBQXdCLHFCQUVBbEgsRUFBQXFNLFNBQUFuSixRQUFBb0osT0FBQSxjQUFBLFVBQUE1RyxFQUFBd0IsbUJBRUE5RyxFQUNBK0osV0FDQTdJLEtBQUEsWUFFQVYsU0FDQUMsS0FDQSxTQUFBVSxHQUVBekIsRUFBQTJMLFdBQUEsS0FDQTNMLEVBQUE0TCxlQUFBLEVBRUE1TCxFQUFBb0wsT0FDQWxFLE9BQUF0QixFQUFBeUIsY0FDQS9ELEtBQUEsVUFDQWhDLEdBQUFHLEVBQUFDLE1BQUEsR0FBQUosR0FDQUMsVUFBQUUsRUFBQUMsTUFBQSxHQUFBSixHQUNBNkQsYUFBQTFELEVBQUFDLE1BQUEsR0FBQW1LLFFBQUFDLE1BQ0FDLFlBQUF0SyxFQUFBQyxNQUFBLEdBQUFtSyxRQUFBRSxZQUNBN0csV0FBQXpELEVBQUFDLE1BQUEsR0FBQW1LLFFBQUEzRyxXQUNBOEcsWUFBQXZLLEVBQUFDLE1BQUEsR0FBQW1LLFFBQUFHLFlBQ0FDLFNBQUF4SyxFQUFBd0ssU0FDQWpOLE9BQUEsTUFLQWdCLEVBQUF5TSxPQUFBLFdBQ0E1SSxHQUFBLEVBQUEsTUFHQTdELEVBQUFzTSxPQUFBLFdBQ0F6SSxFQUFBN0QsRUFBQW9MLE1BQUEsU0N2Q0E1TSxRQUFBQyxPQUFBLE9BQ0FVLFdBQUEsMkJBQUEsU0FBQSxRQUFBLFNBQUFhLEVBQUE2RCxHQUVBN0QsRUFBQXlNLE9BQUEsV0FDQTVJLEdBQUEsRUFBQSxNQUdBN0QsRUFBQW1NLEdBQUEsV0FDQXRJLEdBQUEsRUFBQSxTQ1JBckYsUUFBQUMsT0FBQSxPQUNBVSxXQUFBLHlCQUFBLFNBQUEsUUFBQSxRQUFBLFlBQUEsWUFBQSxRQUFBLFVBQUEsU0FBQSxlQUNBLFNBQUFhLEVBQUFFLEVBQUF3TSxFQUFBQyxFQUFBakMsRUFBQTdHLEVBQUF2RCxFQUFBRCxFQUFBdUYsR0FHQXhELFFBQUFDLElBQUEsZUFBQXVELEdBRUE1RixFQUFBNE0sYUFBQSxTQUFBMUUsR0FFQXdFLEVBQ0FFLGFBQUExRSxHQUNBbkgsS0FBQSxTQUFBQyxHQUVBNEUsRUFBQW9CLFFBQUFoRyxFQUFBUyxLQUFBb0wsTUFBQTdMLEVBQUFTLEtBQUFILEdBQUFOLEVBQUFTLEtBQUFxTCxNQUFBOUwsRUFBQVMsS0FBQTJGLG9CQUNBeEIsRUFBQWMsWUFBQSxFQUNBZCxFQUFBZSxPQUdBbkksUUFBQW9GLFFBQUErSSxFQUFBLEdBQUFJLHVCQUFBLG1CQUFBQyxTQUNBdEMsRUFBQXpMLElBQUEsY0FLQWUsRUFBQTZELE1BQUEsU0FBQUMsR0FDQUQsRUFBQSxLQUFBLE1BSUE3RCxFQUFBbU0sR0FBQSxXQUNBL0osUUFBQUMsSUFBQSxlQUFBdUQsSUFJQTVGLEVBQUFzTSxPQUFBLFdBQ0F6SSxFQUFBN0QsRUFBQW9MLE1BQUEiLCJmaWxlIjoiYnVuZGxlLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ2NvbnRlbnRDb250cm9sbGVycycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ2NvbGxlY3Rpb25Db250cm9sbGVycycsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAnbXlwYWdlQ29udHJvbGxlcnMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ3Rlc3RDb250cm9sbGVycycsXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICdsb29wQmFja0F1dGhGYWN0b3JpZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ3VzZXJGYWN0b3JpZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJ2NvbnRlbnRGYWN0b3JpZXMnLCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAnY29sbGVjdGlvbkZhY3RvcmllcycsICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICd5b3V0dWJlRmFjdG9yaWVzJywgIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAndWkucm91dGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICd1aS5ib290c3RyYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ25nQ29va2llcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAnc2F0ZWxsaXplcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYW5ndWxhck1vZGFsU2VydmljZSdcbiAgICAgICAgICAgICAgICAgICAgXSlcblxuLnZhbHVlKCdDb25maWcnLCB7XG4gICAgeW91dHViZUtleSA6ICdBSXphU3lDcVIxdnh4R0k3UXo5Vy1OM0lKREYwRTEtOURvUHVoancnICAgICBcbn0pXG5cbi8vIC5ydW4oZnVuY3Rpb24gKFVzZXIpIHtcblxuICAgIC8vIGNvbnNvbGUubG9nKFVzZXIuZ2V0Q2FjaGVkQ3VycmVudCgpKTtcbiAgICAvL0NoZWNrIGlmIFVzZXIgaXMgYXV0aGVudGljYXRlZFxuICAgIC8vIGlmIChVc2VyLmdldENhY2hlZEN1cnJlbnQoKSA9PSBudWxsKSB7XG4gICAgLy8gICAgIFVzZXIuZ2V0Q3VycmVudCgpO1xuICAgIC8vIH1cbi8vIH0pXG5cbi5jb25maWcoWyckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInLCAnJGxvY2F0aW9uUHJvdmlkZXInLCBmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIFxuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAgIC5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgICAgIHVybDogJy9ob21lJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvY29udGVudC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDb250ZW50Q3RybCdcbiAgICAgICAgfSlcblxuICAgICAgICAuc3RhdGUoJ2NvbGxlY3QnLCB7XG4gICAgICAgICAgICB1cmw6ICcvY29sbGVjdCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2NvbGxlY3Rpb24uaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnQ29sbGVjdGlvbkN0cmwnXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN0YXRlKCdteXBhZ2UnLCB7XG4gICAgICAgICAgICB1cmw6ICcvbXlwYWdlJyxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvbXlwYWdlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ015cGFnZUN0cmwnXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN0YXRlKCd0ZXN0Jywge1xuICAgICAgICAgICAgdXJsOiAnL3Rlc3QnLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy90ZXN0Lmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1Rlc3RDdHJsJ1xuICAgICAgICB9KVxuICAgICAgICA7XG5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCdob21lJyk7XG5cbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG59XSlcblxuLmNvbmZpZyhbJ3NhdGVsbGl6ZXIuY29uZmlnJywgJyRhdXRoUHJvdmlkZXInLCBmdW5jdGlvbiAoY29uZmlnLCAkYXV0aFByb3ZpZGVyKSB7XG5cbiAgICBjb25maWcuYXV0aEhlYWRlciA9ICdTYXRlbGxpemVyJztcbiAgICBjb25maWcuaHR0cEludGVyY2VwdG9yID0gZmFsc2U7XG5cbiAgICAkYXV0aFByb3ZpZGVyLmZhY2Vib29rKHtcbiAgICAgICAgY2xpZW50SWQ6ICc2NTIzNzI5MjgxOTgyMTInXG4gICAgfSk7XG5cbiAgICAkYXV0aFByb3ZpZGVyLmdvb2dsZSh7XG4gICAgICAgIGNsaWVudElkOiAnOTY4MDY0OTYxNjY2LWc4NWFrbGtmdm1pNGR1M2k3ZjdxcjUxb3EwMXVtZ292LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tJyAvL3Byb2R1Y3RcbiAgICAgICAgLy8gY2xpZW50SWQ6ICc5NjgwNjQ5NjE2NjYtZzdhbnF1Z2VmN2JyZmtpZThwMzN0ODg0bWdqOHZlMGQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20nIC8vdGVzdCAgICBcbiAgICB9KTtcblxufV0pXG5cbi5maWx0ZXIoJ3NlY29uZHNUb0RhdGVUaW1lJywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZSgxOTcwLCAwLCAxKS5zZXRTZWNvbmRzKHNlY29uZHMpO1xuICAgIH07XG59XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uY29udHJvbGxlcignQ29sbGVjdGlvbkN0cmwnLCBcbiAgICBbJyRzY29wZScsICckd2luZG93JywgJyRodHRwJywgJ0NvbGxlY3Rpb24nLCAnQ29udGVudCcsICdDb25maWcnLCAnWW91dHViZScsICdNb2RhbFNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uKCRzY29wZSwgJHdpbmRvdywgJGh0dHAsIENvbGxlY3Rpb24sIENvbnRlbnQsIENvbmZpZywgWW91dHViZSwgTW9kYWxTZXJ2aWNlKSB7IFxuXG4gICAgLyoqXG4gICAgICogIENvbGxlY3Rpb24gTGlzdCBcbiAgICAqKi9cbiAgICAkc2NvcGUucmVzZXQgPSBmdW5jdGlvbigpeyAgICAgICAgXG4gICAgICAgICRzY29wZS5jb250ZW50cyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmlsdGVyLnNraXAgPSAwO1xuICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSBmYWxzZTsgICAgICAgIFxuICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvYWRNb3JlID0gZnVuY3Rpb24oKXsgICAgIFxuXG4gICAgICAgICRzY29wZS5kaXNhYmxlZCA9IHRydWU7IFxuXG4gICAgICAgIENvbGxlY3Rpb25cbiAgICAgICAgLmZpbmQoe1xuICAgICAgICAgICAgZmlsdGVyOiAkc2NvcGUuZmlsdGVyICAgIFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uIChyZXMpIHsgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYocmVzLmxlbmd0aCA+IDApIFxuICAgICAgICAgICAgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChyZXMsIGZ1bmN0aW9uICh2YWx1ZXMpIHsgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBZb3V0dWJlXG4gICAgICAgICAgICAgICAgICAgIC5jaGFubmVsKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdrZXknOiBDb25maWcueW91dHViZUtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IHZhbHVlcy5jaGFubmVsSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAncGFydCc6ICdzdGF0aXN0aWNzJ1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuJHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzLml0ZW1zWzBdLnN0YXRpc3RpY3M7ICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMudmlld0NvdW50ID0gZGF0YS52aWV3Q291bnQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMuY29tbWVudENvdW50ID0gZGF0YS5jb21tZW50Q291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMuc3Vic2NyaWJlckNvdW50ID0gZGF0YS5zdWJzY3JpYmVyQ291bnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMudmlkZW9Db3VudCA9IGRhdGEudmlkZW9Db3VudDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZ2V0Q291bnQodmFsdWVzLmNoYW5uZWxJZClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oY291bnQpeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMuY291bnQgPSBjb3VudDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbnRlbnRzLnB1c2godmFsdWVzKTsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSk7ICAvLyBlbmQgZm9yZWFjaCAgICBcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAgeyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSB0cnVlOyAvLyBEaXNhYmxlIGZ1cnRoZXIgY2FsbHMgaWYgdGhlcmUgYXJlIG5vIG1vcmUgaXRlbXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGVycikgeyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyIDo6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uICgpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgJHNjb3BlLmZpbHRlci5za2lwID0gJHNjb3BlLmZpbHRlci5za2lwICsgMTU7ICBcbiAgICAgICAgfSk7ICAgICAgICBcbiAgICB9O1xuXG5cbiAgICB2YXIgZ2V0Q291bnQgPSBmdW5jdGlvbihpZCl7XG5cbiAgICAgICAgdmFyIHByb21pc2UgPSBcbiAgICAgICAgICAgICAgICBDb250ZW50XG4gICAgICAgICAgICAgICAgLmNvdW50KHsgICAgXG4gICAgICAgICAgICAgICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsSWQ6IGlkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmNvdW50OyAgIFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycikgeyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnIgOjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uICgpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgfSk7ICAgICAgXG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5maWx0ZXIgPSB7ICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG9yZGVyOiBuYW1lLFxuICAgICAgICAgICAgbGltaXQ6ICcxNScsXG4gICAgICAgICAgICBza2lwOiAkc2NvcGUuc2tpcFxuICAgICAgICB9XG5cbiAgICAkc2NvcGUucmVzZXQoKTtcblxuXG5cbiAgICAvKipcbiAgICAgKiAgQ29sbGVjdCBZb3V0dWJlIEluZm9tYXRpb25cbiAgICAqKi9cbiAgICAkc2NvcGUuQ29sbGVjdEJ5SWQgPSBmdW5jdGlvbiAoaW5kZXgsIGUpIHtcblxuICAgICAgICB2YXIgaWQgPSAkKGUudGFyZ2V0KS5kYXRhKCdpZCcpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5jb250ZW50c1tpbmRleF0pO1xuICAgICAgICAkc2NvcGUuY29udGVudHNbaW5kZXhdLnN0YXRlID0gdHJ1ZTtcblxuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyAsXG4gICAgICAgICAgICB1cmw6ICcvZXhlY3V0ZUJ5SWQnLCAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCd9LCBcbiAgICAgICAgICAgIGRhdGE6IHtjaGFubmVsSWQ6aWR9LFxuICAgICAgICAgICAgdHlwZTogJ2pzb24nXG4gICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXMpKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpOyAgICAgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgfSkuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDb21wbGV0ZScpO1xuICAgICAgICB9KTtcbiAgICB9OyAgICBcblxuICAgICRzY29wZS5kZWxldGVDb2xsZWN0aW9uID0gZnVuY3Rpb24oaWQsIGNoYW5uZWxJZCl7XG5cbiAgICAgICAgTW9kYWxTZXJ2aWNlLnNob3dNb2RhbCh7XG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ2aWV3cy9tb2RhbC9jb25maXJtL2NvbmZpcm0uaHRtbFwiLFxuICAgICAgICAgICAgY29udHJvbGxlcjogXCJDb25maXJtTW9kYWxDb250cm9sbGVyc1wiXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24obW9kYWwpIHtcbiAgICAgICAgICAgIG1vZGFsLmVsZW1lbnQubW9kYWwoKTtcbiAgICAgICAgICAgIG1vZGFsLmNsb3NlLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG5cbiAgICAgICAgICAgICAgICBpZihyZXN1bHQpe1xuICAgICAgICAgICAgICAgICAgICBDb2xsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIC5kZWxldGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGlkXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAgICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlcykgeyAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTsgXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIpIHsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyciA6OiBcIiArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgICAgICB9KTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pOyAgICBcbiAgICB9O1xuXG4gICAgJHNjb3BlLnVwZGF0ZUNvbGxlY3Rpb24gPSBmdW5jdGlvbihpZCwgY2hhbm5lbElkKXtcblxuICAgICAgICBDb2xsZWN0aW9uXG4gICAgICAgIC51cGRhdGUoe1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgc3RhdGU6IGZhbHNlXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKHJlcykgeyAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiAgICAgICAgICAgICR3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7IFxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZXJyKSB7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnIgOjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG5cblxuICAgIHdpbmRvdy5vbnNjcm9sbCA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICgod2luZG93LmlubmVySGVpZ2h0ICsgd2luZG93LnNjcm9sbFkpID49IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHlvdSdyZSBhdCB0aGUgYm90dG9tIG9mIHRoZSBwYWdlICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZighJHNjb3BlLmRpc2FibGVkKXsgICAgICBcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG59XSk7XG5cblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uY29udHJvbGxlcignQ29udGVudEN0cmwnLCBcbiAgICBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJ0NvbnRlbnQnLCAnQ29sbGVjdGlvbicsICdZb3V0dWJlJywgJ0NvbmZpZycsXG4gICAgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCBDb250ZW50LCBDb2xsZWN0aW9uLCBZb3V0dWJlLCBDb25maWcpIHsgXG5cbiAgICAkcm9vdFNjb3BlLiRvbignc2VsZWN0RmlsdGVyJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHsgICAgICAgICAgICAgICAgXG4gICAgICAgICRzY29wZS5zZWxlY3RDaGFubmVsKGRhdGEpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogIEJhbm5lciBcbiAgICAqKi8gICAgXG4gICAgJHNjb3BlLmJhbm5lcnMgPSBbXTtcblxuICAgIENvbGxlY3Rpb25cbiAgICAuZmluZCh7XG4gICAgICAgIGZpbHRlcjogeyAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBjaGFubmVsSWQ6IHRydWUsIFxuICAgICAgICAgICAgICAgIHRodW1ibmFpbHM6IHRydWUsXG4gICAgICAgICAgICAgICAgY2hhbm5lbFRpdGxlOiB0cnVlXG4gICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIG9yZGVyOiBuYW1lLFxuICAgICAgICAgICAgbGltaXQ6ICc1J1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuJHByb21pc2VcbiAgICAudGhlbihcbiAgICBmdW5jdGlvbiAocmVzKSB7ICAgICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVzLCBmdW5jdGlvbiAodmFsdWVzKSB7ICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgWW91dHViZVxuICAgICAgICAgICAgLmNoYW5uZWwoe1xuICAgICAgICAgICAgICAgICdrZXknOiBDb25maWcueW91dHViZUtleSxcbiAgICAgICAgICAgICAgICAnaWQnOiB2YWx1ZXMuY2hhbm5lbElkLFxuICAgICAgICAgICAgICAgICdwYXJ0JzogJ2JyYW5kaW5nU2V0dGluZ3MnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLiRwcm9taXNlXG4gICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YS5pdGVtc1swXS5icmFuZGluZ1NldHRpbmdzLmltYWdlLmJhbm5lck1vYmlsZU1lZGl1bUhkSW1hZ2VVcmwpO1xuICAgICAgICAgICAgICAgIHZhbHVlcy5iYW5uZXJJbWcgPSBkYXRhLml0ZW1zWzBdLmJyYW5kaW5nU2V0dGluZ3MuaW1hZ2UuYmFubmVyTW9iaWxlTWVkaXVtSGRJbWFnZVVybFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLmJhbm5lcnMgPSAkc2NvcGUuYmFubmVycy5jb25jYXQocmVzKTsgICAgICAgIFxuICAgIH0pOyAgICAgICAgXG5cblxuXG4gICAgLyoqXG4gICAgICogIENvbnRlbnQgTGlzdCBcbiAgICAqKi9cbiAgICAkc2NvcGUucmVzZXQgPSBmdW5jdGlvbigpeyAgICAgICAgXG4gICAgICAgICRzY29wZS5jb250ZW50cyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmlsdGVyLnNraXAgPSAwO1xuICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSBmYWxzZTsgICAgICAgIFxuICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvYWRNb3JlID0gZnVuY3Rpb24oKXsgICAgIFxuXG4gICAgICAgICRzY29wZS5kaXNhYmxlZCA9IHRydWU7IFxuXG4gICAgICAgIENvbnRlbnRcbiAgICAgICAgLmZpbmQoe1xuICAgICAgICAgICAgZmlsdGVyOiAkc2NvcGUuZmlsdGVyICAgIFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uIChyZXMpIHsgICAgICAgICAgICBcblxuICAgICAgICAgICAgaWYocmVzLmxlbmd0aCA+IDApIFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICRzY29wZS5jb250ZW50cyA9ICRzY29wZS5jb250ZW50cy5jb25jYXQocmVzKTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICBlbHNlIFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICRzY29wZS5kaXNhYmxlZCA9IHRydWU7IC8vIERpc2FibGUgZnVydGhlciBjYWxscyBpZiB0aGVyZSBhcmUgbm8gbW9yZSBpdGVtc1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnbW9yZScsICRzY29wZS5jb250ZW50cyk7ICAgICAgXG5cbiAgICAgICAgICAgIC8vICBhbmd1bGFyLmZvckVhY2gocmVzLCBmdW5jdGlvbiAodmFsdWVzKSB7ICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gICAgICRzY29wZS5jb250ZW50cy5wdXNoKHZhbHVlcyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyB9KTsgXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlcnIpIHsgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyciA6OiBcIiArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuICAgICAgICB9KVxuICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICRzY29wZS5maWx0ZXIuc2tpcCA9ICRzY29wZS5maWx0ZXIuc2tpcCArIDE1OyAgICBcbiAgICAgICAgfSk7ICAgICAgICBcbiAgICB9O1xuXG4gICAgJHNjb3BlLnNlbGVjdENoYW5uZWwgPSBmdW5jdGlvbihjaGFubmVsSWQpe1xuXG4gICAgICAgIGlmKGNoYW5uZWxJZCA9PT0gJ2FsbCcpXG4gICAgICAgIHtcbiAgICAgICAgICAgICRzY29wZS5maWx0ZXIgPSB7ICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbmNsdWRlIDogWydhdWRpb3MnXSwgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBvcmRlcjogJ3B1Ymxpc2hlZEF0IERFU0MnLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAnMTUnLFxuICAgICAgICAgICAgICAgIHNraXA6IDAsIFxuICAgICAgICAgICAgICAgIHdoZXJlOiB7ICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBkZWxldGVkOiBmYWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgJHNjb3BlLmZpbHRlciA9IHsgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW5jbHVkZSA6IFsnYXVkaW9zJ10sICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG9yZGVyOiAncHVibGlzaGVkQXQgREVTQycsXG4gICAgICAgICAgICAgICAgbGltaXQ6ICcxNScsXG4gICAgICAgICAgICAgICAgc2tpcDogMCwgXG4gICAgICAgICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbElkOiBjaGFubmVsSWQsXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZWQ6IGZhbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJHNjb3BlLnJlc2V0KCk7XG4gICAgfTsgICBcblxuICAgICRzY29wZS5maWx0ZXIgPSB7ICAgICAgXG4gICAgICAgIGluY2x1ZGUgOiBbJ2F1ZGlvcyddLCAgICAgICAgICAgICAgICAgXG4gICAgICAgIG9yZGVyOiAncHVibGlzaGVkQXQgREVTQycsXG4gICAgICAgIGxpbWl0OiAnMTUnLFxuICAgICAgICBza2lwOiAkc2NvcGUuc2tpcCwgXG4gICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICBkZWxldGVkOiBmYWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgJHNjb3BlLnJlc2V0KCk7XG5cblxuICAgIHdpbmRvdy5vbnNjcm9sbCA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICgod2luZG93LmlubmVySGVpZ2h0ICsgd2luZG93LnNjcm9sbFkpID49IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHlvdSdyZSBhdCB0aGUgYm90dG9tIG9mIHRoZSBwYWdlICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZighJHNjb3BlLmRpc2FibGVkKXsgICAgICBcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG5cbn1dKTtcblxuXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbi5jb250cm9sbGVyKCdNeXBhZ2VDdHJsJywgXG4gICAgWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckd2luZG93JywgJ1VzZXInLCAnQ29udGVudCcsICdDb25maWcnLCAnWW91dHViZScsICdNb2RhbFNlcnZpY2UnLCAnTG9vcEJhY2tBdXRoJyxcbiAgICBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICR3aW5kb3csIFVzZXIsIENvbnRlbnQsIENvbmZpZywgWW91dHViZSwgTW9kYWxTZXJ2aWNlLCBMb29wQmFja0F1dGgpIHsgXG5cbiAgICAkcm9vdFNjb3BlLiRvbignc2VsZWN0TXlDaGFubmVsJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHsgICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAkc2NvcGUuZmlsdGVyID0geyAgICAgICAgICBcbiAgICAgICAgICAgIGluY2x1ZGUgOiBbJ2F1ZGlvcyddLCAgICAgICAgICAgICBcbiAgICAgICAgICAgIG9yZGVyOiAncHVibGlzaGVkQXQgREVTQycsXG4gICAgICAgICAgICBsaW1pdDogJzE1JyxcbiAgICAgICAgICAgIHNraXA6IDAsIFxuICAgICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgICAgICBjaGFubmVsSWQ6IGRhdGEsXG4gICAgICAgICAgICAgICAgZGVsZXRlZDogZmFsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUucmVzZXQoKTtcbiAgICB9KTtcblxuXHQkc2NvcGUuTG9vcEJhY2tBdXRoID0gTG9vcEJhY2tBdXRoO1x0XG5cblx0LyoqXG4gICAgICogIENvbnRlbnQgTGlzdCBcbiAgICAqKi9cbiAgICAkc2NvcGUucmVzZXQgPSBmdW5jdGlvbigpeyAgICAgICAgXG4gICAgICAgICRzY29wZS5jb250ZW50cyA9IFtdO1xuICAgICAgICAkc2NvcGUuZmlsdGVyLnNraXAgPSAwO1xuICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSBmYWxzZTsgICAgICAgIFxuICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmxvYWRNb3JlID0gZnVuY3Rpb24oKXsgICAgIFxuXG4gICAgICAgICRzY29wZS5kaXNhYmxlZCA9IHRydWU7IFxuXG4gICAgICAgIENvbnRlbnRcbiAgICAgICAgLmZpbmQoe1xuICAgICAgICAgICAgZmlsdGVyOiAkc2NvcGUuZmlsdGVyICAgIFxuICAgICAgICB9KVxuICAgICAgICAuJHByb21pc2VcbiAgICAgICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uIChyZXMpIHsgICAgICAgICAgICBcblxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcbiBcbiAgICAgICAgICAgIGlmKHJlcy5sZW5ndGggPiAwKSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29udGVudHMgPSAkc2NvcGUuY29udGVudHMuY29uY2F0KHJlcyk7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZGlzYWJsZWQgPSB0cnVlOyAvLyBEaXNhYmxlIGZ1cnRoZXIgY2FsbHMgaWYgdGhlcmUgYXJlIG5vIG1vcmUgaXRlbXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGVycikgeyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyIDo6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uICgpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgJHNjb3BlLmZpbHRlci5za2lwID0gJHNjb3BlLmZpbHRlci5za2lwICsgMTU7ICAgIFxuICAgICAgICB9KTsgICAgICAgIFxuICAgIH07XG5cbiAgICAkc2NvcGUuZmlsdGVyID0geyAgICAgICAgICBcbiAgICAgICAgaW5jbHVkZSA6IFsnYXVkaW9zJ10sICAgICAgICAgICAgIFxuICAgICAgICBvcmRlcjogJ3B1Ymxpc2hlZEF0IERFU0MnLFxuICAgICAgICBsaW1pdDogJzE1JyxcbiAgICAgICAgc2tpcDogMCwgXG4gICAgICAgIHdoZXJlOiB7XG4gICAgICAgICAgICBjaGFubmVsSWQ6ICRzY29wZS5Mb29wQmFja0F1dGguY2hhbm5lbElkICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHdpbmRvdy5vbnNjcm9sbCA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIGlmICgod2luZG93LmlubmVySGVpZ2h0ICsgd2luZG93LnNjcm9sbFkpID49IGRvY3VtZW50LmJvZHkub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHlvdSdyZSBhdCB0aGUgYm90dG9tIG9mIHRoZSBwYWdlICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZighJHNjb3BlLmRpc2FibGVkKXsgICAgICBcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG59XSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbi5jb250cm9sbGVyKCdUZXN0Q3RybCcsIFsnJHNjb3BlJywgZnVuY3Rpb24oJHNjb3BlKSB7IFxuXG5cbn1dKTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuLmZhY3RvcnkoXG4gICAgXCJDb2xsZWN0aW9uXCIsXG4gICAgWydMb29wQmFja1Jlc291cmNlJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uIChSZXNvdXJjZSwgTG9vcEJhY2tBdXRoLCAkaW5qZWN0b3IpIHtcblxuICAgICAgICB2YXIgdXJsQmFzZSA9IFwiL2FwaVwiO1xuXG4gICAgICAgIHZhciBSID0gUmVzb3VyY2UoXG4gICAgICAgICAgICB1cmxCYXNlICsgXCIvY29sbGVjdGlvbnMvOmlkXCIsXG4gICAgICAgICAgICB7J2lkJzogJ0BpZCd9LFxuICAgICAgICAgICAgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXCJmaW5kXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvY29sbGVjdGlvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJjcmVhdGVcIjoge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb2xsZWN0aW9uc1wiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJ1cGRhdGVcIjoge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb2xsZWN0aW9ucy86aWRcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBVVFwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXCJkZWxldGVcIjoge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb2xsZWN0aW9ucy86aWRcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICBcbiAgICAgICAgUltcInVwZGF0ZU9yQ3JlYXRlXCJdID0gUltcInVwc2VydFwiXTtcbiAgICAgICAgUltcImRlc3Ryb3lCeUlkXCJdID0gUltcImRlbGV0ZUJ5SWRcIl07XG4gICAgICAgIFJbXCJyZW1vdmVCeUlkXCJdID0gUltcImRlbGV0ZUJ5SWRcIl07XG5cbiAgICAgICAgUi5tb2RlbE5hbWUgPSBcImNvbGxlY3Rpb25cIjtcblxuICAgICAgICByZXR1cm4gUjtcbiAgICB9XSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbi5mYWN0b3J5KFxuICAgIFwiQ29udGVudFwiLFxuICAgIFsnTG9vcEJhY2tSZXNvdXJjZScsICckaW5qZWN0b3InLCBmdW5jdGlvbiAoUmVzb3VyY2UsICRpbmplY3Rvcikge1xuXG4gICAgICAgIHZhciB1cmxCYXNlID0gXCIvYXBpXCI7XG5cbiAgICAgICAgdmFyIFIgPSBSZXNvdXJjZShcbiAgICAgICAgICAgIHVybEJhc2UgKyBcIi9jb250ZW50cy86aWRcIixcbiAgICAgICAgICAgIHsnaWQnOiAnQGlkJ30sXG4gICAgICAgICAgICB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcImZpbmRcIjoge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9jb250ZW50c1wiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIFwiY3JlYXRlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvY29udGVudHNcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgXCJjb3VudFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL2NvbnRlbnRzL2NvdW50XCIsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgXG4gICAgICAgIFJbXCJ1cGRhdGVPckNyZWF0ZVwiXSA9IFJbXCJ1cHNlcnRcIl07XG4gICAgICAgIFJbXCJ1cGRhdGVcIl0gPSBSW1widXBkYXRlQWxsXCJdO1xuICAgICAgICBSW1wiZGVzdHJveUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcbiAgICAgICAgUltcInJlbW92ZUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcblxuICAgICAgICBSLm1vZGVsTmFtZSA9IFwiY29udGVudFwiO1xuXG4gICAgICAgIHJldHVybiBSO1xuICAgIH1dKTtcbiIsIihmdW5jdGlvbiAod2luZG93LCBhbmd1bGFyLCB1bmRlZmluZWQpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgXG4gICAgdmFyIGF1dGhIZWFkZXIgPSAnYXV0aG9yaXphdGlvbic7XG4gICAgdmFyIG1vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKFwibG9vcEJhY2tBdXRoRmFjdG9yaWVzXCIsIFsnbmdSZXNvdXJjZSddKTtcbiAgXG4gICAgbW9kdWxlXG4gICAgICAgIC5mYWN0b3J5KCdMb29wQmFja0F1dGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcHJvcHMgPSBbJ2FjY2Vzc1Rva2VuSWQnLCAnY3VycmVudFVzZXJJZCcsICdjdXJyZW50VXNlckVtYWlsJywgJ3lvdXR1YmVBY2Nlc3NUb2tlbiddO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBMb29wQmFja0F1dGgoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHByb3BzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZltuYW1lXSA9IGxvYWQobmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1lbWJlck1lID0gdW5kZWZpbmVkOyAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTG9vcEJhY2tBdXRoLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmFnZSA9IHRoaXMucmVtZW1iZXJNZSA/IGxvY2FsU3RvcmFnZSA6IHNlc3Npb25TdG9yYWdlO1xuICAgICAgICAgICAgICAgIHByb3BzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2F2ZShzdG9yYWdlLCBuYW1lLCBzZWxmW25hbWVdKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIExvb3BCYWNrQXV0aC5wcm90b3R5cGUuc2V0VXNlciA9IGZ1bmN0aW9uIChhY2Nlc3NUb2tlbklkLCB1c2VySWQsIHVzZXJFbWFpbCwgeW91dHViZUFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY2Nlc3NUb2tlbklkID0gYWNjZXNzVG9rZW5JZDtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRVc2VySWQgPSB1c2VySWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlckVtYWlsID0gdXNlckVtYWlsO1xuICAgICAgICAgICAgICAgIHRoaXMueW91dHViZUFjY2Vzc1Rva2VuID0geW91dHViZUFjY2Vzc1Rva2VuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBMb29wQmFja0F1dGgucHJvdG90eXBlLmNsZWFyVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjY2Vzc1Rva2VuSWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFVzZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VXNlckVtYWlsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnlvdXR1YmVBY2Nlc3NUb2tlbiA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgTG9vcEJhY2tBdXRoKCk7XG5cbiAgICAgICAgICAgIC8vIE5vdGU6IExvY2FsU3RvcmFnZSBjb252ZXJ0cyB0aGUgdmFsdWUgdG8gc3RyaW5nXG4gICAgICAgICAgICAvLyBXZSBhcmUgdXNpbmcgZW1wdHkgc3RyaW5nIGFzIGEgbWFya2VyIGZvciBudWxsL3VuZGVmaW5lZCB2YWx1ZXMuXG4gICAgICAgICAgICBmdW5jdGlvbiBzYXZlKHN0b3JhZ2UsIG5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9ICckTG9vcEJhY2skJyArIG5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgc3RvcmFnZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGxvYWQobmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSAnJExvb3BCYWNrJCcgKyBuYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2Vba2V5XSB8fCBzZXNzaW9uU3RvcmFnZVtrZXldIHx8IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5jb25maWcoWyckaHR0cFByb3ZpZGVyJywgZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ0xvb3BCYWNrQXV0aFJlcXVlc3RJbnRlcmNlcHRvcicpO1xuICAgICAgICB9XSlcbiAgICAgICAgLmZhY3RvcnkoJ0xvb3BCYWNrQXV0aFJlcXVlc3RJbnRlcmNlcHRvcicsIFsnJHEnLCAnTG9vcEJhY2tBdXRoJywgJyRyb290U2NvcGUnLCBcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkcSwgTG9vcEJhY2tBdXRoLCAkcm9vdFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gdmFyIHVybEJhc2UgPSAkcm9vdFNjb3BlLnVybEJhc2UgKyBcIi9hcGlcIjtcbiAgICAgICAgICAgICAgICB2YXIgdXJsQmFzZSA9IFwiL2FwaVwiOyAgICBcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICdyZXF1ZXN0JzogZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IG5vbiB1cmxCYXNlIHJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLnVybC5zdWJzdHIoMCwgdXJsQmFzZS5sZW5ndGgpICE9PSB1cmxCYXNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKExvb3BCYWNrQXV0aC5hY2Nlc3NUb2tlbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLmhlYWRlcnNbYXV0aEhlYWRlcl0gPSBMb29wQmFja0F1dGguYWNjZXNzVG9rZW5JZDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZy5fX2lzR2V0Q3VycmVudFVzZXJfXykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBhIHN0dWIgNDAxIGVycm9yIGZvciBVc2VyLmdldEN1cnJlbnQoKSB3aGVuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUgaXMgbm8gdXNlciBsb2dnZWQgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib2R5OiB7ZXJyb3I6IHtzdGF0dXM6IDQwMX19LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IDQwMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiBjb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25maWcgfHwgJHEud2hlbihjb25maWcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV0pXG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2Mgb2JqZWN0XG4gICAgICogQG5hbWUgbGJTZXJ2aWNlcy5Mb29wQmFja1Jlc291cmNlUHJvdmlkZXJcbiAgICAgKiBAaGVhZGVyIGxiU2VydmljZXMuTG9vcEJhY2tSZXNvdXJjZVByb3ZpZGVyXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICogVXNlIGBMb29wQmFja1Jlc291cmNlUHJvdmlkZXJgIHRvIGNoYW5nZSB0aGUgZ2xvYmFsIGNvbmZpZ3VyYXRpb25cbiAgICAgKiBzZXR0aW5ncyB1c2VkIGJ5IGFsbCBtb2RlbHMuIE5vdGUgdGhhdCB0aGUgcHJvdmlkZXIgaXMgYXZhaWxhYmxlXG4gICAgICogdG8gQ29uZmlndXJhdGlvbiBCbG9ja3Mgb25seSwgc2VlXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZG9jcy5hbmd1bGFyanMub3JnL2d1aWRlL21vZHVsZSNtb2R1bGUtbG9hZGluZy1kZXBlbmRlbmNpZXMgTW9kdWxlIExvYWRpbmcgJiBEZXBlbmRlbmNpZXN9XG4gICAgICogZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqICMjIEV4YW1wbGVcbiAgICAgKlxuICAgICAqIGBgYGpzXG4gICAgICogYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4gICAgICogIC5jb25maWcoZnVuY3Rpb24oTG9vcEJhY2tSZXNvdXJjZVByb3ZpZGVyKSB7XG4gICAqICAgICBMb29wQmFja1Jlc291cmNlUHJvdmlkZXIuc2V0QXV0aEhlYWRlcignWC1BY2Nlc3MtVG9rZW4nKTtcbiAgICogIH0pO1xuICAgICAqIGBgYFxuICAgICAqL1xuICAgICAgICAucHJvdmlkZXIoJ0xvb3BCYWNrUmVzb3VyY2UnLCBmdW5jdGlvbiBMb29wQmFja1Jlc291cmNlUHJvdmlkZXIoKSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICAgICAqIEBuYW1lIGxiU2VydmljZXMuTG9vcEJhY2tSZXNvdXJjZVByb3ZpZGVyI3NldEF1dGhIZWFkZXJcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBsYlNlcnZpY2VzLkxvb3BCYWNrUmVzb3VyY2VQcm92aWRlclxuICAgICAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGhlYWRlciBUaGUgaGVhZGVyIG5hbWUgdG8gdXNlLCBlLmcuIGBYLUFjY2Vzcy1Ub2tlbmBcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICAgICAgICogQ29uZmlndXJlIHRoZSBSRVNUIHRyYW5zcG9ydCB0byB1c2UgYSBkaWZmZXJlbnQgaGVhZGVyIGZvciBzZW5kaW5nXG4gICAgICAgICAgICAgKiB0aGUgYXV0aGVudGljYXRpb24gdG9rZW4uIEl0IGlzIHNlbnQgaW4gdGhlIGBBdXRob3JpemF0aW9uYCBoZWFkZXJcbiAgICAgICAgICAgICAqIGJ5IGRlZmF1bHQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuc2V0QXV0aEhlYWRlciA9IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgICAgICAgICAgICAgICBhdXRoSGVhZGVyID0gaGVhZGVyO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAgICAgKiBAbmFtZSBsYlNlcnZpY2VzLkxvb3BCYWNrUmVzb3VyY2VQcm92aWRlciNzZXRVcmxCYXNlXG4gICAgICAgICAgICAgKiBAbWV0aG9kT2YgbGJTZXJ2aWNlcy5Mb29wQmFja1Jlc291cmNlUHJvdmlkZXJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIFVSTCB0byB1c2UsIGUuZy4gYC9hcGlgIG9yIGAvL2V4YW1wbGUuY29tL2FwaWAuXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAqIENoYW5nZSB0aGUgVVJMIG9mIHRoZSBSRVNUIEFQSSBzZXJ2ZXIuIEJ5IGRlZmF1bHQsIHRoZSBVUkwgcHJvdmlkZWRcbiAgICAgICAgICAgICAqIHRvIHRoZSBjb2RlIGdlbmVyYXRvciAoYGxiLW5nYCBvciBgZ3J1bnQtbG9vcGJhY2stc2RrLWFuZ3VsYXJgKSBpcyB1c2VkLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnNldFVybEJhc2UgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICAgICAgdXJsQmFzZSA9IHVybDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuJGdldCA9IFsnJHJlc291cmNlJywgZnVuY3Rpb24gKCRyZXNvdXJjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodXJsLCBwYXJhbXMsIGFjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc291cmNlID0gJHJlc291cmNlKHVybCwgcGFyYW1zLCBhY3Rpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBBbmd1bGFyIGFsd2F5cyBjYWxscyBQT1NUIG9uICRzYXZlKClcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBoYWNrIGlzIGJhc2VkIG9uXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9raXJrYnVzaGVsbC5tZS9hbmd1bGFyLWpzLXVzaW5nLW5nLXJlc291cmNlLWluLWEtbW9yZS1yZXN0ZnVsLW1hbm5lci9cbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2UucHJvdG90eXBlLiRzYXZlID0gZnVuY3Rpb24gKHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3J0dW5hdGVseSwgTG9vcEJhY2sgcHJvdmlkZXMgYSBjb252ZW5pZW50IGB1cHNlcnRgIG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCBleGFjdGx5IGZpdHMgb3VyIG5lZWRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJlc291cmNlLnVwc2VydC5jYWxsKHRoaXMsIHt9LCB0aGlzLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LiRwcm9taXNlIHx8IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfSk7XG5cbn0pKHdpbmRvdywgd2luZG93LmFuZ3VsYXIpO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uZmFjdG9yeShcbiAgICBcIlVzZXJcIixcbiAgICBbJ0xvb3BCYWNrUmVzb3VyY2UnLCAnTG9vcEJhY2tBdXRoJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uIChSZXNvdXJjZSwgTG9vcEJhY2tBdXRoLCAkaW5qZWN0b3IpIHtcblxuICAgICAgICB2YXIgdXJsQmFzZSA9IFwiL2FwaVwiOyAgICAgICAgICAgICAgICBcblxuICAgICAgICB2YXIgUiA9IFJlc291cmNlKFxuICAgICAgICAgICAgdXJsQmFzZSArIFwiL1VzZXJzLzp1c2VySWRcIixcbiAgICAgICAgICAgIHsndXNlcklkJzogJ0B1c2VySWQnfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxvZ2luXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnMvbG9naW5cIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlOiBcInVzZXJcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBpbnRlcmNlcHRvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY2Nlc3NUb2tlbiA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9vcEJhY2tBdXRoLnNldFVzZXIoYWNjZXNzVG9rZW4uaWQsIGFjY2Vzc1Rva2VuLnVzZXJJZCwgYWNjZXNzVG9rZW4udXNlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9vcEJhY2tBdXRoLnJlbWVtYmVyTWUgPSByZXNwb25zZS5jb25maWcucGFyYW1zLnJlbWVtYmVyTWUgIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvb3BCYWNrQXV0aC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc291cmNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuXG4gICAgICAgICAgICAgICAgXCJsb2dvdXRcIjoge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9Vc2Vycy9sb2dvdXRcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb29wQmFja0F1dGguY2xlYXJVc2VyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTG9vcEJhY2tBdXRoLnJlbWVtYmVyTWUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExvb3BCYWNrQXV0aC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc291cmNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIFwibm90aWZpY2F0aW9uXCI6IHsgIFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9Vc2Vycy86dXNlcklkL25vdGlmaWNhdGlvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiB0cnVlXG4gICAgICAgICAgICAgICAgfSwgICAgICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgXCJjbGVhbk5vdGlmaWNhdGlvblwiOiB7ICBcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnMvOnVzZXJJZC9ub3RpZmljYXRpb25zXCIsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQVVRcIlxuICAgICAgICAgICAgICAgIH0sICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgIC8qIElOVEVSTkFMLiBVc2UgVXNlci5ub3RpZmljYXRpb24uY291bnQoKSBpbnN0ZWFkLiAqL1xuICAgICAgICAgICAgICAgIFwiOjpub3RpZmljYXRpb246OmNvdW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnMvOnVzZXJJZC9ub3RpZmljYXRpb25zL2NvdW50XCIsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIlxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBcImNvbGxlY3Rpb25cIjogeyAgXG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL1VzZXJzLzp1c2VySWQvY29sbGVjdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgXCJjb250ZW50XCI6IHsgIFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9Vc2Vycy86dXNlcklkL2NvbnRlbnRcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgICAgICBpc0FycmF5OiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBcImNvbW1lbnRzXCI6IHsgIFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9Vc2Vycy86dXNlcklkL2NvbW1lbnRzXCIsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgICAgICAgICAgaXNBcnJheTogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXCJkZWxldGVDb21tZW50c1wiOiB7ICBcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnMvOnVzZXJJZC9jb21tZW50c1wiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUFVUXCJcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgLyogSU5URVJOQUwuIFVzZSBVc2VyLmNvbW1lbnQuZGVsZXRlKCkgaW5zdGVhZC4gKi9cbiAgICAgICAgICAgICAgICBcIjo6Y29tbWVudHM6OmRlbGV0ZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL1VzZXJzLzp1c2VySWQvY29tbWVudHNcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiXG4gICAgICAgICAgICAgICAgfSwgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBcImNyZWF0ZVwiOiB7ICBcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnNcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIlxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBcInVwZGF0ZVwiOiB7ICBcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnMvOnVzZXJJZFwiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUFVUXCJcbiAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgXCJwaWN0dXJlXCI6IHsgIFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9Vc2Vycy86dXNlcklkL3BpY3R1cmVcIixcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiXG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIFwiaW5mb1wiOiB7ICBcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnMvOnVzZXJJZC9pbmZvXCIsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIlxuICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICBcInNlYXJjaFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsQmFzZSArIFwiL1VzZXJzL3NlYXJjaD9rZXk9OmtleVwiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXCJleGlzdHNcIjoge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyBcIi9Vc2Vycy86dXNlcklkL2V4aXN0c1wiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgfSwgICAgIFxuXG4gICAgICAgICAgICAgICAgXCJnZXRDdXJyZW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmxCYXNlICsgXCIvVXNlcnNcIiArIFwiLzppZFwiLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBMb29wQmFja0F1dGguY3VycmVudFVzZXJJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWQgPT0gbnVsbCkgaWQgPSAnX19hbm9ueW1vdXNfXyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJjZXB0b3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMb29wQmFja0F1dGguY3VycmVudFVzZXJEYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UucmVzb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF9faXNHZXRDdXJyZW50VXNlcl9fOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIFJbXCJ1cGRhdGVPckNyZWF0ZVwiXSA9IFJbXCJ1cHNlcnRcIl07ICAgICAgICBcbiAgICAgICAgUltcInVwZGF0ZVwiXSA9IFJbXCJ1cGRhdGVBbGxcIl07IFxuICAgICAgICBSW1wiZGVzdHJveUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcbiAgICAgICAgUltcInJlbW92ZUJ5SWRcIl0gPSBSW1wiZGVsZXRlQnlJZFwiXTtcblxuXG4gICAgICAgIFIuZ2V0Q2FjaGVkQ3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gTG9vcEJhY2tBdXRoLmN1cnJlbnRVc2VyRGF0YTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhID8gbmV3IFIoZGF0YSkgOiBudWxsO1xuICAgICAgICB9O1xuXG4gICAgICAgIFIuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudElkKCkgIT0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICBSLmdldEN1cnJlbnRJZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBMb29wQmFja0F1dGguY3VycmVudFVzZXJJZDtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIFIubW9kZWxOYW1lID0gXCJVc2VyXCI7XG5cbiAgICAgICAgcmV0dXJuIFI7XG4gICAgfV0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uZmFjdG9yeShcbiAgICBcIllvdXR1YmVcIixcbiAgICBbJ0xvb3BCYWNrUmVzb3VyY2UnLCAnJGluamVjdG9yJywgZnVuY3Rpb24gKFJlc291cmNlLCAkaW5qZWN0b3IpIHtcblxuICAgICAgICB2YXIgdXJsQmFzZSA9IFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20veW91dHViZS92M1wiO1xuXG4gICAgICAgIHZhciBSID0gUmVzb3VyY2UoXG4gICAgICAgICAgICB1cmxCYXNlICsgXCJrZXk9OmtleSZwYXJ0PTpwYXJ0XCIsXG4gICAgICAgICAgICB7J2tleSc6ICdAa2V5JywgJ3BhcnQnOiAnQHBhcnQnfSxcbiAgICAgICAgICAgIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFwiY2hhbm5lbFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsQmFzZSArICcvY2hhbm5lbHMnLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgICAgICAgICB9LCAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXCJteUNoYW5uZWxcIjogeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybEJhc2UgKyAnL2NoYW5uZWxzP21pbmU9dHJ1ZScsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICBcbiAgICAgICAgUltcInVwZGF0ZU9yQ3JlYXRlXCJdID0gUltcInVwc2VydFwiXTtcbiAgICAgICAgUltcInVwZGF0ZVwiXSA9IFJbXCJ1cGRhdGVBbGxcIl07XG4gICAgICAgIFJbXCJkZXN0cm95QnlJZFwiXSA9IFJbXCJkZWxldGVCeUlkXCJdO1xuICAgICAgICBSW1wicmVtb3ZlQnlJZFwiXSA9IFJbXCJkZWxldGVCeUlkXCJdO1xuXG4gICAgICAgIFIubW9kZWxOYW1lID0gXCJZb3V0dWJlXCI7XG5cbiAgICAgICAgcmV0dXJuIFI7XG4gICAgfV0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uZGlyZWN0aXZlKCdmb290ZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdFx0cmVzdHJpY3Q6ICdBJywgLy9UaGlzIG1lbmFzIHRoYXQgaXQgd2lsbCBiZSB1c2VkIGFzIGFuIGF0dHJpYnV0ZSBhbmQgTk9UIGFzIGFuIGVsZW1lbnQuIEkgZG9uJ3QgbGlrZSBjcmVhdGluZyBjdXN0b20gSFRNTCBlbGVtZW50c1xuXHRcdFx0XHQvLyByZXBsYWNlOiB0cnVlLFxuXHRcdFx0XHRzY29wZToge3VzZXI6ICc9J30sIC8vIFRoaXMgaXMgb25lIG9mIHRoZSBjb29sIHRoaW5ncyA6KS4gV2lsbCBiZSBleHBsYWluZWQgaW4gcG9zdC5cblx0XHRcdFx0dGVtcGxhdGVVcmw6IFwidmlld3MvZGlyZWN0aXZlcy9mb290ZXIvZm9vdGVyLmh0bWxcIixcblx0XHRcdFx0Y29udHJvbGxlcjogWyckc2NvcGUnLCAnJGZpbHRlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRmaWx0ZXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcblxuXHRcdFx0XHR9XVxuXHRcdH1cbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uZGlyZWN0aXZlKCdoZWFkZXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdFx0cmVzdHJpY3Q6ICdBJywgLy9UaGlzIG1lbmFzIHRoYXQgaXQgd2lsbCBiZSB1c2VkIGFzIGFuIGF0dHJpYnV0ZSBhbmQgTk9UIGFzIGFuIGVsZW1lbnQuIEkgZG9uJ3QgbGlrZSBjcmVhdGluZyBjdXN0b20gSFRNTCBlbGVtZW50c1xuXHRcdFx0XHQvLyByZXBsYWNlOiB0cnVlLFxuXHRcdFx0XHRzY29wZToge3VzZXI6ICc9J30sIC8vIFRoaXMgaXMgb25lIG9mIHRoZSBjb29sIHRoaW5ncyA6KS4gV2lsbCBiZSBleHBsYWluZWQgaW4gcG9zdC5cblx0XHRcdFx0dGVtcGxhdGVVcmw6IFwidmlld3MvZGlyZWN0aXZlcy9oZWFkZXIvaGVhZGVyLmh0bWxcIixcblx0XHRcdFx0Y29udHJvbGxlcjogWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnJGZpbHRlcicsICdDb2xsZWN0aW9uJywgJ01vZGFsU2VydmljZScsICdMb29wQmFja0F1dGgnLCAnVXNlcicsXG5cdFx0XHRcdGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUsICRsb2NhdGlvbiwgJGZpbHRlciwgQ29sbGVjdGlvbiwgTW9kYWxTZXJ2aWNlLCBMb29wQmFja0F1dGgsIFVzZXIpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQkc2NvcGUuTG9vcEJhY2tBdXRoID0gTG9vcEJhY2tBdXRoO1xuXG5cdFx0XHRcdFx0JHNjb3BlLmxvZ2luID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRcdCAgICAgICAgIE1vZGFsU2VydmljZS5zaG93TW9kYWwoe1xuXHRcdFx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ2aWV3cy9tb2RhbC9sb2dpbi9sb2dpbi5odG1sXCIsXG5cdFx0XHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiTG9naW5Nb2RhbENvbnRyb2xsZXJzXCJcblx0XHRcdFx0ICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKG1vZGFsKSB7XG5cdFx0XHRcdCAgICAgICAgICAgIG1vZGFsLmVsZW1lbnQubW9kYWwoKTtcblx0XHRcdFx0ICAgICAgICAgICAgbW9kYWwuY2xvc2UudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0ICAgICAgICAgICAgXHRcdFx0XHRcdCAgICAgICAgICAgICAgIFxuXHRcdFx0XHQgICAgICAgICAgICB9KTtcblx0XHRcdFx0ICAgICAgICB9KTtcdFx0XHRcdCAgICAgICAgXG5cdFx0XHRcdCAgICB9O1x0XHRcdFxuXG5cdFx0XHRcdCAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQgICAgXHRcblx0XHRcdFx0ICAgIFx0VXNlclxuXHRcdFx0XHQgICAgICAgIC5sb2dvdXQoe2FjY2Vzc190b2tlbjogTG9vcEJhY2tBdXRoLmFjY2Vzc1Rva2VuSWR9KVxuXHRcdFx0XHQgICAgICAgIC4kcHJvbWlzZVxuXHRcdFx0XHQgICAgICAgIC50aGVuKFxuXHRcdFx0XHQgICAgICAgIGZ1bmN0aW9uIChyZXMsIGhlYWRlcikgeyBcblx0XHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coJ3JlcycsIHJlcyk7XHRcdFx0XHQgICAgICAgIFxuXHRcdFx0XHRcdFx0XHQkbG9jYXRpb24udXJsKCcvaG9tZScpO1xuXHRcdFx0XHQgICAgICAgIH0sXG5cdFx0XHRcdCAgICAgICAgZnVuY3Rpb24gKGVycikgeyBcblx0XHRcdFx0ICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dpbiBlcnJcIiwgSlNPTi5zdHJpbmdpZnkoZXJyKSk7ICAgICAgICAgICAgICBcblx0XHRcdFx0ICAgICAgICB9KTtcblx0XHRcdFx0ICAgICAgICBcdFx0XHRcdCAgICAgICAgXG5cdFx0XHRcdCAgICB9O1xuXG5cdFx0XHRcdH1dXG5cdFx0fVxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbi5kaXJlY3RpdmUoJ3NpZGViYXInLCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdFx0cmVzdHJpY3Q6ICdBJywgLy9UaGlzIG1lbmFzIHRoYXQgaXQgd2lsbCBiZSB1c2VkIGFzIGFuIGF0dHJpYnV0ZSBhbmQgTk9UIGFzIGFuIGVsZW1lbnQuIEkgZG9uJ3QgbGlrZSBjcmVhdGluZyBjdXN0b20gSFRNTCBlbGVtZW50c1xuXHRcdFx0XHRyZXBsYWNlOiB0cnVlLFxuXHRcdFx0XHRzY29wZToge3VzZXI6ICc9J30sIC8vIFRoaXMgaXMgb25lIG9mIHRoZSBjb29sIHRoaW5ncyA6KS4gV2lsbCBiZSBleHBsYWluZWQgaW4gcG9zdC5cblx0XHRcdFx0dGVtcGxhdGVVcmw6IFwidmlld3MvZGlyZWN0aXZlcy9zaWRlYmFyL2NvbnRlbnQtc2lkZWJhci5odG1sXCIsXG5cdFx0XHRcdC8vIGNvbnRyb2xsZXI6IFwiQ29udGVudEN0cmxcIlx0XHRcdFx0XG5cdFx0XHRcdGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnJGZpbHRlcicsICdDb2xsZWN0aW9uJywgXG5cdFx0XHRcdGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkc2NvcGUsICRmaWx0ZXIsIENvbGxlY3Rpb24pIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQkc2NvcGUuY2F0ZWdvcmllcyA9IFtdO1x0XHRcdFx0XHRcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQkc2NvcGUuc3RhdGVzID0ge307XG4gICAgXHRcdFx0XHQkc2NvcGUuc3RhdGVzLmFjdGl2ZUl0ZW0gPSAnYWxsJztcblxuXHRcdFx0XHRcdENvbGxlY3Rpb25cblx0XHRcdCAgICAgICAgLmZpbmQoe1x0XHRcdCAgICAgICAgXHRcblx0XHRcdCAgICAgICAgICAgIGZpbHRlcjoge1xuXHRcdFx0ICAgICAgICAgICAgXHRmaWVsZHM6e1xuXHRcdFx0ICAgICAgICAgICAgXHRcdGNoYW5uZWxJZDp0cnVlLFxuXHRcdFx0XHQgICAgICAgIFx0XHRjaGFubmVsVGl0bGU6dHJ1ZVxuXHRcdFx0XHQgICAgICAgIFx0fSwgICAgICAgICAgICAgICAgIFxuXHRcdFx0ICAgICAgICAgICAgICAgIG9yZGVyOiBuYW1lXHRcdFx0ICAgICAgIFxuXHRcdFx0ICAgICAgICAgICAgfVx0XHRcdCAgICAgICAgXHRcblx0XHRcdCAgICAgICAgfSlcblx0XHRcdCAgICAgICAgLiRwcm9taXNlXG5cdFx0XHQgICAgICAgIC50aGVuKFxuXHRcdFx0ICAgICAgICBmdW5jdGlvbiAocmVzKSB7ICAgICAgICAgICAgICAgICAgXHRcdFx0ICAgICAgICAgICBcblx0XHRcdCAgICAgICAgICAgICRzY29wZS5jYXRlZ29yaWVzID0gJHNjb3BlLmNhdGVnb3JpZXMuY29uY2F0KHJlcyk7XG5cdFx0XHQgICAgICAgIH0pO1xuXHRcdFx0ICAgICAgICBcblx0XHRcdCAgICAgICAgJHNjb3BlLnNlbGVjdENoYW5uZWwgPSBmdW5jdGlvbihjaGFubmVsSWQpeyAgIFx0XHRcdCAgICAgICAgIFx0XG5cdFx0XHQgICAgICAgIFx0JHJvb3RTY29wZS4kZW1pdCgnc2VsZWN0RmlsdGVyJywgY2hhbm5lbElkKTsgICAgIFxuXHRcdFx0ICAgICAgICB9O1xuXG5cdFx0XHRcdH1dXG5cdFx0fVxufSlcbi5kaXJlY3RpdmUoJ2NvbGxlY3Rpb25TaWRlYmFyJywgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRcdHJlc3RyaWN0OiAnQScsIC8vVGhpcyBtZW5hcyB0aGF0IGl0IHdpbGwgYmUgdXNlZCBhcyBhbiBhdHRyaWJ1dGUgYW5kIE5PVCBhcyBhbiBlbGVtZW50LiBJIGRvbid0IGxpa2UgY3JlYXRpbmcgY3VzdG9tIEhUTUwgZWxlbWVudHNcblx0XHRcdFx0cmVwbGFjZTogdHJ1ZSxcblx0XHRcdFx0c2NvcGU6IHt1c2VyOiAnPSd9LCAvLyBUaGlzIGlzIG9uZSBvZiB0aGUgY29vbCB0aGluZ3MgOikuIFdpbGwgYmUgZXhwbGFpbmVkIGluIHBvc3QuXG5cdFx0XHRcdHRlbXBsYXRlVXJsOiBcInZpZXdzL2RpcmVjdGl2ZXMvc2lkZWJhci9jb2xsZWN0aW9uLXNpZGViYXIuaHRtbFwiLFxuXHRcdFx0XHQvLyBjb250cm9sbGVyOiBcIkNvbGxlY3Rpb25DdHJsXCJcblx0XHRcdFx0Y29udHJvbGxlcjogWyckcm9vdFNjb3BlJywgJyRzY29wZScsICckZmlsdGVyJywgJyR3aW5kb3cnLCAnTW9kYWxTZXJ2aWNlJywgJ0NvbGxlY3Rpb24nLCBcblx0XHRcdFx0ZnVuY3Rpb24gKCRyb290U2NvcGUsICRzY29wZSwgJGZpbHRlciwgJHdpbmRvdywgTW9kYWxTZXJ2aWNlLCBDb2xsZWN0aW9uKSB7XG5cdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0LyoqXG5cdFx0XHRcdCAgICAgKiAgIE1vZGFsXG5cdFx0XHRcdCAgICAqKi9cblx0XHRcdFx0ICAgICRzY29wZS5vcGVuID0gZnVuY3Rpb24gKHNpemUpIHtcblxuXHRcdFx0XHQgICAgICAgICBNb2RhbFNlcnZpY2Uuc2hvd01vZGFsKHtcblx0XHRcdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidmlld3MvbW9kYWwvY2hhbm5lbC9jaGFubmVsLWFkZC5odG1sXCIsXG5cdFx0XHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiQ2hhbm5lbE1vZGFsQ29udHJvbGxlcnNcIlxuXHRcdFx0XHQgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24obW9kYWwpIHtcblx0XHRcdFx0ICAgICAgICAgICAgbW9kYWwuZWxlbWVudC5tb2RhbCgpO1xuXHRcdFx0XHQgICAgICAgICAgICBtb2RhbC5jbG9zZS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHQgICAgICAgICAgICAgICAgaWYobnVsbCAhPSByZXN1bHQpIGNyZWF0ZUNvbGxlY3Rpb24ocmVzdWx0KTtcblx0XHRcdFx0ICAgICAgICAgICAgfSk7XG5cdFx0XHRcdCAgICAgICAgfSk7XG5cdFx0XHRcdCAgICAgICAgXG5cdFx0XHRcdCAgICB9O1xuXG5cdFx0XHRcdCAgICB2YXIgY3JlYXRlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKHBhcmFtKXtcblxuXHRcdFx0XHQgICAgICAgIENvbGxlY3Rpb25cblx0XHRcdFx0ICAgICAgICAuY3JlYXRlKHBhcmFtKVxuXHRcdFx0XHQgICAgICAgIC4kcHJvbWlzZVxuXHRcdFx0XHQgICAgICAgIC50aGVuKFxuXHRcdFx0XHQgICAgICAgIGZ1bmN0aW9uIChyZXMpIHsgICAgICAgICAgICAgICBcblx0XHRcdFx0ICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcblx0XHRcdFx0ICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTsgXG5cdFx0XHRcdCAgICAgICAgfSxcblx0XHRcdFx0ICAgICAgICBmdW5jdGlvbiAoZXJyKSB7ICAgICAgICAgICAgICAgIFxuXHRcdFx0XHQgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyciA6OiBcIiArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuXHRcdFx0XHQgICAgICAgIH0pXG5cdFx0XHRcdCAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24gKCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cblx0XHRcdFx0ICAgICAgICB9KTtcblxuXHRcdFx0XHQgICAgfTtcblx0XHRcdFx0XHRcblx0XHRcdFx0fV1cblx0XHR9XG59KVxuLmRpcmVjdGl2ZSgnbXlwYWdlU2lkZWJhcicsIGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0XHRyZXN0cmljdDogJ0EnLCAvL1RoaXMgbWVuYXMgdGhhdCBpdCB3aWxsIGJlIHVzZWQgYXMgYW4gYXR0cmlidXRlIGFuZCBOT1QgYXMgYW4gZWxlbWVudC4gSSBkb24ndCBsaWtlIGNyZWF0aW5nIGN1c3RvbSBIVE1MIGVsZW1lbnRzXG5cdFx0XHRcdHJlcGxhY2U6IHRydWUsXG5cdFx0XHRcdHNjb3BlOiB7dXNlcjogJz0nfSwgLy8gVGhpcyBpcyBvbmUgb2YgdGhlIGNvb2wgdGhpbmdzIDopLiBXaWxsIGJlIGV4cGxhaW5lZCBpbiBwb3N0LlxuXHRcdFx0XHR0ZW1wbGF0ZVVybDogXCJ2aWV3cy9kaXJlY3RpdmVzL3NpZGViYXIvbXlwYWdlLXNpZGViYXIuaHRtbFwiLFx0XHRcdFx0XG5cdFx0XHRcdGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICckd2luZG93JywgJyRzY29wZScsICckZmlsdGVyJywgJyRodHRwJywgJ0NvbGxlY3Rpb24nLCAnTG9vcEJhY2tBdXRoJywgJ01vZGFsU2VydmljZScsICdVc2VyJywgJ1lvdXR1YmUnLCAnQ29uZmlnJywgJ0NvbnRlbnQnLFxuXHRcdFx0XHRmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHdpbmRvdywgJHNjb3BlLCAkZmlsdGVyLCAkaHR0cCwgQ29sbGVjdGlvbiwgTG9vcEJhY2tBdXRoLCBNb2RhbFNlcnZpY2UsIFVzZXIsIFlvdXR1YmUsIENvbmZpZywgQ29udGVudCkge1xuXG5cdFx0XHRcdFx0JHNjb3BlLkxvb3BCYWNrQXV0aCA9IExvb3BCYWNrQXV0aDtcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0JHNjb3BlLm15Q29sbGVjdGlvbiA9IHt9O1x0XHRcdFx0XHRcblxuXHRcdFx0XHRcdFVzZXJcdFx0XHRcdFx0XG5cdFx0XHQgICAgICAgIC5jb2xsZWN0aW9uKHtcblx0XHRcdCAgICAgICAgICAgIHVzZXJJZDogTG9vcEJhY2tBdXRoLmN1cnJlbnRVc2VySWRcblx0XHRcdCAgICAgICAgfSlcblx0XHRcdCAgICAgICAgLiRwcm9taXNlXG5cdFx0XHQgICAgICAgIC50aGVuKFxuXHRcdFx0ICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7ICAgICAgICAgICAgICAgICAgXHRcdFx0ICAgICAgICAgICAgXG5cblx0XHRcdCAgICAgICAgICAgIGlmKG51bGwgIT0gcmVzdWx0KSBcblx0XHRcdCAgICAgICAgICAgIHsgICAgICAgICAgICBcblxuXHRcdFx0ICAgICAgICAgICAgXHQkcm9vdFNjb3BlLiRlbWl0KCdzZWxlY3RNeUNoYW5uZWwnLCByZXN1bHQuY2hhbm5lbElkKTsgICAgIFxuXG5cdFx0XHQgICAgICAgICAgICAgICAgWW91dHViZVxuXHRcdCAgICAgICAgICAgICAgICAgICAgLmNoYW5uZWwoe1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICdrZXknOiBDb25maWcueW91dHViZUtleSxcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiByZXN1bHQuY2hhbm5lbElkLFxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICdwYXJ0JzogJ3N0YXRpc3RpY3MnXG5cdFx0ICAgICAgICAgICAgICAgICAgICB9KVxuXHRcdCAgICAgICAgICAgICAgICAgICAgLiRwcm9taXNlXG5cdFx0ICAgICAgICAgICAgICAgICAgICAudGhlbihcblx0XHQgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlcy5pdGVtc1swXS5zdGF0aXN0aWNzOyAgICAgICAgICAgICAgICBcblxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5teUNvbGxlY3Rpb24udmlld0NvdW50ID0gZGF0YS52aWV3Q291bnQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm15Q29sbGVjdGlvbi5jb21tZW50Q291bnQgPSBkYXRhLmNvbW1lbnRDb3VudDtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubXlDb2xsZWN0aW9uLnN1YnNjcmliZXJDb3VudCA9IGRhdGEuc3Vic2NyaWJlckNvdW50O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5teUNvbGxlY3Rpb24udmlkZW9Db3VudCA9IGRhdGEudmlkZW9Db3VudDtcblx0XHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdFx0ICAgICAgICAgICAgICAgICAgICBnZXRDb3VudChyZXN1bHQuY2hhbm5lbElkKVxuXHRcdCAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oY291bnQpeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm15Q29sbGVjdGlvbi5jb3VudCA9IGNvdW50O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgfSk7XHRcdFx0ICAgICAgICAgICAgICAgICAgICBcblxuXHRcdCAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm15Q29sbGVjdGlvbiA9IHJlc3VsdDtcblx0XHRcdCAgICAgICAgICAgIH0gXHRcdFx0ICAgICAgICAgICAgXG5cdFx0XHQgICAgICAgIH0sXG5cdFx0XHQgICAgICAgIGZ1bmN0aW9uIChlcnIpIHsgICAgICAgICAgICAgICAgXG5cdFx0XHQgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyciA6OiBcIiArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuXHRcdFx0ICAgICAgICB9KTtcblxuXG5cdFx0XHQgICAgICAgIC8qKlxuXHRcdFx0XHQgICAgICogIENvbGxlY3QgTXkgWW91dHViZSBJbmZvbWF0aW9uXG5cdFx0XHRcdCAgICAqKi9cblx0XHRcdFx0ICAgICRzY29wZS5Db2xsZWN0QnlJZCA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0XHQgICAgXHQkc2NvcGUubXlDb2xsZWN0aW9uLnN0YXRlID0gdHJ1ZTtcblxuXHRcdFx0XHQgICAgICAgICRodHRwKHtcblx0XHRcdFx0ICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcgLFxuXHRcdFx0XHQgICAgICAgICAgICB1cmw6ICcvZXhlY3V0ZUJ5SWQnLCAgICAgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHQgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04J30sIFxuXHRcdFx0XHQgICAgICAgICAgICBkYXRhOiB7IGNoYW5uZWxJZDogJHNjb3BlLm15Q29sbGVjdGlvbi5jaGFubmVsSWQgfSxcblx0XHRcdFx0ICAgICAgICAgICAgdHlwZTogJ2pzb24nXG5cdFx0XHRcdCAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXMpIHtcblx0XHRcdFx0ICAgICAgICAgICAgXG5cdFx0XHRcdCAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXMpKTtcblx0XHRcdFx0ICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7ICAgICAgICAgICAgICAgICAgICBcblxuXHRcdFx0XHQgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDb21wbGV0ZScpO1xuXHRcdFx0XHQgICAgICAgIH0pO1xuXHRcdFx0XHQgICAgfTsgICAgXG5cblxuXHRcdFx0XHRcdCRzY29wZS5jb2xsZXRNeVlvdXR1YmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuXG5cdFx0XHRcdCAgICAgICAgTW9kYWxTZXJ2aWNlLnNob3dNb2RhbCh7XG5cdFx0XHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInZpZXdzL21vZGFsL2NoYW5uZWwvbXktY2hhbm5lbC1hZGQuaHRtbFwiLFxuXHRcdFx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiBcIk15Q2hhbm5lbE1vZGFsQ29udHJvbGxlcnNcIlxuXHRcdFx0XHQgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24obW9kYWwpIHtcblx0XHRcdFx0ICAgICAgICAgICAgbW9kYWwuZWxlbWVudC5tb2RhbCgpO1xuXHRcdFx0XHQgICAgICAgICAgICBtb2RhbC5jbG9zZS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdFx0XHQgICAgICAgICAgICAgICAgaWYocmVzdWx0KSBjcmVhdGVDb2xsZWN0aW9uKHJlc3VsdCk7XG5cdFx0XHRcdCAgICAgICAgICAgIH0pO1xuXHRcdFx0XHQgICAgICAgIH0pO1x0XHRcdFx0ICAgICAgICBcblx0XHRcdFx0ICAgIH07XG5cblx0XHRcdFx0ICAgICRzY29wZS5kZWxldGVDb2xsZWN0aW9uID0gZnVuY3Rpb24oaWQsIGNoYW5uZWxJZCl7XG5cblx0XHRcdFx0ICAgICAgICBNb2RhbFNlcnZpY2Uuc2hvd01vZGFsKHtcblx0XHRcdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidmlld3MvbW9kYWwvY29uZmlybS9jb25maXJtLmh0bWxcIixcblx0XHRcdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogXCJDb25maXJtTW9kYWxDb250cm9sbGVyc1wiXG5cdFx0XHRcdCAgICAgICAgfSkudGhlbihmdW5jdGlvbihtb2RhbCkge1xuXHRcdFx0XHQgICAgICAgICAgICBtb2RhbC5lbGVtZW50Lm1vZGFsKCk7XG5cdFx0XHRcdCAgICAgICAgICAgIG1vZGFsLmNsb3NlLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG5cblx0XHRcdFx0ICAgICAgICAgICAgICAgIGlmKHJlc3VsdCl7XG5cdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgQ29sbGVjdGlvblxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC5kZWxldGUoe1xuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICBpZDogaWRcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICB9KVxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC4kcHJvbWlzZVxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIC50aGVuKFxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHsgICAgICAgICAgICAgICBcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTsgXG5cdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgfSxcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyKSB7ICAgICAgICAgICAgICAgIFxuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVyciA6OiBcIiArIEpTT04uc3RyaW5naWZ5KGVycikpO1xuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXHRcdFx0XHQgICAgICAgICAgICAgICAgfVxuXG5cdFx0XHRcdCAgICAgICAgICAgIH0pO1xuXHRcdFx0XHQgICAgICAgIH0pOyAgICBcblx0XHRcdFx0ICAgIH07XG5cblx0XHRcdFx0ICAgIHZhciBjcmVhdGVDb2xsZWN0aW9uID0gZnVuY3Rpb24ocGFyYW0pe1xuXG5cdFx0XHRcdCAgICAgICAgQ29sbGVjdGlvblxuXHRcdFx0XHQgICAgICAgIC5jcmVhdGUocGFyYW0pXG5cdFx0XHRcdCAgICAgICAgLiRwcm9taXNlXG5cdFx0XHRcdCAgICAgICAgLnRoZW4oXG5cdFx0XHRcdCAgICAgICAgZnVuY3Rpb24gKHJlcykgeyAgICAgICAgICAgICAgIFxuXHRcdFx0XHQgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xuXHRcdFx0XHQgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpOyBcblx0XHRcdFx0ICAgICAgICB9LFxuXHRcdFx0XHQgICAgICAgIGZ1bmN0aW9uIChlcnIpIHsgICAgICAgICAgICAgICAgXG5cdFx0XHRcdCAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyIDo6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXJyKSk7XG5cdFx0XHRcdCAgICAgICAgfSlcblx0XHRcdFx0ICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuXHRcdFx0XHQgICAgICAgIH0pO1x0XHRcdFx0ICAgICAgICBcblx0XHRcdFx0ICAgIH07XG5cblx0XHRcdFx0ICAgIHZhciBnZXRDb3VudCA9IGZ1bmN0aW9uKGlkKXtcblxuXHRcdFx0XHQgICAgICAgIHZhciBwcm9taXNlID0gXG5cdFx0XHRcdCAgICAgICAgICAgICAgICBDb250ZW50XG5cdFx0XHRcdCAgICAgICAgICAgICAgICAuY291bnQoeyAgICBcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICB3aGVyZToge1xuXHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsSWQ6IGlkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgfVxuXHRcdFx0XHQgICAgICAgICAgICAgICAgfSlcblx0XHRcdFx0ICAgICAgICAgICAgICAgIC4kcHJvbWlzZVxuXHRcdFx0XHQgICAgICAgICAgICAgICAgLnRoZW4oXG5cdFx0XHRcdCAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmNvdW50OyAgIFxuXHRcdFx0XHQgICAgICAgICAgICAgICAgfSxcblx0XHRcdFx0ICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIpIHsgICAgICAgICAgICAgICAgXG5cdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnIgOjogXCIgKyBKU09OLnN0cmluZ2lmeShlcnIpKTtcblx0XHRcdFx0ICAgICAgICAgICAgICAgIH0pO1xuXG5cdFx0XHRcdCAgICAgICAgcmV0dXJuIHByb21pc2U7XG5cdFx0XHRcdCAgICB9O1xuXG5cblx0XHRcdFx0fV1cblx0XHR9XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwJylcbi5jb250cm9sbGVyKCdDaGFubmVsTW9kYWxDb250cm9sbGVycycsIFsnJHNjb3BlJywgJ2Nsb3NlJywgJ1lvdXR1YmUnLCAnQ29uZmlnJywgZnVuY3Rpb24oJHNjb3BlLCBjbG9zZSwgWW91dHViZSwgQ29uZmlnKSB7XG5cblxuICAgICBmdW5jdGlvbiBmaW5kQ2hhbm5lbChwYXJhbSl7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG5cbiAgICAgICAgICAgIFlvdXR1YmVcbiAgICAgICAgICAgIC5jaGFubmVsKHBhcmFtKVxuICAgICAgICAgICAgLiRwcm9taXNlXG4gICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGF0YSk7ICBcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSk7ICAgICAgIFxuICAgIH07XG5cblxuICAgICRzY29wZS5jaGFubmVsRGV0YWlsID0gZnVuY3Rpb24oZGF0YSl7XG5cbiAgICAgICAgJHNjb3BlLnJlc3VsdFRleHQgPSBudWxsO1xuICAgICAgICAkc2NvcGUuZW5yb2xsX2J1dHRvbiA9IHRydWU7XG5cbiAgICAgICAgJHNjb3BlLnBhcmFtID0ge1xuICAgICAgICAgICAgdHlwZTogXCJ5b3V0dWJlXCIsXG4gICAgICAgICAgICBpZDogZGF0YS5pdGVtc1swXS5pZCxcbiAgICAgICAgICAgIGNoYW5uZWxJZDogZGF0YS5pdGVtc1swXS5pZCxcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogZGF0YS5pdGVtc1swXS5zbmlwcGV0LnRpdGxlLFxuICAgICAgICAgICAgcHVibGlzaGVkQXQ6IGRhdGEuaXRlbXNbMF0uc25pcHBldC5wdWJsaXNoZWRBdCxcbiAgICAgICAgICAgIHRodW1ibmFpbHM6IGRhdGEuaXRlbXNbMF0uc25pcHBldC50aHVtYm5haWxzLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRhdGEuaXRlbXNbMF0uc25pcHBldC5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHBhZ2VJbmZvOiBkYXRhLnBhZ2VJbmZvLFxuICAgICAgICAgICAgc3RhdGU6IGZhbHNlXG4gICAgICAgIH07ICAgICAgICAgICAgICAgXG5cbiAgICAgICAgJHNjb3BlLiRhcHBseSgpOyBcbiAgICB9O1xuXG5cbiAgXHQkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbihyZXN1bHQpIHtcblx0ICBcdGNsb3NlKG51bGwsIDUwMCk7IC8vIGNsb3NlLCBidXQgZ2l2ZSA1MDBtcyBmb3IgYm9vdHN0cmFwIHRvIGFuaW1hdGVcbiAgXHR9O1xuXG4gIFx0JHNjb3BlLm9rID0gZnVuY3Rpb24gKCkgeyAgICAgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgJHNjb3BlLnJlc3VsdFRleHQgPSAnU2VhcmNoaW5nLi4uJztcbiAgICAgICAgXG4gICAgICAgIGZpbmRDaGFubmVsKHtcbiAgICAgICAgICAgICdrZXknOiBDb25maWcueW91dHViZUtleSxcbiAgICAgICAgICAgICdpZCc6ICRzY29wZS5hZGRDaGFubmVsLFxuICAgICAgICAgICAgJ3BhcnQnOiAnc25pcHBldCdcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7ICAgICAgICAgICAgXG5cbiAgICAgICAgICAgIGlmKGRhdGEuaXRlbXMubGVuZ3RoID4gMCkgJHNjb3BlLmNoYW5uZWxEZXRhaWwoZGF0YSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmluZENoYW5uZWwoe1xuICAgICAgICAgICAgICAgICAgICAna2V5JzogQ29uZmlnLnlvdXR1YmVLZXksXG4gICAgICAgICAgICAgICAgICAgICdmb3JVc2VybmFtZSc6ICRzY29wZS5hZGRDaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICAncGFydCc6ICdzbmlwcGV0J1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoZGF0YS5pdGVtcy5sZW5ndGggPiAwKSAkc2NvcGUuY2hhbm5lbERldGFpbChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZXN1bHRUZXh0ID0gJ1lvdXR1YmUgSUQgTm90IEZvdW5kISc7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTsgXG4gICAgICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgfSk7ICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG5cbiAgICAkc2NvcGUuZW5yb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjbG9zZSgkc2NvcGUucGFyYW0sIDUwMCk7IC8vIGNsb3NlLCBidXQgZ2l2ZSA1MDBtcyBmb3IgYm9vdHN0cmFwIHRvIGFuaW1hdGVcbiAgICB9O1xuXG59XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uY29udHJvbGxlcignTXlDaGFubmVsTW9kYWxDb250cm9sbGVycycsIFsnJHNjb3BlJywgJyRodHRwJywgJ2Nsb3NlJywgJ1lvdXR1YmUnLCAnQ29uZmlnJywgJ0xvb3BCYWNrQXV0aCcsXG4gICAgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgY2xvc2UsIFlvdXR1YmUsIENvbmZpZywgTG9vcEJhY2tBdXRoKSB7XG5cbiAgICBpZihudWxsICE9IExvb3BCYWNrQXV0aC55b3V0dWJlQWNjZXNzVG9rZW4pe1xuICAgICAgICBcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGhvcml6YXRpb24nXSA9ICdCZWFyZXIgJyArIExvb3BCYWNrQXV0aC55b3V0dWJlQWNjZXNzVG9rZW47XG5cbiAgICAgICAgWW91dHViZVxuICAgICAgICAubXlDaGFubmVsKHtcbiAgICAgICAgICAgICdwYXJ0JzogJ3NuaXBwZXQnXG4gICAgICAgIH0pXG4gICAgICAgIC4kcHJvbWlzZVxuICAgICAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKGRhdGEpIHtcblxuICAgICAgICAgICAgJHNjb3BlLnJlc3VsdFRleHQgPSBudWxsO1xuICAgICAgICAgICAgJHNjb3BlLmVucm9sbF9idXR0b24gPSB0cnVlO1xuXG4gICAgICAgICAgICAkc2NvcGUucGFyYW0gPSB7XG4gICAgICAgICAgICAgICAgdXNlcklkOiBMb29wQmFja0F1dGguY3VycmVudFVzZXJJZCxcbiAgICAgICAgICAgICAgICB0eXBlOiBcInlvdXR1YmVcIixcbiAgICAgICAgICAgICAgICBpZDogZGF0YS5pdGVtc1swXS5pZCxcbiAgICAgICAgICAgICAgICBjaGFubmVsSWQ6IGRhdGEuaXRlbXNbMF0uaWQsXG4gICAgICAgICAgICAgICAgY2hhbm5lbFRpdGxlOiBkYXRhLml0ZW1zWzBdLnNuaXBwZXQudGl0bGUsXG4gICAgICAgICAgICAgICAgcHVibGlzaGVkQXQ6IGRhdGEuaXRlbXNbMF0uc25pcHBldC5wdWJsaXNoZWRBdCxcbiAgICAgICAgICAgICAgICB0aHVtYm5haWxzOiBkYXRhLml0ZW1zWzBdLnNuaXBwZXQudGh1bWJuYWlscyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZGF0YS5pdGVtc1swXS5zbmlwcGV0LmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIHBhZ2VJbmZvOiBkYXRhLnBhZ2VJbmZvLFxuICAgICAgICAgICAgICAgIHN0YXRlOiBmYWxzZVxuICAgICAgICAgICAgfTsgICAgICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbG9zZShmYWxzZSwgNTAwKTsgLy8gY2xvc2UsIGJ1dCBnaXZlIDUwMG1zIGZvciBib290c3RyYXAgdG8gYW5pbWF0ZVxuICAgIH07XG5cbiAgICAkc2NvcGUuZW5yb2xsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjbG9zZSgkc2NvcGUucGFyYW0sIDUwMCk7IC8vIGNsb3NlLCBidXQgZ2l2ZSA1MDBtcyBmb3IgYm9vdHN0cmFwIHRvIGFuaW1hdGVcbiAgICB9O1xuXG59XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcCcpXG4uY29udHJvbGxlcignQ29uZmlybU1vZGFsQ29udHJvbGxlcnMnLCBbJyRzY29wZScsICdjbG9zZScsIGZ1bmN0aW9uKCRzY29wZSwgY2xvc2UpIHtcblxuICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgIFx0Y2xvc2UoZmFsc2UsIDUwMCk7IC8vIGNsb3NlLCBidXQgZ2l2ZSA1MDBtcyBmb3IgYm9vdHN0cmFwIHRvIGFuaW1hdGVcbiAgICB9O1xuXG4gICAgJHNjb3BlLm9rID0gZnVuY3Rpb24gKCkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgXHRjbG9zZSh0cnVlLCA1MDApOyAvLyBjbG9zZSwgYnV0IGdpdmUgNTAwbXMgZm9yIGJvb3RzdHJhcCB0byBhbmltYXRlXG4gICAgfTtcblxufV0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuLmNvbnRyb2xsZXIoJ0xvZ2luTW9kYWxDb250cm9sbGVycycsIFsnJHNjb3BlJywgJyRodHRwJywgJyRhdXRoJywgJyRkb2N1bWVudCcsICckbG9jYXRpb24nLCAnY2xvc2UnLCAnWW91dHViZScsICdDb25maWcnLCAnTG9vcEJhY2tBdXRoJyxcbiAgICBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkYXV0aCwgJGRvY3VtZW50LCAkbG9jYXRpb24sIGNsb3NlLCBZb3V0dWJlLCBDb25maWcsIExvb3BCYWNrQXV0aCkge1xuXG4gICAgXG4gICAgY29uc29sZS5sb2coJ0xvb3BCYWNrQXV0aCcsIExvb3BCYWNrQXV0aCk7XG5cbiAgICAkc2NvcGUuYXV0aGVudGljYXRlID0gZnVuY3Rpb24gKHByb3ZpZGVyKSB7XG4gICAgICBcbiAgICAgICAgJGF1dGhcbiAgICAgICAgLmF1dGhlbnRpY2F0ZShwcm92aWRlcilcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXG4gICAgICAgICAgICBMb29wQmFja0F1dGguc2V0VXNlcihyZXMuZGF0YS50b2tlbiwgcmVzLmRhdGEuaWQsIHJlcy5kYXRhLmVtYWlsLCByZXMuZGF0YS55b3V0dWJlQWNjZXNzVG9rZW4pO1xuICAgICAgICAgICAgTG9vcEJhY2tBdXRoLnJlbWVtYmVyTWUgPSB0cnVlO1xuICAgICAgICAgICAgTG9vcEJhY2tBdXRoLnNhdmUoKTtcblxuICAgICAgICAgICAgLy8gIE5vdyBjbG9zZSBhcyBub3JtYWwsIGJ1dCBnaXZlIDUwMG1zIGZvciBib290c3RyYXAgdG8gYW5pbWF0ZVxuICAgICAgICAgICAgYW5ndWxhci5lbGVtZW50KCRkb2N1bWVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdtb2RhbC1iYWNrZHJvcCcpKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICRsb2NhdGlvbi51cmwoJy9teXBhZ2UnKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgJHNjb3BlLmNsb3NlID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGNsb3NlKG51bGwsIDUwMCk7IC8vIGNsb3NlLCBidXQgZ2l2ZSA1MDBtcyBmb3IgYm9vdHN0cmFwIHRvIGFuaW1hdGVcbiAgICB9O1xuXG5cbiAgICAkc2NvcGUub2sgPSBmdW5jdGlvbiAoKSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygnTG9vcEJhY2tBdXRoJywgTG9vcEJhY2tBdXRoKTsgICAgICAgIFxuICAgIH07XG5cblxuICAgICRzY29wZS5lbnJvbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsb3NlKCRzY29wZS5wYXJhbSwgNTAwKTsgLy8gY2xvc2UsIGJ1dCBnaXZlIDUwMG1zIGZvciBib290c3RyYXAgdG8gYW5pbWF0ZVxuICAgIH07XG5cblxufV0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
