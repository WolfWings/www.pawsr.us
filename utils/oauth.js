const crypto = require('crypto');
const querystring = require('querystring');

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
