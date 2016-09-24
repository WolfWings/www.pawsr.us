const serviceTitle = 'GitHub';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

module.exports = (endpoints, shared_data) => {
	console.log('Registering /initlogin/' + service);
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
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /initlogin/' + service);
			routine(data, res);
		}
	});
}
