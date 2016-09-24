module.exports = (endpoints, shared_data) => {
	console.log('Adding Amazon service');
	shared_data.services.push({
		name:		'Amazon'
	,	login_url:	'/initlogin/amazon'
	,	logout_url:	'https:\x2F/www.amazon.com/gp/flex/sign-out.html'
	});
}
