// GLOBALS
"use strict"

let fs = require("fs");
let blessed = require("blessed");
let contrib = require("blessed-contrib");
let childProcess = require("child_process");
let Gdax = require("gdax");

let MAX_HEADLINE_LENTH = 35;
var helpOpenCloseCount = 0;
// TODO: Figure out how to write to home directory.
// const dotfilePath = "~/.bitvision";
const dotfilePath = ".bitvision";
var gdaxClient = new Gdax.PublicClient();

let strings = {
	autotrading: "## Automatic Trading\n\n 1. Enter account credentials \n 2. Press \`T\` to toggle this option.\n 3. Enter the max amount you\"d like to trade.\n 3.5. Watch our algorithm trade BTC for you.\n 4. Profit",
	authors: "\n\n## Authors\n\n Written by Jon Shobrook and Aaron Lichtman.\n -> https://www.github.com/shobrook\n -> https://www.github.com/alichtman",
	warning: "\n\n## Warning\n\n Use this software to trade bitcoin at your own risk.\n We are not responsible if our algorithm misbehaves.",
	source: "\n\n## Source Code\n\n -> https://github.com/shobrook/BitVision"
};

let screen = blessed.screen({
	smartCSR: true,
	title: "Bitvision"
})

// Quit functionality
screen.key(["escape", "q", "C-c"], function(ch, key) {
	return process.exit(0);
});

const log = (text) => {
	logs.pushLine(text);
	screen.render();
}

// DOTFILE RELATED FUNCTIONS

/**
 * Creates dotfile with default values if it doesn't exist.
 */
 function createDotfileIfNeeded() {
 	log("Checking for dotfile")
 	fs.stat(dotfilePath, function(err, stat) {
 		// console.log(err)
 		if (err == null) {
 			return
 		} else if (err.code == "ENOENT") {
 			console.log("No dotfile found. Creating.")
 			// Create file
 			let fileContent = {
 				"credentials" : {
 					"key" : "",
 					"secret" : "",
 					"passphrase" : ""
 				},
 				"autotrade" : {
 					"enabled" : false,
 					"next-trade-timestamp-UTC" : 0,
 					"next-trade-amount" : 0,
 					"next-trade-side" : "",
 				},
 			}

 			let json = JSON.stringify(fileContent)
 			console.log(json)
 			console.log(dotfilePath)
 			fs.writeFile(dotfilePath, json, (err) => {
 				if (err) throw err;
 				console.log('The file has been saved!');
 			});
 		}
 	});
 }

/**
 * Gets credentials from config file.
 *
 * @return {Dict} Credentials.
 */
 function getCredentials() {
 	var config = JSON.parse(dotfilePath)
 	return config.credentials
 }

/**
 * Clear credentials by removing the dotfile.
 */
 function clearCredentials() {
 	fs.unlink(dotfilePath, (err) => {
 		if (err) throw err;
 		console.log(`${dotfilePath} was deleted.`);
 	});
 }


// COINBASE FUNCTIONS

/**
 * Replaces public Coinbase client with authenticated client so trades can be placed.
 */
 function authenticateWithCoinbase() {
 	let credentials = getCredentials()
 	let key = credentials.key;
	let secret = btoa(credentials.secret) // base64 encoded secret
	let passphrase = credentials.passphrase

	// DO NOT USE
	// let apiURI = "https://api.pro.coinbase.com";
	let sandboxURI = "https://api-public.sandbox.pro.coinbase.com";

	gdaxClient = new Gdax.AuthenticatedClient(key,
	                                          secret,
	                                          passphrase,
	                                          sandboxURI);
}


/**
 * Returns the current BTC price in USD.
 *
 * @return {Double} Current bitcoin price
 */
 function getUpdatedBitcoinPrice() {
 	gdaxClient.getProductTicker("ETH-USD", (error, response, data) => {
 		if (error) {
 			console.log("ERROR")
 		} else {
 			return data["price"]
 		}
 	});
 }

/**
 * Creates a buy order.
 * @param  {Double} price In this format: "100.00"
 * @param  {Double} size  [description]
 */
 function createBuyOrder(price, size, callback) {
	// Buy 1 BTC @ 100 USD
	let buyParams = {
		price: `${price}`, // USD
		size: `${size}`, // BTC
		product_id: "BTC-USD"
	};
	authedClient.buy(buyParams, callback);
}

