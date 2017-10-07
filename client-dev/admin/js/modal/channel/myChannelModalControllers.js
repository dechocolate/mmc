angular.module('app')
    .controller('MyChannelModalControllers', 
        ['$scope', '$http', 'close', 'Youtube', 'Config', 'LoopBackAuth',
        function($scope, $http, close, Youtube, Config, LoopBackAuth) {

        if(null != LoopBackAuth.youtubeAccessToken){
            
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + LoopBackAuth.youtubeAccessToken;

            Youtube
            .myChannel({
                'part': 'snippet'
            })
            .$promise
            .then(
            function (data) {

                $scope.resultText = null;
                $scope.enroll_button = true;

                $scope.param = {
                    userId: LoopBackAuth.currentUserId,
                    type: "youtube",
                    id: data.items[0].id,
                    channelId: data.items[0].id,
                    channelTitle: data.items[0].snippet.title,
                    publishedAt: data.items[0].snippet.publishedAt,
                    thumbnails: data.items[0].snippet.thumbnails,
                    description: data.items[0].snippet.description,
                    pageInfo: data.pageInfo,
                    state: false
                };               
            });
        }


        $scope.enroll = function () {
            close($scope.param, 500); 
        };

}]);