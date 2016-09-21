const crypto = require('crypto');
const escape = require('querystring').escape;

exports.nonce = () => {
	return crypto.randomBytes(24).toString('base64').replace(/\x2f/g, '_').replace(/\x2b/g, '-');
};

exports.oauth1_signature = (method, url, params, key, token, hash) => {
	var ordered = '';
	var keys = Object.keys(params).sort().forEach((key) => {
		ordered = ordered + '&' + escape(key) + '=' + escape(params[key]);
	});
	var hmac = crypto.createHmac(hash, key + '&' + token);
	hmac.update(method + '&' + escape(url) + '&' + escape(ordered.slice(1)));
	return '\x22' + escape(hmac.digest('base64')) + '\x22';
};
