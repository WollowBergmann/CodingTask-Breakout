import Phaser from 'phaser'

import BreakoutScene from '../scenes/breakoutScene';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.CANVAS,
	parent: 'app',
	width: 700,
	height: 900,
	physics: {
		default: 'arcade',
	},
	scene: [BreakoutScene],
}

export default new Phaser.Game(config)
