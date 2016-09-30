exports.refresh = (timeout, url) => {
	return	'<meta http-equiv=\x22Refresh\x22 content=\x22' + timeout + ';URL=' + url + '\x22 />';
};

exports.noscriptrefresh = (timeout, url) => {
	return	'<script>document.write(\x22\\x3Cscript>\x2F*\x22);</script>'
	+	exports.refresh(timeout, url)
	+	'<script>\x2F**\x2F</script>';
};
