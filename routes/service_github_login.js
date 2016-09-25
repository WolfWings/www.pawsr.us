const serviceTitle = 'GitHub';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

// istanbul ignore next: Nothing to 'test' here, it's all in utils/oauth.js
module.exports = (endpoints, shared_data) => {
	console.log('Registering /login/' + service);
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
