// (function (window, angular, undefined) {
//     'use strict';
    
    var authHeader = 'authorization';
    // var module = angular.module("loopBackAuthFactories", ['ngResource']);
  
    angular.module('app')
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

            /**
             *  Note: LocalStorage converts the value to string
             *  We are using empty string as a marker for null/undefined values.
            **/
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
                                
                var urlBase = "/api";    

                return {
                    'request': function (config) {

                        /* filter out non urlBase requests */
                        if (config.url.substr(0, urlBase.length) !== urlBase) {
                            return config;
                        }

                        if (LoopBackAuth.accessTokenId) {
                            config.headers[authHeader] = LoopBackAuth.accessTokenId;                            
                        } else if (config.__isGetCurrentUser__) {
                            /*  Return a stub 401 error for User.getCurrent() when */
                            /*  there is no user logged in */
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

                    resource.prototype.$save = function (success, error) {
                        var result = resource.upsert.call(this, {}, this, success, error);
                        return result.$promise || result;
                    };
                    return resource;
                };
            }];
        });

// })(window, window.angular);
