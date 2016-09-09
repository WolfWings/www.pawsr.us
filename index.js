const fs = require('fs');
const path = require('path');
const http = require('http');

// Shared 'global' data for all routes/endpoints
//
// While generally frowned upon, this is the cleanest way to allow segmented
// addition of additional services supported, and other modular additions.
var shared_data_build = {
	services: []
};

// Endpoints uses the following structure:
//	uri: NON-REGEX uri to match against, including leading /
//	routine: Function called w/ (data, res) parameters
//
// Use a recursive loader to load in all the routes to keep things tidy
//
// Each file called MUST have a 'register' function that takes the endpoints
// array as a parameter, and updates the array however it sees fit. Usually
// this will be via a simple .push() call adding it's two-entry object, but
// it is left open in case alternative approaches become required.
var endpoints = [];
fs.readdirSync(path.join(__dirname, 'routes')).forEach((file) => {
	// Only load ".js" files in the directory non-recursively
	if (fs.statSync('./routes/' + file).isFile()
	 && (path.extname(file) === '.js')
	   ) {
		require('./routes/' + file).register(endpoints, shared_data_build);
	}
});

// Archive the shared_data into JSON format to avoid the per-request
// JSON.stringify call in the object-->JSON-->object cloning process.
console.log('Shared data:');
console.log(JSON.stringify(shared_data_build, null, 2));
const shared_data = JSON.stringify(shared_data_build);
delete shared_data_build;

//
// Build the HTTP listener server
//

// Default action is to just close the socket as a failsafe
var server = http.createServer((req, res) => {
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
	const url = require('url');
	const aead = require('./aead.js');
	const querystring = require('querystring');
	const server_key = Buffer.from(require('./secrets.js').server_key, 'base64');

	var parsedurl = require('url').parse(raw.url, true);
	var uri = parsedurl.pathname;
	var route = endpoints.find(i => i.uri === uri);
	var tempdata;

	// Early bail-out of invalid routes to avoid session decoding when possible
	if (typeof(route) === 'undefined') {
		console.log('Unknown URI: ' + uri);
		res.statusCode = 307;
		res.setHeader('Location', '/');
		res.end('<!doctype html><html><head><meta http-equiv="refresh" content="0; url=/"></head><body></body></html>', 'utf8');
		return;
	}

	// Cookie parsing
	var cookies = {};
	var rawcookies = '';
	if (raw.headers.hasOwnProperty('cookie')) {
		rawcookies = ';' + raw.headers.cookie;
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
		var decoded = aead.decrypt(cookies['session'], server_key);
			session = JSON.parse(decoded);
		} catch (e) {
			console.log(e);
			console.log(cookies.session);
		} finally {
			delete cookies.session;
		}
	}

	// Utility DRY function for storing an updated session-state
	// Note that this must be called manually IF saving changes!
	res.saveSession = (session) => {
		var sessioncookie = '';
		try {
			sessioncookie = aead.encrypt(JSON.stringify(session), server_key);
		} catch (e) {
			console.log(e);
			console.log(session);
		} finally {
			res.setHeader('Set-Cookie', 'session=' + sessioncookie + '; HttpOnly; Path=/; Domain=.pawsr.us');
		}
	}

	console.time(uri);
	tempdata = JSON.parse(shared_data);
	tempdata.query = parsedurl.query;
	tempdata.session = session;
	res.setHeader('Content-Type', 'text/html');
	route.routine(tempdata, res);
	res.end();
	console.timeEnd(uri);
});

// Finally select a listening port
server.listen(8000);
