'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:CategoryCtrl
 * @description
 * # CategoryCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('CategoryListCtrl', ['$scope', '$location', 'Category', 'LoopBackAuth', 'ModalService',
			function ($scope, $location, Category, LoopBackAuth, ModalService) {	

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
     *  Category List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];    
        $scope.loadMore(0);
        $scope.getTotalCount();
    };

    $scope.getTotalCount = function(){     

        Category
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

        Category
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
     *  List attr update
    **/
    $scope.display = function(index, id, display){        
        
        Category
        .upsert({
            id: id,
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
    }; 



    /**
     *  Category delete
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
    
    /**
     *  Category delete
    **/ 
    $scope.delete = function(index, id){      
        
        Category
        .categoryChild
        .destroyAll({
            id: id,
        })
        .$promise
        .then(
        function (res) {               
            $scope.deleteById(index, id);
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });        
    };   

    $scope.deleteById = function(index, id){      
        
        Category
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
	
}]);