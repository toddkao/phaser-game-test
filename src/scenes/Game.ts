import Phaser from 'phaser';
import { controls, Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  player1!: Player;
  player2!: Player;

  tilemapLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super('GameScene');
  }

  preload() {
    Player.preload(this);
    this.load.image('terrain', 'assets/terrain.png');
    this.load.tilemapTiledJSON('map', 'tilemap/tilemap.json');

    this.load.audio('henesys', ['bgm/RestNPeace.mp3']);
  }

  create() {
    // this.sound.play('henesys', {
    //   volume: 0.2
    // });

    const map = this.add.tilemap('map');
    const tileset = map.addTilesetImage("terrain", "terrain");
    this.tilemapLayer = map.createLayer("layer0", tileset);
    this.tilemapLayer.setCollision(1, true);

    const controls1 = this.input.keyboard.addKeys({
      attack: Phaser.Input.Keyboard.KeyCodes.F,
      jump: Phaser.Input.Keyboard.KeyCodes.UP,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
    }) as controls;

    const controls2 = this.input.keyboard.addKeys({
      attack: Phaser.Input.Keyboard.KeyCodes.H,
      jump: Phaser.Input.Keyboard.KeyCodes.I,
      right: Phaser.Input.Keyboard.KeyCodes.L,
      left: Phaser.Input.Keyboard.KeyCodes.J,
    }) as controls;
    
    this.player1 = new Player('player1', this, controls1);
    // this.player2 = new Player('player2', this, controls2);

    // this.physics.add.overlap(this.player1.attackZone, this.player1.playerSprite, this.player2.onDamageTaken);
    // this.physics.add.overlap(this.player2.attackZone, this.player2.playerSprite, this.player1.onDamageTaken);

    this.input.gamepad.once('connected', (pad: Phaser.Types.Input.Gamepad.Pad) => {
      const gamepad = new Phaser.Input.Gamepad.Gamepad(this.input.gamepad, pad);

      // const gamepadControls = this.input.keyboard.addKeys({
      //   attack: gamepad.X,
      //   jump: gamepad.A,
      //   right: gamepad.R1,
      //   left: gamepad.L1,
      // }) as controls;

      // this.player1.updateControls(gamepadControls);
    });


  }

  update(t: number, dt: number) {
    this.player1.onUpdate(dt);
    // this.player2.onUpdate(dt);
  }
}
