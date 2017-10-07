'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:RoleCtrl
 * @description
 * # RoleCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('AuthListCtrl', ['$scope', '$location', 'Role', 'LoopBackAuth', 'ModalService',
			function ($scope, $location, Role, LoopBackAuth, ModalService) {	

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
     *  Auth List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];    
        $scope.loadMore(0);
        $scope.getTotalCount();
    };

    $scope.getTotalCount = function(){     

        Role
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

        $scope.filter.skip = newPage * $scope.pageSize;

        Role
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
     *  Auth delete
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
        
        Role
        .principals
        .destroyAll({
            id: id
        })
        .$promise
        .then(
        function (res) {               
            $scope.deleteAuth(index, id);
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });
    };     

    /**
     *  AuthMapping delete
    **/             
    $scope.deleteAuth = function(index, id){      

        Role
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