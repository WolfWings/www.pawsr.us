const fs = require('fs');
const ico = fs.readFileSync('./static/favicon/favicon.ico');
const png = fs.readFileSync('./static/favicon/favicon.png');
const apple = fs.readFileSync('./static/favicon/apple.png');

module.exports = (endpoints, shared_data) => {
	console.log('Registering various favicon formats');
	endpoints.push({
		uri: '/favicon.ico'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.setHeader('Content-Type', 'image/x-icon');
	res.write(ico);
	res.end();
	resolve();
});



		}
	});

	endpoints.push({
		uri: '/favicon.png'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.setHeader('Content-Type', 'image/png');
	res.write(png);
	res.end();
	resolve();
});



		}
	});

	endpoints.push({
		uri: '/apple-touch-icon.png'
	,	routine: (data, res) => {



return new Promise(resolve => {
	res.setHeader('Content-Type', 'image/png');
	res.write(apple);
	res.end();
	resolve();
});



		}
	});
};
