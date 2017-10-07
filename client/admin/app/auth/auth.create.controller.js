'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:RoleCtrl
 * @description
 * # RoleCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('AuthCreateCtrl', ['$scope', '$location', 'Role', 'LoopBackAuth',
			function ($scope, $location, Role, LoopBackAuth) {	


	$scope.create = function() {

		Role.create($scope.model)
		.$promise
	    .then(
	    function (res) {               
	        $location.nextAfterLogin = $location.path();
            $location.path('/auth/list');			
	    },
	    function (err) {                            
	        console.log('err', err);
            alert(err.data.error.message);
	    });

    };

	
}]);