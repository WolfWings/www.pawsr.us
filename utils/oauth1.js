const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const _url = require('url');
const keyvalue = require('./keyvalue.js');
const templating = require('./templating.js');
const nonce = require('./nonce.js');

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
