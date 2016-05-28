//$(document).ready(init);
window.onload = init;

let gridSize = {
	x: 10,
	y: 10
};

let cellSize = {
	x: 64,
	y: 64,
}

$('#octo-bomber-board').on('click', function(){
	updateLoop({
		data: {
			board: [
				{x: 2, y: 2, state: 'FIRE'},
				{x: 3, y: 2, state: 'FIRE'},
				{x: 2, y: 3, state: 'FIRE'},
				{x: 3, y: 3, state: 'FIRE'},
			],
		},
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
			regX:    0,
			regY:    0,
			spacing: 0,
			margin:  0
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
			regX:    0,
			regY:    0,
			spacing: 0,
			margin:  0
		},
		animations: {
			IDLE: [0, 1, 'IDLE', 0.08],
		},
	});

	createBoard();
	drawBoard();

	//socket = new WebSocket('ws://zed0.co.uk:8080', 'octo-bomber');
	//socket.onmessage = updateLoop;

	player = makePlayer();
	player.sprite.gotoAndPlay(player.state);
	//sendCommand('newPlayer', player);

	stage.update();
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.addEventListener("tick", stage);
}

function createBoard(){
	board = [];
	for(let y=0; y<gridSize.y; ++y)
	{
		board[y] = [];
		for(let x=0; x<gridSize.x; ++x)
		{
			let state = [
				'EMPTY',
				'BLOCK',
				'BRICK',
				'BOMB0',
				'BOMB1',
				'BOMB2',
				'FIRE',
			][Math.floor(Math.random()*7)];
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
	return sprite;
}

function drawBoard(){
	board.forEach(row => row.forEach(renderCell));
	stage.update();
}

function renderCell(cell){
	if (cell.state == 'BOMB0' || cell.state=='BOMB1' || cell.state=='BOMB2' || cell.state == 'FIRE')
	{
		let sprite = new createjs.Sprite(sprites, 'EMPTY');
		sprite.x = cell.x * cellSize.x;
		sprite.y = cell.y * cellSize.y;
		stage.addChild(sprite);
	}
	stage.setChildIndex(cell.sprite, stage.getNumChildren()-1);
	cell.sprite.gotoAndPlay(cell.state);
}

function renderPlayer(){
	player.sprite.gotoAndPlay(player.state);
}

function updateLoop(event)
{
	console.log(event.data);
	_.each(event.data.board, function(cell){
		console.log(cell);
		board[cell.y][cell.x].state = cell.state;
		renderCell(board[cell.y][cell.x]);
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
	sprite.x = pos.x * cellSize.x;
	sprite.y = pos.y * cellSize.y;
	let localPlayer = {
		name: 'panda',
		pos:pos,
		state: 'IDLE',
		sprite:sprite,
	};
	stage.addChild(localPlayer.sprite);
	return localPlayer;
}

function sendCommand(command, args){
	socket.send({
		command: command,
		args:    args,
	});
}
