angular.module('app')
.directive('header', function () {
		return {
				restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
				// replace: true,
				scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
				templateUrl: "views/directives/header/header.html",
				controller: ['$scope', '$rootScope', '$location', '$filter', 'Collection', 'ModalService', 'LoopBackAuth', 'User',
				function ($scope, $rootScope, $location, $filter, Collection, ModalService, LoopBackAuth, User) {
					
					$scope.LoopBackAuth = LoopBackAuth;

					$scope.login = function () {

				         ModalService.showModal({
				            templateUrl: "views/modal/login/login.html",
				            controller: "LoginModalControllers"
				        }).then(function(modal) {
				            modal.element.modal();
				            modal.close.then(function(result) {
				            					               
				            });
				        });				        
				    };			

				    $scope.logout = function () {
				    	
				    	User
				        .logout({access_token: LoopBackAuth.accessTokenId})
				        .$promise
				        .then(
				        function (res, header) { 
							// console.log('res', res);				        
							$location.url('/home');
				        },
				        function (err) { 
				            console.log("login err", JSON.stringify(err));              
				        });
				        				        
				    };

				}]
		}
});
