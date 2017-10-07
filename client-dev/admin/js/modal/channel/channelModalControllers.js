angular.module('app')
    .controller('ChannelModalControllers', ['$scope', 'close', 'Youtube', 'Config', function($scope, close, Youtube, Config) {


     function findChannel(param){

        return new Promise(function(resolve, reject){

            Youtube
            .channel(param)
            .$promise
            .then(
            function (data) {
                return resolve(data);  
            })

        });       
    };


    $scope.channelDetail = function(data){

        $scope.resultText = null;
        $scope.enroll_button = true;

        $scope.param = {
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

        $scope.$apply(); 
    };


  	$scope.close = function(result) {
	  	close(null, 500); 
  	};

  	$scope.ok = function () {                    

        $scope.resultText = 'Searching...';
        
        findChannel({
            'key': Config.youtubeKey,
            'id': $scope.addChannel,
            'part': 'snippet'
        })
        .then(
        function (data) {            
            console.log(data);
            if(data.items.length > 0) $scope.channelDetail(data);
            else
            {
                findChannel({
                    'key': Config.youtubeKey,
                    'forUsername': $scope.addChannel,
                    'part': 'snippet'
                })
                .then(
                function (data) {
                    if(data.items.length > 0) $scope.channelDetail(data);
                    else{
                        $scope.resultText = 'Youtube ID Not Found!';                    
                        $scope.$apply(); 
                    } 
                });                    
            }
        });

    };


    $scope.enroll = function () {
        close($scope.param, 500); 
    };

}]);