angular.module('app')
  	.controller('CollectCtrl', 
  		['$scope', '$window', '$http', 'Collection', 'Content', 'Config', 'Youtube', 'ModalService',
  		function($scope, $window, $http, Collection, Content, Config, Youtube, ModalService) {


  		/**
	     *  List pagenation
	    **/	
  		$scope.totalCount = 0;	  		
		$scope.pageSize = 15;

	    $scope.pagination = {
	        current: 1
	    };

	    $scope.pageChanged = function(newPage) {
	    	$scope.contents = [];   
	        $scope.loadMore(newPage-1);
	    };


  		/**
	     *  Collection List 
	    **/
	    $scope.reset = function(){        
	        $scope.contents = [];    
	        $scope.loadMore(0);
	    };

	    $scope.getTotalCount = function(){        
	    	Collection
	        .count({})
	        .$promise
	        .then(
	        function (res) {               
	            $scope.totalCount = res.count;
	        },
	        function (err) {                
	            console.log("err :: " + JSON.stringify(err));
	        });
		};	        	


	    $scope.loadMore = function(newPage){     

	        Collection
	        .find({
	        	filter: {           
	                fields: {
	                	id: true, 
	                    channelId: true, 
	                    channelTitle: true, 
	                    thumbnails: true,
	                    state: true,
	                    display: true,
	                    description: true
	                },
	                order: 'channelTitle',
	                limit: '15',
	            	skip: newPage* 15                    
	            }	            
	        })
	        .$promise
	        .then(
	        function (res) {                  

            	angular.forEach(res, function (values) {                                        
                    Youtube
                    .channel({
                        'key': Config.youtubeKey,
                        'id': values.channelId,
                        'part': 'statistics'
                    })
                    .$promise
                    .then(
                    function (res) {                    	

                        var data = res.items[0].statistics;                

                        values.viewCount = data.viewCount;                           
                        values.commentCount = data.commentCount;
                        values.subscriberCount = data.subscriberCount;
                        values.videoCount = data.videoCount;
                    });

                    getCount(values.channelId)
                    .then(function(count){                                            
                        values.count = count;
                    });
                    
                    $scope.contents.push(values); 
                                                 
                });  /* end foreach */ 

	        },
	        function (err) {                
	            console.log("err :: " + JSON.stringify(err));
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

	    $scope.reset();
	    $scope.getTotalCount();


	    /**
	     *  Collect Youtube Infomation
	    **/
	    $scope.CollectById = function (index, e) {

	        var id = $(e.target).data('id');

	        console.log($scope.contents[index]);
	        $scope.contents[index].state = true;

	        $http({
	            method: 'POST' ,
	            url: '/executeById',                        
	            headers: {'Content-Type': 'application/json; charset=utf-8'}, 
	            data: {channelId:id},
	            type: 'json'
	        }).success(function(res) {
	            
	            var data = JSON.parse(JSON.stringify(res));
	            console.log(data);                    

	        }).finally(function() {
	            console.log('Complete');
	        });
	    };    

	    $scope.deleteCollection = function(id, channelId){

	    	console.log('id', id);
	    	console.log('id', channelId);

	        ModalService.showModal({
	            templateUrl: "views/modal/confirm/confirm.html",
	            controller: "ConfirmModalControllers"
	        }).then(function(modal) {
	            modal.element.modal();
	            modal.close.then(function(result) {


	            	console.log('id', id);

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
	                    })
	                    .finally(function () {                                

	                    });                    
	                }

	            });
	        });    
	    };

	    $scope.updateCollection = function(index, id, channelId){

	        Collection
	        .update({
	            id: id,
	            state: false
	        })
	        .$promise
	        .then(
	        function (res) {               
	            console.log(res);
	            $scope.contents[index].state = false;
	            //$window.location.reload(); 
	        },
	        function (err) {                
	            console.log("err :: " + JSON.stringify(err));
	        });

	    };

	    $scope.display = function(index, channelId, display){

	        Collection
	        .update({
	            id: channelId,
	            display: display
	        })
	        .$promise
	        .then(
	        function (res) {               
	            $scope.contents[index].display = display;
	        },
	        function (err) {                
	            console.log("err :: " + JSON.stringify(err));
	        });

	        Collection
	        .displayContents({
			   	id: channelId ,	                                  	           		            
	        	display: display
	        })
	        .$promise
	        .then(
	        function (res) {               
	            console.log(res);
	            $scope.contents[index].display = display;
	        },
	        function (err) {                
	            console.log("err :: " + JSON.stringify(err));
	        });
	    };

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
		        });

		    };
	        
	    };


}]);




