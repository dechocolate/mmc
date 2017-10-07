angular.module('app')
.controller('LoginModalControllers', ['$scope', '$http', '$auth', '$document', '$location', 'close', 'Youtube', 'Config', 'LoopBackAuth',
    function($scope, $http, $auth, $document, $location, close, Youtube, Config, LoopBackAuth) {

    
    console.log('LoopBackAuth', LoopBackAuth);

    $scope.authenticate = function (provider) {
      
        $auth
        .authenticate(provider)
        .then(function (res) {

            LoopBackAuth.setUser(res.data.token, res.data.id, res.data.email, res.data.youtubeAccessToken);
            LoopBackAuth.rememberMe = true;
            LoopBackAuth.save();

            //  Now close as normal, but give 500ms for bootstrap to animate
            angular.element($document[0].getElementsByClassName('modal-backdrop')).remove();
            $location.url('/mypage');
        });
    };


    $scope.close = function(result) {
        close(null, 500); // close, but give 500ms for bootstrap to animate
    };


    $scope.ok = function () {                                        
        console.log('LoopBackAuth', LoopBackAuth);        
    };


    $scope.enroll = function () {
        close($scope.param, 500); // close, but give 500ms for bootstrap to animate
    };


}]);