exports.register = (endpoints, shared_data) => {
	console.log('Adding Twitter service');
	shared_data.services.push('twitter');

	console.log('Registering /login/twitter');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (data, res) => {



res.write('Process callback from Twitter for login...');



		}
	});
}
