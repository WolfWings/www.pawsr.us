exports.register = (endpoints) => {
	console.log('Registering /login');
	endpoints.push({
		uri: '/login'
	,	routine: (data, res) => {



data.session.user = Math.floor(Math.random() * 1000000);
res.saveSession(data.session);
res.write(
`<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.png">`
);



		}
	});
}
