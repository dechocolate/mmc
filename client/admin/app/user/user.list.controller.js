'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('UserListCtrl', ['$scope', '$location', 'User', 'LoopBackAuth', 'ModalService',
			function ($scope, $location, User, LoopBackAuth, ModalService) {	

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
     *  User List 
    **/
    $scope.reset = function(){        
        $scope.contents = [];    
        $scope.loadMore(0);
        $scope.getTotalCount();
    };

    $scope.getTotalCount = function(){     

        User
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

        User
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
                username:{regexp: "/"+$scope.keyword+"/i"}
            }
        };     
        
        $scope.filter = {
            filter:{           
                order: 'created DESC',
                limit: '15',
                skip: null,
                where: {                            
                    username:{regexp: "/"+$scope.keyword+"/i"}
                }
            }
        };

        $scope.reset()
    };


    /**
     *  User delete
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
        User
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
     *  User auth
    **/             
    $scope.viewAuth = function(username, id){      
        
        ModalService.showModal({
            templateUrl: "app/user/user.list.auth.modal.html",
            controller: "UserListAuthModalCtrl",        
            inputs: {
                username: username,
                userId: id            
            }    
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                // if(null != result) createCollection(result);
            });
        });
    };    

	
}]);