const fs = require('fs');

exports.register = (endpoints, shared_data) => {
	const ico = fs.readFileSync('./static/favicon/favicon.ico');
	console.log('Registering /favicon.ico');
	endpoints.push({
		uri: '/favicon.ico'
	,	routine: (data, res) => {



res.setHeader('Content-Type', 'image/x-icon');
res.write(ico);



		}
	});

	const png = fs.readFileSync('./static/favicon/favicon.png');
	console.log('Registering /favicon.png');
	endpoints.push({
		uri: '/favicon.png'
	,	routine: (data, res) => {



res.setHeader('Content-Type', 'image/png');
res.write(png);



		}
	});

	const apple = fs.readFileSync('./static/favicon/apple.png');
	console.log('Registering /apple-touch-icon.png');
	endpoints.push({
		uri: '/apple-touch-icon.png'
	,	routine: (data, res) => {



res.setHeader('Content-Type', 'image/png');
res.write(apple);



		}
	});
};
