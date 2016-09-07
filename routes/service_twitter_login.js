exports.register = (endpoints, shared_data) => {
	console.log('Registering /login/twitter');
	endpoints.push({
		uri: '/login/twitter'
	,	routine: (data, res) => {



res.write(data.boilerplate.pretitle);
res.write('<title>Twitter Login Callback - www.pawsr.us</title>');
res.write(data.boilerplate.prebody);
res.write('<p>Process callback from Twitter for login...</p>');
res.write(data.boilerplate.postbody);



		}
	});
}
