'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:CollectionListCtrl
 * @description
 * # CollectionListCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('CollectionViewCtrl', ['$scope', '$stateParams', '$location', '$filter', 'LoopBackAuth', 'ModalService', 'Collection',
			function ($scope, $stateParams, $location, $filter, LoopBackAuth, ModalService, Collection) {	

	/**
     *  List pagenation
    **/ 
    $scope.totalCount = 0;          
    $scope.pageSize = 15;

    $scope.pagination = {
        current: 1
    };

    $scope.filter = {
        id: $stateParams.id,        
        filter:{           
            include:[{  
                relation:'audios',       
                scope:{fields: ['url', 'length']}      
            }],
            order: 'publishedAt DESC',
            limit: '15',
            skip: null,
        }
    };

    $scope.filter_count = {id: $stateParams.id};


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
        .contents
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
        .contents($scope.filter)
        .$promise
        .then(
        function (res) {   
            console.log(res);
            $scope.contents = $scope.contents.concat(res);
        },
        function (err) {                
            console.log('err', err);
            alert(err.data.error.message);
        });        
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
            id: $stateParams.id,
            where: {                            
                title:{regexp: "/"+$scope.keyword+"/i"}
            }
        };     
        
        $scope.filter = {
            id: $stateParams.id,
            filter:{      
                include:[{  
                    relation:'audios',       
                    scope:{fields: ['url', 'length']}      
                }],     
                order: 'publishedAt DESC',
                limit: '15',
                skip: null,
                where: {                            
                    title:{regexp: "/"+$scope.keyword+"/i"}
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


    $scope.display = function(index, channelId, display){

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
