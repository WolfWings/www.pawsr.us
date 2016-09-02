// We only use http, url, path, and fs once each, so there's no 'require' boilerplate

var secrets = require('./secrets.js');
var aead = require('./aead.js');

// Application-specific GLOBALS entries
//
// While generally frowned upon, this is the cleanest way to allow segmented
// addition of additional services supported.
//
// In this case, supported 'services' to know what to callback later:
global.services = [];

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

	// Cookie parsing
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
	var session = {};
	if (cookies.hasOwnProperty('session')) {
		try {
			var decoded = aead.decrypt(cookies['session'], secrets.server_key);
			session = JSON.parse(decoded);
		} catch (e) {
			console.log(e);
			console.log(cookies.session);
		} finally {
			delete cookies.session;
		}
	}

	res.saveSession = (session) => {
		var sessioncookie = '';
		try {
			sessioncookie = aead.encrypt(JSON.stringify(session), secrets.server_key);
		} catch (e) {
			console.log(e);
			console.log(session);
		} finally {
			res.setHeader('Set-Cookie', 'session=' + sessioncookie + '; HttpOnly; Path=/');
		}
	}

	var f = endpoints.find(i => i.uri === uri);

	if (typeof(f) === 'undefined') {
		console.log('Unknown URI: ' + uri + '?' + query);
		res.statusCode = 307;
		res.setHeader('Location: /');
		res.end('<!doctype html><html><head><meta http-equiv="refresh" content="1; url=/"></head><body></body></html>', 'utf8');
	} else {
		res.setHeader('Content-Type', 'text/html');
		console.time(uri);
		f.routine(query, session, res);
		console.timeEnd(uri);
		res.end();
	}
});

// Finally select a listening port
server.listen(8000);
