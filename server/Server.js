#!/usr/bin/env/node
var WebSocketServer = require('websocket').server;
var http = require('http');

let tick = 0;
let userCount = 0;
let port = 7080;

function getUserID() {
	return ++userCount;
}

let connectedClients = {};
let userMap = {};
let moved = [];
let cells = [];
let dimx = 100, dimy = 100;

let EMPTY = 'EMPTY';
let BLOCK = 'BLOCK';
let BRICK = 'BRICK';
let BOMB  = 'BOMB0';
let BOMB1 = 'BOMB1';
let BOMB2 = 'BOMB2';
let FIRE  = 'FIRE';

function initializeGrid() {
	for (let row = 0; row < dimy; row++) {
		cells.push([]);
		for (let col = 0; col < dimx; col++) {
			cells[row][col] = {
				state: EMPTY,
				x:     col,
				y:     row,
			}
		}
	}
}

initializeGrid();

var sendUpdate = () => {
	let data = {type: 'tick', clock: tick, grid: cells, userMap: userMap};
	for (client in connectedClients) {
		connectedClients[client].sendUTF(JSON.stringify(data));
	}
	moved = [];
	tick++;
}

setInterval(sendUpdate, 1000);

var server = http.createServer((request, response) => {
	response.writeHead(404);
	response.end();
})

server.listen(port, () => {
	console.log((new Date()) + 'Server listening on port ' + port);
})

wsServer = new WebSocketServer({
	httpServer: server,
});

function checkGrid(x, y) {
	if (x < 0 || y < 0 || x >= dimx || y >= dimy) return false;
	if (cells[x][y].state !== EMPTY) return false;
	return true;
}

wsServer.on('request', (request) => {
	let conn = request.accept('octo-bomber', request.origin);
	let userID = getUserID();
	let coordx = Math.floor(Math.random() * 10), coordy = Math.floor(Math.random() * 10);
	console.log((new Date()) + ' Client ' + request.origin + ' userID: ' + userID + ' at ' + coordx + ',' + coordy);

	connectedClients[userID] = conn;
	userMap[userID] = {x: coordx, y: coordy};

	conn.on('message', (message) => {
		if (message.type === 'utf8') {
			let parsed = JSON.parse(message.utf8Data);
			console.log(parsed);

			if (moved.indexOf(userID) > -1) {
				conn.sendUTF(JSON.stringify({type: 'update', result: 'error', message: 'Already moved this tick, ignoring!'}));
				return;
			}

			let newx = 0, newy = 0;
			switch (parsed.action) {
				case 'moveup':
					newx = coordx, newy = coordy - 1;
					break;
				case 'movedown':
					newx = coordx, newy = coordy + 1;
					break;
				case 'moveleft':
					newx = coordx - 1, newy = coordy;
					break;
				case 'moveright':
					newx = coordx + 1, newy = coordy;
					break;
				case 'getID':
					conn.sendUTF(JSON.stringify({userID: userID}));
					return;
				case 'placebomb':
					cells[coordx][coordy] = {state: BOMB0, x: coordx, y: coordy};
					conn.sendUTF(JSON.stringify({type: 'update', result: 'success', message: 'Bomb placed!'}));
					return;
				default:
					conn.sendUTF(JSON.stringify({type: 'update', result: 'error', message: 'Unknown command'}));
					return;
			}

			if (checkGrid(newx, newy)) {
				conn.sendUTF(JSON.stringify({type: 'update', result: 'success', newx: newx, newy: newy}));
				coordx = newx, coordy = newy;
				userMap[userID] = {x: coordx, y: coordy};
				moved.push(userID);
			} else {
				conn.sendUTF(JSON.stringify({type: 'update', result: 'error', message: 'Invalid movement'}));
			}
		}
	});

	conn.on('close', (reasonCode, description) => {
		console.log((new Date()) + 'Peer ' + conn.remoteAddress + ' has disconnected!');
		delete connectedClients[userID];
		delete userMap[userID];
	});
});

