const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.amazon;
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /login/amazon');
	endpoints.push({
		uri: '/login/amazon'
	,	routine: (data, res) => {



try {
	if (data.query.state !== data.session.amazon_uuid) {
		throw Error('Nonce/State Mismatch - CSRF attack?');
	}
	if (typeof data.query.code === 'undefined') {
		throw Error('OAuth Code missing!');
	}
} catch (err) {
	console.log('Amazon: ' + err.message);
	console.log(err.stacktrack);

	delete(data.session.amazon_uuid);

	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Amazon Login Callback - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error:</b> Amazon did not successfully login.</p>');
	res.write('<p><a href=\x22/\x22>Click here to go back to the homepage, and try again later.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

var uuid = 'login_amazon_' + data.session.amazon_uuid;
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
,	redirect_uri:		'https:\x2F/www.pawsr.us/login/amazon'
}, '&', '=', {encodeURIComponent: x => x});

var url = {
	method: 'POST'
,	protocol: 'https:'
,	host: 'api.amazon.com'
,	port: 443
,	path: '/auth/o2/token'
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
	/* istanbul ignore next: No sane way to store valid Amazon creds, remainder is straight-forward */
	response.on('end', () => {
		console.log(response.statusCode);
		console.log(buffer.toString('utf8'));

		keyvalue.set(uuid, 'error:Unfinished code path');
		return;

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
		,	host: 'api.amazon.com'
		,	port: 443
		,	path: '/user/profile'
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

				require('../utils/login_complete.js')(data.session.userid, 'Amazon', uuid, results.id, results.name);
			});
		});
		request.on('error', (e) => {
			keyvalue.set(uuid, 'error:Amazon API request failure.');
			console.log(`Problem with request: ${e.message}`);
		});
		request.end();
	});
});
/* istanbul ignore next: No way to force CURL errors */
request.on('error', (e) => {
	keyvalue.set(uuid, 'error:Amazon API request failure.');
	console.log(`Problem with request: ${e.message}`);
});
request.write(params);
request.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			console.log('Testing /login/amazon w/ empty data');
			data = JSON.parse(raw_data);
			data.query = {};
			data.session = {};
			routine(data, res);

			console.log('Testing /login/amazon with mismatched Nonce/State');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			};
			data.session = {
				amazon_uuid: '1'
			};
			routine(data, res);

			console.log('Testing /login/amazon with matching initial data');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			,	code: '0'
			};
			data.session = {
				amazon_uuid: '0'
			};
			routine(data, res);
		}
	});
}
