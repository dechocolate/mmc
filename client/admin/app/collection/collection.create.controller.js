'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:CollectionCtrl
 * @description
 * # CollectionCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('CollectionCreateCtrl', ['$scope', '$location', '$filter', 'LoopBackAuth', 'ModalService', 'Collection', 'Youtube', 'Config',
			function ($scope, $location, $filter, LoopBackAuth, ModalService, Collection, Youtube, Config) {	

	$scope.model = {
		name: '',
		start: '',
		end: '',
		display: true
	}

	/**
	 *  Event Create
	**/
	$scope.create = function() {			

		Collection
		.create($scope.param)
		.$promise
	    .then(
	    function (res) {               
	        $location.nextAfterLogin = $location.path();
            $location.path('/collection/list');			
	    },
	    function (err) {                            
	        console.log('err', err);
            alert(err.data.error.message);
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
            display: true,
            state: false
        };               

        $scope.$apply(); 
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
	
}]);