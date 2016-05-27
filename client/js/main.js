$().ready(function(){
	init();
});

let gridSize = {
	x: 10,
	y: 10
};

let cellSize = {
	x: 20,
	y: 20,
}

$('#octo-bomber-board').on('click', function(){
	updateLoop({
		data: {
			board: [
				{x: 2, y: 2, state: 4},
				{x: 3, y: 2, state: 4},
				{x: 2, y: 3, state: 4},
				{x: 3, y: 3, state: 4},
			],
		},
	});
});

let socket;
let player;
let board;
let stage;

function init(){
	stage = new createjs.Stage('octo-bomber-board');

	createBoard();
	drawBoard();

	//socket = new WebSocket('ws://zed0.co.uk:8080', 'octo-bomber');
	player = makePlayer();
	//sendCommand('newPlayer', player);

	//socket.onmessage = updateLoop;
}

function createBoard(){
	board = [];
	for(let y=0; y<gridSize.y; ++y)
	{
		board[y] = [];
		for(let x=0; x<gridSize.x; ++x)
		{
			board[y][x] = {
				state: Math.floor(Math.random()*4),
				shape: createShape(x, y),
				x:     x,
				y:     y,
			};
		}
	}
}

function createShape(x, y){
	let shape = new createjs.Shape();
	stage.addChild(shape);
	return shape;
}

function drawBoard(){
	board.forEach(row => row.forEach(renderCell));
	stage.update();
}

function getCellColor(cell){
	if(cell.state === 0)
		return '#ff0000';
	if(cell.state === 1)
		return '#00ff00';
	if(cell.state === 2)
		return '#0000ff';
	if(cell.state === 3)
		return '#ffff00';
	if(cell.state === 4)
		return '#00ffff';
}

function renderCell(cell){
	cell.shape.graphics
	.beginFill(getCellColor(cell))
	.drawRect(
		cell.x * cellSize.x,
		cell.y * cellSize.y,
		cellSize.x - 1,
		cellSize.y - 1
	);
}

function updateLoop(event)
{
	console.log(event.data);
	_.each(event.data.board, function(cell){
		board[cell.y][cell.x].state = cell.state;
		renderCell(board[cell.y][cell.x]);
	});
	stage.update();
}

function makePlayer(){
	return {
		name: 'foo',
	}
}

function sendCommand(command, args){
	socket.send({
		command: command,
		args:    args,
	});
}
