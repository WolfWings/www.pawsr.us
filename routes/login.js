function display_login(cookies, query, res) {
	res.write('Display /login page...');
}

exports.register = function(endpoints) {
	console.log('Registering /login...');
	endpoints.push({
		uri: '/login'
	,	routine: display_login
	});
}
