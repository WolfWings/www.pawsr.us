const keyvalue = require('../utils/keyvalue.js');
const templating = require('../utils/templating.js');

module.exports = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



var status;

var refresh = false;
var updatesession = false;
data.services.forEach((x) => {
	var service = x.name.toLowerCase();

	status = null;
	if (typeof data.session[service + '_uuid'] !== 'undefined') {
		status = keyvalue.get('login_' + service + '_' + data.session[service + '_uuid']);

		if (status === null) {
			delete data.session[service + '_uuid'];
			updatesession = true;
			refresh = true;
		}
	}

	if (typeof status === 'string') {
		if (status.startsWith('ready:')) {
			data.session.userid = parseInt(status.slice(6));
			keyvalue.delete('login_' + service + '_' + data.session[service + '_uuid']);
			delete data.session[service + '_uuid'];
			updatesession = true;
		} else if (status === 'wip') {
			refresh = true;
		}
	}
});

if (updatesession) {
	res.saveSession(data.session);
}

res.write(data.boilerplate.pretitle);

res.write('<title>Login - www.pawsr.us</title>');

if (refresh === true) {
	res.write(templating.refresh(1, '/login'));
}

res.write(data.boilerplate.prebody);

res.write('<p>Add/Verify Login</p>');

res.write('<ul>');

data.services.forEach((x) => {
	var service = x.name.toLowerCase();

	status = null;

	if (typeof data.session[service + '_uuid'] !== 'undefined') {
		status = keyvalue.get('login_' + service + '_' + data.session[service + '_uuid']);
	}

	if (status === null) {
		status = '';
	}

	res.write('<li><a href=\x22' + x.login_url);

	if (status === 'wip') {
		res.write(' title=\x22Pending...\x22');
	} else if (status.startsWith('error:')) {
		res.write(' title=\x22Error: ' + status.slice(6) + '\x22');
	}

	res.write('\x22>' + x.name + '</a>');

	if (data.session.hasOwnProperty(service + '_uuid')) {
		res.write('<br><p><b>Status:</b> ' + status + '</p>');
	}

	res.write('</li>');
});

res.write('</ul>');

res.write(data.boilerplate.postbody);

res.end();



		}
	,	test_code_coverage: (routine, res, raw_data) => {
			var data;
			data = JSON.parse(raw_data);
			data.session = {};
			console.log('Testing /login with empty session');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '0'
			};
			keyvalue.delete('login_twitter_0');
			console.log('Testing /login with invalid twitter uuid');
			routine(data, res);

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '1'
			};
			keyvalue.set('login_twitter_1', 'wip');
			console.log('Testing /login with twitter uuid: wip');
			routine(data, res);
			keyvalue.delete('login_twitter_1');

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '2'
			};
			keyvalue.set('login_twitter_2', 'error:Testing');
			console.log('Testing /login with twitter uuid: error');
			routine(data, res);
			keyvalue.delete('login_twitter_2');

			data = JSON.parse(raw_data);
			data.session = {
				twitter_uuid: '3'
			};
			keyvalue.set('login_twitter_3', 'ready:0');
			console.log('Testing /login with twitter uuid: ready');
			routine(data, res);
			keyvalue.delete('login_twitter_3');
		}
	});
}
