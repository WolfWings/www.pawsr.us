// Allow this test to be called standalone
if (typeof global.database === 'undefined') {
	global.database = {
		getConnection: () => {
		}
	}
}

const oauth = require('../utils/oauth2.js');
const https = require('https');

// Disable certificate checking as we're using a self-signed localhost cert
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fake_res = {
	setHeader: (header, value) => {}
,	write: (content) => {}
,	end: (content) => {}
,	destroy: () => {}
,	saveSession: (session) => {}
};

const fake_secrets = {
	clientID: '_test_invalid_test_'
,	clientSecret: '_test_invalid_test_'
};

const base_data = JSON.stringify({
	query: {
	}
,	session: {
	}
,	boilerplate: {
		pretitle: ''
	,	prebody: ''
	,	postbody: ''
	}
,	user_agent: ''
});

function do_tests(port) {
	var data;
	const invalid_site = 'https:\x2F/invalid.invalid/';
	const localhost = 'https:\x2F/localhost:' + port + '/';

	console.log('Testing OAuth2 login initialization');

	data = JSON.parse(base_data);
	oauth.oauth2_initlogin(
		data
	,	fake_res
	,	'_test_OAuth2_Init'
	,	'Invalid'
	,	'/'
	,	'Invalid'
	);

	console.log('Testing OAuth2 valid request w/ auth');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.query.code = '0';
	data.session._test_oauth2_valid_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_Valid'
	,	fake_secrets
	,	localhost + 'access-token'
	,	fake_secrets
	,	localhost + 'profile'
	,	'invalid'
	,	'invalid.invalid'
	);

	console.log('Testing OAuth2 CSRF check');

	data = JSON.parse(base_data);
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_CSRF'
	,	fake_secrets
	,	invalid_site
	,	null
	,	invalid_site
	,	'invalid'
	,	'invalid'
	);

	console.log('Testing OAuth2 missing code handling');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.session._test_oauth2_no_code_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_No_Code'
	,	fake_secrets
	,	invalid_site
	,	null
	,	invalid_site
	,	'invalid'
	,	'invalid'
	);

	console.log('Testing OAuth2 profile CURL error');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.query.code = '0';
	data.session._test_oauth2_profile_curl_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_Profile_CURL'
	,	fake_secrets
	,	localhost + 'access-token'
	,	null
	,	invalid_site
	,	'invalid'
	,	'invalid'
	);

	console.log('Testing OAuth2 access_token CURL error');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.query.code = '0';
	data.session._test_oauth2_access_token_curl_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_Access_Token_CURL'
	,	fake_secrets
	,	invalid_site
	,	null
	,	invalid_site
	,	'invalid'
	,	'invalid'
	);

	console.log('Testing OAuth2 profile status-code');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.query.code = '0';
	data.session._test_oauth2_profile_status_code_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_Profile_Status_Code'
	,	fake_secrets
	,	localhost + 'access-token'
	,	null
	,	localhost + 'status-code'
	,	'invalid'
	,	'invalid'
	);

	console.log('Testing OAuth2 access_token status code');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.query.code = '0';
	data.session._test_oauth2_access_token_status_code_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_Access_Token_Status_Code'
	,	fake_secrets
	,	localhost + 'status-code'
	,	null
	,	localhost
	,	'invalid'
	,	'invalid'
	);

	console.log('Testing OAuth2 missing access_token');

	data = JSON.parse(base_data);
	data.query.state = '0';
	data.query.code = '0';
	data.session._test_oauth2_access_token_uuid = '0';
	oauth.oauth2_login(
		data
	,	fake_res
	,	'_test_OAuth2_Access_Token'
	,	fake_secrets
	,	localhost + 'missing-access-token'
	,	null
	,	localhost
	,	'invalid'
	,	'invalid'
	);
}

function server_request(req, res) {
	console.log(req.url);
	res.setHeader('Content-Type', 'application/json');
	switch(true) {
		case /^.access-token/.test(req.url):
			res.statusCode = 200;
			res.write(JSON.stringify({
				access_token: '_test_invalid_test_'
			}));
			break;
		case /^.profile/.test(req.url):
			res.statusCode = 200;
			res.write(JSON.stringify({
				invalid: '_test_invalid_test_'
			}));
			break;
		case /^.missing-access-token/.test(req.url):
			res.statusCode = 200;
			res.write(JSON.stringify({
			}));
			break;
		case /^.status-code/.test(req.url):
			res.statusCode = 403;
			break;
		default:
	}
	res.end();
}

var server = https.createServer(require('../utils/localhost_ssl_keys.js'));

server.on('clientError', (err, socket) => {
	socket.end();
});
server.on('request', server_request);
server.on('listening', () => {
	const port = server.address().port;
	console.log('OAuth 2 testing server listening on port ' + port);

	do_tests(port);

	setTimeout(() => {
		server.close();
		console.log('OAuth 2 testing server shut down');
	}, 2000);
});
server.listen(0);
