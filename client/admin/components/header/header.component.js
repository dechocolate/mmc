angular.module('adminApp')
.directive('header', function () {
	return {
		restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
		// replace: true,
		scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
		templateUrl: "components/header/header.html",
		controller: ['$scope', '$rootScope', '$location', '$filter', 'LoopBackAuth', 'localStorageService', 'User',
		function ($scope, $rootScope, $location, $filter, LoopBackAuth, localStorageService, User) {				


			/**
			 *   LoopBackAuth Setting
			**/
			$scope.LoopBackAuth = LoopBackAuth;		
			$scope.userRoles = localStorageService.get('roles');
			
			/**
		     *  Get user roles
		    **/             
		    // $scope.getRoleNamesById = function(id){              
		    //     User
		    //     .roleNames({
		    //         id:id
		    //     })
		    //     .$promise
		    //     .then(
		    //     function (res) {   
		    //     	console.log(res);
		    //     },
		    //     function (err) {                            
		    //         console.log('err', err);
		    //         alert(err.data.error.message);
		    //     });            
		    // };  

		    // $scope.getRoleNamesById(LoopBackAuth.currentUserId);


			/**
			 *   logout
			**/
		    $scope.logout = function () {
		    	
		    	User
		        .logout({access_token: LoopBackAuth.accessTokenId})
		        .$promise
		        .then(
		        function (res, header) { 									        
		        	// LoopBackAuth.clearUser();
	        		// LoopBackAuth.clearStorage();

					var next = $location.nextAfterLogin || '/login';
					$location.nextAfterLogin = null;
					$location.path(next);
		        },
		        function (err) { 
		            console.log("login err", JSON.stringify(err));              
		        });		        				        
		    };


		    /**
			 *   check class active
			**/
			$scope.isActive = function (path) {				
			  	return ($location.path().includes(path)) ? 'active' : '';
			}


		}]
	}
});
