function callback_login_twitter(cookies, query, res) {
	res.write('Process callback from Twitter for login...');
}

exports.register = function(endpoints) {
	console.log('Registering /login/twitter...');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: callback_login_twitter
	});
}
