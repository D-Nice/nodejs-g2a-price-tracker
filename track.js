//G2A track
'use strict';

const https = require('https'),
fs = require('fs'),
notifier = require('node-notifier'),
open = require('open'),
schedule = require('node-schedule');

//timeout per http request in minutes
//must be at least as large as games.length, and share denominator
const timeout = 2;

//contains 2-d json Array.
let games = JSON.parse(fs.readFileSync('games.json'));

//
var checkPrice = (game) => {	
	https.get(`https://www.g2a.com/marketplace/product/auctions/?id=${game[1]}`, (res) => {
		res.on('data', (chunk) => {
			let parsed = JSON.parse(chunk).a;
			let lowest = Object.keys(parsed)[0];
			let price = parsed[lowest].p;
			compareAndNotify(price, game);
		});

		res.resume();
	}).on('error', (e) => {
		console.log(`Got error: ${e.message}`);
	});
}

for (let i = 0; i < games.length; i++) {
	//
	let offset = (i % (timeout / (games.length) + 1));
	//multiplier variant
	//let offset = (i * (timeout / (games.length)));
	//console.log(`scheduling ${games[i][0]} ${offset}`);
	schedule.scheduleJob(`${offset}-59/${timeout} * * * *`, () => {
		checkPrice(games[i]);
	});
}

var compareAndNotify = (sellprice, game) => {
	if(sellprice <= game[2]) {
		let time = new Date().toLocaleTimeString();
		let msg = `${game[0]} is on sale for $${parseFloat(sellprice).toFixed(2)}, your wanted price is $${game[2].toFixed(2)}`;
		console.log(`${time} : ${msg}`);
		beep(3);
		notifier.notify({
			title: 'A Game is on SALE!!!',
			message: msg,
			wait: true // Wait with callback, until user action is taken against notification
		}, (err, response) => {

		}).on('click', (notifierObject, options) => {
			// Triggers if `wait: true` and user clicks notification
			open(game[3]);
		});
	}
}

var beep = (t) => {
	process.stdout.write("\x07");
	t--;
	if (t > 0)
		beep(t);
}