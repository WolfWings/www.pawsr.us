exports.register = (endpoints) => {
	console.log('Registering /...');
	endpoints.push({
		uri: '/'
	,	routine: (query, session, res) => {



res.write('Display / page...');



		}
	});
};
