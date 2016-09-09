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
		oauth_callback: 'https:\x2F/www.pawsr.us/login/twitter?state=' + uuid + '#'
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
		if (response.statusCode !== 200) {
			keyvalue.delete('prelogin_twitter_' + uuid);
			response.destroy();
			return;
		}

		response.setEncoding('utf8');
		response.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
		});
		response.on('end', () => {
			var results = querystring.parse(buffer.toString('utf8'));
			console.log(results);
			console.log(typeof results);
			try {
				if (results['oauth_callback_confirmed'] !== 'true') {
					throw new TypeError('Twitter oauth_callback_confirmed not true!');
				}
				keyvalue.set('prelogin_twitter_' + uuid, 'ready:' + results['oauth_token_secret'] + ':' + results['oauth_token']);
			} catch (err) {
				keyvalue.set('prelogin_twitter_' + uuid, 'error:Twitter service failed to return a token. Please try again later.');
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

var uuid = data.session['prelogin_twitter'];

var state = keyvalue.get('prelogin_twitter_' + uuid);

// If there is no such UUID on record, boot entirely. Possible replay attack.
if (state === null) {
	delete data.session['prelogin_twitter'];
	res.saveSession(data.session);
	res.statusCode = 307;
	res.setHeader('Location', '/');
}

// If still processing, just cycle around again in one second.
// Calls usually take 500ms or less.
if (state === 'wip') {
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(util.noscriptrefresh(1, '/prelogin/twitter'));
	res.write(data.boilerplate.prebody);
	res.write('<p>Requesting unique login token from twitter...</p>');
	res.write(data.boilerplate.postbody);
	return;
}

// We no longer need the UUID record, so purge it.
// Note we do *NOT* update the client-side cookie yet, as we may need to add more data to it first.
keyvalue.delete('prelogin_twitter_' + uuid);
delete data.session['prelogin_twitter'];

// Errored out? Save session, give a screen with a link, we're done.
if (state.startsWith('error:')) {
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error!</b> ' + state.slice(6) + '</p>');
	res.write('<p><a href="/">Click here to return to the homepage.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

// Unhandled state? Corruption possible, abort and provide a link.
if (!state.startsWith('ready:')) {
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Unknown State!</b></p>');
	res.write('<p><a href="/">Click here to return to the homepage.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

// YAY, success! *partyfavors*
// Store the two oauth token bits into the session, save it, and roll the redirect...
var components = state.split(':');
data.session['twitter_token_secret'] = components[1];
data.session['twitter_token'] = components[2];
res.saveSession(data.session);
res.statusCode = 307;
res.setHeader('Location', 'https:\x2F/api.twitter.com/oauth/authenticate?oauth_token=' + components[2] + '#');



		}
	});
}
