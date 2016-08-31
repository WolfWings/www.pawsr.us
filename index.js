// We only use http, url, path, and fs once each, so there's no 'require' boilerplate

var secrets = require('./secrets.js').secrets;
var aead = require('./aead.js');

// Endpoints uses the following structure:
//	uri: NON-REGEX uri to match against, including leading /
//	routine: Function called w/ (query, headers, res) parameters
//
// Use a recursive loader to load in all the routes to keep things tidy
//
// Each file called MUST have a 'register' function that takes the endpoints
// array as a parameter, and updates the array however it sees fit. Usually
// this will be via a simple .push() call adding it's two-entry object, but
// it is left open in case alternative approaches become required.
var endpoints = [];
require('fs').readdirSync(require('path').join(__dirname, 'routes')).forEach((file) => {
	require('./routes/' + file).register(endpoints);
});

// Build the HTTP listener server
//
// Default action is to just close the socket as a failsafe
var server = require('http').createServer((req, res) => {
	res.end;
});

// Send a proper 400 if the client is sending screwy requests
server.on('clientError', (err, socket) => {
	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Actual request handler here
//
// Parse the URI to split out the query, DRY concept in action
//
// Also parse out the 'cookies' from the headers
server.on('request', (raw, res) => {
	var tmp = require('url').parse(raw.url, true);
	var uri = tmp.pathname;
	var query = tmp.query;

	// Cookie parsing over-simplified here
	var cookies = {};
	var rawcookies = '';
	if (raw.headers.hasOwnProperty('cookies')) {
		rawcookies = ';' + raw.headers.cookies;
	}
	rawcookies.split(';').slice(1).forEach((x, i, a) => {
		var t = x.trim();
		var j = t.indexOf('=');
		// Naked "key" handler without an =
		if (j === -1) {
			cookies[t] = null;
		} else {
			cookies[t.slice(0, j)] = t.slice(j + 1);
		}
	});

	// Now we process the session cookie if needed, using AEAD
	if (cookies.hasOwnProperty('session')) {
		try {
			var decoded = aead.decrypt(cookies['session'], secrets.server_key);
			cookies.session = JSON.parse(decoded);
		} catch (e) {
			console.log(e);
			console.log(cookies.session);
			delete cookies.session;
		}
	}

	console.log(cookies);

	var f = endpoints.find(i => i.uri === uri);

	if (typeof(f) !== 'undefined') {
		f.routine(cookies, query, res);
	} else {
		res.write('Unknown URI!');
		res.write('Cookies:\r\n' + JSON.stringify(cookies, null, '\t') + '\r\n');
		res.write('Query: ' + JSON.stringify(query, null, '\t') + '\r\n');
		res.write('URI: ' + uri);
	}
	res.end('\r\n');
});

// Finally select a listening port
server.listen(8000);

console.log(secrets);
