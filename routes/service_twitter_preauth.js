exports.register = (endpoints, shared_data) => {
	console.log('Registering /preauth/twitter');
	endpoints.push({
		uri: '/preauth/twitter'
	,	routine: (data, res) => {



const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const util = require('../util.js');

if (!data.session.hasOwnProperty('twitter_uuid')) {
	res.statusCode = 307;
	res.saveSession(data.session);
	res.setHeader('Location', '/initlogin/twitter');
}

var uuid = data.session['twitter_uuid'];

var state = keyvalue.get('twitter_uuid_' + uuid);

// If there is no such UUID on record, boot entirely. Possible replay attack.
if (state === null) {
	delete data.session['twitter_uuid'];
	res.saveSession(data.session);
	res.statusCode = 307;
	res.setHeader('Location', '/');
}

// If still processing, just cycle around again in one second.
// Calls usually take 500ms or less.
if (state === 'wip') {
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(util.refresh(1, '/preauth/twitter'));
	res.write(data.boilerplate.prebody);
	res.write('<p>Requesting unique login token from twitter...</p>');
	res.write(data.boilerplate.postbody);
	return;
}

// We no longer need the UUID record serverside, so purge it.
// Note we do *NOT* update the client-side cookie yet, as we may need to add more data to it first.
keyvalue.delete('twitter_uuid_' + uuid);

// Errored out? Save session, give a screen with a link, we're done.
if (state.startsWith('error:')) {
	delete data.session['twitter_uuid'];
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error!</b> ' + state.slice(6) + '</p>');
	res.write('<p><a href="/">Click here to return to the homepage.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

// Unhandled state? Corruption possible, abort and provide a link.
if (!state.startsWith('ready:')) {
	delete data.session['twitter_uuid'];
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>Twitter Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Unknown State!</b></p>');
	res.write('<p><a href="/">Click here to return to the homepage.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

// YAY, success! *partyfavors*
// Store the two oauth token bits into the session, save it, and roll the redirect...
var components = state.split(':');
data.session['twitter_token_secret'] = components[1];
data.session['twitter_token'] = components[2];
res.saveSession(data.session);
res.statusCode = 307;
res.setHeader('Location', 'https:\x2F/api.twitter.com/oauth/authenticate?oauth_token=' + components[2] + '#');
res.end();



		}
	});
}
