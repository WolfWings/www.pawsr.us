const serviceTitle = 'GitHub';
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
,	'https:\x2F/github.com/login/oauth/access_token'
,	null
,	'https:\x2F/api.github.com/user'
,	'id'
,	'login'
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