/**
 * Creates a sell order.
 * @param  {Double} price
 * @param  {Double} size  [description]
 */
 function createSellOrder(price, size, callback) {
 	let sellParams = {
  	price: `${price}`, // USD
  	size: `${size}`, // BTC
  	product_id: "BTC-USD"
  };
  authedClient.sell(sellParams, callback);
};

function displayLoginScreen() {

}

// CLI ACTION METHODS

function focusOnHeadlines() {
	headlineTable.focus()
}

// Help menu

var helpMenuLayout = null

/**
 * Display help screen as overlay.
 */
 function displayHelpScreen() {

 	helpOpenCloseCount++;

 	let helpMenuData = [ [ "Keybinding",  "Action" ],
 	[ "---", "---"],
 	[ "H", "Open help menu"],
 	[ "I", "Focus on headlines"],
 	[ "C", "Clear Credentials"],
 	[ "L", "Login"],
 	[ "O", "Open, changes depending on focus."],
 	[ "T", "Toggle automatic trading"],
 	[ "V", "Show version and author info"] ];

 	helpMenuLayout = blessed.layout({
 		parent: screen,
 		top: "center",
 		left: "center",
 		width: 80,
 		height: 36,
 		border: "line",
 		style: {
 			border: {
 				fg: "blue"
 			}
 		}
 	});

 	var keybindingsTable = blessed.listtable({
 		parent: helpMenuLayout,
 		interactive: false,
 		top: "center",
 		left: "center",
 		data: helpMenuData,
 		border: "line",
 		pad: 2,
 		width: 53,
 		height: 10,
 		style: {
 			border: {
 				fg: "bright-blue"
 			},
 			header: {
 				fg: "bright-green",
 				bold: true,
 				underline: true,
 			},
 			cell: {
 				fg: "yellow",
 			}
 		}
 	});

 	var exitTextBox = blessed.box({
 		parent: helpMenuLayout,
 		width: 25,
 		height: 3,
 		left: "right",
 		top: "center",
 		padding: {
 			left: 2,
 			right: 2,
 		},
 		border: "line",
 		style: {
 			fg: "white",
 			border: {
 				fg: "red",
 			}
 		},
 		content: "Press h to close."
 	});

 	var largeTextBox = blessed.box({
 		parent: helpMenuLayout,
 		width: 78,
 		height: 24,
 		left: "center",
 		top: "center",
 		padding: {
 			left: 2,
 			right: 2,
 		},
 		border: "line",
 		style: {
 			fg: "bright-green",
 			border: {
 				fg: "bright-blue",
 			}
 		},
 		content: strings["autotrading"] + strings["authors"] + strings["warning"] + strings["source"]
 	});
 }

 function destroyHelpScreen() {
 	helpOpenCloseCount++;
 	helpMenuLayout.destroy()
 }

/**
* Execute shell command.
**/
function executeShellCommand(command) {
	console.log(command)
	let args = command.split(" ")
  // Remove first element
  let program = args.splice(0, 1)[0];
  console.log(args)
  console.log(program)
  let cmd = childProcess.spawn(program, args);

  cmd.stdout.on("data", function(data) {
  	console.log("OUTPUT: " + data);
  });

  cmd.on("close", function(code, signal) {
  	console.log("command finished...");
  });
}

// PYTHON CONTROL METHODS

function refreshData() {
	executeShellCommand("python3 refresh_data.py")
}

function retrainModel() {
	executeShellCommand("python3 retrain_model.py")
}

// Data generation methods

function getRandomInteger(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)

	return Math.floor(Math.random() * (max - min)) + min
}

function getRandomSentiment() {
	return String(Math.random().toFixed(2))
}

function getRandomDate() {
	let month = Math.floor(Math.random() * 12) + 1
	let day = Math.floor(Math.random() * 30) + 1
	return `${month}/${day}`
}

function getRandomHeadline() {
	let possiblities = [ "Zerocoin's widget promises Bitcoin privacy",
	"Bitcoin is bad news for stability",
	"WikiLeaks' Assange hypes bitcoin in secret talk",
	"Butterfly Labs' Jalapeno aims to spice up bitcoin mining",
	"Are alternative Ecoins 'anti-bitcoins'?",
	"Canada to tax bitcoin users",
	"Google Ventures invests in Bitcoin competitor OpenCoin",
	"Economists wrestle with Bitcoin's 'narrative problem'" ]
	return possiblities[Math.floor(Math.random() * possiblities.length)]
}

