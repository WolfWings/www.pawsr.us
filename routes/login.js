exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



const keyvalue = require('../keyvalue.js');
const util = require('../util.js');
var status;

var refresh = false;
var updatesession = false;
data.services.forEach((x) => {
	var service = x.name.toLowerCase();

	if (typeof data.session[service + '_uuid'] === 'undefined') {
		status = null;
	} else {
		try {
			status = keyvalue.get('login_' + service + '_' + data.session[service + '_uuid']);
			if (status === null) {
				delete data.session[service + '_uuid'];
				updatesession = true;
				refresh = true;
			}
		} catch (err) {
			status = null;
		}
	}

	if (status !== null) {
		if (status.startsWith('ready:')) {
			data.session.userid = parseInt(status.slice(6));
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
	res.write(util.refresh(1, '/login'));
}
res.write(data.boilerplate.prebody);
res.write('<p>Add/Verify Login</p>');
res.write('<ul>');
data.services.forEach((x) => {
	var service = x.name.toLowerCase();

	if (typeof data.session[service + '_uuid'] === 'undefined') {
		status = null;
	} else {
		try {
			status = keyvalue.get('login_' + service + '_' + data.session[service + '_uuid']);
		} catch (err) {
			status = null;
		}
	}
	if (status === null) {
		status = '';
	}
	res.write('<li><a href=\x22' + x.login_url);
	if (status === 'wip') {
		res.write(' title=\x22Pending...\x22');
	} else if (status.startsWith('error:')) {
		res.write(' title=\x22Error: ' + status.slice(6) + '\x22');
	} else if (status.startsWith('ready:')) {
		res.write(' title=\x22' + status.split(':')[2] + '\x22');
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
	});
}
