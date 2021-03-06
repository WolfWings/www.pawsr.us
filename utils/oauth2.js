const https = require('https');
const querystring = require('querystring');
const urlparser = require('url');
const nonce = require('./nonce.js');
const memcache = require('memcache-plus')(require('../secrets.js').memcache);

function get_property(object, property) {
	var parts = property.split('.');
	var tunnel = object;

	// Dig down until we run out of steps, or out of nesting
	while ((parts.length > 0)
	    && (typeof tunnel[parts[0]] !== 'undefined')) {
		tunnel = tunnel[parts[0]];
		parts.shift();
	}

	// If there's any parts left we ran out of nesting
	if (parts.length > 0) {
		return undefined;
	}

	// Even if the last step is missing, we'll return undefined
	return tunnel;
}

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

	return Promise.resolve();
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
		res.write(global.templates.login_failure({
			title: serviceTitle + ' Login Callback - www.pawsr.us'
		,	mode: 'Error'
		,	message: serviceTitle + ' did not successfully login.'
		}));

		return Promise.resolve();
	}

	var uuid = 'login_' + service + '_' + data.session[service + '_uuid'];

	var params = querystring.stringify({
		client_id:		secrets.clientID
	,	client_secret:		secrets.clientSecret
	,	code:			data.query.code
	,	grant_type:		'authorization_code'
	,	redirect_uri:		'https:\x2F/www.pawsr.us/login/' + service
	}, '&', '=', {encodeURIComponent: x => x});

	var url = urlparser.parse(a_t_url, false, true);
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
				memcache.set(uuid, 'error:' + response.statusCode);
				return;
			}

			var results = JSON.parse(buffer.toString('utf8'));
			if (typeof results.access_token === 'undefined') {
				console.log('oauth2_login(' + serviceTitle + ') Error - No access_token returned');
				memcache.set(uuid, 'error:No access_token returned');
				return;
			}

			url = urlparser.parse(u_p_url + '?' + querystring.stringify({
				access_token:	results.access_token
//			,	client_id:	secrets.clientID
//			,	client_secret:	secrets.clientSecret
			}), false, true);
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
						console.log(buffer.toString('utf8'));
						memcache.set(uuid, 'error:' + response.statusCode);
						return;
					}

					var results = JSON.parse(buffer.toString('utf8'));

					require('../utils/login_complete.js')(
						data.session.userid
					,	serviceTitle
					,	uuid
					,	get_property(results, u_p_id)
					,	get_property(results, u_p_name)
					);
				});
			});
			request.on('error', (e) => {
				console.log('oauth2_login(' + serviceTitle + ') Error - Problem with profile request: ' + e.message);
				memcache.set(uuid, 'error:' + serviceTitle + ' API request failure.');
			});
			request.end();
		});
	});
	request.on('error', (e) => {
		console.log('oauth2_login(' + serviceTitle + ') Error - Problem with access_token request: ' + e.message);
		memcache.set(uuid, 'error:' + serviceTitle + ' API request failure.');
	});
	request.write(params);
	request.end();

	return memcache.set(uuid, 'wip').then(() => {
		res.statusCode = 307;
		res.saveSession(data.session);
		res.setHeader('Location', '/login');
		res.end();
		return Promise.resolve();
	});
};