// Utilities

function trimIfLongerThan(text, len) {
	if (text.length > len) {
		return text.slice(0, len)
	} else {
		return text
	}
}

function setLineData(mockData, line) {
	for (var i=0; i<mockData.length; i++) {
		var last = mockData[i].y[mockData[i].y.length-1]
		mockData[i].y.shift()
		var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)
		mockData[i].y.push(num)
	}

	line.setData(mockData)
}

/**
 * Takes three arrays and zips them into a list of lists like this:
 *
 * [1,2,3]
 * [a,b,c] -> [ [1,a,!], [2,b,@], [3,c,#] ]
 * [!,@,#]
 */
 function zipThreeArrays(a, b, c) {
 	let zipped = []
 	for (var i = 0; i < a.length; i++) {
 		zipped.push([a[i], b[i], c[i]])
 	}
 	return zipped
 }

// Takes dictionary with key -> list pairs and returns a list of lists.
function unpackData(dict) {
	var listOfIndicatorData = []
	Object.keys(dict["data"]).forEach(function(key) {
		listOfIndicatorData.push([key, dict["data"][key]["value"], dict["data"][key]["signal"]])
	});

	return listOfIndicatorData
}

var signalEnum = Object.freeze ({ buy: "BUY", sell: "SELL" });

let networkIndicatorData = {
	"name": "NETWORK_DATA",
	"data": {
		"Confirmation Time": { value: "42ms", signal: signalEnum.buy },
		"Block Size": { value: "129MB", signal: signalEnum.sell },
		"Avg Transaction Cost": { value: "Val", signal: signalEnum.buy },
		"Difficulty": { value: "Val", signal: signalEnum.sell },
		"Transaction Value": { value: "Val", signal: signalEnum.buy },
		"Hash Rate": { value: "Val", signal: signalEnum.sell },
		"Transactions per Block": { value: "Val", signal: signalEnum.sell },
		"Unique Addresses": { value: "Val", signal: signalEnum.buy },
		"Total BTC": { value: "Val", signal: signalEnum.sell },
		"Transaction Fees": { value: "Val", signal: signalEnum.buy },
		"Transactions per Day": { value: "Val", signal: signalEnum.sell }
	}
}

let technicalIndicatorData = {
	"name": "TECHNICAL_INDICATORS",
	"data": {
		"Rate of Change Ratio": { value: "Val", signal: signalEnum.buy },
		"Momentum": { value: "Val", signal: signalEnum.sell },
		"Avg Directional Index": { value: "Val", signal: signalEnum.buy },
		"Williams %R": { value: "Val", signal: signalEnum.sell },
		"Relative Strength Index": { value: "Val", signal: signalEnum.buy },
		"Moving Avg Convergence Divergence": { value: "Val", signal: signalEnum.sell },
		"Avg True Range": { value: "Val", signal: signalEnum.sell },
		"On-Balance Volume": { value: "Val", signal: signalEnum.buy },
		"Triple Exponential Moving Avg": { value: "Val", signal: signalEnum.sell }
	}
}

// Placing widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

// Place tables on the left side of the screen.

var headlineTable = grid.set(0, 0, 4, 4, contrib.table,
                             { keys: true
                             	, fg: "green"
                             	, label: "Headlines"
                             	, interactive: true
                             	, columnSpacing: 1
                             	, columnWidth: [7, 38, 10]
                             })

var technicalTable = grid.set(4, 0, 3.5, 4, contrib.table,
                              { keys: true
                              	, fg: "green"
                              	, label: "Technical Indicators"
                              	, interactive: false
                              	, columnSpacing: 1
                              	, columnWidth: [35, 10, 10]
                              })

var networkTable = grid.set(7.2, 0, 4, 4, contrib.table,
                            { keys: true
                            	, fg: "green"
                            	, label: "Network Indicators"
                            	, interactive: false
                            	, columnSpacing: 1
                            	, columnWidth: [35, 10, 10]})

// Line chart on the right of the tables

