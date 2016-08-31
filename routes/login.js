exports.register = (endpoints) => {
	console.log('Registering /login...');
	endpoints.push({
		uri: '/login'
	,	routine: (query, session, res) => {



res.saveSession(session);
res.write('Display /login page...');



		}
	});
}
