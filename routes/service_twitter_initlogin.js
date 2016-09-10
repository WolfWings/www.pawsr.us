exports.register = (endpoints, shared_data) => {
	console.log('Registering /initlogin/twitter');
	endpoints.push({
		uri: '/initlogin/twitter'
	,	routine: (data, res) => {



const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const util = require('../util.js');

var uuid = util.nonce();
var nonce = util.nonce();
keyvalue.set('twitter_uuid_' + uuid, 'wip');
data.session['twitter_uuid'] = uuid;
res.statusCode = 307;
res.saveSession(data.session);
res.setHeader('Location', '/preauth/twitter');

var params = {
	oauth_callback:         'https:\x2F/www.pawsr.us/login/twitter?state=' + uuid + '#'
,	oauth_consumer_key:     secrets.oauthConsumerKey
,	oauth_nonce:            nonce
,	oauth_signature_method: 'HMAC-SHA1'
,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
,	oauth_version:          '1.0'
};

var authorization = 'OAuth oauth_signature=' + util.oauth1_signature('POST', 'https:\x2F/api.twitter.com/oauth/request_token', params, secrets.secretKey, '', 'sha1');

var url = {
	method: 'POST'
,	protocol: 'https:'
,	host: 'api.twitter.com'
,	port: 443
,	path: '/oauth/request_token'
,	agent: false
,	headers: {
		'Accept': '*/*'
	,	'Authorization': authorization
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'Host': 'api.twitter.com'
	,	'User-Agent': 'web:www.pawsr.us:v0.9.9 (by /u/wolfwings)'
	}
};

var request = https.request(url, (response) => {
	var buffer = Buffer.alloc(0);
	if (response.statusCode !== 200) {
		keyvalue.delete('twitter_uuid_' + uuid);
		response.destroy();
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
			return;
		}
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
