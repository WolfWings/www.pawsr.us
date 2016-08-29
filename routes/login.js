exports.register = (endpoints) => {
	console.log('Registering /login...');
	endpoints.push({
		uri: '/login'
	,	routine: (cookies, query, res) => {



res.write('Display /login page...');



		}
	});
}
