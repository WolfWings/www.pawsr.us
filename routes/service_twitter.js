exports.register = (endpoints, shared_data) => {
	const secrets = require('../secrets.js').services.twitter;

	console.log('Adding Twitter service');
	shared_data.services.push({
		name:		'twitter'
	,	login_url:	'/prelogin/twitter'
	});

	console.log('Registering /prelogin/twitter');
	endpoints.push({
		uri: '/prelogin/twitter'
	,	routine: (data, res) => {



res.write(data.boilerplate.pretitle);
res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Process callback from Twitter for login...</p>');
res.write(data.boilerplate.postbody);



		}
	});

	console.log('Registering /login/twitter');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (data, res) => {



res.write(data.boilerplate.pretitle);
res.write('<title>Twitter Login Callback - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Process callback from Twitter for login...</p>');
res.write(data.boilerplate.postbody);



		}
	});
}
