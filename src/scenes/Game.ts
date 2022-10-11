import Phaser from 'phaser';
import { controls, Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  private static instance: GameScene;
  public static get(): GameScene {
    if (!GameScene.instance) GameScene.instance = new GameScene();
    return GameScene.instance;
  }

  player1!: Player;
  player2!: Player;

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
    this.sound.play('henesys', {
      volume: 0.2
    });

    const map = this.add.tilemap('map');
    const tileset = map.addTilesetImage("terrain", "terrain");
    const layer = map.createLayer("layer0", tileset);
    layer.setCollision(1, true);

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

    const playerSprite = this.physics.add.sprite(200, 400, 'idle');
    this.player1 = new Player('player1', this, playerSprite, controls1);
    const playerSprite2 = this.physics.add.sprite(500, 400, 'idle');
    this.player2 = new Player('player2', this, playerSprite2, controls2);

    this.physics.add.collider(layer, playerSprite);
    this.physics.add.collider(layer, playerSprite2);

    this.physics.add.overlap(this.player1.attackZone, playerSprite2, this.player2.onDamageTaken);
    this.physics.add.overlap(this.player2.attackZone, playerSprite, this.player1.onDamageTaken);
  }

  update(t: number, dt: number) {
    this.player1.onUpdate(dt);
    this.player2.onUpdate(dt);
  }
}
