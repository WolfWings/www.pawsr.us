exports.register = (endpoints, shared_data) => {
	console.log('Adding Twitter service');
	shared_data.services.push({
		name:		'Twitter'
	,	login_url:	'/initlogin/twitter'
	,	logout_uti:	'https://twitter.com/logout'
	});
}
