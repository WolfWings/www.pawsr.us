const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.amazon;
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /initlogin/amazon');
	endpoints.push({
		uri: '/initlogin/amazon'
	,	routine: (data, res) => {



var uuid = oauth.nonce();
data.session['amazon_uuid'] = uuid;
res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', 'https:\x2F/www.amazon.com/ap/oa?' + querystring.stringify({
	client_id: secrets.clientID
,	redirect_uri: 'https:\x2F/www.pawsr.us/login/amazon'
,	response_type: 'code'
,	scope: 'profile'
,	state: uuid
}) + '#');
res.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /initlogin/amazon');
			routine(data, res);
		}
	});
}
