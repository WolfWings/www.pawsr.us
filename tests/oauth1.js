// Allow this test to be called standalone
if (typeof global.database === 'undefined') {
	global.database = {
		getConnection: () => {
		}
	}
}

const oauth = require('../utils/oauth1.js');
const https = require('https');
const keyvalue = require('../utils/keyvalue.js');
const querystring = require('querystring');

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
	oauthConsumerKey: '_test_invalid_test_'
,	secretKey: '_test_invalid_test_'
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

	console.log('Testing OAuth 1.0a init-login with invalid URL');

	data = JSON.parse(base_data);
	data.session = {};
	oauth.oauth1_initlogin(data, fake_res, '_test_oauth1', fake_secrets, invalid_site);

	console.log('Testing OAuth 1.0a init-login status-code');

	data = JSON.parse(base_data);
	data.session = {};
	oauth.oauth1_initlogin(data, fake_res, '_test_oauth1', fake_secrets, localhost + 'status-code');

	console.log('Testing OAuth 1.0a init-login callback unconfirmed');

	data = JSON.parse(base_data);
	data.session = {};
	oauth.oauth1_initlogin(data, fake_res, '_test_oauth1', fake_secrets, localhost + 'bad-callback');

	console.log('Testing OAuth 1.0a valid init-login');

	data = JSON.parse(base_data);
	data.session = {};
	oauth.oauth1_initlogin(data, fake_res, '_test_oauth1', fake_secrets, localhost + 'token');

	console.log('Testing OAuth 1.0a pre-auth with empty session');

	data = JSON.parse(base_data);
	data.session = {};
	oauth.oauth1_preauth(data, fake_res, '_test_oauth1');

	console.log('Testing OAuth 1.0a pre-auth with missing keyvalue');

	data = JSON.parse(base_data);
	data.session = {};
	data.session['_test_oauth1_uuid'] = '0';
	oauth.oauth1_preauth(data, fake_res, '_test_oauth1');

	console.log('Testing OAuth 1.0a pre-auth with keyvalue: wip');

	data = JSON.parse(base_data);
	data.session = {};
	data.session['_test_oauth1_uuid'] = '1';
	keyvalue.set('_test_oauth1_uuid_1', 'wip');
	oauth.oauth1_preauth(data, fake_res, '_test_oauth1');

	console.log('Testing OAuth 1.0a pre-auth with keyvalue: error:_');

	data = JSON.parse(base_data);
	data.session = {};
	data.session['_test_oauth1_uuid'] = '2';
	keyvalue.set('_test_oauth1_uuid_2', 'error:_');
	oauth.oauth1_preauth(data, fake_res, '_test_oauth1');

	console.log('Testing OAuth 1.0a pre-auth with keyvalue: garbage');

	data = JSON.parse(base_data);
	data.session = {};
	data.session['_test_oauth1_uuid'] = '3';
	keyvalue.set('_test_oauth1_uuid_3', 'garbage');
	oauth.oauth1_preauth(data, fake_res, '_test_oauth1');

	console.log('Testing OAuth 1.0a pre-auth with keyvalue: ready:5:6');

	data = JSON.parse(base_data);
	data.session = {};
	data.session['_test_oauth1_uuid'] = '4';
	keyvalue.set('_test_oauth1_uuid_4', 'ready:5:6');
	oauth.oauth1_preauth(data, fake_res, '_test_oauth1');

	console.log('Testing OAuth 1.0a post-auth with empty data');

	var data;
	data = JSON.parse(base_data);
	data.query = {};
	data.session = {};
	oauth.oauth1_login(data, fake_res, '_test_oauth1', fake_secrets, invalid_site, '', '');

	console.log('Testing OAuth 1.0a post-auth with CSRF');

	data = JSON.parse(base_data);
	data.query = {
		state: '0'
	,	oauth_token: '1'
	,	oauth_verifier: '2'
	};
	data.session = {};
	data.session['_test_oauth1_uuid'] = '3';
	oauth.oauth1_login(data, fake_res, '_test_oauth1', fake_secrets, invalid_site, '', '');

	console.log('Testing OAuth 1.0a post-auth with mismatched tokens');

	data = JSON.parse(base_data);
	data.query = {
		state: '4'
	,	oauth_token: '5'
	,	oauth_verifier: '6'
	};
	data.session = {};
	data.session['_test_oauth1_uuid'] = '4';
	data.session['_test_oauth1_token'] = '7';
	oauth.oauth1_login(data, fake_res, '_test_oauth1', fake_secrets, invalid_site, '', '');

	console.log('Testing OAuth 1.0a post-auth with profile CURL error');

	data = JSON.parse(base_data);
	data.query = {
		state: '8'
	,	oauth_token: '9'
	,	oauth_verifier: '10'
	};
	data.session = {};
	data.session['_test_oauth1_uuid'] = '8';
	data.session['_test_oauth1_token'] = '9';
	oauth.oauth1_login(data, fake_res, '_test_oauth1', fake_secrets, invalid_site, '', '');

	console.log('Testing OAuth 1.0a post-auth with profile status code');

	data = JSON.parse(base_data);
	data.query = {
		state: '8'
	,	oauth_token: '9'
	,	oauth_verifier: '10'
	};
	data.session = {};
	data.session['_test_oauth1_uuid'] = '8';
	data.session['_test_oauth1_token'] = '9';
	oauth.oauth1_login(data, fake_res, '_test_oauth1', fake_secrets, localhost + 'status-code', '', '');

	console.log('Testing OAuth 1.0a post-auth with valid data');

	data = JSON.parse(base_data);
	data.query = {
		state: '8'
	,	oauth_token: '9'
	,	oauth_verifier: '10'
	};
	data.session = {};
	data.session['_test_oauth1_uuid'] = '8';
	data.session['_test_oauth1_token'] = '9';
	oauth.oauth1_login(data, fake_res, '_test_oauth1', fake_secrets, localhost + 'valid', '_invalid_', '_invalid_');
}

function server_request(req, res) {
	res.setHeader('Content-Type', 'application/json');
	switch(req.url) {
		case '/token':
			res.statusCode = 200;
			res.write(querystring.stringify({
				oauth_callback_confirmed: 'true'
			,	oauth_token: '1'
			,	oauth_token_secret: '2'
			}));
			break;
		case '/bad-callback':
			res.statusCode = 200;
			res.write(querystring.stringify({
				oauth_callback_confirmed: 'false'
			}));
			break;
		case '/status-code':
			res.statusCode = 403;
			break;
		case '/valid':
			res.statusCode = 200;
			res.write(querystring.stringify({
				_invalid_: '_test_invalid_test_'
			}));
			break;
		default:
			console.log(req.url);
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
	console.log('Server listening on port ' + port);

	do_tests(port);

	console.log('Waiting two seconds for testing to complete before shutting down HTTPS localhost server');
	setTimeout(() => {
		console.log('Testing complete.');
		server.close();
	}, 2000);
});
server.listen(0);
