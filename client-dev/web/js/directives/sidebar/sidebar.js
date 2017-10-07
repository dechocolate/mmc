angular.module('app')
.directive('sidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/sidebar/content-sidebar.html",
				// controller: "ContentCtrl"				
				controller: ['$rootScope', '$scope', '$filter', 'Collection', 
				function ($rootScope, $scope, $filter, Collection) {
					
					$scope.categories = [];					
					
					$scope.states = {};
    				$scope.states.activeItem = 'all';

					Collection
			        .find({			        	
			            filter: {
			            	fields:{
			            		channelId:true,
				        		channelTitle:true
				        	},                 
			                order: name			       
			            }			        	
			        })
			        .$promise
			        .then(
			        function (res) {                  			           
			            $scope.categories = $scope.categories.concat(res);
			        });
			        
			        $scope.selectChannel = function(channelId){   			         	
			        	$rootScope.$emit('selectFilter', channelId);     
			        };

				}]
		}
})
.directive('collectionSidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/sidebar/collection-sidebar.html",
				// controller: "CollectionCtrl"
				controller: ['$rootScope', '$scope', '$filter', '$window', 'ModalService', 'Collection', 
				function ($rootScope, $scope, $filter, $window, ModalService, Collection) {
								
					/**
				     *   Modal
				    **/
				    $scope.open = function (size) {

				         ModalService.showModal({
				            templateUrl: "views/modal/channel/channel-add.html",
				            controller: "ChannelModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {
				                if(null != result) createCollection(result);
				            });
				        });
				        
				    };

				    var createCollection = function(param){

				        Collection
				        .create(param)
				        .$promise
				        .then(
				        function (res) {               
				            console.log(res);
				            $window.location.reload(); 
				        },
				        function (err) {                
				            console.log("err :: " + JSON.stringify(err));
				        })
				        .finally(function () {                                

				        });

				    };
					
				}]
		}
})
.directive('mypageSidebar', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/sidebar/mypage-sidebar.html",				
				controller: ['$rootScope', '$window', '$scope', '$filter', '$http', 'Collection', 'LoopBackAuth', 'ModalService', 'User', 'Youtube', 'Config', 'Content',
				function ($rootScope, $window, $scope, $filter, $http, Collection, LoopBackAuth, ModalService, User, Youtube, Config, Content) {

					$scope.LoopBackAuth = LoopBackAuth;														
					$scope.myCollection = {};					

					User					
			        .collection({
			            userId: LoopBackAuth.currentUserId
			        })
			        .$promise
			        .then(
			        function (result) {                  			            

			            if(null != result) 
			            {            

			            	$rootScope.$emit('selectMyChannel', result.channelId);     

			                Youtube
		                    .channel({
		                        'key': Config.youtubeKey,
		                        'id': result.channelId,
		                        'part': 'statistics'
		                    })
		                    .$promise
		                    .then(
		                    function (res) {
		                        var data = res.items[0].statistics;                

		                        $scope.myCollection.viewCount = data.viewCount;                           
		                        $scope.myCollection.commentCount = data.commentCount;
		                        $scope.myCollection.subscriberCount = data.subscriberCount;
		                        $scope.myCollection.videoCount = data.videoCount;
		                    });

		                    getCount(result.channelId)
		                    .then(function(count){                                            
		                        $scope.myCollection.count = count;
		                    });			                    

		                    $scope.myCollection = result;
			            } 			            
			        },
			        function (err) {                
			            console.log("err :: " + JSON.stringify(err));
			        });


			        /**
				     *  Collect My Youtube Infomation
				    **/
				    $scope.CollectById = function () {

				    	$scope.myCollection.state = true;

				        $http({
				            method: 'POST' ,
				            url: '/executeById',                        
				            headers: {'Content-Type': 'application/json; charset=utf-8'}, 
				            data: { channelId: $scope.myCollection.channelId },
				            type: 'json'
				        }).success(function(res) {
				            
				            var data = JSON.parse(JSON.stringify(res));
				            console.log(data);                    

				        }).finally(function() {
				            console.log('Complete');
				        });
				    };    


					$scope.colletMyYoutube = function (size) {

				        ModalService.showModal({
				            templateUrl: "views/modal/channel/my-channel-add.html",
				            controller: "MyChannelModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {
				                if(result) createCollection(result);
				            });
				        });				        
				    };

				    $scope.deleteCollection = function(id, channelId){

				        ModalService.showModal({
				            templateUrl: "views/modal/confirm/confirm.html",
				            controller: "ConfirmModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {

				                if(result){
				                    Collection
				                    .delete({
				                        id: id
				                    })
				                    .$promise
				                    .then(
				                    function (res) {               
				                        $window.location.reload(); 
				                    },
				                    function (err) {                
				                        console.log("err :: " + JSON.stringify(err));
				                    });
				                }

				            });
				        });    
				    };

				    var createCollection = function(param){

				        Collection
				        .create(param)
				        .$promise
				        .then(
				        function (res) {               
				            console.log(res);
				            $window.location.reload(); 
				        },
				        function (err) {                
				            console.log("err :: " + JSON.stringify(err));
				        })
				        .finally(function () {                                

				        });				        
				    };

				    var getCount = function(id){

				        var promise = 
				                Content
				                .count({    
				                    where: {
				                        channelId: id                                       
				                    }
				                })
				                .$promise
				                .then(
				                function (res) {                                   
				                    return res.count;   
				                },
				                function (err) {                
				                    console.log("err :: " + JSON.stringify(err));
				                });

				        return promise;
				    };


				}]
		}
});