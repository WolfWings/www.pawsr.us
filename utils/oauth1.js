const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const urlparser = require('url');
const nonce = require('./nonce.js');
const memcache = require('memcache-plus')(require('../secrets.js').memcache);

function oauth1_signature(method, url, params, key, token, hash) {
	var ordered = '';
	var keys = Object.keys(params).sort().forEach((key) => {
		ordered = ordered + '&' + querystring.escape(key) + '=' + querystring.escape(params[key]);
	});
	var hmac = crypto.createHmac(hash, key + '&' + token);
	hmac.update(method + '&' + querystring.escape(url) + '&' + querystring.escape(ordered.slice(1)));
	return 'OAuth oauth_signature=\x22' + querystring.escape(hmac.digest('base64')) + '\x22';
};

exports.oauth1_initlogin = (data, res, serviceTitle, secrets, tokenURL) => {
	var service = serviceTitle.toLowerCase();
	var uuid = nonce();

	var params = {
		oauth_callback:         'https:\x2F/www.pawsr.us/login/' + service + '?state=' + uuid + '#'
	,	oauth_consumer_key:     secrets.oauthConsumerKey
	,	oauth_nonce:            nonce()
	,	oauth_signature_method: 'HMAC-SHA1'
	,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
	,	oauth_version:          '1.0'
	};


	var url = urlparser.parse(tokenURL, false, true);
	url.method = 'POST';
	url.agent = false;
	url.headers = {
		'Accept': '*\x2F*'
	,	'Authorization': oauth1_signature(
			'POST'
		,	tokenURL
		,	params
		,	secrets.secretKey
		,	''
		,	'sha1'
		)
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'User-Agent': data.user_agent
	};

	var request = https.request(url, (response) => {
		var buffer = Buffer.alloc(0);
		if (response.statusCode !== 200) {
			memcache.delete(service + '_uuid_' + uuid);
			return;
		}

		response.setEncoding('utf8');
		response.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
		});
		response.on('end', () => {
			var results = querystring.parse(buffer.toString('utf8'));
			var newvalue;
			try {
				if (results['oauth_callback_confirmed'] !== 'true') {
					throw new TypeError(serviceTitle + ' oauth_callback_confirmed not true!');
				}
				newvalue = 'ready:' + results['oauth_token_secret'] + ':' + results['oauth_token'];
			} catch (err) {
				newvalue = 'error:' + serviceTitle + ' service failed to return a token. Please try again later.';
			}
			memcache.set(service + '_uuid_' + uuid, newvalue);
		});
	});
	request.on('error', (e) => {
		memcache.set(service + '_uuid_' + uuid, 'error:API request problem to ' + serviceTitle);
		console.log(`Problem with request: ${e.message}`);
	});
	request.write(querystring.stringify(params));
	request.end();

	return memcache.set(service + '_uuid_' + uuid, 'wip').then(() => {
		data.session[service + '_uuid'] = uuid;
		res.statusCode = 307;
		res.saveSession(data.session);
		res.setHeader('Location', '/preauth/' + service);
		res.end();

		return Promise.resolve();
	});
};

exports.oauth1_preauth = (data, res, serviceTitle, loginURL, ajax) => {
	var service = serviceTitle.toLowerCase();

	// First make sure the session-state variable exists
	if (typeof data.session[service + '_uuid'] !== 'string') {
		console.log('Warning: Damaged UUID for ' + service + ' in session data!');

		if (ajax === true) {
			res.saveSession(data.session);
			res.setHeader('Content-Type', 'application/json');
			res.write(JSON.stringify({
				command: 'redirect'
			,	location: '/initlogin/' + service
			}));
		} else {
			res.statusCode = 307;
			res.saveSession(data.session);
			res.setHeader('Location', '/initlogin/' + service);
		}
		res.end();

		return Promise.resolve();
	}

	var uuid = data.session[service + '_uuid'];

	return memcache.get(service + '_uuid_' + uuid)
	.then(state => {
		// If still processing, just cycle around again in one second.
		// Calls usually take 500ms or less.
		if (state === 'wip') {
			if (ajax === true) {
				res.saveSession(data.session);
				res.setHeader('Content-Type', 'application/json');
				res.write(JSON.stringify({
					command: 'wait'
				}));
			} else {
				res.write(global.templates.loading({
					title: serviceTitle + ' Pre-Login Authorize - www.pawsr.us'
				,	serviceTitle: serviceTitle
				}));
			}
			res.end();
			return Promise.resolve();
		}

		// If there is no such UUID on record, boot entirely. Possible replay attack.
		if (state === null) {
			console.log('Error: No such UUID for ' + service + ': ' + state);
			delete data.session[service + '_uuid'];
			if (ajax === true) {
				res.saveSession(data.session);
				res.setHeader('Content-Type', 'application/json');
				res.write(JSON.stringify({
					command: 'redirect'
				,	location: '/'
				}));
			} else {
				res.saveSession(data.session);
				res.statusCode = 307;
				res.setHeader('Location', '/');
			}
			res.end();
			return Promise.resolve();
		}

		// We no longer need the UUID record serverside, so purge it.
		// Note we do *NOT* update the client-side cookie yet, as we may need to add more data to it first.
		memcache.delete(service + '_uuid_' + uuid);

		// Not ready and not WIP? Usually an error, but generic response to future-proof.
		if (!state.startsWith('ready:')) {
			console.log('Finished but not ready: ' + state);
			delete data.session[service + '_uuid'];
			if (ajax === true) {
				res.saveSession(data.session);
				res.setHeader('Content-Type', 'application/json');
				res.write(JSON.stringify({
					command: 'error'
				}));
			} else {
				res.saveSession(data.session);
				res.write(global.templates.login_failure({
					title: serviceTitle + ' Pre-Login Authorizer - www.pawsr.us'
				,	mode: state.slice(0,1).toUpperCase() + state.slice(1).split(':')[0]
				,	message: state.replace(/^[^:]+(:|$)/, '')
				}));
			}
			res.end();
			return Promise.resolve();
		}

		// YAY, success! *partyfavors*
		// Store the two oauth token bits into the session, save it, and roll the redirect...
		var components = state.split(':');
		data.session[service + '_token_secret'] = components[1];
		data.session[service + '_token'] = components[2];

		if (ajax === true) {
			res.saveSession(data.session);
			res.setHeader('Content-Type', 'application/json');
			res.write(JSON.stringify({
				command: 'redirect'
			,	location: loginURL + '?oauth_token=' + components[2] + '#'
			}));
		} else {
			res.saveSession(data.session);
			res.statusCode = 307;
			res.setHeader('Location', loginURL + '?oauth_token=' + components[2] + '#');
		}
		res.end();
		return Promise.resolve();
	});
};

