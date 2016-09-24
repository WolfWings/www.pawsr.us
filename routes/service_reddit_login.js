const serviceTitle = 'Reddit';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

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
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			console.log('Testing /login/' + service);
			data = JSON.parse(raw_data);
			data.query = {};
			data.session = {};
			routine(data, res);
		}
	});
}
