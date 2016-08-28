// We only use http, url, path, and fs once each, so there's no 'require' block up here

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
	delete tmp;

	var cookies = '';
	if (raw.headers.hasOwnProperty('cookies')) {
		cookies = ';' + raw.headers.cookies;
	}
	cookies = cookies.split(';').split(1).map(s => s.trim());
	delete raw;

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
