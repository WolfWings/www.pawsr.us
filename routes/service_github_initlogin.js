const querystring = require('querystring');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.github;
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /initlogin/github');
	endpoints.push({
		uri: '/initlogin/github'
	,	routine: (data, res) => {



var uuid = oauth.nonce();
data.session['github_uuid'] = uuid;
res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', 'https:\x2F/github.com/login/oauth/authorize?' + querystring.stringify({
	client_id: secrets.clientID
,	redirect_uri: 'https:\x2F/www.pawsr.us/login/github'
,	response_type: 'code'
,	scope: ''
,	state: uuid
}) + '#');
res.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /initlogin/github');
			routine(data, res);
		}
	});
}
