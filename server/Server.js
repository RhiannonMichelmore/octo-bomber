#!/usr/bin/env/node
var WebSocketServer = require('websocket').server;
var http = require('http');

let tick = 0;
let userCount = 0;

function getUserID() {
    return ++userCount;
}

let connectedClients = {};
let userMap = {};
let cells = [];
let dimx = 100, dimy = 100;

let EMPTY = 'EMPTY';
let BLOCK = 'BLOCK';
let BRICK = 'BRICK';
let BOMB  = 'BOMB';
let FIRE  = 'FIRE';

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
    let data = {clock: tick, grid: cells, userMap: userMap};
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

function checkGrid(x, y) {
    if (x < 0 || y < 0 || x >= dimx || y >= dimy) return false;
    if (cells[x][y] != EMPTY) return false;
    return true;
}

wsServer.on('request', (request) => {
    let conn = request.accept('octo-bomber', request.origin);
    let userID = getUserID();
    let coordx = Math.floor(Math.random() * dimy), coordy = Math.floor(Math.random() * dimx);
    console.log((new Date()) + ' Client ' + request.origin + ' userID: ' + userID + ' at ' + coordx + ',' + coordy);

    connectedClients[userID] = conn;
    userMap[userID] = {x: coordx, y: coordy};

    conn.on('message', (message) => {
        if (message.type === 'utf8') {
            let parsed = JSON.parse(message.utf8Data);
            let newx = 0, newy = 0;
            switch (parsed.action) {
                case 'moveup':
                    newx = coordx, newy = coordy - 1;
                    if (checkGrid(newx, newy)) {
                        conn.sendUTF(JSON.stringify({result: "success", newx: newx, newy: newy}));
                        coordx = newx, coordy = newy;
                        userMap[userID] = {x: coordx, y: coordy};
                    } else {
                        conn.sendUTF(JSON.stringify({error: true, message: "Invalid movement"}));
                    }
                    break;
                case 'movedown':
                    newx = coordx, newy = coordy + 1;
                    if (checkGrid(newx, newy)) {
                        conn.sendUTF(JSON.stringify({result: "success", newx: newx, newy: newy}));
                        coordx = newx, coordy = newy;
                        userMap[userID] = {x: coordx, y: coordy};
                    } else {
                        conn.sendUTF(JSON.stringify({error: true, message: "Invalid movement"}));
                    }
                    break;
                case 'moveleft':
                    newx = coordx - 1, newy = coordy;
                    if (checkGrid(newx, newy)) {
                        conn.sendUTF(JSON.stringify({result: "success", newx: newx, newy: newy}));
                        coordx = newx, coordy = newy;
                        userMap[userID] = {x: coordx, y: coordy};
                    } else {
                        conn.sendUTF(JSON.stringify({error: true, message: "Invalid movement"}));
                    }
                    break;
                case 'moveright':
                    newx = coordx + 1, newy = coordy;
                    if (checkGrid(newx, newy)) {
                        conn.sendUTF(JSON.stringify({result: "success", newx: newx, newy: newy}));
                        coordx = newx, coordy = newy;
                        userMap[userID] = {x: coordx, y: coordy};
                    } else {
                        conn.sendUTF(JSON.stringify({error: true, message: "Invalid movement"}));
                    }
                    break;
                break;
                default:
                    conn.sendUTF(JSON.stringify({error: true, message: "Unknown command"}));
                    break;
            }
        }
    });

    conn.on('close', (reasonCode, description) => {
        console.log((new Date()) + 'Peer ' + conn.remoteAddress + ' has disconnected!');
        delete connectedClients[userID];
        delete userMap[userID];
    });
});
