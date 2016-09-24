const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const oauth = require('../utils/oauth.js');

module.exports = (endpoints, shared_data) => {
	console.log('Registering /initlogin/twitter');
	endpoints.push({
		uri: '/initlogin/twitter'
	,	routine: (data, res) => {



var uuid = oauth.nonce();
var nonce = oauth.nonce();
keyvalue.set('twitter_uuid_' + uuid, 'wip');
data.session['twitter_uuid'] = uuid;
res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', '/preauth/twitter');
res.end();

var params = {
	oauth_callback:         'https:\x2F/www.pawsr.us/login/twitter?state=' + uuid + '#'
,	oauth_consumer_key:     secrets.oauthConsumerKey
,	oauth_nonce:            nonce
,	oauth_signature_method: 'HMAC-SHA1'
,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
,	oauth_version:          '1.0'
};

var authorization = 'OAuth oauth_signature=' + oauth.oauth1_signature('POST', 'https:\x2F/api.twitter.com/oauth/request_token', params, secrets.secretKey, '', 'sha1');

var url = {
	method: 'POST'
,	protocol: 'https:'
,	host: 'api.twitter.com'
,	port: 443
,	path: '/oauth/request_token'
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
	console.log('response');
	var buffer = Buffer.alloc(0);
	if (response.statusCode !== 200) {
		keyvalue.delete('twitter_uuid_' + uuid);
		return;
	}

	response.setEncoding('utf8');
	response.on('data', (chunk) => {
		buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
	});
	response.on('end', () => {
		var results = querystring.parse(buffer.toString('utf8'));
		try {
			if (results['oauth_callback_confirmed'] !== 'true') {
				throw new TypeError('Twitter oauth_callback_confirmed not true!');
			}
			keyvalue.set('twitter_uuid_' + uuid, 'ready:' + results['oauth_token_secret'] + ':' + results['oauth_token']);
		} catch (err) {
			keyvalue.set('twitter_uuid_' + uuid, 'error:Twitter service failed to return a token. Please try again later.');
		}

	});
});
request.on('error', (e) => {
	console.log(`Problem with request: ${e.message}`);
});
request.write(querystring.stringify(params));
request.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /initlogin/twitter');
			routine(data, res);
		}
	});
}
