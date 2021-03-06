const serviceTitle = 'Twitter';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth1.js');

// istanbul ignore next: Pure wrapper, no functional code here
module.exports = (endpoints, shared_data) => {
	console.log('Adding ' + serviceTitle + ' service');

	shared_data.services.push({
		name:		serviceTitle
	,	login_url:	'/initlogin/' + service
	,	logout_url:	'https:\x2F/twitter.com/logout'
	});

	endpoints.push({
		uri: '/initlogin/' + service
	,	routine: (data, res) => {
			return oauth.oauth1_initlogin(
				data
			,	res
			,	serviceTitle
			,	secrets
			,	'https:\x2F/api.twitter.com/oauth/request_token'
			);
		}
	});

	endpoints.push({
		uri: '/preauth/' + service
	,	routine: (data, res) => {
			return oauth.oauth1_preauth(
				data
			,	res
			,	serviceTitle
			,	'https:\x2F/api.twitter.com/oauth/authenticate'
			,	false
			);
		}
	});

	endpoints.push({
		uri: '/ajax/preauth/' + service
	,	routine: (data, res) => {
			return oauth.oauth1_preauth(
				data
			,	res
			,	serviceTitle
			,	'https:\x2F/api.twitter.com/oauth/authenticate'
			,	true
			);
		}
	});

	endpoints.push({
		uri: '/login/' + service
	,	routine: (data, res) => {
			return oauth.oauth1_login(
				data
			,	res
			,	serviceTitle
			,	secrets
			,	'https:\x2F/api.twitter.com/oauth/access_token'
			,	'user_id'
			,	'screen_name'
			);
		}
	});
}
