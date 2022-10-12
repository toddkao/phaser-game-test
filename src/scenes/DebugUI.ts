import Phaser from 'phaser';
import config from '../config';
import { Player } from '../objects/Player';
import { GameScene } from './Game';

type Data = {
  player1: Player,
  player2: Player,
  gameScene: GameScene,
}

export class DebugUI extends Phaser.Scene {
  debugText!: Phaser.GameObjects.Text;
  data!: Data;

  constructor() {
    super('DebugUI');
  }

  init(data: Data) {
    this.data = data;
  }

  preload() {

  }

  create() {
    this.debugText = this.add.text(0, 0, `FPS: ${this.game.loop.actualFps}`, {
      fontSize: '20px',
    }).setPosition(20, 20);
  }

  update(t: number, dt: number) {
    if (config.physics.arcade.debug) {
      this.debugText.text = `
FPS: ${this.game.loop.actualFps}
`;

      this.debugText.text += `
** Player 1 **
state: ${this.data.player1.currentState?.name}
position x: ${this.data.player1.position.x} y: ${this.data.player1.position.y}

** Player 2 **
state: ${this.data.player2.currentState?.name}
position x: ${this.data.player2.position.x} y: ${this.data.player2.position.y}
`;

      this.input.gamepad.getAll().forEach(gamepad => {
        this.debugText.text += `
${gamepad.id} connected
`;
      });
    }
  }
}
