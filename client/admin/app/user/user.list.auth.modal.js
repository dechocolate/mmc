angular.module('adminApp')
    .controller('UserListAuthModalCtrl', ['$scope', 'User', 'Role', 'RoleMapping', 'UtilServices', 'close', 'userId', 'username',
            function($scope, User, Role, RoleMapping, UtilServices, close, userId, username) {
  
    /**
     *  Get user roles
    **/             
    $scope.getRolesById = function(){              
        User
        .roles({
            id:userId
        })
        .$promise
        .then(
        function (res) {   
            $scope.roles = res.roles;         
            $scope.username = username;
        },
        function (err) {                            
            console.log('err', err);
            alert(err.data.error.message);
        });            
    };         


    /**
     *  Get user roles
    **/             
    $scope.getRoles = function(){     

        $scope.contents = [];         
        
        Role
        .find({
            filter: {           
                fields: {
                    id: true,
                    name: true
                }
            }
        })
        .$promise
        .then(
        function (res) {    
            if(null !== $scope.roles) res = UtilServices.removeValueByKey(res, $scope.roles, 'name');
            $scope.contents = $scope.contents.concat(res); 
        },
        function (err) {              
            console.log('err', err);
            alert(err.data.error.message);                        
        });               
    };  


    /**
     *  Add role
    **/             
    $scope.addRole = function(roleId, roleName){     

        RoleMapping
        .create({                 
            // id: roleId,
            principalType: "USER",
            principalId: userId,
            roleId: roleId
        })
        .$promise
        .then(
        function (res) {    
            if(null == $scope.roles) $scope.roles = [];
            $scope.roles.push({id: roleId, name: roleName});             
        },
        function (err) {              
            console.log('err', err);
            alert(err.data.error.message);                        
        });    
    };  


    /**
     *  find roleMapping
    **/             
    $scope.findRoleMapping = function(roleId){     


        RoleMapping
        .find({            
            filter:{  
                fields: {
                    id: true                
                },     
                where: {           
                    and: [{ principalId: userId }, { roleId: roleId }]
                }
            }
        })
        .$promise
        .then(
        function (res) {    
            if(res.length === 1 && null !== res[0].id) $scope.deleteRoleMapping(res[0].id);
        },
        function (err) {              
            console.log('err', err);
            alert(err.data.error.message);                        
        });                    

    };  


    /**
     *  delete roleMapping
    **/             
    $scope.deleteRoleMapping = function(roleMappingId){
        
        console.log(roleMappingId);

        RoleMapping
        .destroyById({                 
            id: roleMappingId
        })
        .$promise
        .then(
        function (res) {    
            console.log(res);            
        },
        function (err) {              
            console.log('err', err);
            alert(err.data.error.message);                        
        });
    };


    /**
     *  init
    **/         
    $scope.getRolesById();  
    // $scope.getRoles();    


}]);