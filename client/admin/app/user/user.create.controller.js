'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('UserCreateCtrl', ['$scope', '$location', 'User', 'LoopBackAuth',
			function ($scope, $location, User, LoopBackAuth) {	


	$scope.model = {
		username : '',
		email : '',
		password: '',
		available : true
	}

	$scope.create = function() {

		// $scope.model.available = true;

		User.create($scope.model)
		.$promise
	    .then(
	    function (res) {               
	        console.log(res);
	        $location.nextAfterLogin = $location.path();
            $location.path('/user/list');			
	    },
	    function (err) {                            
	        console.log('err', err);
            alert(err.data.error.message);
	    });

    };

	
}]);