var exchangeRateCurve = grid.set(0, 4, 6, 6, contrib.line, {
	style: {
		line: "yellow",
		text: "green",
		baseline: "black"
	},
	xLabelPadding: 3,
	xPadding: 5,
	showLegend: true,
	wholeNumbersOnly: false,
	label: "Exchange Rate"
})

// Countdown under chart

var countdown = grid.set(6, 4, 3, 3, contrib.lcd, {
	segmentWidth: 0.06,
	segmentInterval: 0.10,
	strokeWidth: 0.1,
	elements: 4,
	display: "0000",
	elementSpacing: 4,
	elementPadding: 2,
	color: "white", // color for the segments
	label: "Minutes Until Next Trade"
})

var logs = grid.set(6, 7, 5, 4, blessed.box, {
	label: "Activity Log",
	top: 0,
	left: 0,
	height: "100%-1",
	width: "100%",
})

let menubar = blessed.listbar({
	parent: screen,
	mouse: true,
	keys: true,
	bottom: 0,
	left: 0,
	height: 1,
	commands: {
		"Toggle Trading": {
			keys: [ "t", "T" ],
			callback: () => {
				log("Toggle Trading")
				// toggleTrading()
			}
		},
		"Refresh Data": {
			keys: [ "r", "R" ],
			callback: () => {
				log("Refresh Data")
				// refreshData()
			}
		},
		"Coinbase Login": {
			keys: [ "l", "L" ],
			callback: () => {
				log("Login")
				// login()
			}
		},
		"Clear Credentials": {
			keys: [ "c", "C" ],
			callback: () => {
				log("Clear Credentials")
				clearCredentials()
			}
		},
		"Buy BTC": {
			keys: [ "b", "B" ],
			callback: () => {
				log("Buy BTC")
				// buyBitcoin()
			}
		},
		"Sell BTC": {
			keys: [ "s", "S" ],
			callback: () => {
				log("Sell BTC")
				// sellBitcoin()
			}
		},
		"Help": {
			keys: [ "h", "H" ],
			callback: () => {
				if (helpOpenCloseCount % 2 == 0) {
					log("Help Menu Opened")
					displayHelpScreen()
				} else {
					log("Help Menu Closed")
					destroyHelpScreen()
				}

			}
		},
		"Exit": {
			keys: [ "q", "Q", "C-c", "escape" ],
			callback: () => process.exit(0)
		}
	}
})

// Resizing
screen.on("resize", function() {
	technicalTable.emit("attach");
	networkTable.emit("attach");
	headlineTable.emit("attach");
	exchangeRateCurve.emit("attach");
	countdown.emit("attach");
	menubar.emit("attach");

});

// TESTING DATA

let headlineDates = [...Array(16).keys()].map((key) => {
	return getRandomDate()
})

let headlines = [...Array(16).keys()].map((key) => {
	return getRandomHeadline()
})

let headlineSentiment = [...Array(16).keys()].map((key) => {
	return getRandomSentiment()
})

let headlinesTrimmed = headlines.map(str => trimIfLongerThan(str, MAX_HEADLINE_LENTH));
let headlinesZipped = zipThreeArrays(headlineDates, headlinesTrimmed, headlineSentiment)

let networkIndicators = unpackData(networkIndicatorData)
let technicalIndicators = unpackData(technicalIndicatorData)

let exchangeRateSeries = {
	title: "Exchange Rate",
	x: [...Array(24).keys()].map((key) => {
		return String(key) + ":00"
	}),
	y: [...Array(24).keys()].map((key) => {
		return key * getRandomInteger(1000, 1200)
	})
}

// Set up widget data and focus

headlineTable.setData({ headers: ["Date", "Title", "Sentiment"],
                      data: headlinesZipped})

headlineTable.focus()

headlineTable.on("keypress", function(ch, key) {
	console.log("DEBUG ME")
	if (key.name.toLowerCase() === "o") {
		console.log("OPEN UP")
	}
})

technicalTable.setData({ headers: ["Name", "Value", "Signal"],
                       data: technicalIndicators})

networkTable.setData({ headers: ["Name", "Value", "Signal"],
                     data: networkIndicators})

setLineData([exchangeRateSeries], exchangeRateCurve)

setInterval(function() {
	setLineData([exchangeRateSeries], exchangeRateCurve)
	screen.render()
}, 500)

// START DOING THINGS
createDotfileIfNeeded()

screen.render()
