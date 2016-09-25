const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const _url = require('url');
const keyvalue = require('./keyvalue.js');
const templating = require('./templating.js');

function nonce() {
	return crypto.randomBytes(24).toString('base64').replace(/\x2f/g, '_').replace(/\x2b/g, '-');
};
exports.nonce = nonce;

exports.oauth1_signature = (method, url, params, key, token, hash) => {
	var ordered = '';
	var keys = Object.keys(params).sort().forEach((key) => {
		ordered = ordered + '&' + querystring.escape(key) + '=' + querystring.escape(params[key]);
	});
	var hmac = crypto.createHmac(hash, key + '&' + token);
	hmac.update(method + '&' + querystring.escape(url) + '&' + querystring.escape(ordered.slice(1)));
	return '\x22' + querystring.escape(hmac.digest('base64')) + '\x22';
};

exports.oauth1_initlogin = (data, res, serviceTitle, secrets, tokenURL) => {
	var service = serviceTitle.toLowerCase();
	var uuid = nonce();
	keyvalue.set(service + '_uuid_' + uuid, 'wip');
	data.session[service + '_uuid'] = uuid;
	res.statusCode = 307;
	res.saveSession(data.session);
	res.setHeader('Location', '/preauth/' + service);
	res.end();

	var params = {
		oauth_callback:         'https:\x2F/www.pawsr.us/login/' + service + '?state=' + uuid + '#'
	,	oauth_consumer_key:     secrets.oauthConsumerKey
	,	oauth_nonce:            nonce()
	,	oauth_signature_method: 'HMAC-SHA1'
	,	oauth_timestamp:        Math.floor(Date.now() / 1000).toString()
	,	oauth_version:          '1.0'
	};

	var authorization = 'OAuth oauth_signature=' + exports.oauth1_signature('POST', tokenURL, params, secrets.secretKey, '', 'sha1');

	var url = _url.parse(tokenURL, false, true);
	url.method = 'POST';
	url.agent = false;
	url.headers = {
		'Accept': '*\x2F*'
	,	'Authorization': authorization
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'User-Agent': data.user_agent
	};

	var request = https.request(url, (response) => {
		var buffer = Buffer.alloc(0);
		if (response.statusCode !== 200) {
			keyvalue.delete(service + '_uuid_' + uuid);
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
					throw new TypeError(serviceTitle + ' oauth_callback_confirmed not true!');
				}
				keyvalue.set(service + '_uuid_' + uuid, 'ready:' + results['oauth_token_secret'] + ':' + results['oauth_token']);
			} catch (err) {
				keyvalue.set(service + '_uuid_' + uuid, 'error:' + serviceTitle + ' service failed to return a token. Please try again later.');
			}
		});
	});
	request.on('error', (e) => {
		console.log(`Problem with request: ${e.message}`);
	});
	request.write(querystring.stringify(params));
	request.end();

};

exports.oauth1_preauth = (data, res, serviceTitle, loginURL) => {
	var service = serviceTitle.toLowerCase();

	// First make sure the session-state variable exists
	if (typeof data.session[service + '_uuid'] !== 'string') {
		console.log('Warning: Damaged UUID for ' + service + ' in session data!');

		res.statusCode = 307;
		res.saveSession(data.session);
		res.setHeader('Location', '/initlogin/' + service);
		res.end();
		return;
	}

	var uuid = data.session[service + '_uuid'];

	var state = keyvalue.get(service + '_uuid_' + uuid);

	// If there is no such UUID on record, boot entirely. Possible replay attack.
	if (state === null) {
		console.log('Error: No such UUID for ' + service + ': ' + state);

		delete data.session[service + '_uuid'];
		res.saveSession(data.session);
		res.statusCode = 307;
		res.setHeader('Location', '/');
		res.end();
		return;
	}

	// If still processing, just cycle around again in one second.
	// Calls usually take 500ms or less.
	if (state === 'wip') {
		res.write(data.boilerplate.pretitle);
		res.write('<title>' + serviceTitle + ' Pre-Login Authorizer - www.pawsr.us</title>');
		res.write(templating.refresh(1, '/preauth/' + service));
		res.write(data.boilerplate.prebody);
		res.write('<p>Requesting unique login token from ' + serviceTitle + '...</p>');
		res.write(data.boilerplate.postbody);
		return;
	}

	// We no longer need the UUID record serverside, so purge it.
	// Note we do *NOT* update the client-side cookie yet, as we may need to add more data to it first.
	keyvalue.delete(service + '_uuid_' + uuid);

	// Not ready and not WIP? Usually an error, but generic response to future-proof.
	if (!state.startsWith('ready:')) {
		console.log('Finished but not ready: ' + state);
		delete data.session[service + '_uuid'];
		res.saveSession(data.session);
		res.write(data.boilerplate.pretitle);
		res.write('<title>' + serviceTitle + ' Pre-Login Authorizer - www.pawsr.us</title>');
		res.write(data.boilerplate.prebody);
		res.write('<p><b>');
		res.write(state.slice(0,1).toUpperCase());
		res.write(state.slice(1).replace(/:/g, '! '));
		res.write('</b></p>');
		res.write('<p><a href=\x22/\x22>Click here to return to the homepage.</a></p>');
		res.write(data.boilerplate.postbody);
		return;
	}

	// YAY, success! *partyfavors*
	// Store the two oauth token bits into the session, save it, and roll the redirect...
	var components = state.split(':');
	data.session[service + '_token_secret'] = components[1];
	data.session[service + '_token'] = components[2];
	res.saveSession(data.session);
	res.statusCode = 307;
	res.setHeader('Location', loginURL + '?oauth_token=' + components[2] + '#');
	res.end();
};

