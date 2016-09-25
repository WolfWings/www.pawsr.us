const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');
const _url = require('url');
const keyvalue = require('../utils/keyvalue.js');

exports.nonce = () => {
	return crypto.randomBytes(24).toString('base64').replace(/\x2f/g, '_').replace(/\x2b/g, '-');
};

exports.oauth1_signature = (method, url, params, key, token, hash) => {
	var ordered = '';
	var keys = Object.keys(params).sort().forEach((key) => {
		ordered = ordered + '&' + querystring.escape(key) + '=' + querystring.escape(params[key]);
	});
	var hmac = crypto.createHmac(hash, key + '&' + token);
	hmac.update(method + '&' + querystring.escape(url) + '&' + querystring.escape(ordered.slice(1)));
	return '\x22' + querystring.escape(hmac.digest('base64')) + '\x22';
};

exports.oauth2_initlogin = (data, res, service, clientID, loginURL, scope) => {
	var uuid = exports.nonce();
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
	const service = serviceTitle.toLowerCase();

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

			url = _url.parse(u_p_url);
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
