const serviceTitle = 'Reddit';
const service = serviceTitle.toLowerCase();

const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services[service];
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
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
			console.log('Testing /login/' + service + ' w/ empty data');
			data = JSON.parse(raw_data);
			data.query = {};
			data.session = {};
			routine(data, res);

			console.log('Testing /login/' + service + ' with mismatched Nonce/State');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			};
			data.session = {};
			data.session[service + '_uuid'] = '1';
			routine(data, res);

			console.log('Testing /login/' + service + ' with matching initial data');
			data = JSON.parse(raw_data);
			data.query = {
				state: '2'
			,	code: '2'
			};
			data.session = {};
			data.session[service + '_uuid'] = '2';
			routine(data, res);
		}
	});
}
