
// module.exports = function(app) {
	
// 	var User = app.models.user;
// 	var Role = app.models.role;
// 	var RoleMapping = app.models.roleMapping;	

// 	User.create([
// 		{username: 'music', email: 'music@music.com', password: 'music', available: true}
// 	], function(err, users) {
// 		if (err) throw err;

// 		console.log('Created users:', users);

// 		//create the admin role
// 		Role.create({
// 			name: 'admin',
// 			description: 'CMS admin 권한'
// 		}, function(err, role) {
// 			if (err) throw err;

// 			console.log('Created role:', role);			

// 			//make bob an admin
// 			role.principals.create({
// 				// principalType: RoleMapping.ADMIN,
// 				principalType: RoleMapping.USER,
// 				principalId: users[0].id				
// 			}, function(err, principal) {
// 				if (err) throw err;

// 				console.log('Created principal:', principal);
// 			});
// 		});

// 		Role.create({
// 			name: 'super',
// 			description: 'CMS 모든 권한'
// 		}, function(err, role) {
// 			if (err) throw err;

// 			console.log('Created role:', role);

// 			//make bob an admin
// 			role.principals.create({
// 				// principalType: RoleMapping.ADMIN,
// 				principalType: RoleMapping.USER,
// 				principalId: users[0].id				
// 			}, function(err, principal) {
// 				if (err) throw err;

// 				console.log('Created principal:', principal);
// 			});
// 		});


// 	});
// };