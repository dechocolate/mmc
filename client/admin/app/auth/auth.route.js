'use strict';

angular.module('adminApp')
.config(['$stateProvider', function($stateProvider) {     

	$stateProvider
    .state('auth/list', {
        url: '/auth/list',
        templateUrl: 'app/auth/auth.list.html',
        controller: 'AuthListCtrl'
    })
    .state('auth/create', {
        url: '/auth/create',
        templateUrl: 'app/auth/auth.create.html',
        controller: 'AuthCreateCtrl'
    });

}]);