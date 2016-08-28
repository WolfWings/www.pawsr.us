function display_homepage(cookies, query, res) {
	res.write('Display / page...');
}

exports.register = function(endpoints) {
	console.log('Registering /...');
	endpoints.push({
		uri: '/'
	,	routine: display_homepage
	});
}
