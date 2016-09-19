const http = require('http');
const crypto = require('crypto');
const util = require('./util.js');

// Load the routes details
var routes = require('./routes');
const shared_data = routes.shared_data;
const endpoints = routes.endpoints;
delete routes;

// Build the database connection at the central level
var database = require('./database.js');

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
		res.statusCode = 404;
		res.end('<!doctype html><html><head><meta http-equiv=\x22refresh\x22 content=\x220; url=/\x22></head><body></body></html>', 'utf8');
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
		// Naked key handler without an =
		if (j === -1) {
			cookies[t] = null;
		} else {
			cookies[t.slice(0, j)] = t.slice(j + 1);
		}
	});

	// Now we process the session cookie if needed, using AEAD
	// Note the 9-character padding is due to the base64base64
	// effective encoding. It adds 16 characters to both ends.
	var session = {};
	if (typeof cookies['session'] !== 'undefined') {
		try {
			var decoded = '{' + aead.decrypt(cookies['session'], server_key).slice(12, -12) + '}';
			console.log('Session: ' + decoded);
			session = JSON.parse(decoded, util.JSONreviver);
			if (typeof session.userid === 'string') {
				session.userid = parseInt(session.userid);
			}
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
		var sessioncookie =
			crypto.randomBytes(9).toString('base64')
		+	JSON.stringify(session, util.JSONreplacer).slice(1, -1)
		+	crypto.randomBytes(9).toString('base64');
		try {
			sessioncookie = aead.encrypt(sessioncookie, server_key);
		} catch (e) {
			console.log(e);
			console.log(session);
		} finally {
			res.setHeader('Set-Cookie', 'session=' + sessioncookie + '; HttpOnly; Path=/; Domain=.pawsr.us');
		}
	}

	res.deleteSession = () => {
		res.setHeader('Set-Cookie', 'session=..wolf.TVk2UngFOJyCqvu3gVt8Ag; HttpOnly; Path=/; Domain=.pawsr.us; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
	}

	res.database = database;

	console.time(uri);
	tempdata = JSON.parse(shared_data);
	tempdata.query = parsedurl.query;
	tempdata.session = session;
	res.setHeader('Content-Type', 'text/html');
	route.routine(tempdata, res);
	if (res.finished !== true) {
		res.end();
	}
	console.timeEnd(uri);
});

// Finally select a listening port
server.listen(8000);
