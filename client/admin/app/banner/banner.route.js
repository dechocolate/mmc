'use strict';

angular.module('adminApp')
.config(['$stateProvider', function($stateProvider) {    

	$stateProvider
    .state('banner/list', {
        url: '/banner/list',
        templateUrl: 'app/banner/banner.list.html',
        controller: 'BannerListCtrl'
    })
    .state('banner/create', {
        url: '/banner/create',
        templateUrl: 'app/banner/banner.create.html',
        controller: 'BannerCreateCtrl'
    })
    .state('banner/view/:id', {
        url: '/banner/view/:id',
        templateUrl: 'app/banner/banner.view.html',
        controller: 'BannerViewCtrl'
    })
    ;

}]);