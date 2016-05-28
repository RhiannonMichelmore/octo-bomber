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
		],
		frames: {
			width:   64,
			height:  64,
			count:   8,
			regX:    0,
			regY:    0,
			spacing: 0,
			margin:  0
		},
		animations: {
			EMPTY: 0,
			BLOCK: 1,
			BRICK: 2,
			BOMB:  [3, 4, 'BOMB', 0.2],
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
			count:   8,
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

	socket = new WebSocket('ws://uwcs.co.uk:7080', 'octo-bomber');
	socket.onmessage = updateLoop;

	player = makePlayer();
	player.sprite.gotoAndPlay(player.state);
	//sendCommand('newPlayer', player);

	stage.update();
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.addEventListener("tick", stage);

	$(document).keydown(handleInput);
}

function handleInput(event){
	console.log(event);
	if(event.which == 37)
		sendCommand('moveleft');
	if(event.which == 38)
		sendCommand('moveup');
	if(event.which == 39)
		sendCommand('moveright');
	if(event.which == 40)
		sendCommand('movedown');
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
				'BOMB',
				'FIRE',
			][Math.floor(Math.random()*4)];
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
	if (cell.state == 'BOMB' || cell.state == 'FIRE')
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
	let data = JSON.parse(event.data);
	console.log(data);
	_.each(data.grid, function(row){
		_.each(row, function(cell){
			board[cell.y][cell.x].state = cell.state;
			renderCell(board[cell.y][cell.x]);
		});
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

function sendCommand(action){
	socket.send(JSON.stringify({
		action: action,
	}));
}
