exports.register = (endpoints, shared_data) => {
	console.log('Adding Twitter service');
	shared_data.services.push({
		name:		'twitter'
	,	login_url:	'/prelogin/twitter'
	});
}
