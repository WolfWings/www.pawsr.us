const serviceTitle = 'Amazon';
const service = serviceTitle.toLowerCase();

const querystring = require('querystring');

const keyvalue = require('../utils/keyvalue.js');
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
,	'https:\x2F/www.amazon.com/ap/oa'
,	'profile'
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
