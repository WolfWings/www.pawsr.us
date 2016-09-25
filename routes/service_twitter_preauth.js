const serviceTitle = 'Twitter';
const service = serviceTitle.toLowerCase();

const querystring = require('querystring');
const https = require('https');

const templating = require('../utils/templating.js');
const keyvalue = require('../utils/keyvalue.js');
const secrets = require('../secrets.js').services[service];

module.exports = (endpoints, shared_data) => {
	console.log('Registering /preauth/' + service);
	endpoints.push({
		uri: '/preauth/' + service
	,	routine: (data, res) => {



if (typeof data.session[service + '_uuid'] !== 'string') {
	res.statusCode = 307;
	res.saveSession(data.session);
	res.setHeader('Location', '/initlogin/' + service);
	res.end();
	return;
}

var uuid = data.session[service + '_uuid'];

var state = keyvalue.get(service + '_uuid_' + uuid);

// If there is no such UUID on record, boot entirely. Possible replay attack.
if (state === null) {
	delete data.session[service + '_uuid'];
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
	res.write('<title>' + serviceTitle + ' Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(templating.refresh(1, '/preauth/' + service));
	res.write(data.boilerplate.prebody);
	res.write('<p>Requesting unique login token from ' + serviceTitle + '...</p>');
	res.write(data.boilerplate.postbody);
	return;
}

// We no longer need the UUID record serverside, so purge it.
// Note we do *NOT* update the client-side cookie yet, as we may need to add more data to it first.
keyvalue.delete(service + '_uuid_' + uuid);

// Errored out? Save session, give a screen with a link, we're done.
if (state.startsWith('error:')) {
	delete data.session[service + '_uuid'];
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>' + serviceTitle + ' Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Error!</b> ' + state.slice(6) + '</p>');
	res.write('<p><a href=\x22/\x22>Click here to return to the homepage.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

// Unhandled state? Corruption possible, abort and provide a link.
if (!state.startsWith('ready:')) {
	delete data.session[service + '_uuid'];
	res.saveSession(data.session);
	res.write(data.boilerplate.pretitle);
	res.write('<title>' + serviceTitle + ' Pre-Login Authorizer - www.pawsr.us</title>');
	res.write(data.boilerplate.prebody);
	res.write('<p><b>Unknown State!</b></p>');
	res.write('<p><a href=\x22/\x22>Click here to return to the homepage.</a></p>');
	res.write(data.boilerplate.postbody);
	return;
}

// YAY, success! *partyfavors*
// Store the two oauth token bits into the session, save it, and roll the redirect...
var components = state.split(':');
data.session[service + '_token_secret'] = components[1];
data.session[service + '_token'] = components[2];
res.saveSession(data.session);
res.statusCode = 307;
res.setHeader('Location', 'https:\x2F/api.twitter.com/oauth/authenticate?oauth_token=' + components[2] + '#');
res.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;

			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /preauth/' + service + ' with empty session');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {};
			data.session[service + '_uuid'] = '0';
			console.log('Testing /preauth/' + service + ' with missing keyvalue');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {};
			data.session[service + '_uuid'] = '1';
			keyvalue.set(service + '_uuid_1', 'wip');
			console.log('Testing /preauth/' + service + ' with keyvalue: wip');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {};
			data.session[service + '_uuid'] = '2';
			keyvalue.set(service + '_uuid_2', 'error:_');
			console.log('Testing /preauth/' + service + ' with keyvalue: error:_');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {};
			data.session[service + '_uuid'] = '3';
			keyvalue.set(service + '_uuid_3', 'garbage');
			console.log('Testing /preauth/' + service + ' with keyvalue: garbage');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {};
			data.session[service + '_uuid'] = '4';
			keyvalue.set(service + '_uuid_4', 'ready:5:6');
			console.log('Testing /preauth/' + service + ' with keyvalue: ready:5:6');
			routine(data, res);
		}
	});
}
