import Phaser from 'phaser'
import Helper from './_helper/helper';
import {config} from '../src/config';

export default class BreakoutScene extends Phaser.Scene {
	canvas: {width: number, height: number} = {width: 0, height: 0};
	
	//game status
	gameStarted: boolean = false;
	gameControlsEnabled: boolean = false;
	currentLifePoints: number = 0;
	currentLevel: number = 1;
	currentPoints: number = 0;
	currentHighScore: number = 0;
	
	//background
	background!: Phaser.GameObjects.Container;
	border!: Phaser.GameObjects.Image;
	
	//background information display
	displayCurrentPoints!: Phaser.GameObjects.Text;
	displayCurrentLevel!: Phaser.GameObjects.Text;
	displayCurrentHighScore!: Phaser.GameObjects.Text;
	
	//life points
	lifePoints!: Phaser.GameObjects.Container;
	
	//rocket
	rocket!: Phaser.GameObjects.Container;
	
	//bricks
	bricks!: Phaser.GameObjects.Container;
	
	//paddle
	paddle!: Phaser.GameObjects.Container;
	paddleWidth: number = config.defaultPaddleWidth;
	
	//balls
	// @ts-ignore
	balls: Phaser.GameObjects.GameObject[Phaser.Physics.Arcade.Image] = [];
	ballSpeed: number = config.defaultBallSpeedMultiplier;
	
	//keyboard input to move paddle
	inputKeyLeft!: Phaser.Input.Keyboard.Key;
	inputKeyA!: Phaser.Input.Keyboard.Key;
	inputKeyRight!: Phaser.Input.Keyboard.Key;
	inputKeyD!: Phaser.Input.Keyboard.Key;
	
	constructor() {
		super('breakout')
	}
	
	preload() {
		//get game size to handle all other sizes & movements
		this.canvas = this.sys.game.canvas;
		
		//bind keys to handle checkDown in update()
		this.inputKeyLeft = this.input.keyboard.addKey('LEFT');
		this.inputKeyA = this.input.keyboard.addKey('A');
		this.inputKeyRight = this.input.keyboard.addKey('RIGHT');
		this.inputKeyD = this.input.keyboard.addKey('D');
		
		//load all images from assets
		for(let lvl: number = 1; lvl <= 6; lvl++) {
			this.load.image(`background_lvl${lvl}`, `../assets/backgrounds/background_lvl${lvl}.png`);
		}
		this.load.image('border', '../assets/backgrounds/border.png');
		this.load.image('heart', '../assets/sprites/heart.png');
		this.load.image('ball', '../assets/sprites/ball.png');
		this.load.atlas('paddle', '../assets/sprites/paddle.png', '../assets/sprites/paddle.json');
		this.load.image('rocket', '../assets/sprites/rocket.png');
		this.load.image('fire', '../assets/particles/fire.png');
		this.load.atlas('bricks', '../assets/sprites/bricks.png', '../assets/sprites/bricks.json');
		
		//load audio from assets
		this.load.audio('hitBrick', '../assets/audio/hitBrick.mp3');
		this.load.audio('brickChainBreak', '../assets/audio/brickChainBreak.mp3');

		//check highScore localStorage is exist and get the highScore
		if(window.localStorage.getItem('highScore')) {
			this.currentHighScore = parseInt(<string>window.localStorage.getItem('highScore'));
		}
	}

