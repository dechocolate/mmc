angular.module('adminApp')
    .controller('ModalConfirmCtrl', ['$scope', 'close', function($scope, close) {
  

    $scope.cancel = function(result) {
        close(false, 200); 
    };

    $scope.ok = function () {                                
        close(true, 200); 
    };

}]);