#!/usr/bin/env/node
var WebSocketServer = require('websocket').server;
var http = require('http');

let tick = 0;
let userCount = 0;

function getUserID() {
    return ++userCount;
}

let connectedClients = {};
let cells = [];
let dimx = 100, dimy = 100;

let EMPTY = "EMPTY";
let BLOCK = "BLOCK";
let BRICK = "BRICK";
let BOMB  = "BOMB";
let FIRE  = "FIRE";

function initializeGrid() {
    for (let row = 0; row < dimy; row++) {
        cells.push([]);
        for (let col = 0; col < dimx; col++) {
            cells[row][col] = EMPTY;
        }
    }
}

initializeGrid();

var sendUpdate = () => {
    let data = {clock: tick, grid: cells};
    for (client in connectedClients) {
        connectedClients[client].sendUTF(JSON.stringify(data));
    }

    tick++;
}

setInterval(sendUpdate, 1000);

var server = http.createServer((request, response) => {
    response.writeHead(404);
    response.end();
})

server.listen(8080, () => {
    console.log((new Date()) + 'Server listening on port 8080');
})

wsServer = new WebSocketServer({
    httpServer: server,
});

wsServer.on('request', (request) => {
    var conn = request.accept('octo-bomber', request.origin);
    var userID = getUserID();
    console.log((new Date()) + ' Client ' + request.origin + ' userID: ' + userID);

    connectedClients[userID] = conn;

    conn.on('message', (message) => {
        if (message.type === 'utf8') {
            console.log('Received message ' + message.utf8Data + ' from user ' + userID);
            conn.sendUTF(message.utf8Data);
        }
    });

    conn.on('close', (reasonCode, description) => {
        console.log((new Date()) + 'Peer ' + conn.remoteAddress + ' has disconnected!');
        delete connectedClients[userID];
    });
});
