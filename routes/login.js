exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (query, session, res) => {



session.user = Math.floor(Math.random() * 1000000);
res.saveSession(session);
res.write('Display /login page...');



		}
	});
}
