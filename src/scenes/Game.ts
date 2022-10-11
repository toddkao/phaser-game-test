import Phaser from 'phaser';
import { Player } from '../objects/Player';

export class GameScene extends Phaser.Scene {
  private static instance: GameScene;
  public static get(): GameScene {
    if (!GameScene.instance) GameScene.instance = new GameScene();
    return GameScene.instance;
  }

  cursors: any;
  keys: any;

  player1!: Player;
  player2!: Player;

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.atlas('swing', 'assets/swing.png', 'assets/swing.json');
    this.load.atlas('stab', 'assets/stab.png', 'assets/stab.json');
    this.load.atlas('walk', 'assets/walk.png', 'assets/walk.json');
    this.load.atlas('idle', 'assets/idle.png', 'assets/idle.json');
    this.load.atlas('jump', 'assets/jump.png', 'assets/jump.json');

    this.load.image('terrain', 'assets/terrain.png');
    this.load.image('tile', 'assets/tile.png');
    this.load.audio('henesys', ['bgm/RestNPeace.mp3']);

  }

  create() {
    this.sound.play('henesys', {
      volume: 0.2
    });

    const playerSprite = this.physics.add.sprite(200, 400, 'player');
    this.player1 = new Player('player1', this, playerSprite);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('F');
    
    const terrain = this.physics.add.sprite(1920 / 2, 1080 - 50, 'terrain').setImmovable(true);

    terrain.body.setAllowGravity(false);

    // this.player1 = this.physics.add.sprite(500, 0, 'player').play('idle');

    // this.attackZone = this.add.zone(this.player1.x, this.player1.y, 20, 40);

    // const player2 = this.physics.add.sprite(1920 - 500, 0, 'player').play('idle');
    // player2.body.collideWorldBounds = true;
    // player2.setSize(55, 75);

    // this.player1.on('animationupdate', (anim, frame, sprite, frameKey)=> {
    //   if (anim.key === 'swing') {
    //     if(frame.index == 1) {
    //       this.physics.world.disable(this.attackZone);
    //       this.attackZone.x = this.player1.x
    //       this.attackZone.y = this.player1.y
    //     }
    //     if(frame.index == 2) {
    //       this.physics.world.enable(this.attackZone);
    //       this.attackZone.x = this.player1.x + 50
    //       this.attackZone.y = this.player1.y - 20
    //       this.attackZone.body.height = 84
    //     }
    //     if(frame.index == 3) {
    //       this.attackZone.x = this.player1.x + 20
    //       this.attackZone.y = this.player1.y - 30
    //       this.attackZone.body.height = 32
    //     }
    //   }
    // })

    
    // this.physics.add.collider(terrain, this.player1);
    // this.physics.add.collider(terrain, player2);

    // this.player1.setSize(55, 75);
    // this.player1.flipX = true;
    // this.player1.body.collideWorldBounds = true;
  }

  // playAnimation(animation: string) {
  //   if (this.player1.anims.currentAnim.key !== animation) {
  //     this.player1.play(animation);
  //   }
  // }

  update(t: number, dt: number) {

    this.player1.update(dt);

    // this.player1.body.velocity.x = 0;

    // if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player1.body.onFloor()) {
    //   this.player1.body.setVelocityY(-500); // jump up
    // }
    
    // if (this.cursors.left.isDown) {
    //   this.player1.body.velocity.x = -150;
    //   this.player1.flipX = false;
    // } else if (this.cursors.right.isDown) {

    //   this.player1.body.velocity.x = 150;
    //   this.player1.flipX = true;
    // }

    // if (this.keys.F.isDown) {
    //   this.playAnimation('swing');
    // } else if (this.player1.body.velocity.x !== 0 && this.player1.body.velocity.y === 0) {
    //   this.playAnimation('walk');
    // } else if (this.player1.body.velocity.y !== 0) {
    //   this.playAnimation('jump');
    // } else {
    //   this.playAnimation('idle');
    // }

  }
}
