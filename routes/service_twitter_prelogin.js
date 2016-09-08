exports.register = (endpoints, shared_data) => {
	console.log('Registering /prelogin/twitter');
	endpoints.push({
		uri: '/prelogin/twitter'
	,	routine: (data, res) => {



const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const util = require('../util.js');

if (!data.session.hasOwnProperty('prelogin_twitter')) {
	var uuid = util.nonce();
	var nonce = util.nonce();
	keyvalue.set('prelogin_twitter_' + uuid, 'wip');
	data.session['prelogin_twitter'] = uuid;
	res.saveSession(data.session);

	var params = {
		oauth_callback: 'https://www.pawsr.us/login/twitter?state=' + uuid + '#'
	,	oauth_consumer_key: secrets.oauthConsumerKey
	,	oauth_nonce: nonce
	,	oauth_signature_method: 'HMAC-SHA1'
	,	oauth_timestamp: `${Math.floor(Date.now() / 1000)}`
	,	oauth_version: '1.0'
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
		console.log(`STATUS: ${response.statusCode}`);
		if (response.statusCode !== 200) {
			response.destroy();
			return;
		}

		response.setEncoding('utf8');
		response.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
		});
		response.on('end', () => {
			console.log(querystring.parse(buffer.toString('utf8')));
		});
	});
	request.on('error', (e) => {
		console.log(`Problem with request: ${e.message}`);
	});
	request.write(querystring.stringify(params));
	request.end();

}

var uuid = data.session['prelogin_twitter'];

var state = keyvalue.get('prelogin_twitter_' + uuid);
if (state === 'wip') {
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(util.noscriptrefresh(1, '/prelogin/twitter'));
	res.write(data.boilerplate.prebody);
	res.write('<p>Requesting unique login token from twitter...</p>');
	res.write(data.boilerplate.postbody);
	return;
}

delete data.session['prelogin_twitter'];
res.saveSession(data.session);

if (!state.startsWith('ready:')) {
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authroizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p>Error! Unknown state!</p>');
	res.write(state);
	res.write(data.boilerplate.postbody);
	return;
}

res.statusCode = 307;
res.setHeader('Location', state.slice(6));
res.write('<!doctype html><html><head><meta http-equiv="refresh" content="0; url=' + state.slice(6) + '"></head><body></body></html>\r\n\r\n', 'utf8');



		}
	});
}
