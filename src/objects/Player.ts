import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine";

export interface controls {
  [index: string]: Phaser.Input.Keyboard.Key;
}

export class Player extends StateMachine {
  playerSprite!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone!: Phaser.GameObjects.GameObject;
  playerGroup!: Phaser.GameObjects.Group;
  playerContainer!: Phaser.GameObjects.Container;
  polearm!: Phaser.GameObjects.Sprite;

  scene: GameScene;
  hp: number = 100;
  hpText!: Phaser.GameObjects.Text;
  hpBar: any;
  controls: controls;
  damageTakenRecently: boolean = false;
  attackGroup!: Phaser.Physics.Arcade.Group;

  static preload(scene: Phaser.Scene) {
    scene.load.atlas('player1', 'assets/player1.png', 'assets/player1.json');
    scene.load.atlas('polearm', 'assets/polearm.png', 'assets/polearm.json');

    scene.load.audio('spearattack', ['sfx/attack.mp3']);
  }

  constructor(id: string, scene: GameScene, controls: controls) {
    super(scene, id);
    this.scene = scene;
    this.controls = controls;
    this.onCreate();


    this.addState('idle', {
      onEnter: () => this.onIdleEnter(),
      onUpdate: () =>  this.onIdleUpdate(),
    })

    this.addState('walk', {
      onEnter: () => this.onWalkEnter(),
      onUpdate: () => this.onWalkUpdate(),
    })

    this.addState('jump', {
      onEnter: () => this.onJumpEnter(),
      onUpdate: () => this.onJumpUpdate(),
    })

    this.addState('stab', {
      onEnter: () => this.onStabEnter(),
      onUpdate: () => this.onStabUpdate(),
    })

    this.setState('idle');
  }

  createAnimations() {
    this.scene.anims.create({
      key: 'polearmIdle',
      defaultTextureKey: 'idle',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 3,
          prefix: 'stand2_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'idle',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 3,
          prefix: 'stand2_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    })

        
    this.scene.anims.create({
      key: 'jump',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 2,
          prefix: 'jump_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'jump',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 2,
          prefix: 'jump_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'swing',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 3,
          prefix: 'swingP1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'swing',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 2,
          prefix: 'swingP1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'stab',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 2,
          prefix: 'stabO1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'walk',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 4,
          prefix: 'walk1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
      yoyo: true,
    });

    this.scene.anims.create({
      key: 'walk',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 4,
          prefix: 'walk1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
      yoyo: true,
    });
  }

  onCreate() {
    this.createAnimations();

    this.playerGroup = this.scene.add.group();
    this.playerContainer = this.scene.add.container();
    this.playerSprite = this.scene.physics.add.sprite(200, 400, 'player1').setDepth(1);
    this.playerSprite.setOrigin(0, 0);
    this.playerSprite.setBodySize(50, 70, false);
    this.playerSprite.body.collideWorldBounds = true;

    this.polearm = this.scene.add.sprite(this.playerSprite.x, this.playerSprite.y, 'polearm').setDepth(0);
    this.polearm.setOrigin(0, 0);

    this.hpText = this.scene.add.text(this.playerSprite.x + 50, this.playerSprite.y - 20, `HP: ${this.hp}`).setOrigin(0.5);

    this.playerGroup.add(this.playerSprite).add(this.polearm).add(this.hpText);

    this.playerGroup.scaleXY(1, 1);
    this.playerGroup.playAnimation('idle');

    // Add collision between scene map and player
    this.scene.physics.add.collider(this.scene.tilemapLayer, this.playerSprite);

    this.playerSprite.body.checkCollision.up = false;
    this.playerSprite.body.checkCollision.left = false;
    this.playerSprite.body.checkCollision.right = false;

    this.attackGroup = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    })

    this.attackZone = this.scene.add.rectangle(-1000, -1000, 70, 25, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.attackGroup.add(this.attackZone);
  

  }

  onUpdate(dt: number) {
    this.hpText.setPosition(this.playerSprite.x + 50, this.playerSprite.y - 20);
    this.polearm.setPosition(this.playerSprite.x, this.playerSprite.y);
    this.update(dt);
  }

  onIdleEnter() {
    this.playerGroup.playAnimation('idle');
    this.playerSprite.setVelocityX(0);
  }

  onIdleUpdate() {
    this.handleLateralMovement();
    if (this.controls.attack.isDown) {
      this.playerSprite.setState('swing')
    }
    if ((this.controls.jump.isDown) && this.playerSprite.body.onFloor()) {
      this.setState('jump');
    }
  }

  onWalkEnter() {
    if (this.playerSprite.body.onFloor()) {
      this.playerGroup.playAnimation('walk');
    }
  }

  onWalkUpdate() {
    this.handleLateralMovement();
    if ((this.controls.jump.isDown) && this.playerSprite.body.onFloor()) {
      this.setState('jump');
    }

    if (this.controls.attack.isDown) {
      this.setState('swing');
    }

    if (!this.controls.left.isDown && !this.controls.right.isDown) {
      this.setState('idle');
    }
  }

  onJumpEnter() {
    this.playerGroup.playAnimation('jump');
    this.playerSprite.body.setVelocityY(-500);
  }

  onJumpUpdate() {
    this.handleLateralMovement();

    this.scene.time.delayedCall(100, () => {
      if (this.playerSprite.body.onFloor()) {
        if (this.playerSprite.body.velocity.x !== 0) {
          this.setState('walk');
        } else {
          this.setState('idle');
        }
      }
    })
  }

  handleLateralMovement() {
    if (this.controls.left.isDown) {
      this.playerSprite.setVelocityX(-300);
      this.playerSprite.flipX = false;
      this.setState('walk');
    } else if (this.controls.right.isDown) {
      this.playerSprite.flipX = true;
      this.playerSprite.setVelocityX(300);
      this.setState('walk');
    } else if (!this.controls.left.isDown && !this.controls.right.isDown) {
      this.playerSprite.setVelocityX(0);
    }

    if (this.controls.attack.isDown) {
      this.setState('stab');
    }
  }

  onStabEnter() {
    this.playerGroup.playAnimation('swing');
    this.scene.sound.play('spearattack', {
      volume: 0.2
    });
    this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));
  }

  onStabUpdate() {
    this.attackZone.x = this.playerSprite.x + (this.playerSprite.flipX ? 50 : -70);
    this.attackZone.y = this.playerSprite.y + 60;
    
    if (this.playerSprite.anims.currentFrame.index === 3) {
      this.setState('idle');
      
      (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false;
      this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);
    }
  }

  onDamageTaken = (object1: any, player: any) => {
    if (!this.damageTakenRecently) {
      this.hp -= 10;
      this.hpText.text = `HP: ${this.hp}`;
      this.damageTakenRecently = true;

      this.playerSprite.setTint(0xFF0000);

      const tween = this.scene.tweens.add({
        targets: this.playerSprite,
        alpha: 0.5,
        ease: 'Cubic.easeOut',  
        duration: 500,
        repeat: -1,
        yoyo: true
      });

      this.scene.time.delayedCall(1000, () => {
        this.damageTakenRecently = false;
        this.playerSprite.alpha = 1;
        this.scene.tweens.remove(tween);
        this.playerSprite.setTint(0xffffff);
      })
    }
  }
}
