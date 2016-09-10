exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



keyvalue = require('../keyvalue.js');

res.saveSession(data.session);
res.write(data.boilerplate.pretitle);
res.write('<title>Login - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Login</p>');
res.write('<ul>');
data.services.forEach((x) => {
	res.write('<li><a href="' + x.login_url + '">' + x.name + '</a>');
	if (data.session.hasOwnProperty(x.name.toLowerCase() + '_uuid')) {
		var status = keyvalue.get('login_' + x.name.toLowerCase() + '_' + data.session[x.name.toLowerCase() + '_uuid']);
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

