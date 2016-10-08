const memcache = require('memcache-plus')(require('../secrets.js').memcache);

function login_handler(data, res, alax) {
	var refresh = false;
	var updatesession = false;
	var services = [];

	return Promise.all(data.services.map((x) => {
		var service = x.name.toLowerCase();

		return new Promise((resolve, reject) => {
			if (typeof data.session[service + '_uuid'] !== 'string') {
				resolve(null);
				return;
			}

			var keyname = 'login_' + service + '_' + data.session[service + '_uuid'];
			resolve(memcache.get(keyname)
			.then(status => {
				if (status === 'wip') {
					refresh = true;
					return Promise.resolve(status);
				}

				if ((typeof status !== 'string')
				 || (!status.startsWith('ready:'))) {
					delete data.session[service + '_uuid'];
					updatesession = true;
					return Promise.resolve(status);
				}

				data.session.userid = parseInt(status.slice(6));
				delete data.session[service + '_uuid'];
				updatesession = true;
				return memcache.delete(keyname)
				.then(deleted => {
					return Promise.resolve(null);
				});
			})).catch(reason => {
				reject(reason);
			});
		}).then(status => {
			services.push({
				name: x.name
			,	status: status === null ? undefined : status
			,	login_url: x.login_url
			});
			return Promise.resolve(true);
		});
	})).then((r) => {
		return new Promise(resolve => {
			if (updatesession) {
				res.saveSession(data.session);
			}

			if (ajax) {
				res.setHeader('Content-Type', 'application/json');
				if (refresh) {
					res.write(JSON.stringify({
						command: 'wait'
					}));
				} else {
					res.write(JSON.stringify({
						command: 'done'
					}));
				}
			} else {
				res.write(global.templates.login({
					title: 'Login - www.pawsr.us'
				,	refresh: refresh
				,	services: services.sort((a, b) => {
						return a.name.localeCompare(b.name);
					})
				}));
			}

			res.end();
			resolve();
		});
	});
}

module.exports = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



login_handler(data, res, false);



		}
	});
	console.log('Registering /ajax/login');
	endpoints.push({
		uri: '/ajax/login'
	,	routine: (data, res) => {



login_handler(data, res, true);



		}
	});
}
