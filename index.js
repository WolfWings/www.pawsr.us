const http = require('http');
const crypto = require('crypto');
const JSON_utils = require('./utils/JSON.js');
const fs = require('fs');

//
// Compile any templates
//
global.templates = require('dot').process({ path: './templates' });

// Load the routes
var routes = require('./routes');
const shared_data = routes.shared_data;
const endpoints = routes.endpoints;
delete routes;

//
// Build the database connection at the central level
//
global.database = require('./utils/database.js');

//
// Build the HTTP listener server
//
var server = http.createServer((raw, res) => {
	const url = require('url');
	const aead = require('./utils/aead.js');
	const querystring = require('querystring');
	const server_key = Buffer.from(require('./secrets.js').server_key, 'base64');

	var parsedurl = require('url').parse(raw.url, true, true);
	var uri = parsedurl.pathname;
	var route = endpoints.find(i => i.uri === uri);
	var tempdata;

	// Early bail-out of invalid routes to avoid session decoding entirely
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
	rawcookies.split(';').slice(1).forEach(cookie => {
		var i = cookie.indexOf('=');
		// Naked key handler without an =
		if (i === -1) {
			cookies[cookie] = null;
		} else {
			cookies[cookie.slice(0, i).trim()] = cookie.slice(i + 1).trim();
		}
	});

	// Now we process the session cookie if needed, using AEAD
	// Note the 12-character padding is due to the dual-base64
	// effective encoding. It adds 16 characters to both ends.
	// It is not verified or generated in any way, it's purely
	// there to provide a minimal encrypted payload length and
	// remove the known-plaintext outermost {} curly braces.
	var session = {};
	if (typeof cookies['session'] !== 'undefined') {
		try {
			var decoded = '{' + aead.decrypt(cookies['session'], server_key).slice(12, -12) + '}';
			session = JSON.parse(decoded, JSON_utils.JSONreviver);
		} catch (e) {
			console.log(e);
			console.log(cookies.session);
		} finally {
			delete cookies.session;
		}
	}

	// Utility function in case we need to nuke the session, mostly just for logout
	// Centralized here to guarantee we only use one 'dead' session key
	res.deleteSession = () => {
		res.setHeader('Set-Cookie', 'session=...; HttpOnly; Secure; Path=/; Domain=.pawsr.us; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
	}

	// Utility DRY function for storing an updated session-state
	// Note that this must be called manually IF saving changes!
	res.saveSession = (session) => {
		var sessioncookie = JSON.stringify(session, JSON_utils.JSONreplacer).slice(1, -1);
		if (sessioncookie === '') {
			res.deleteSession();
			return;
		}

		sessioncookie =
			crypto.randomBytes(9).toString('base64')
		+	sessioncookie
		+	crypto.randomBytes(9).toString('base64');

		try {
			sessioncookie = aead.encrypt(sessioncookie, server_key);
		} catch (e) {
			console.log(e);
			console.log(session);
		} finally {
			res.setHeader('Set-Cookie', 'session=' + sessioncookie + '; HttpOnly; Secure; Path=/; Domain=.pawsr.us');
		}
	}

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

// Send a proper 400 if the client is sending screwy requests
server.on('clientError', (err, socket) => {
	socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Open up a listening port
server.listen(8000);