	create() {
		//enable bounds, but disabled bottom
		this.physics.world.setBounds(10, 10, this.canvas.width - 20, this.canvas.height - 10, true, true, true, false);
		
		//container for complete background
		this.background = this.add.container(0, 0);
		for(let lvl: number = 1; lvl <= 6; lvl++) {
			this.background.add(this.add.image(this.canvas.width / 2, this.canvas.height - ((lvl-1) * this.canvas.height), `background_lvl${lvl}`));
		}
		
		//implement border
		this.border = this.add.image((this.canvas.width / 2), (this.canvas.height / 2), 'border').setAlpha(0);
		
		this.lifePoints = this.add.container(50, 50).setAlpha(0);
		
		const paddleMiddle = this.physics.add.image(0, 0, 'paddle', 'paddle_middle').setImmovable();
		paddleMiddle.displayWidth = this.paddleWidth;

		const paddleCurveLeft = this.physics.add.image((0 - (this.paddleWidth / 2)), 0, 'paddle', 'paddle_curve_left').setImmovable().setCircle(5);
		const paddleCurveRight = this.physics.add.image((this.paddleWidth / 2), 0, 'paddle', 'paddle_curve_right').setImmovable().setCircle(5);
		
		this.paddle = this.add.container((this.canvas.width / 2), (this.canvas.height + 50), [paddleMiddle, paddleCurveLeft, paddleCurveRight]);

		this.displayCurrentPoints = this.add.text(0, 0, this.currentPoints.toLocaleString('de-DE'))
			.setFontSize(100)
			.setFontStyle('bold')
			.setAlpha(0.25)
			.setOrigin(0.5, 0.5)
			.setFontFamily('Arial');

		this.displayCurrentLevel = this.add.text(0, 0, `Level ${this.currentLevel.toLocaleString('de-DE')}`)
			.setFontSize(25)
			.setFontStyle('bold')
			.setAlpha(0.25)
			.setOrigin(0.5, 3)
			.setFontFamily('Arial');

		this.displayCurrentHighScore = this.add.text(0, 125, `HighScore: ${this.currentHighScore.toLocaleString('de-DE')}`)
			.setFontSize(25)
			.setFontStyle('bold')
			.setAlpha(0.25)
			.setOrigin(0.5, 3)
			.setFontFamily('Arial');
		
		this.add.container((this.canvas.width / 2), (this.canvas.height / 2), [this.displayCurrentPoints, this.displayCurrentLevel, this.displayCurrentHighScore]);

		this.bricks = this.add.container(((this.canvas.width - 512) / 1.5), 100).setAlpha(0);
		
		const rocketMachine = this.add.image(0, 0, 'rocket');
		const rocketPlayer = this.add.image(0, -75, 'ball');
		rocketPlayer.displayWidth = 100;
		rocketPlayer.displayHeight = 100;
		const rocketStartGameText = this.add.text(0, 75, `SPACE to start`)
			.setFontSize(25)
			.setFontStyle('bold')
			.setColor('#000000')
			.setOrigin(0.5, 3)
			.setFontFamily('Arial');
		const rocketFireParticle = this.add.particles('fire');
		rocketFireParticle.createEmitter({
			speed: 20,
			alpha: { start: 1, end: 0 },
			scale: { start: 0.5, end: 2.5 },
			accelerationY: 500,
			angle: { min: -85, max: -95 },
			rotate: { min: -180, max: 180 },
			lifespan: { min: 1000, max: 1100 },
			blendMode: 'ADD',
			frequency: 110,
			x: 0,
			y: 200
		})
		this.rocket = this.add.container((this.canvas.width / 2), (this.canvas.height / 2), [rocketPlayer, rocketFireParticle, rocketMachine, rocketStartGameText]);
		
		//input event to start the game
		this.input.keyboard.on('keydown-SPACE', () => {
			this.startGame()
		});
	}
	
	update() {
		if(this.gameStarted && this.gameControlsEnabled) {
			//check input event to move the paddle
			if (this.input.keyboard.checkDown(this.inputKeyLeft) || this.input.keyboard.checkDown(this.inputKeyA)) {
				if ((this.paddle.x - (this.paddleWidth / 2) - config.defaultPaddleMoveSpeed) >= (config.defaultPaddleMoveSpeed + 5)) {
					this.paddle.x -= config.defaultPaddleMoveSpeed;
				}
			} else if (this.input.keyboard.checkDown(this.inputKeyRight) || this.input.keyboard.checkDown(this.inputKeyD)) {
				if ((this.paddle.x + (this.paddleWidth / 2) + config.defaultPaddleMoveSpeed) <= this.canvas.width - (config.defaultPaddleMoveSpeed + 5)) {
					this.paddle.x += config.defaultPaddleMoveSpeed;
				}
			}
			
			//check ball falling out at bottom
			const findFallingBallIndex: number = this.balls.findIndex((ball: Phaser.Physics.Arcade.Image) => ball.y > this.canvas.height);
			if(findFallingBallIndex >= 0) {
				this.balls[findFallingBallIndex].destroy();
				this.balls.splice(findFallingBallIndex, 1);
				
				if(!this.balls.length) {
					this.subLifePoint();
				}
			}
		}
	}

	//start the game
	startGame() {
		if(!this.gameStarted) {
			this.gameStarted = true;
			this.showPaddle();
			this.startRound();
			// @ts-ignore
			this.rocket.last.visible = false;
		}
	}
	
