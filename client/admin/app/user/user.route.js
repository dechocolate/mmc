'use strict';

angular.module('adminApp')
.config(['$stateProvider', function($stateProvider) {   

	$stateProvider
    .state('user/list', {
        url: '/user/list',
        templateUrl: 'app/user/user.list.html',
        controller: 'UserListCtrl'
    })
    .state('user/create', {
        url: '/user/create',
        templateUrl: 'app/user/user.create.html',
        controller: 'UserCreateCtrl'
    });

}]);