'use strict';

var Promise = require('bluebird');

module.exports = function(User) {

	// Remove existing validations for email
	delete User.validations.username;
	
	// Get user roles object
	User.roles = function (id, cb) {
	    	    
	    var RoleMapping = User.app.models.RoleMapping;
	    var Role = User.app.models.Role;
	      
	    RoleMapping.find({ where : { principalId: id }}, function (err, roleMappings) {	     

	        var roleIds = roleMappings.map(function (roleMapping) {
	            return roleMapping.roleId;
	        });	     

	        if(roleIds.length === 0) cb(null, null);
	        else
	        {	        	
		        var conditions = roleIds.map(function (roleId) {
		          	return { id: roleId };
		        });

		        if(conditions.length === 0) cb(null, null);
		      	else
		      	{		      		
			        Role.find({ where: { or: conditions}}, function (err, roles) {
			          	if (err) throw err;
			          	var roleNames = roles.map(function(role) {
			            	return {id: role.id, name: role.name};
			          	});

			          	cb(null, roleNames);
			        });
		      	}
	        }

	      
	    });

	};

	User.remoteMethod('roles', {
		http: { path: '/:id/roles', verb: 'get' },
		accepts: {arg: 'id', type: 'string', required: true},
		returns: { arg: 'roles', type: 'Object' }
	});


	// Get user role names array
	User.roleNames = function (id, cb) {
	    	    
	    var RoleMapping = User.app.models.RoleMapping;
	    var Role = User.app.models.Role;
	      
	    RoleMapping.find({ where : { principalId: id }}, function (err, roleMappings) {	     

	        var roleIds = roleMappings.map(function (roleMapping) {
	            return roleMapping.roleId;
	        });	     

	        if(roleIds.length === 0) cb(null, null);
	        else
	        {	        	
		        var conditions = roleIds.map(function (roleId) {
		          	return { id: roleId };
		        });

		        if(conditions.length === 0) cb(null, null);
		      	else
		      	{		      		
			        Role.find({ where: { or: conditions}}, function (err, roles) {
			          	if (err) throw err;
			          	var roleNames = roles.map(function(role) {
			            	return role.name;
			          	});

			          	cb(null, roleNames);
			        });
		      	}
	        }

	      
	    });

	};

	User.remoteMethod('roleNames', {
		http: { path: '/:id/roleNames', verb: 'get' },
		accepts: {arg: 'id', type: 'string', required: true},
		returns: { arg: 'roles', type: 'Object' }
	});

};
