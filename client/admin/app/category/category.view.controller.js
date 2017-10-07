'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:CategoryListCtrl
 * @description
 * # CategoryListCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('CategoryViewCtrl', ['$scope', '$stateParams', '$location', 'Category', 'CategoryChild',
	function ($scope, $stateParams, $location, Category, CategoryChild) {

	/**
	 *  get Items	 
	**/		
	$scope.data = [];

	Category
    .categoryChild({    	
    	id: $stateParams.id,
    	filter: {           
            fields: {
            	categoryId: true,
                name: true
            }
        }
    })
    .$promise
    .then(
    function (res) {      
    	$scope.data = $scope.data.concat(res);                     
    },
    function (err) {                            
        console.log('err', err);
        alert(err.data.error.message);
    });		


    /**
	 *  remove Item	 
	**/
	$scope.remove = function () {
		$scope.remove();
	};

	/**
	 *  add Item	 
	**/
	$scope.newItem = function () {
				
		// var nodeData = $scope.data[$scope.data.length - 1];
		
		$scope.data.push({
			categoryId: $stateParams.id,
			name: null
		});
	};


	/**
	 *  save changed items 
	**/
	$scope.save = function () {
	
		Category
        .categoryChild
        .destroyAll({
            id: $stateParams.id,
        })
        .$promise
        .then(
        function (res) {               
            $scope.createMany();
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });

	};

	$scope.createMany = function () {
	
		CategoryChild
		.createMany($scope.data)
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