exports.oauth2_initlogin = (data, res, service, clientID, loginURL, scope) => {
	var uuid = nonce();
	data.session[service + '_uuid'] = uuid;
	res.statusCode = 307;
	res.saveSession(data.session);
	res.setHeader('Location', loginURL + '?' + querystring.stringify({
		client_id: clientID
	,	redirect_uri: 'https:\x2F/www.pawsr.us/login/' + service
	,	response_type: 'code'
	,	scope: scope
	,	state: uuid
	}) + '#');
	res.end();
};

exports.oauth2_login = (data, res, serviceTitle, secrets, a_t_url, a_t_auth, u_p_url, u_p_id, u_p_name) => {
	var service = serviceTitle.toLowerCase();

	try {
		if ((data.query.state !== data.session[service + '_uuid'])
		 || (typeof data.query.state === 'undefined')) {
			throw Error('Nonce/State Mismatch - CSRF attack?');
		}
		if (typeof data.query.code === 'undefined') {
			throw Error('OAuth Code missing!');
		}
	} catch (err) {
		console.log('oauth2_login(' + serviceTitle + ') - Error: ' + err.message);

		delete(data.session[service + '_uuid']);

		res.saveSession(data.session);
		res.write(data.boilerplate.pretitle);
		res.write('<title>' + serviceTitle + ' Login Callback - www.pawsr.us</title>');
		res.write(data.boilerplate.prebody);
		res.write('<p><b>Error:</b> ' + serviceTitle + ' did not successfully login.</p>');
		res.write('<p><a href=\x22/\x22>Click here to go back to the homepage, and try again later.</a></p>');
		res.write(data.boilerplate.postbody);
		return;
	}

	var uuid = 'login_' + service + '_' + data.session[service + '_uuid'];
	keyvalue.set(uuid, 'wip');

	res.statusCode = 307;
	res.saveSession(data.session);
	res.setHeader('Location', '/login');
	res.end();

	var params = querystring.stringify({
		client_id:		secrets.clientID
	,	client_secret:		secrets.clientSecret
	,	code:			data.query.code
	,	grant_type:		'authorization_code'
	,	redirect_uri:		'https:\x2F/www.pawsr.us/login/' + service
	}, '&', '=', {encodeURIComponent: x => x});

	var url = _url.parse(a_t_url, false, true);
	url.method = 'POST';
	url.agent = false;
	if (a_t_auth !== null) {
		url.auth = a_t_auth.clientID + ':' + a_t_auth.clientSecret;
	}
	url.headers = {
		'User-Agent': data.user_agent
	,	'Accept': 'application\x2Fjson'
	,	'Content-Type': 'application/x-www-form-urlencoded'
	,	'Content-Length': Buffer.byteLength(params)
	};

	var request = https.request(url, (response) => {
		var buffer = Buffer.alloc(0);
		response.setEncoding('utf8');
		response.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
		});
		response.on('end', () => {
			if (response.statusCode !== 200) {
				console.log('oauth2_login(' + serviceTitle + ') Error - Access_token status code: ' + response.statusCode);
				keyvalue.set(uuid, 'error:' + response.statusCode);
				return;
			}

			var results = JSON.parse(buffer.toString('utf8'));
			if (typeof results.access_token === 'undefined') {
				console.log('oauth2_login(' + serviceTitle + ') Error - No access_token returned');
				keyvalue.set(uuid, 'error:No access_token returned');
				return;
			}

			url = _url.parse(u_p_url, false, true);
			url.method = 'GET';
			url.agent = false;
			url.headers = {
				'User-Agent': data.user_agent
			,	'Accept': 'application\x2Fjson'
			,	'Authorization': 'Bearer ' + results.access_token
			};

			var request = https.request(url, (response) => {
				var buffer = Buffer.alloc(0);
				response.setEncoding('utf8');
				response.on('data', (chunk) => {
					buffer = Buffer.concat([buffer, Buffer.from(chunk, 'utf8')]);
				});
				response.on('end', () => {
					if (response.statusCode !== 200) {
						console.log('oauth2_login(' + serviceTitle + ') Error - Profile status code: ' + response.statusCode);
						keyvalue.set(uuid, 'error:' + response.statusCode);
						return;
					}

					var results = JSON.parse(buffer.toString('utf8'));

					require('../utils/login_complete.js')(data.session.userid, serviceTitle, uuid, results[u_p_id], results[u_p_name]);
				});
			});
			request.on('error', (e) => {
				console.log('oauth2_login(' + serviceTitle + ') Error - Problem with profile request: ' + e.message);
				keyvalue.set(uuid, 'error:' + serviceTitle + ' API request failure.');
			});
			request.end();
		});
	});
	request.on('error', (e) => {
		console.log('oauth2_login(' + serviceTitle + ') Error - Problem with access_token request: ' + e.message);
		keyvalue.set(uuid, 'error:' + serviceTitle + ' API request failure.');
	});
	request.write(params);
	request.end();
};
