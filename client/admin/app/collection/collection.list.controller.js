'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:NewsListCtrl
 * @description
 * # NewsListCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('CollectionListCtrl', ['$scope', '$location', '$http', 'Collection', 'Content', 'Youtube', 'Config', 'LoopBackAuth', 'ModalService',
				function ($scope, $location, $http, Collection, Content, Youtube, Config, LoopBackAuth, ModalService) {			
 	
 	/**
     *  List pagenation
    **/ 
    $scope.totalCount = 0;          
    $scope.pageSize = 15;

    $scope.pagination = {
        current: 1
    };

    $scope.filter = {
        filter:{           
            order: 'publishedAt DESC',
            limit: '15',
            skip: null,
        }
    };

    $scope.filter_count = {};


    $scope.pageChanged = function(newPage) {
        $scope.contents = [];  
        $scope.pagination.current = newPage;
        $scope.loadMore(newPage-1);
    };


    /**
     *  Collection List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];    
        $scope.loadMore(0);
        $scope.getTotalCount();
    };

    $scope.getTotalCount = function(){     

        Collection
        .count($scope.filter_count)
        .$promise
        .then(
        function (res) {                       
            $scope.totalCount = res.count;
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });
    };        

    $scope.loadMore = function(newPage){     
        
        $scope.filter.filter.skip = newPage * $scope.pageSize;

        Collection
        .find($scope.filter)
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
            console.log('err', err);
            alert(err.data.error.message);
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

    /**
     *  Init
    **/
    $scope.reset();


    /**
     *  search
    **/
    $scope.search = function(){ 

        $scope.filter_count = {
            where: {                            
                channelTitle:{regexp: "/"+$scope.keyword+"/i"}
            }
        };     
        
        $scope.filter = {
            filter:{           
                order: 'publishedAt DESC',
                limit: '15',
                skip: null,
                where: {                            
                    channelTitle:{regexp: "/"+$scope.keyword+"/i"}
                }
            }
        };

        $scope.reset()
    };


    /**
     *  Collection delete
    **/             
    $scope.confirmDelete = function(index, id){      

        ModalService.showModal({
            templateUrl: "components/modal/confirm.html",
            controller: "ModalConfirmCtrl",        
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                if(result) $scope.delete(index, id);
            });
        });
    };

    $scope.delete = function(index, id){      
        
        Collection
        .deleteById({
            id: id
        })
        .$promise
        .then(
        function (res) {               
            $scope.totalCount -= 1;
            $scope.contents = [];  
            $scope.pageChanged($scope.pagination.current);        
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });
    };   


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

        }).finally(function() {
            console.log('Complete');
        });
    };    

    $scope.updateCollection = function(index, id, channelId){

        Collection
        .upsert({
            id: id,
            state: false
        })
        .$promise
        .then(
        function (res) {               
            $scope.contents[index].state = false;
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        });

    };

    $scope.display = function(index, channelId, display){

        Collection
        .upsert({
            id: channelId,
            display: !display
        })
        .$promise
        .then(
        function (res) {               
            $scope.contents[index].display = !display;
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        });

        Collection
        .updateAllContents({
            id: channelId ,                                                                 
            display: !display
        })
        .$promise
        .then(
        function (res) {               
            console.log(res);
        },
        function (err) {                
            console.log("err :: " + JSON.stringify(err));
        });
    };

}]);
