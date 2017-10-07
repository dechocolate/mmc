angular.module('app')
	.controller('ConfirmModalControllers', ['$scope', 'close', function($scope, close) {

    $scope.cancel = function(result) {
      	close(false, 500); 
    };

    $scope.ok = function () {                                
    	close(true, 500); 
    };

}]);