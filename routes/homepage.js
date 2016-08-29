exports.register = (endpoints) => {
	console.log('Registering /...');
	endpoints.push({
		uri: '/'
	,	routine: (cookies, query, res) => {



res.write('Display / page...');



		}
	});
};
