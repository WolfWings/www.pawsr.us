const crypto = require('crypto');

exports.noscriptrefresh = (timeout, url) => {
	return	'<script>document.write("\\x3Cscript>\x2F*");</script>'
	+	'<meta http-equiv="Refresh" content="' + timeout + ';URL=' + url + '" />'
	+	'<script>\x2F**\x2F</script>';
};

exports.nonce = () => {
	return crypto.randomBytes(24).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
//	return '________________________________';
};
