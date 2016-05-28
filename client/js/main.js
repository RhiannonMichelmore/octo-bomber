//$(document).ready(init);
window.onload = init;

let gridSize = {
	x: 100,
	y: 100
};

let cellSize = {
	x: 64,
	y: 64,
}

$('#octo-bomber-board').on('click', function(){
	updateLoop({
		data: JSON.stringify({
			grid: [
				[{x: 2, y: 2, state: 'FIRE'}],
				[{x: 3, y: 2, state: 'FIRE'}],
				[{x: 2, y: 3, state: 'FIRE'}],
				[{x: 3, y: 3, state: 'FIRE'}],
			],
		}),
	});
});

let socket;
let player;
let board;
let stage;
let sprites;
let playerSprites;

function init(){
	stage = new createjs.Stage('octo-bomber-board');

	sprites = new createjs.SpriteSheet({
		images: [
			'./assets/floor/sprite_sheets/floor_sheet_64x64.png',
			'./assets/wall/sprite_sheets/unbreakable_block_sheet_64x64.png',
			'./assets/wall/sprite_sheets/breakable_block_sheet_64x64.png',
			'./assets/bomb/sprite_sheets/bomb_new_sheet_64x64.png',
			'./assets/bomb/sprite_sheets/bomb_explode_sheet_64x64.png',
			'./assets/bomb/sprite_sheets/bomb_second_sheet_64x64.png',
			'./assets/bomb/sprite_sheets/bomb_pulse_sheet_64x64.png',
		],
		frames: {
			width:   64,
			height:  64,
			count:   12,
		},
		animations: {
			EMPTY: 0,
			BLOCK: 1,
			BRICK: 2,
			BOMB0:  [3, 4, 'BOMB0', 0.2],
			BOMB1:  [8, 9, 'BOMB1', 0.2],
			BOMB2:  [10, 11, 'BOMB2', 0.1],
			FIRE:  [5, 7, 'FIRE', 0.1],
		},
	});

	playerSprites = new createjs.SpriteSheet({
		images: [
			'./assets/character/sprite_sheets/panda_idle_sheet_64x64.png',
		],
		frames: {
			width:   64,
			height:  64,
			count:   2,
		},
		animations: {
			IDLE: [0, 1, 'IDLE', 0.08],
		},
	});

	createBoard();
	drawBoard();

	socket = new WebSocket('ws://uwcs.co.uk:7080', 'octo-bomber');
	socket.onmessage = updateLoop;
	socket.onopen = function(){
		sendCommand('getID');
	};

	player = makePlayer();

	stage.update();
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.addEventListener("tick", stage);

	$(document).keydown(handleInput);
}

function handleInput(event){
	switch(event.which)
	{
		case 37:
			sendCommand('moveleft');
			break;
		case 38:
			sendCommand('moveup');
			break;
		case 39:
			sendCommand('moveright');
			break;
		case 40:
			sendCommand('movedown');
			break;
	}
}

function createBoard(){
	board = [];
	for(let y=0; y<gridSize.y; ++y)
	{
		board[y] = [];
		for(let x=0; x<gridSize.x; ++x)
		{
			let state = 'EMPTY';
			board[y][x] = {
				state:  state,
				sprite: createCell(x, y),
				x:      x,
				y:      y,
			};
		}
	}
}

function createCell(x, y){
	let sprite = new createjs.Sprite(sprites, 'normal');
	sprite.x = x * cellSize.x;
	sprite.y = y * cellSize.y;
	stage.addChild(sprite);

	let background = new createjs.Sprite(sprites, 'EMPTY');
	background.x = x * cellSize.x;
	background.y = y * cellSize.y;
	stage.addChild(background);
	stage.setChildIndex(background, 1);

	return sprite;
}

function drawBoard(){
	board.forEach(row => row.forEach(renderCell));
	stage.update();
}

function renderCell(cell){
	cell.sprite.gotoAndPlay(cell.state);
}

function renderPlayer(){
	player.sprite.x = player.pos.x * cellSize.x;
	player.sprite.y = player.pos.y * cellSize.y;
	player.sprite.gotoAndPlay(player.state);
}

function updateLoop(event)
{
	let data = JSON.parse(event.data);
	console.log(data);
	if(data.userID){
		player.id = data.userID;
		return;
	}

	_(data.grid)
	.flatten()
	.each(function(cell){
		board[cell.y][cell.x].state = cell.state;
		renderCell(board[cell.y][cell.x]);
	});
	_.each(data.userMap, function(pos, userID){
		if(Number(userID) === player.id)
			player.pos = pos;
	});
	renderPlayer();
	stage.update();
}

function makePlayer(){
	let pos = {
		x: 1,
		y: 1,
	};
	let sprite = new createjs.Sprite(playerSprites, 'normal');
	sprite.x   = pos.x * cellSize.x;
	sprite.y   = pos.y * cellSize.y;
	let localPlayer = {
		name:   'panda',
		id:     undefined,
		pos:    pos,
		state:  'IDLE',
		sprite: sprite,
	};
	stage.addChild(localPlayer.sprite);
	return localPlayer;
}

function sendCommand(action){
	socket.send(JSON.stringify({
		action: action,
	}));
}