exports.oauth1_login = (data, res, serviceTitle, secrets, profileURL, unique_id, screen_name) => {
	var service = serviceTitle.toLowerCase();

	try {
		if ((typeof data.query.state !== 'string')
		 || (typeof data.query.oauth_token !== 'string')
		 || (typeof data.query.oauth_verifier !== 'string')) {
			throw Error('OAuth callback query components missing!');
		}
		if (data.query.state !== data.session[service + '_uuid']) {
			throw Error('Nonce/State Mismatch - CSRF attack?');
		}
		if (data.query.oauth_token !== data.session[service + '_token']) {
			throw Error('OAuth Token Mismatch - Replay attack?');
		}
	} catch (err) {
		console.log(serviceTitle + ': ' + err.message);
		console.log(err.stacktrack);

		delete(data.session[service + '_uuid']);
		delete(data.session[service + '_token']);
		delete(data.session[service + '_token_secret']);

		res.saveSession(data.session);
		res.write(global.templates.login_failure({
			title: serviceTitle + ' Login Callback - www.pawsr.us'
		,	mode: 'Error'
		,	message: serviceTitle + ' did not successfully login.'
		}));
		res.end();

		return Promise.resolve();
	}

	var token_secret = data.session[service + '_token_secret'];
	var uuid = 'login_' + service + '_' + data.session[service + '_uuid'];

	var params = {
		oauth_consumer_key:     secrets.oauthConsumerKey
	,	oauth_nonce:            nonce()
	,	oauth_signature_method: 'HMAC-SHA1'
	,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
	,	oauth_token:            data.query.oauth_token
	,	oauth_version:          '1.0'
	,	oauth_verifier:         data.query.oauth_verifier
	};

	var url = urlparser.parse(profileURL);
	url.method = 'POST';
	url.agent = false;
	url.headers = {
		'Accept': '*\x2F*'
	,	'Authorization': oauth1_signature(
			'POST'
		,	profileURL
		,	params
		,	secrets.secretKey
		,	token_secret
		,	'sha1'
		)
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'User-Agent': data.user_agent
	};

	var request = https.request(url, (response) => {
		var buffer = Buffer.alloc(0);
		response.setEncoding('utf8');
		response.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
		});
		response.on('end', () => {
			if (response.statusCode !== 200) {
				memcache.set(uuid, 'error:' + response.statusCode);
				return;
			}

			var results = querystring.parse(buffer.toString('utf8'));

			require('../utils/login_complete.js')(
				data.session.userid
			,	serviceTitle
			,	uuid
			,	results[unique_id]
			,	results[screen_name]
			);
		});
	});
	request.on('error', (e) => {
		memcache.set(uuid, 'error:' + serviceTitle + ' API request failure.');
		console.log(`Problem with request: ${e.message}`);
	});
	request.write(querystring.stringify(params));
	request.end();

	return memcache.set(uuid, 'wip')
	.then(() => {
		console.log('Redirecting WIP login back to /login');
		delete(data.session[service + '_token']);
		delete(data.session[service + '_token_secret']);
		res.statusCode = 307;
		res.saveSession(data.session);
		res.setHeader('Location', '/login');
		res.end();

		return Promise.resolve();
	});
};