	//start a round
	startRound() {
		this.gameControlsEnabled = false;
		// @ts-ignore
		this.rocket.first.visible = true;
		this.resetPaddle();
		this.showPaddle();
		this.rocketToPaddle();
		setTimeout(() => {
			this.gameControlsEnabled = true;
			// @ts-ignore
			this.rocket.first.visible = false;
			this.rocket.getAt(0).setActive(false);
			if(this.currentLifePoints === 0) {
				this.showLifePoints();
			}
			if(!this.bricks.length) {
				this.addBricks(this.currentLevel * 8);
			}
			this.showBorder();
			this.showBricks();
			this.rocketToSky();
			this.resetPaddle();
			this.addBall((this.canvas.width / 2), (this.canvas.height - 130));
		}, Helper.getMillisecondsFromSeconds(3));
	}
	
	//move rocket to paddle & scale
	rocketToPaddle() {
		this.tweens.add({
			targets: this.rocket,
			y: (this.canvas.height - 115),
			scale: 0.25,
			duration: Helper.getMillisecondsFromSeconds(2.5)
		});
	}
	
	//move rocket to sky & scale
	rocketToSky() {
		this.tweens.add({
			targets: this.rocket,
			y: (0 - this.canvas.height),
			scale: 0.25,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}

	//move rocket to game center & scale
	resetRocket() {
		// @ts-ignore
		this.rocket.first.visible = true;
		this.tweens.add({
			targets: this.rocket,
			y: (this.canvas.height / 2),
			scale: 1,
			duration: Helper.getMillisecondsFromSeconds(5)
		});
	}
	
	//add points
	addPoints(points: number) {
		this.currentPoints += points;
		this.displayCurrentPoints.setText(this.currentPoints.toLocaleString('de-DE'));
		
		//save current points to highScore localStorage if current points larger as current highScore
		if(this.currentPoints > this.currentHighScore) {
			this.currentHighScore = this.currentPoints;
			this.displayCurrentHighScore.setText(`HighScore: ${this.currentHighScore.toLocaleString('de-DE')}`);
			window.localStorage.setItem('highScore', this.currentHighScore.toString());
		}
	}
	
	//reset all points
	resetPoints() {
		this.currentPoints = 0;
		this.displayCurrentPoints.setText(this.currentPoints.toLocaleString('de-DE'));
	}
	
	//transition to show the life points
	showLifePoints() {
		this.addLifePoints(config.defaultLifePoints);
		this.tweens.add({
			targets: this.lifePoints,
			alpha: 1,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}

	//transition to hide the life points
	hideLifePoints() {
		this.tweens.add({
			targets: this.lifePoints,
			alpha: 0,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}

	//add a amount of life points, but max the maxLifePoints of config
	addLifePoints(amount: number) {
		for(let a = 1; a <= amount; a++) {
			if (this.currentLifePoints < config.maxLifePoints) {
				this.currentLifePoints++;
				const lifeIcon = this.add.image(0, (((this.lifePoints.length) * 75)), 'heart').setAlpha(0.25);
				lifeIcon.displayHeight = 50;
				lifeIcon.displayWidth = 50;
				this.lifePoints.add(lifeIcon);
			} else {
				break;
			}
		}
	}
	
	//subtract 1 life point
	subLifePoint() {
		this.currentLifePoints--;
		this.lifePoints.last.destroy();
		
		//reset the game if player has 0 life points, otherwise start a new round
		if(this.currentLifePoints === 0) {
			this.displayCurrentLevel.setText('GAME OVER');
			this.gameControlsEnabled = false;
			this.resetLevel();
			
			//release to be able to play again
			setTimeout(() => {
				this.gameStarted = false;
				// @ts-ignore
				this.rocket.last.visible = true;
				this.ballSpeed = config.defaultBallSpeedMultiplier;
				this.currentLevel = 1;
				this.displayCurrentLevel.setText(`Level ${this.currentLevel.toLocaleString('de-DE')}`);
				this.displayCurrentPoints.setText(this.currentPoints.toLocaleString('de-DE'));
				this.resetPoints();
				this.destroyAllBricks();
			}, Helper.getMillisecondsFromSeconds(5))
		} else {
			this.startRound();
		}
	}

	//transition to show the border
	showBorder() {
		this.tweens.add({
			targets: this.border,
			alpha: 1,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}
	
	//transition to hide the border
	hideBorder() {
		this.tweens.add({
			targets: this.border,
			alpha: 0,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}

	//transition to show the paddle
	showPaddle() {
		this.tweens.add({
			targets: this.paddle,
			y: (this.canvas.height - 50),
			duration: Helper.getMillisecondsFromSeconds(0.5)
		});
	}
	
	//transition to hide the paddle
	hidePaddle() {
		this.tweens.add({
			targets: this.paddle,
			y: (this.canvas.height + 50),
			duration: Helper.getMillisecondsFromSeconds(0.5)
		});
	}
	
	//reset the paddle size & paddle position to center
	resetPaddle() {
		this.changePaddleSize(config.defaultPaddleWidth);
		this.tweens.add({
			targets: this.paddle,
			x: (this.canvas.width / 2),
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}
	
	//transition to change the paddle size
	changePaddleSize(width: number) {
		this.paddleWidth = width;
		this.tweens.add({
			targets: this.paddle.list[0],
			displayWidth: this.paddleWidth,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
		this.tweens.add({
			targets: this.paddle.list[1],
			x: (0 - (this.paddleWidth / 2)),
			duration: Helper.getMillisecondsFromSeconds(1)
		});
		this.tweens.add({
			targets: this.paddle.list[2],
			x: (this.paddleWidth / 2),
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}
	
	//load the next level
	nextLevel() {
		this.currentLevel++;
		this.ballSpeed += config.addBallSpeedMultiplierOnFinishedLevel;
		this.displayCurrentLevel.setText(`Level ${this.currentLevel.toLocaleString('de-DE')}`);
		this.gameControlsEnabled = false;
		this.balls[0].setVelocity(0);
		this.tweens.add({
			targets: this.balls[0],
			x: (this.canvas.width / 2),
			y: (this.canvas.height - 130),
			duration: Helper.getMillisecondsFromSeconds(2.5)
		});
		this.addLifePoints(config.addLifePointsOnFinishedLevel);
		this.hideBorder();
		this.hideBricks();
		this.resetPaddle();
		this.rocketToPaddle();
		//fly the rocket to the next level
		setTimeout(() => {
			this.balls[0].destroy();
			this.balls.splice(0, 1);
			// @ts-ignore
			this.rocket.first.visible = true;
			this.resetRocket();
			this.hidePaddle();
			//higher as lvl 6 is black, so we dont need a transition after lvl 6
			if(this.currentLevel <= 6) {
				this.tweens.add({
					targets: this.background,
					y: this.background.y + this.canvas.height,
					duration: Helper.getMillisecondsFromSeconds(10)
				});
			}
			//start the next round
			setTimeout(() => {
				this.startRound();
			}, Helper.getMillisecondsFromSeconds(8))
		}, Helper.getMillisecondsFromSeconds(3));
	}
	
	//reset the game to lvl 1, the background move to the bottom with a transition
	resetLevel() {
		this.hidePaddle();
		this.hideBorder();
		this.resetPaddle();
		this.resetRocket();
		this.hideLifePoints();
		this.hideBricks();
		this.tweens.add({
			targets: this.background,
			y: 0,
			duration: Helper.getMillisecondsFromSeconds(5)
		});
	}

	//transition to show the bricks
	showBricks() {
		this.tweens.add({
			targets: this.bricks,
			alpha: 1,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}

	//transition to hide the bricks
	hideBricks() {
		this.tweens.add({
			targets: this.bricks,
			alpha: 0,
			duration: Helper.getMillisecondsFromSeconds(1)
		});
	}
	
	//add a amount of new bricks to the bricks grid system
	addBricks(count: number) {
		for(let a = 1; a <= count; a++) {
			let brickFrame = 'brick_normal';
			
			//calculate probability for special bricks
			if(config.ballsBrickActivated && Helper.between(1, 100 * (config.ballsBrickProbabilityDivideWithCurrentLevel ? this.currentLevel : 1)) <= config.ballsBrickProbability) {
				brickFrame = 'brick_balls';
			} else if(config.giftBrickActivated && Helper.between(1, 100 * (config.giftBrickProbabilityDivideWithCurrentLevel ? this.currentLevel : 1)) <= config.giftBrickProbability) {
				brickFrame = 'brick_gift';
			} else if(config.largePaddleBrickActivated && Helper.between(1, 100 * (config.largePaddleBrickProbabilityDivideWithCurrentLevel ? this.currentLevel : 1)) <= config.largePaddleBrickProbability) {
				brickFrame = 'brick_largePaddle';
			} else if(config.smallPaddleBrickActivated && Helper.between(1, 100) <= config.smallPaddleBrickProbability) {
				brickFrame = 'brick_smallPaddle';
			}
			
			//calculate probability for bricks with chain
			const hasChain: boolean = config.brickChainActivated ? Helper.between(1, 100) < ((config.brickChainProbabilityMultiplyWithCurrentLevel ? (this.currentLevel - 1) : 0) * config.brickChainProbability) : false;
			
			//create new brick to grid system
			const newBrick = this.physics.add.image(
				(this.bricks.length - (Math.floor(this.bricks.length / 8) * 8)) * 64, 
				(Math.floor(this.bricks.length / 8)) * 32,
				'bricks', 
				`${brickFrame}${hasChain ? '_chain' : ''}`
			).setImmovable();
			newBrick.setData('brickFrame', brickFrame);
			newBrick.setData('hasChain', hasChain);
			
			// @ts-ignore
			this.physics.add.collider(this.balls, newBrick, this.hitBrick, null, this);
			this.bricks.add(newBrick);
		}
	}
	
	//destroy all exist bricks
	destroyAllBricks() {
		this.bricks.each((brick: Phaser.GameObjects.Image) => {
			brick.destroy();
		})
	}
	
	//event called if a ball hit a brick
	hitBrick(ball: Phaser.Physics.Arcade.Image, brick: Phaser.Physics.Arcade.Image) {
		//add points
		this.addPoints((config.addPointsOnHitBrick * (config.multiplierAddPointsWithCurrentLevel ? this.currentLevel : 1)));
		
		//check has brick a chain, then remove the chain
		if(brick.getData('hasChain')) {
			//if audio activated, then play a sound for chain break
			if(config.audioActivated) {
				this.sound.play('brickChainBreak', {
					volume: 0.5
				});
			}
			brick.setData('hasChain', false);
			brick.setTexture('bricks', brick.getData('brickFrame'));
		} else {
			//if audio activated, then play a sound for hit the brick
			if(config.audioActivated) {
				this.sound.play('hitBrick', {
					volume: 0.5
				});
			}
			
			//check brick is a special brick & do the special thing
			if(brick.getData('brickFrame') === 'brick_balls')  {
				//special brick: add more balls
				const randomAmountBalls = Helper.between(config.minBallsOnHitBallBrick, config.maxBallsOnHitBallBrick);
				for(let a = 1; a <= randomAmountBalls; a++) {
					this.addBall(ball.x, ball.y);
				}
			} else if(brick.getData('brickFrame') === 'brick_gift') {
				//special brick: add random points
				this.addPoints(Helper.between(config.minPointsOnHitGiftBrick, config.maxPointsOnHitGiftBrick) * (config.multiplierAddPointsWithCurrentLevel ? this.currentLevel : 1));
			} else if(brick.getData('brickFrame') === 'brick_largePaddle') {
				//special brick: change the paddle size larger
				this.changePaddleSize(Helper.between(config.defaultPaddleWidth, config.maxPaddleWidthOnHitPaddleBrick));
			} else if(brick.getData('brickFrame') === 'brick_smallPaddle') {
				//special brick: change the paddle size smaller
				this.changePaddleSize(Helper.between(config.minPaddleWidthOnHitPaddleBrick, config.defaultPaddleWidth));
			}
			
			//destroy the hit brick and check the amount of exist bricks, if the amount 0 then go to the next lvl
			brick.destroy();
			if(!this.bricks.length) {
				this.addPoints((config.addPointsOnFinishedLevel * (config.multiplierAddPointsWithCurrentLevel ? this.currentLevel : 1)));
				this.nextLevel();
			}
		}
	}
	
	//add a ball to coordinate
	addBall(x: number, y: number) {
		const ball = this.physics.add.image(x, y, 'ball')
			.setVelocity((Helper.between((0 - (this.canvas.width / 2)), (this.canvas.width / 2)) * this.ballSpeed), -250 * this.ballSpeed)
			.setBounce(1, 1)
			.setCollideWorldBounds(true);
		ball.displayWidth = 25;
		ball.displayHeight = 25;
		this.balls.push(ball);
		// @ts-ignore
		this.physics.add.collider(ball, this.paddle.list, this.hitPaddle, null, this);
	}

	//event called if a ball hit the paddle
	hitPaddle(ball: Phaser.Physics.Arcade.Image, paddleComponent: Phaser.Physics.Arcade.Image) {
		//if hit the ball a curve of paddle, then change the speed & flight direction
		if((paddleComponent.parentContainer.x - (this.paddleWidth / 2)) > ball.x) {
			ball.setVelocityX((0 - this.canvas.width / 2) * this.ballSpeed);
		} else if((paddleComponent.parentContainer.x + (this.paddleWidth / 2)) < ball.x) {
			ball.setVelocityX((this.canvas.width / 2) * this.ballSpeed);
		}
	}
}
