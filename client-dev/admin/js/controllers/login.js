angular.module('app')
  	.controller('LoginCtrl', 
  		['$scope', '$location', 
  		function($scope, $location) {

    	$scope.submit = function() {

      		$location.path('/dashboard');

      		return false;
    	}	

}]);
