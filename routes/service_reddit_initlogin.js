const serviceTitle = 'Reddit';
const service = serviceTitle.toLowerCase();

const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /initlogin/' + service);
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
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /initlogin/' + service);
			routine(data, res);
		}
	});
}
