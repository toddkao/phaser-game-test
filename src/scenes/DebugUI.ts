import Phaser from 'phaser';
import { Player } from '../classes/Player';
import { GameScene } from './Game';

type Data = {
  player1: Player,
  player2: Player,
  gameScene: GameScene,
}

export class DebugUI extends Phaser.Scene {
  debugText!: Phaser.GameObjects.Text;
  gameSceneData!: Data;

  constructor() {
    super('DebugUI');
  }

  init(data: Data) {
    this.gameSceneData = data;
  }

  create() {
    this.debugText = this.add.text(0, 0, ``, {
      fontSize: '20px',
    }).setPosition(20, 20);
  }

  update(t: number, dt: number) {
    const { player1, player2 } = this.gameSceneData;
    this.debugText.text = `
FPS: ${this.game.loop.actualFps}
`;

    this.debugText.text += `
** Player 1 **
state: ${player1.currentState?.name}
position x: ${player1.position.x} y: ${player1.position.y}
velocity x: ${player1.velocity.x} y: ${player1.velocity.y}
origin: x: ${player1.sprite.originX} y: ${player1.sprite.originY}
isFastFalling: ${player1.isFastFalling}
onFloor: ${player1.onFloor}
isAttacking: ${player1.isAttacking}

** Player 2 **
state: ${player2.currentState?.name}
position x: ${player2.position.x} y: ${player2.position.y}
velocity x: ${player2.velocity.x} y: ${player2.velocity.y}
isFastFalling: ${player2.isFastFalling}
onFloor: ${player2.onFloor}
isAttacking: ${player2.isAttacking}
`;

    this.input.gamepad.getAll().forEach(gamepad => {
      this.debugText.text += `
${gamepad.id} connected
`;
    });
  }
}
