const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const oauth = require('../utils/oauth.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /login/twitter');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (data, res) => {



try {
	if (data.query.state !== data.session.twitter_uuid) {
		throw Error('Nonce/State Mismatch - CSRF attack?');
	}
	if (data.query.oauth_token !== data.session.twitter_token) {
		throw Error('OAuth Token Mismatch - Replay attack?');
	}
	if (typeof data.query.oauth_verifier === 'undefined') {
		throw Error('OAuth Verifier missing!');
	}
} catch (err) {
	console.log('Twitter: ' + err.message);
	console.log(err.stacktrack);

	delete(data.session.twitter_uuid);
	delete(data.session.twitter_token);
	delete(data.session.twitter_token_secret);

	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Login Callback - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error:</b> Twitter did not successfully login.</p>');
	res.write('<p><a href=\x22/\x22>Click here to go back to the homepage, and try again later.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

var twitter_token_secret = data.session.twitter_token_secret;
var uuid = 'login_twitter_' + data.session.twitter_uuid;
keyvalue.set(uuid, 'wip');
delete(data.session.twitter_token);
delete(data.session.twitter_token_secret);

res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', '/login');
res.end();

var params = {
	oauth_consumer_key:     secrets.oauthConsumerKey
,	oauth_nonce:            oauth.nonce()
,	oauth_signature_method: 'HMAC-SHA1'
,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
,	oauth_token:            data.query.oauth_token
,	oauth_version:          '1.0'
,	oauth_verifier:         data.query.oauth_verifier
};

var authorization = 'OAuth oauth_signature=' + oauth.oauth1_signature(
	'POST'
,	'https:\x2F/api.twitter.com/oauth/access_token'
,	params
,	secrets.secretKey
,	twitter_token_secret
,	'sha1');

var url = {
	method: 'POST'
,	protocol: 'https:'
,	host: 'api.twitter.com'
,	port: 443
,	path: '/oauth/access_token'
,	agent: false
,	headers: {
		'Accept': '*\x2F*'
	,	'Authorization': authorization
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'Host': 'api.twitter.com'
	,	'User-Agent': data.user_agent
	}
};

var request = https.request(url, (response) => {
	var buffer = Buffer.alloc(0);
	response.setEncoding('utf8');
	response.on('data', (chunk) => {
		buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
	});
	/* istanbul ignore next: No sane way to store valid Twitter creds, remainder is straight-forward */
	response.on('end', () => {
		if (response.statusCode !== 200) {
			keyvalue.set(uuid, 'error:' + response.statusCode);
			return;
		}

		var results = querystring.parse(buffer.toString('utf8'));

		if (typeof results.user_id === 'undefined') {
			keyvalue.set(uuid, 'error:No unique ID returned from Twitter.');
			return;
		}

		if (typeof results.screen_name === 'undefined') {
			keyvalue.set(uuid, 'error:No screen name returned from Twitter.');
			return;
		}

		require('../utils/login_complete.js')(data.session.userid, 'Twitter', uuid, results.user_id, results.screen_name);
	});
});
/* istanbul ignore next: No way to force CURL errors */
request.on('error', (e) => {
	keyvalue.set(uuid, 'error:Twitter API request failure.');
	console.log(`Problem with request: ${e.message}`);
});
request.write(querystring.stringify(params));
request.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			console.log('Testing /login/twitter w/ empty data');
			data = JSON.parse(raw_data);
			data.query = {};
			data.session = {};
			routine(data, res);

			console.log('Testing /login/twitter with mismatched Nonce/State');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			};
			data.session = {
				twitter_uuid: '1'
			};
			routine(data, res);

			console.log('Testing /login/twitter with Replay Attach');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			,	oauth_token: '0'
			};
			data.session = {
				twitter_uuid: '0'
			,	twitter_token: '1'
			};
			routine(data, res);

			console.log('Testing /login/twitter with matching initial data');
			data = JSON.parse(raw_data);
			data.query = {
				state: '0'
			,	oauth_token: '0'
			,	oauth_verifier: '0'
			};
			data.session = {
				twitter_uuid: '0'
			,	twitter_token: '0'
			};
			routine(data, res);
		}
	});
}
