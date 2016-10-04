const keyvalue = require('../utils/keyvalue.js');
const templating = require('../utils/templating.js');

module.exports = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



var refresh = false;
var updatesession = false;
var services = [];

return Promise.all(data.services.map((x) => {
	var service = x.name.toLowerCase();

	return new Promise((resolve, reject) => {
		if (typeof data.session[service + '_uuid'] !== 'string') {
			resolve(null);
		} else {
			return Promise.resolve(keyvalue.get('login_' + service + '_' + data.session[service + '_uuid'])
			).then(status => {
				if (status === 'wip') {
					refresh = true;
				} else if (status === null) {
					delete data.session[service + '_uuid'];
					updatesession = true;
				} else if ((typeof status === 'string')
				        && (status.startsWith('ready:'))) {
					data.session.userid = parseInt(status.slice(6));
					keyvalue.delete('login_' + service + '_' + data.session[service + '_uuid']);
					delete data.session[service + '_uuid'];
					updatesession = true;
					status = null;
				}
				return Promise.resolve(status);
			});
		}
	}).then(status => {
		services.push({
			name: x.name
		,	status: status === null ? undefined : status
		,	login_url: x.login_url
		});
		return Promise.resolve(true);
	});
})).then(() => {

	if (updatesession) {
		res.saveSession(data.session);
	}

	res.write(global.templates.login({
		title: 'Login - www.pawsr.us'
	,	refresh: refresh
	,	services: services
	}));

	res.end();

	return Promise.resolve();
});



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
