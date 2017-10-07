angular.module('app')
.controller('ConfirmModalControllers', ['$scope', 'close', function($scope, close) {

    $scope.cancel = function() {
      	close(false, 500); // close, but give 500ms for bootstrap to animate
    };

    $scope.ok = function () {                                
    	close(true, 500); // close, but give 500ms for bootstrap to animate
    };

}]);