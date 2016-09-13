const docstore = require('./docstore.js');

exports.loginsuccess = (service, uid, name) => {
	var lock = null;
	lock = docstore.lock('users');
	if (lock === null) {
		return null;
	}
	var users = docstore.get('users');
	if (users === null) {
		users = {
			nextid: -1
		,	data: [
			]
		};
	}
	var user = users.data.findIndex((u) => {
		return u.services.some((s) => {
			return ((s.uid === uid)
			     && (s.service === service));
		});
	});
	if (user === -1) {
		users.nextid = users.nextid + 1;
		users.data.unshift({
			uid: users.nextid
		,	services: {
				uid: uid
			,	service: service
			,	name: name
			}
		})
		user = 0;
	}
	docstore.set('users', users);
	docstore.unlock('users', lock);
	return users.data[user].uid;
}
