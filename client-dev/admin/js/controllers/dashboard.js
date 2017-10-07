angular.module('app')
  	.controller('DashboardCtrl', 
  		['$scope', '$state', 
  		function($scope, $state) {

	$scope.$state = $state;
	
}]);
