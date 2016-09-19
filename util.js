const crypto = require('crypto');
const escape = require('querystring').escape;
const keyvalue = require('./keyvalue.js');

exports.refresh = (timeout, url) => {
	return	'<meta http-equiv=\x22Refresh\x22 content=\x22' + timeout + ';URL=' + url + '\x22 />';
};

exports.noscriptrefresh = (timeout, url) => {
	return	'<script>document.write(\x22\\x3Cscript>\x2F*\x22);</script>'
	+	exports.refresh(timeout, url)
	+	'<script>\x2F**\x2F</script>';
};

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

exports.complete_login = (service, uuid, user_id, screen_name, custom_url) => {
	keyvalue.set(uuid, 'error:Code path unimplemented for ' + service + '!');
}
