exports.register = (endpoints, shared_data) => {
	console.log('Adding Twitter service');
	shared_data.services.push('twitter');

	console.log('Registering /login/twitter');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (data, res) => {



res.write(data.boilerplate.pretitle);
res.title('Twitter - Login - www.pawsr.us');
res.write(data.boilerplate.prebody);
res.write('<p>Process callback from Twitter for login...</p>');
res.write(data.boilerplate.postbody);



		}
	});
}
