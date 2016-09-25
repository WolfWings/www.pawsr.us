const serviceTitle = 'GitHub';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

module.exports = (endpoints, shared_data) => {
	console.log('Adding ' + serviceTitle + ' service');

	shared_data.services.push({
		name:		serviceTitle
	,	login_url:	'/initlogin/' + service
	,	logout_url:	'https:\x2F/www.github.com/logout'
	});

	endpoints.push({
		uri: '/initlogin/' + service
	,	routine: (data, res) => {
			oauth.oauth2_initlogin(
				data
			,	res
			,	service
			,	secrets.clientID
			,	'https:\x2F/github.com/login/oauth/authorize'
			,	''
			);
		}
	});

	endpoints.push({
		uri: '/login/' + service
	,	routine: (data, res) => {
			oauth.oauth2_login(
				data
			,	res
			,	serviceTitle
			,	secrets
			,	'https:\x2F/github.com/login/oauth/access_token'
			,	null
			,	'https:\x2F/api.github.com/user'
			,	'id'
			,	'login'
			);
		}
	});
}
