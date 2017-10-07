'use strict';

angular.module('adminApp')
.config(['$stateProvider', function($stateProvider) {    

	$stateProvider
    .state('login', {
        url: '/login',
        templateUrl: 'app/login/login.html',
        controller: 'LoginCtrl'
    });

}]);