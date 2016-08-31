exports.register = (endpoints) => {
	console.log('Registering /login/twitter...');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (query, session, res) => {



res.write('Process callback from Twitter for login...');



		}
	});
}
