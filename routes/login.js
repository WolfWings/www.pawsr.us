exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



res.saveSession(data.session);
res.write(data.boilerplate.pretitle);
res.write('<title>Login - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Login</p>');
res.write('<ul>');
data.services.forEach((x) => {
	res.write('<li><a href="' + x.login_url + '">' + x.name + '</a></li>');
});
res.write('</ul>');
res.write(data.boilerplate.postbody);
res.end();



		}
	});
}
