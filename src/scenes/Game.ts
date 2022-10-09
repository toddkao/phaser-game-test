import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('player0', 'assets/stand1_0.png');
    this.load.image('player1', 'assets/stand1_1.png');
    this.load.image('player2', 'assets/stand1_2.png');
    this.load.image('player3', 'assets/stand1_3.png');

    this.load.image('playerwalk0', 'assets/walk1_0.png');
    this.load.image('playerwalk1', 'assets/walk1_1.png');
    this.load.image('playerwalk2', 'assets/walk1_2.png');
    this.load.image('playerwalk3', 'assets/walk1_3.png');
    this.load.image('playerwalk4', 'assets/walk1_4.png');

    this.load.image('playerswing0', 'assets/swingT1_0.png');
    this.load.image('playerswing1', 'assets/swingT1_1.png');
    this.load.image('playerswing2', 'assets/swingT1_2.png');
    this.load.image('playerswing3', 'assets/swingT1_3.png');

    this.load.image('tile', 'assets/tile.png');
    // this.load.spritesheet('terrain', 'assets/sprite1.png');
  }

  create() {
    this.anims.create({
      key: 'idle',
      frames: [
          { key: 'player0' },
          { key: 'player1' },
          { key: 'player2' },
          { key: 'player3', duration: 50 }
      ],
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: 'swing',
      frames: [
          { key: 'playerswing0' },
          { key: 'playerswing1' },
          { key: 'playerswing2' },
          { key: 'playerswing3', duration: 50 }
      ],
      frameRate: 5,
      repeat: -1,
    });

    this.anims.create({
      key: 'walk',
      frames: [
          { key: 'playerwalk0' },
          { key: 'playerwalk1' },
          { key: 'playerwalk2' },
          { key: 'playerwalk3' },
          { key: 'playerwalk4', duration: 50 }
      ],
      frameRate: 3,
      repeat: -1,
    });

    this.player = this.physics.add.sprite(200, 400, 'player').play('idle');

    this.player.setSize(55, 75);
    this.player.flipX = true;
    this.player.body.collideWorldBounds = true;
  }

  playAnimation(animation: string) {
    if (this.player.anims.currentAnim.key !== animation) {
      this.player.play(animation);
    }
  }

  update() {
    const cursors = this.input.keyboard.createCursorKeys();
    const keys = this.input.keyboard.addKeys('F');

    this.player.body.velocity.x = 0;

    if ((cursors.space.isDown || cursors.up.isDown) && this.player.body.onFloor()) {
      this.player.body.setVelocityY(-500); // jump up
    }
    
    if (cursors.left.isDown) {
      this.player.body.velocity.x = -150;
      this.player.flipX = false;
    } else if (cursors.right.isDown) {

      this.player.body.velocity.x = 150;
      this.player.flipX = true;
    }

    if (keys.F.isDown) {
      this.playAnimation('swing');
    } else if (this.player.body.velocity.x !== 0) {
      this.playAnimation('walk');
    } else {
      this.playAnimation('idle');
    }

  }
}
