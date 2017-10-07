"use strict";

angular.module('app', [ 
                        // 'contentControllers', 
                        // 'collectionControllers',
                        // 'mypageControllers',
                        // 'testControllers',
                        
                        'loopBackAuthFactories',
                        // 'userFactories',
                        // 'contentFactories',  
                        // 'collectionFactories',  
                        // 'youtubeFactories',  

                        'ui.router',
                        'ui.bootstrap',
                        'ngCookies',
                        'satellizer',
                        'angularModalService'
                    ])

.value('Config', {
    youtubeKey : 'AIzaSyCqR1vxxGI7Qz9W-N3IJDF0E1-9DoPuhjw'     
})

// .run(function (User) {

    // console.log(User.getCachedCurrent());
    //Check if User is authenticated
    // if (User.getCachedCurrent() == null) {
    //     User.getCurrent();
    // }
// })

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $locationProvider) {
    
    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: 'views/content.html',
            controller: 'ContentCtrl'
        })

        .state('collect', {
            url: '/collect',
            templateUrl: 'views/collection.html',
            controller: 'CollectionCtrl'
        })

        .state('mypage', {
            url: '/mypage',
            templateUrl: 'views/mypage.html',
            controller: 'MypageCtrl'
        })

        .state('test', {
            url: '/test',
            templateUrl: 'views/test.html',
            controller: 'TestCtrl'
        })
        ;

    $urlRouterProvider.otherwise('home');

    $locationProvider.html5Mode(true);
}])

.config(['satellizer.config', '$authProvider', function (config, $authProvider) {

    config.authHeader = 'Satellizer';
    config.httpInterceptor = false;

    $authProvider.facebook({
        clientId: '652372928198212'
    });

    $authProvider.google({
        clientId: '968064961666-g85aklkfvmi4du3i7f7qr51oq01umgov.apps.googleusercontent.com' //product
        // clientId: '968064961666-g7anqugef7brfkie8p33t884mgj8ve0d.apps.googleusercontent.com' //test    
    });

}])

.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}]);