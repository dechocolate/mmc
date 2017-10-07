var config = require('./../config');
var request = require('request');
var moment = require('moment');
var jwt = require('jwt-simple');
var util = require('./util');

var app = require('../../server/server');
var User = app.models.user; 


module.exports = function(app) {


	/*
	 |--------------------------------------------------------------------------
	 | Login Required Middleware
	 |--------------------------------------------------------------------------
	 */
	function ensureAuthenticated(req, res, next) {
	  
	  	if (!req.header('Authorization')) {
	    	return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
	  	}
	  	
	  	var token = req.header('Authorization').split(' ')[1];
		var payload = null;
	  	
	  	try {
	    	payload = jwt.decode(token, config.TOKEN_SECRET);
	  	}
	  	catch (err) {
	    	return res.status(401).send({ message: err.message });
	  	}

	  	if (payload.exp <= moment().unix()) {
	    	return res.status(401).send({ message: 'Token has expired' });
	  	}
		
		req.user = payload.sub;
		next();
	}	

	/*
	 |--------------------------------------------------------------------------
	 | Generate JSON Web Token
	 |--------------------------------------------------------------------------
	 */
	function createJWT(user) {
	  	var payload = {
	    	sub: user._id,
	    	iat: moment().unix(),
	    	exp: moment().add(14, 'days').unix()
	  	};
	  	
	  	return jwt.encode(payload, config.TOKEN_SECRET);
	}


	/*
	 |--------------------------------------------------------------------------
	 | Login
	 |--------------------------------------------------------------------------
	 */
	function login(res, req, email, password, youtubeAccessToken){

		User.login({
			include: 'user',
			email: email,
			password: password
		}, 'user', function(err, token) {
			
			if (err) {
				util.logger('error').info("login", JSON.stringify(err)); 
				return res.send({loginFailed: true});	
			}

			accessToken = token.toJSON();

			if (accessToken != null) {
				if (accessToken.id != null) {
					res.cookie('accessToken', accessToken.id, {
						signed: req.signedCookies ? true : false,
						maxAge: 1000 * accessToken.ttl
					});
					res.cookie('username', accessToken.user.username, {
						signed: req.signedCookies ? true : false,
						maxAge: 1000 * accessToken.ttl
					});
					res.cookie('email', accessToken.user.email, {
						signed: req.signedCookies ? true : false,
						maxAge: 1000 * accessToken.ttl
					});
					res.cookie('userId', accessToken.user.id, {
						signed: req.signedCookies ? true : false,
						maxAge: 1000 * accessToken.ttl
					});
				}
			}

			res.send({
				id: accessToken.user.id,
				username: accessToken.user.username,
				email: accessToken.user.email,
				token: accessToken.id,
				youtubeAccessToken: youtubeAccessToken				
			});

		});
	}

	/*
	 |--------------------------------------------------------------------------
	 | GET /api/me
	 |--------------------------------------------------------------------------
	 */
	app.get('/api/me', ensureAuthenticated, function(req, res) {
	  	User.findById(req.user, function(err, user) {
	    	res.send(user);
	  	});
	});

	/*
	 |--------------------------------------------------------------------------
	 | PUT /api/me
	 |--------------------------------------------------------------------------
	 */
	app.put('/api/me', ensureAuthenticated, function(req, res) {
	  	User.findById(req.user, function(err, user) {
	    	
	    	if (!user) {
	      		return res.status(400).send({ message: 'User not found' });
	    	}	
	    	
	    	user.displayName = req.body.displayName || user.displayName;
	    	user.email = req.body.email || user.email;
	    	
	    	user.save(function(err) {
	      		res.status(200).end();
	    	});
	  	});
	});


	/*
	 |--------------------------------------------------------------------------
	 | Log in with Email
	 |--------------------------------------------------------------------------
	 */
	app.post('/auth/login', function(req, res) {
	  
	  	User.findOne({ email: req.body.email }, '+password', function(err, user) {
	    	
	  		if(err) console.log('login err', err);

	    	if (!user) {
	      		return res.status(401).send({ message: 'Invalid email and/or password' });
	    	}
	    
	    	user.comparePassword(req.body.password, function(err, isMatch) {

	    		if(err) console.log('comparePassword', err);
	      		
	      		if (!isMatch) {
	        		return res.status(401).send({ message: 'Invalid email and/or password' });
	      		}

	      		accessToken = token.toJSON();

				if (accessToken != null) {
					if (accessToken.id != null) {
						res.cookie('accessToken', accessToken.id, {
							signed: req.signedCookies ? true : false,
							maxAge: 1000 * accessToken.ttl
						});
						res.cookie('username', accessToken.user.username, {
							signed: req.signedCookies ? true : false,
							maxAge: 1000 * accessToken.ttl
						});
						res.cookie('email', accessToken.user.email, {
							signed: req.signedCookies ? true : false,
							maxAge: 1000 * accessToken.ttl
						});
						res.cookie('userId', accessToken.user.id, {
							signed: req.signedCookies ? true : false,
							maxAge: 1000 * accessToken.ttl
						});
					}
				}

	      		res.send({ token: accessToken });
	    	});
	  	});
	});


	/*
	 |--------------------------------------------------------------------------
	 | auth callback
	 |--------------------------------------------------------------------------
	 */
	app.get('/auth/callback', function(req, res) {	  
	  	res.send();
	});


	/*
	 |--------------------------------------------------------------------------
	 | Login with Google
	 |--------------------------------------------------------------------------
	 */
	app.post('/auth/google', function(req, res) {
	  	
	  	var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
	  	var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

	  	var params = {
	    	code: req.body.code,
	    	client_id: req.body.clientId,
	    	client_secret: config.GOOGLE_SECRET,
	    	redirect_uri: req.body.redirectUri,
	    	grant_type: 'authorization_code'
	  	};	  	

	  	// Step 1. Exchange authorization code for access token.
	  	request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
	    	
	    	var accessToken = token.access_token;
	    	var headers = { Authorization: 'Bearer ' + accessToken };

	    	// Step 2. Retrieve profile information about the current user.
	    	request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {


				// console.log('profile', profile);
				// console.log('profile', response);

	      		if (profile.error) {
	        		return res.status(500).send({message: profile.error.message});
	      		}
	      		
	      		// Step 3a. Link user accounts.
	      		if (req.header('Authorization')) {

	        		User.findOne({ google: profile.sub }, function(err, existingUser) {
	          			if (existingUser) {
	            			return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
	          			}
	          			
	          			var token = req.header('Authorization').split(' ')[1];
	          			var payload = jwt.decode(token, config.TOKEN_SECRET);
	          			
	          			User.findById(payload.sub, function(err, user) {
	            		
		            		if (!user) {
		              			return res.status(400).send({ message: 'User not found' });
		            		}
	            			
	            			user.google = profile.sub;
				            user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
				            user.displayName = user.displayName || profile.name;
				            
				            user.save(function() {
	              				var token = createJWT(user);
	              				res.send({ user: profile, token: token, youtubeAccessToken: accessToken });
	            			});
	          			});
	        		});

	      		} else {
	        		// Step 3b. Create a new user account or return an existing one.
	        		User.findOne({ google: profile.sub }, function(err, existingUser) {
	          			
	        			console.log('existingUser', existingUser);

	          			if (existingUser) {
	            			// return res.send({ user: profile, token: createJWT(existingUser), youtubeAccessToken: accessToken });
	            			return login(res, req, profile.email, profile.sub, accessToken)		
	          			}

			          	User.create({
			          		passport: 'google',
			          		email: profile.email,
			                password: profile.sub,
			          		name: profile.name,			                
			          		given_name: profile.given_name,
			          		family_name: profile.family_name,
			          		gender: profile.gender,
			          		picture: profile.picture.replace('sz=50', 'sz=200'),
			          		locale: profile.locale,
			          		created: new Date().toJSON()
			            },function (err, obj) {
			                if (err !== null) {
			                	console.log('err', err);
			                    util.logger('error').error("User.create ::", JSON.stringify(err, null, 2));                    
			                }
			                else {            
			                	console.log('obj', obj);

			                	// var token = createJWT(obj);            
			                 	// res.send({ user: profile, token: token, youtubeAccessToken: accessToken });

			                 	return login(res, req, profile.email, profile.sub, accessToken)			               
			                }
			            });              


	        		});

	      		}
	    	});
	  	});
	});

}