const serviceTitle = 'Twitter';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

// istanbul ignore next: Nothing to 'test' here, it's all in utils/oauth.js
module.exports = (endpoints, shared_data) => {
	console.log('Registering /initlogin/' + service);
	endpoints.push({
		uri: '/initlogin/' + service
	,	routine: (data, res) => {



oauth.oauth1_initlogin(
	data
,	res
,	serviceTitle
,	secrets
,	'https:\x2F/api.twitter.com/oauth/request_token'
);



		}
	});
}
