exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



const keyvalue = require('../keyvalue.js');
const util = require('../util.js');
var status;

var refresh = false;
data.services.forEach((x) => {
	try {
		status = keyvalue.get('login_' + x.name.toLowerCase() + '_' + data.session[x.name.toLowerCase() + '_uuid']);
	} catch (err) {
		status = null;
	}
	if (status !== null) {
		if (status.startsWith('ready:')) {
			status = status.split(':');
			keyvalue.delete('login_' + x.name.toLowerCase() + '_' + data.session[x.name.toLowerCase() + '_uuid']);
			delete data.session[x.name.toLowerCate()' + '_uuid'];
			if (typeof data.session[x.name.toLowerCase()] === 'undefined') {
				data.session[x.name.toLowerCase()] = [];
			}
			data.session[x.name.toLowerCase()].push({
				uid: status[1]
			,	name: status[2]
			});
		} else {
			refresh = true;
		}
	}
});
if (refresh === true) {
	res.write(util.refresh(1, '/login'));
}

res.saveSession(data.session);
res.write(data.boilerplate.pretitle);
res.write('<title>Login - www.pawsr.us</title>');

res.write(data.boilerplate.prebody);
res.write('<p>Add/Verify Login</p>');
res.write('<ul>');
data.services.forEach((x) => {

	try {
		status = keyvalue.get('login_' + x.name.toLowerCase() + '_' + data.session[x.name.toLowerCase() + '_uuid']);
	} catch (err) {
		status = null;
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
	if (data.session.hasOwnProperty(x.name.toLowerCase() + '_uuid')) {
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
