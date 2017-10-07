angular.module('adminApp')
.directive('bannerSidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "app/banner/banner.sidebar.html",
				// controller: "UserCtrl"				
				controller: ['$rootScope', '$scope', '$state', '$filter', '$location',
				function ($rootScope, $scope, $state, $filter, $location) {
					
					/**
					 *   check class active
					**/
					$scope.isActive = function (path) {				
					  	return ($location.path().includes(path)) ? 'active' : '';
					}
					
				}]
		}
});