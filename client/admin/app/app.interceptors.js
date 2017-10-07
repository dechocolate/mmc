angular.module('adminApp')
.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {   

	$httpProvider.interceptors.push(function($q, $location, LoopBackAuth) {
  		return {
            'request': function(config) {

                if (LoopBackAuth.accessTokenId === null && config.url !== "app/login/login.html") {                                
                    $location.nextAfterLogin = $location.path();
                    $location.path('/login');
                }

                if (LoopBackAuth.accessTokenId !== null && config.url === "app/login/login.html") {                                
                    $location.nextAfterLogin = $location.path();
                    $location.path('/collection/list');
                }

                return config;
            },   

    		responseError: function(rejection) {
      			if (rejection.status == 401) {
        			//Now clearing the loopback values from client browser for safe logout...
			        LoopBackAuth.clearUser();
			        LoopBackAuth.clearStorage();
			        $location.nextAfterLogin = $location.path();
			        $location.path('/login');
      			}                

	      		return $q.reject(rejection);
	    	}
	  	};
	});
}]);