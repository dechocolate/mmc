'use strict';

angular.module('adminApp')
.config(['$stateProvider', function($stateProvider) {   

	$stateProvider
    .state('category/list', {
        url: '/category/list',
        templateUrl: 'app/category/category.list.html',
        controller: 'CategoryListCtrl'
    })
    .state('category/create', {
        url: '/category/create',
        templateUrl: 'app/category/category.create.html',
        controller: 'CategoryCreateCtrl'
    })
    .state('category/view/:id', {
        url: '/category/view/:id',
        templateUrl: 'app/category/category.view.html',
        controller: 'CategoryViewCtrl'
    })
    .state('category/edit/:id', {
        url: '/category/edit/:id',
        templateUrl: 'app/category/category.edit.html',
        controller: 'CategoryEditCtrl'
    })
    ;

}]);