exports.register = (endpoints, shared_data) => {
	const crypto = require('crypto');
	const keyvalue = require('../keyvalue.js');
	const util = require('../util.js');
	const querystring = require('querystring');
	const secrets = require('../secrets.js').services.twitter;

	console.log('Registering /prelogin/twitter');
	endpoints.push({
		uri: '/prelogin/twitter'
	,	routine: (data, res) => {



var uuid;
if (data.session.hasOwnProperty('prelogin_twitter')) {
	uuid = data.session['prelogin_twitter'];
} else {
	uuid = crypto.randomBytes(16).toString('hex');
	keyvalue.set('prelogin_twitter_' + uuid, 'wip');
	data.session['prelogin_twitter'] = uuid;
	res.saveSession(data.session);
	var params = {
		oauth_callback: 'https://www.pawsr.us/login/twitter?state=' + uuid + '#'
	,	oauth_consumer_key: secrets.oauthConsumerKey
	,	oauth_timestamp: Math.floor(Date.now() / 1000)
	,	oauth_nonce: uuid
	,	oauth_signature_method: 'HMAC-SHA1'
	,	oauth_version: '1.0'
	};

	var data = 'POST&' + querystring.escale('https://api.twitter.com/oauth/request_token') + '&' + querystring.stringify(params);

	var hmac = crypto.createHmac('sha1', secrets.secretKey);
	hmac.update(data);
	var authorization = 'OAuth oauth_signature=' + querystring.escape(hmac.digest);
	console.log(authorization);
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
