const crypto = require('crypto');
const querystring = require('querystring');

exports.refresh = (timeout, url) => {
	return	'<meta http-equiv="Refresh" content="' + timeout + ';URL=' + url + '" />';
};

exports.noscriptrefresh = (timeout, url) => {
	return	'<script>document.write("\\x3Cscript>\x2F*");</script>'
	+	exports.refresh(timeout, url)
	+	'<script>\x2F**\x2F</script>';
};

exports.nonce = () => {
	return crypto.randomBytes(24).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
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
