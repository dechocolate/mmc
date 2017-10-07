'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:CategoryListCtrl
 * @description
 * # CategoryListCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('CategoryEditCtrl', ['$scope', '$stateParams', '$location', 'Category', 'CategoryChild',
    function ($scope, $stateParams, $location, Category, CategoryChild) {

    /**
     *  view model 
    **/ 
    $scope.model = [];

    Category
    .findById({     
        id: $stateParams.id     
    })
    .$promise
    .then(
    function (res) {      
        $scope.model = res;
    },
    function (err) {                            
        console.log('err', err);
        alert(err.data.error.message);
    });     

    /**
     *  togle shitch
    **/
    $scope.changeSwitch = function(name) {             
        $scope.model[name] = !$scope.model[name];
    };

    /**
     *  save changed  
    **/
    $scope.save = function () {
    
        Category
        .upsert($scope.model)
        .$promise
        .then(
        function (res) {               
            $location.nextAfterLogin = $location.path();
            $location.path('/category/list');           
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });

    };


        
}]);
