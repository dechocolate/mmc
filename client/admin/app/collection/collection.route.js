'use strict';

angular.module('adminApp')
.config(['$stateProvider', function($stateProvider) {    

	$stateProvider
    .state('collection/list', {
        url: '/collection/list',
        templateUrl: 'app/collection/collection.list.html',
        controller: 'CollectionListCtrl'
    })
    .state('collection/create', {
        url: '/collection/create',
        templateUrl: 'app/collection/collection.create.html',
        controller: 'CollectionCreateCtrl'
    })
    .state('collection/view/:id', {
        url: '/collection/view/:id',
        templateUrl: 'app/collection/collection.view.html',
        controller: 'CollectionViewCtrl'
    })    
    ;

}]);