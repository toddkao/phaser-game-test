import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine";

export interface controls {
  [index: string]: Phaser.Input.Keyboard.Key;
}

export class Player extends StateMachine {
  playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone!: Phaser.GameObjects.GameObject;
  scene: GameScene;
  hp: number = 100;
  hpText!: Phaser.GameObjects.Text;
  hpBar: any;
  controls: controls;
  damageTakenRecently: boolean = false;

  static preload(scene: Phaser.Scene) {
    scene.load.atlas('swing', 'assets/swing.png', 'assets/swing.json');
    scene.load.atlas('stab', 'assets/stab.png', 'assets/stab.json');
    scene.load.atlas('walk', 'assets/walk.png', 'assets/walk.json');
    scene.load.atlas('idle', 'assets/idle.png', 'assets/idle.json');
    scene.load.atlas('jump', 'assets/jump.png', 'assets/jump.json');

    scene.load.audio('spearattack', ['sfx/attack.mp3']);
  }

  constructor(id: string, scene: GameScene, sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, controls: controls) {
    super(scene, id);
    this.scene = scene;
    this.controls = controls;
    this.playerSprite = sprite;
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
      key: 'idle',
      frames: this.scene.anims.generateFrameNames(
        'idle',
        {
          start: 0,
          end: 3,
          prefix: 'stand1_',
          suffix: '.png',
        }
      ),
      frameRate: 3,
      repeat: -1,
    })

        
    this.scene.anims.create({
      key: 'jump',
      frames: this.scene.anims.generateFrameNames(
        'jump',
        {
          start: 1,
          end: 2,
          prefix: 'jump_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    })

    this.scene.anims.create({
      key: 'swing',
      frames: this.scene.anims.generateFrameNames(
        'swing',
        {
          start: 1,
          end: 3,
          prefix: 'swing',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: 0,
    });

    this.scene.anims.create({
      key: 'stab',
      frames: this.scene.anims.generateFrameNames(
        'stab',
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
        'walk',
        {
          start: 1,
          end: 5,
          prefix: 'walk1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });
  }

  onCreate() {
    this.createAnimations();
    this.playerSprite.body.collideWorldBounds = true;
    this.playerSprite.setScale(2, 2);

    this.playerSprite.body.checkCollision.up = false;
    this.playerSprite.body.checkCollision.left = false;
    this.playerSprite.body.checkCollision.right = false;

    this.attackZone = this.scene.add.rectangle(-1000, -1000, 70, 25, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.scene.physics.add.existing(this.attackZone);
    (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false;
  
    this.hpText = this.scene.add.text(this.playerSprite.x, this.playerSprite.y - 90, `HP: ${this.hp}`).setOrigin(0.5);
  }

  onUpdate(dt: number) {
    this.hpText.setPosition(this.playerSprite.x, this.playerSprite.y - 90);
    this.update(dt);
  }

  onIdleEnter() {
    this.playerSprite.play('idle');
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
    this.playerSprite.play('walk');
  }

  onWalkUpdate() {
    this.handleLateralMovement();
    if ((this.controls.jump.isDown) && this.playerSprite.body.onFloor()) {
      this.setState('jump');
    }
    if (this.controls.attack.isDown) {
      this.setState('swing');
    } else {
      this.setState('idle');
    }
  }

  onJumpEnter() {
    this.playerSprite.play('jump');
    this.playerSprite.body.setVelocityY(-500);
  }

  onJumpUpdate() {
    this.handleLateralMovement();
    if (this.playerSprite.body.onFloor()) {
      if (this.playerSprite.body.velocity.x !== 0) {
        this.setState('walk');
      } else {
        this.setState('idle');
      }
    }
  }

  handleLateralMovement() {
    if (this.controls.left.isDown) {
      this.playerSprite.setVelocityX(-300);
      this.playerSprite.flipX = false;
    } else if (this.controls.right.isDown) {
      this.playerSprite.flipX = true;
      this.playerSprite.setVelocityX(300);
    }
    if (!this.controls.left.isDown && !this.controls.right.isDown) {
      this.playerSprite.setVelocityX(0);
    }

    if (this.controls.attack.isDown) {
      this.setState('stab');
    }
  }

  onStabEnter() {
    this.playerSprite.play('stab');
    this.scene.sound.play('spearattack', {
      volume: 0.2
    });
  }

  onStabUpdate() {
    const startHit = (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      this.playerSprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

      this.attackZone.x = this.playerSprite.x + (this.playerSprite.flipX ? 70 : -70);
      this.attackZone.y = this.playerSprite.y + 20;

      (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = true;
      this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));
    }

    startHit(this.playerSprite.anims, this.playerSprite.anims.currentFrame);
    if (this.playerSprite.anims.currentFrame.index === 3) {
      this.setState('idle');
      (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false;
      this.scene.physics.world.remove(this.attackZone.body);
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
