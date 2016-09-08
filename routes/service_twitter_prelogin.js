exports.register = (endpoints, shared_data) => {
	const crypto = require('crypto');
	const keyvalue = require('../keyvalue.js');
	const util = require('../util.js');
	const querystring = require('querystring');
	const secrets = require('../secrets.js').services.twitter;
	const https = require('https');
	const url = require('url');

	console.log('Registering /prelogin/twitter');
	endpoints.push({
		uri: '/prelogin/twitter'
	,	routine: (data, res) => {



var uuid;
if (data.session.hasOwnProperty('prelogin_twitter')) {
	uuid = data.session['prelogin_twitter'];
} else {
	uuid = util.nonce();
	var nonce = util.nonce();
	console.log(uuid);
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

	var params_qs = querystring.stringify(params);

	var mydata = 'POST' + '&' + querystring.escape('https://api.twitter.com/oauth/request_token') + '&' + querystring.escape(params_qs);
	console.log(mydata.split('&'));

	var hmac = crypto.createHmac('sha1', secrets.secretKey + '&');
	hmac.update(mydata);
	var authorization = 'OAuth oauth_signature="' + querystring.escape(hmac.digest('base64')) + '"';

	var url = {
		method: 'POST'
	,	protocol: 'https:'
	,	host: 'api.twitter.com'
	,	port: 443
	,	path: '/oauth/request_token'
	,	headers: {
			'Accept': '*/*'
		,	'Authorization': authorization
		,	'Connection': 'close'
		,	'Content-Length': `${params_qs.length}`
		,	'Content-Type': 'application/x-www-form-urlencoded'
		,	'Host': 'api.twitter.com'
		,	'User-Agent': 'web:www.pawsr.us:v0.9.9 (by /u/wolfwings)'
		}
	};

	console.log(JSON.stringify(url, null, 4));

	var request = https.request(url, (response) => {
		var buffer = Buffer.alloc(0);
		console.log(`STATUS: ${response.statusCode}`);
		if (response.statusCode !== 200) {
			response.destroy();
			response.on('data', (chunk) => { return; });
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
	request.write(params_qs);
	request.end();

}

var state = keyvalue.get('prelogin_twitter_' + uuid);
if (state === 'wip') {
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(util.noscriptrefresh(1, '/prelogin/twitter'));
	res.write(data.boilerplate.prebody);
	res.write('<p>Process callback from Twitter for login...</p>');
	res.write(data.boilerplate.postbody);
	return;
}

delete data.session['prelogin_twitter'];
res.saveSession(data.session);

if (!state.startsWith('readu:')) {
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
res.write('<!doctype html><html><head><meta http-equiv="refresh" content="1; url=' + state.slice(6) + '"></head><body></body></html>\r\n\r\n', 'utf8');



		}
	});
}
