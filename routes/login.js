exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



data.session.user = Math.floor(Math.random() * 1000000);
res.saveSession(data.session);
res.write(data.boilerplate.pretitle);
res.write('<title>Login - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Login</p>');
res.write(data.boilerplate.postbody);



		}
	});
}
