const serviceTitle = 'Reddit';
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
,	'https:\x2F/ssl.reddit.com/api/v1/access_token'
,	secrets
,	'https:\x2F/oauth.reddit.com/api/v1/me?raw_json=1'
,	'id'
,	'name'
);



		}
	});
}
