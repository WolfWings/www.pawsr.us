const querystring = require('querystring');
const https = require('https');

const docstore = require('../docstore.js');
const keyvalue = require('../keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const util = require('../util.js');

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

var params = {
	oauth_consumer_key:     secrets.oauthConsumerKey
,	oauth_nonce:            util.nonce()
,	oauth_signature_method: 'HMAC-SHA1'
,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
,	oauth_token:            data.session.twitter_token
,	oauth_version:          '1.0'
,	oauth_verifier:         data.query.oauth_verifier
};

var authorization = 'OAuth oauth_signature=' + util.oauth1_signature(
	'POST'
,	'https:\x2F/api.twitter.com/oauth/access_token'
,	params
,	secrets.secretKey
,	data.session.twitter_token_secret
,	'sha1');

var url = {
	method: 'POST'
,	protocol: 'https:'
,	host: 'api.twitter.com'
,	port: 443
,	path: '/oauth/access_token'
,	agent: false
,	headers: {
		'Accept': '*/*'
	,	'Authorization': authorization
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'Host': 'api.twitter.com'
	,	'User-Agent': 'web:www.pawsr.us:v0.9.9 (by /u/wolfwings)'
	}
};

var uuid = 'login_twitter_' + data.session.twitter_uuid;
keyvalue.set(uuid, 'wip');
delete(data.session.twitter_token);
delete(data.session.twitter_token_secret);

res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', '/login');
res.end();

var request = https.request(url, (response) => {
	var buffer = Buffer.alloc(0);
	if (response.statusCode !== 200) {
		keyvalue.set(uuid, 'error:' + response.statusCode);
		response.destroy();
		return;
	}

	response.setEncoding('utf8');
	response.on('data', (chunk) => {
		buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
	});
	response.on('end', () => {
		loginsuccess(uuid, querystring.parse(buffer.toString('utf8')));
	});
});
request.on('error', (e) => {
	console.log(`Problem with request: ${e.message}`);
});
request.write(querystring.stringify(params));
request.end();



		}
	});
}

// Separate function to simplify placing us back on the event loop
// Only way to handle locks for now, simply try again later!
function loginsuccess(uuid, results) {
	var response;
	try {
		docstore.set('account_twitter_' + results.user_id, results.screen_name);
		response = 'ready:' + results.user_id;
	} catch (err) {
		response = 'error:Invalid response from Twitter. Please try again later.';
	}
	keyvalue.set(uuid, response);
}
