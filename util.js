exports.noscriptrefresh = (timeout, url) => {
	return	'<script>document.write("\\x3Cscript>\x2F*");</script>'
	+	'<meta http-equiv="Refresh" content="' + timeout + ';URL=' + url + '" />'
	+	'<script>\x2F**\x2F</script>';
};
