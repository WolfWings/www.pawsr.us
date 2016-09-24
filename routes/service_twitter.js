module.exports = (endpoints, shared_data) => {
	console.log('Adding Twitter service');
	shared_data.services.push({
		name:		'Twitter'
	,	login_url:	'/initlogin/twitter'
	,	logout_url:	'https:\x2F/twitter.com/logout'
	});
}
