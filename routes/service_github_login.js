const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.github;
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /login/github');
	endpoints.push({
		uri: '/login/github'
	,	routine: (data, res) => {



try {
	if (data.query.state !== data.session.github_uuid) {
		throw Error('Nonce/State Mismatch - CSRF attack?');
	}
	if (typeof data.query.code === 'undefined') {
		throw Error('OAuth Code missing!');
	}
} catch (err) {
	console.log('GitHub: ' + err.message);
	console.log(err.stacktrack);

	delete(data.session.github_uuid);

	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>GitHub Login Callback - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error:</b> GitHub did not successfully login.</p>');
	res.write('<p><a href=\x22/\x22>Click here to go back to the homepage, and try again later.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

var uuid = 'login_github_' + data.session.github_uuid;
keyvalue.set(uuid, 'wip');

res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', '/login');
res.end();

var params = querystring.stringify({
	client_id:		secrets.clientID
,	client_secret:		secrets.clientSecret
,	code:			data.query.code
,	grant_type:		'authorization_code'
,	redirect_uri:		'https:\x2F/www.pawsr.us/login/github'
}, '&', '=', {encodeURIComponent: x => x});

var url = {
	method: 'POST'
,	protocol: 'https:'
,	host: 'github.com'
,	port: 443
,	path: '/login/oauth/access_token'
,	agent: false
,	headers: {
		'User-Agent': data.user_agent
	,	'Accept': 'application\x2Fjson'
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'Content-Length': Buffer.byteLength(params)
	}
};

var request = https.request(url, (response) => {
	var buffer = Buffer.alloc(0);
	response.setEncoding('utf8');
	response.on('data', (chunk) => {
		buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
	});
	/* istanbul ignore next: No sane way to store valid GitHub creds, remainder is straight-forward */
	response.on('end', () => {
		if (response.statusCode !== 200) {
			keyvalue.set(uuid, 'error:' + response.statusCode);
			return;
		}

		var results = JSON.parse(buffer.toString('utf8'));
		if (typeof results.access_token === 'undefined') {
			keyvalue.set(uuid, 'error:No access_token returned');
			return;
		}

		url = {
			method: 'GET'
		,	protocol: 'https:'
		,	host: 'api.github.com'
		,	port: 443
		,	path: '/user'
		,	agent: false
		,	headers: {
				'User-Agent': data.user_agent
			,	'Accept': 'application\x2Fjson'
			,	'Authorization': 'Bearer ' + results.access_token
			}
		};

		var request = https.request(url, (response) => {
			var buffer = Buffer.alloc(0);
			response.setEncoding('utf8');
			response.on('data', (chunk) => {
				buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
			});
			response.on('end', () => {
				if (response.statusCode !== 200) {
					keyvalue.set(uuid, 'error:' + response.statusCode);
					return;
				}

				var results = JSON.parse(buffer.toString('utf8'));

				require('../utils/login_complete.js')(data.session.userid, 'GitHub', uuid, results.id, results.login);
			});
		});
		request.on('error', (e) => {
			keyvalue.set(uuid, 'error:GitHub API request failure.');
			console.log(`Problem with request: ${e.message}`);
		});
		request.end();
	});
});
/* istanbul ignore next: No way to force CURL errors */
request.on('error', (e) => {
	keyvalue.set(uuid, 'error:GitHub API request failure.');
	console.log(`Problem with request: ${e.message}`);
});
request.write(params);
request.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			console.log('Testing /login/github w/ empty data');
			data = JSON.parse(raw_data);
			data.query = {};
			data.session = {};
			routine(data, res);

			console.log('Testing /login/github with mismatched Nonce/State');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			};
			data.session = {
				github_uuid: '1'
			};
			routine(data, res);

			console.log('Testing /login/github with matching initial data');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			,	code: '0'
			};
			data.session = {
				github_uuid: '0'
			};
			routine(data, res);
		}
	});
}
