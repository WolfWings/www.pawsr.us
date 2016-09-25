const serviceTitle = 'Reddit';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

module.exports = (endpoints, shared_data) => {
	console.log('Adding ' + serviceTitle + ' service');

	shared_data.services.push({
		name:		serviceTitle
	,	login_url:	'/initlogin/' + service
	,	logout_url:	'https:\x2F/www.reddit.com/logout'
	});

	endpoints.push({
		uri: '/initlogin/' + service
	,	routine: (data, res) => {
			oauth.oauth2_initlogin(
				data
			,	res
			,	service
			,	secrets.clientID
			,	'https:\x2F/www.reddit.com/api/v1/authorize.compact'
			,	'identity'
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
			,	'https:\x2F/ssl.reddit.com/api/v1/access_token'
			,	secrets
			,	'https:\x2F/oauth.reddit.com/api/v1/me?raw_json=1'
			,	'id'
			,	'name'
			);
		}
	});
}
