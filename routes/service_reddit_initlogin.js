const querystring = require('querystring');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.reddit;
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /initlogin/reddit');
	endpoints.push({
		uri: '/initlogin/reddit'
	,	routine: (data, res) => {



var uuid = oauth.nonce();
data.session['reddit_uuid'] = uuid;
res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', 'https:\x2F/www.reddit.com/api/v1/authorize.compact?' + querystring.stringify({
	client_id: secrets.clientID
,	redirect_uri: 'https:\x2F/www.pawsr.us/login/reddit'
,	response_type: 'code'
,	scope: 'identity'
,	state: uuid
}) + '#');
res.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /initlogin/reddit');
			routine(data, res);
		}
	});
}
