'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:BannerListCtrl
 * @description
 * # BannerListCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('BannerListCtrl', ['$scope', '$location', 'LoopBackAuth', 'ModalService', 'Banner',
			function ($scope, $location, LoopBackAuth, ModalService, Banner) {	
               
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
            order: 'created DESC',
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
     *  Banner List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];    
        $scope.loadMore(0);
        $scope.getTotalCount();
    };

    $scope.getTotalCount = function(){     

        Banner
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

        Banner
        .find($scope.filter)
        .$promise
        .then(
        function (res) {                 
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
            where: {                            
                name:{regexp: "/"+$scope.keyword+"/i"}
            }
        };     
        
        $scope.filter = {
            filter:{           
                order: 'created DESC',
                limit: '15',
                skip: null,
                where: {                            
                    name:{regexp: "/"+$scope.keyword+"/i"}
                }
            }
        };

        $scope.reset()
    };


    /**
     *  List delete
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

        Banner
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
     *  List attr update
    **/
    $scope.display = function(index, id, boolean){        
        Banner
        .patchAttributes({
            id: id,
            display: boolean
        })
        .$promise
        .then(
        function (res) {      
            $scope.contents[index].display = boolean;                   
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });
    }; 

}]);
