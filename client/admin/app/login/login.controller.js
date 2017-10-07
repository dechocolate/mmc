'use strict';

/**
 * @ngdoc function
 * @name adminApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the adminApp
 */
angular.module('adminApp')
.controller('LoginCtrl', ['$rootScope', '$scope', '$location', 'User', 'LoopBackAuth', 'localStorageService',
			function (rootScope, $scope, $location, User, LoopBackAuth, localStorageService) {	
	/**
	 *  setting credentials 
	**/
	var token_period = 1000 * 60 * 60 * 24; //1 day

	$scope.credentials = {
        // email: 'music@music.com',
        // password: 'music',
        email: '',
        password: '',
		ttl: token_period,
		rememberMe: true
	};

	/**
	 *  login 
	**/
	$scope.login = function() {

		$scope.loginResult = User.login({
			include: 'user',
			rememberMe: $scope.credentials.rememberMe
		}, $scope.credentials,
		function (user) {

			// console.log(user.id); // => acess token
			// console.log(user.ttl); // => 1209600 time to live
			// console.log(user.created); // => 2013-12-20T21:10:20.377Z
			// console.log(user.userId); // => 1

			//유저에 권한 체크한다. 
			$scope.getRoleNamesById(LoopBackAuth.currentUserId);	
		},
		function (res) {
			console.log(res)
			$scope.loginError = 'The email or password you entered is incorrect.';
		});
	};

	/**
     *  Get user roles
    **/             
    $scope.getRoleNamesById = function(id){              
        User
        .roleNames({
            id:id
        })
        .$promise
        .then(
        function (res) {   


        	//Role 권한 체크. Role 권한이 없을 시 로그인을 거부한다. 
        	if(null === res.roles || res.roles.length === 0)
        	{
        		User.logout({access_token: LoopBackAuth.accessTokenId});
        		$scope.loginError = 'Permission denied. Please request administrator.';
        	} 
        	else
        	{
        		var url = null
        		var role = res.roles[0];

        		console.log('role', role)

        		//Role이 'admin' or 'super'가 아니면 권한을 가지고 있는 Role 섹션으로 간다. 
        		if(role !== 'admin' && role !== 'super') url = '/'+role+'/list';
        		else url = '/collection/list';

        		console.log(url)

        		localStorageService.set('roles', res.roles);
        		$location.nextAfterLogin = $location.path();
            	$location.path(url);			  

        	}	
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });            
    };  

}]);