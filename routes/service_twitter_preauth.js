const querystring = require('querystring');
const https = require('https');

const keyvalue = require('../keyvalue.js');
const secrets = require('../secrets.js').services.twitter;
const util = require('../util.js');

exports.register = (endpoints, shared_data) => {
	console.log('Registering /preauth/twitter');
	endpoints.push({
		uri: '/preauth/twitter'
	,	routine: (data, res) => {



if (typeof data.session.twitter_uuid !== 'string') {
	res.statusCode = 307;
	res.saveSession(data.session);
	res.setHeader('Location', '/initlogin/twitter');
	res.end();
	return;
}

var uuid = data.session['twitter_uuid'];

var state = keyvalue.get('twitter_uuid_' + uuid);

// If there is no such UUID on record, boot entirely. Possible replay attack.
if (state === null) {
	delete data.session['twitter_uuid'];
	res.saveSession(data.session);
	res.statusCode = 307;
	res.setHeader('Location', '/');
	res.end();
	return;
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
	res.write('<p><a href=\x22/\x22>Click here to return to the homepage.</a></p>');
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
	res.write('<p><a href=\x22/\x22>Click here to return to the homepage.</a></p>');
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
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {
			};
			console.log('Testing /preauth/twitter with empty session');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '0'
			};
			keyvalue.delete('twitter_uuid_0');
			console.log('Testing /preauth/twitter with valid session but missing keyvalue');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '1'
			};
			keyvalue.set('twitter_uuid_1', 'wip');
			console.log('Testing /preauth/twitter with valid session and keyvalue "wip"');
			routine(data, res);
			keyvalue.delete('twitter_uuid_1');

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '2'
			};
			keyvalue.set('twitter_uuid_2', 'error:Testing error');
			console.log('Testing /preauth/twitter with valid session and keyvalue "error"');
			routine(data, res);
			keyvalue.delete('twitter_uuid_2');

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '3'
			};
			keyvalue.set('twitter_uuid_3', 'invalid');
			console.log('Testing /preauth/twitter with valid session and keyvalue "invalid"');
			routine(data, res);
			keyvalue.delete('twitter_uuid_3');

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '4'
			};
			keyvalue.set('twitter_uuid_4', 'ready:5:6');
			console.log('Testing /preauth/twitter with valid session and keyvalue "ready"');
			routine(data, res);
			keyvalue.delete('twitter_uuid_4');
		}
	});
}
