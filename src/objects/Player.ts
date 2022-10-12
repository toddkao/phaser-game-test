import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine";
import config from '../config';

export interface controls {
  [index: string]: Phaser.Input.Keyboard.Key;
}

export class Player extends StateMachine {
  static numberOfInstances = 0;
  instanceId = 0;

  playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone: Phaser.GameObjects.GameObject;
  playerGroup: Phaser.GameObjects.Group;
  polearm: Phaser.GameObjects.Sprite;

  onFloor = false;

  position: {
    x: number;
    y: number;
  }

  enableTapJump = false;
  enableDropBelowTerrain = false;
  gamepad: Phaser.Input.Gamepad.Gamepad | undefined;

  deadZoneX = 0.7;
  deadZoneY = 0.7;

  scene: GameScene;
  hp: number = 100;
  hpText: Phaser.GameObjects.Text;
  hpBar: any;
  controls: controls;
  damageTakenRecently: boolean = false;
  isAttacking: boolean = false;

  attackGroup: Phaser.Physics.Arcade.Group;

  static preload(scene: Phaser.Scene) {
    scene.load.atlas('player1', 'assets/player1.png', 'assets/player1.json');
    scene.load.atlas('polearm', 'assets/polearm.png', 'assets/polearm.json');

    scene.load.audio('spearattack', ['sfx/attack.mp3']);
  }

  constructor({
    id,
    scene,
    controls,
    position,
  }: {
    id: string,
    scene: GameScene,
    controls: controls,
    position: {
      x: number,
      y: number,
    }
  }) {
    super(scene, id);
    this.instanceId = Player.numberOfInstances++;
    this.scene = scene;
    this.controls = controls;
    this.position = position;

    this.playerGroup = this.scene.add.group();
    this.attackGroup = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    })

    this.playerSprite = this.scene.physics.add.sprite(this.position.x, this.position.y, 'player1').setDepth(1);
    this.polearm = this.scene.add.sprite(this.playerSprite.x, this.playerSprite.y, 'polearm').setDepth(0);
    this.hpText = this.scene.add.text(this.playerSprite.x + 50, this.playerSprite.y - 20, `HP: ${this.hp}`).setOrigin(0.5);
    this.attackZone = this.scene.add.rectangle(-1000, -1000, 70, 25, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    this.createAnimations();
    this.create();
    this.defineStates();
  }

  createAnimations() {
    this.playerSprite.anims.create({
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
    });

    this.polearm.anims.create({
      key: 'idle',
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

    this.playerSprite.anims.create({
      key: 'jump',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 1,
          prefix: 'jump_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.polearm.anims.create({
      key: 'jump',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 1,
          prefix: 'jump_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.playerSprite.anims.create({
      key: 'swing',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 4,
          prefix: 'swingPF_',
          suffix: '.png',
        }
      ),
      frameRate: 8,
      repeat: 0,
    });

    this.polearm.anims.create({
      key: 'swing',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 4,
          prefix: 'swingPF_',
          suffix: '.png',
        }
      ),
      frameRate: 8,
      repeat: 0,
    });

    this.playerSprite.anims.create({
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

    this.playerSprite.anims.create({
      key: 'walk',
      frames: this.scene.anims.generateFrameNames(
        'player1',
        {
          start: 0,
          end: 4,
          prefix: 'walk2_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.polearm.anims.create({
      key: 'walk',
      frames: this.scene.anims.generateFrameNames(
        'polearm',
        {
          start: 0,
          end: 4,
          prefix: 'walk2_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });
  }

  defineStates() {
    this.addState('idle', {
      onUpdate: () => this.onIdleUpdate(),
    });

    this.addState('walk', {
      onUpdate: () => this.onWalkUpdate(),
    });

    this.addState('jump', {
      onEnter: () => this.onJumpEnter(),
      onUpdate: () => this.onJumpUpdate(),
    });

    this.addState('swing', {
      onEnter: () => this.onSwingEnter(),
      onUpdate: () => this.onSwingUpdate(),
    });

    // initialize state as idle
    this.setState('idle');
  }

  create() {
    this.playerSprite.setOrigin(0, 0);
    this.playerSprite.setBodySize(50, 70, false);
    this.playerSprite.body.collideWorldBounds = true;

    this.playerGroup.add(this.playerSprite).add(this.polearm).add(this.hpText).add(this.attackZone);

    this.playerGroup.scaleXY(1, 1);
    this.playerGroup.playAnimation('idle');

    // Add collision between scene map and player
    this.scene.physics.add.collider(this.scene.tilemapLayer, this.playerSprite);

    this.playerSprite.body.checkCollision.up = false;
    this.playerSprite.body.checkCollision.left = false;
    this.playerSprite.body.checkCollision.right = false;

    this.attackGroup.add(this.attackZone);
  }

  onUpdate(dt: number) {
    this.handlePlayerAction();
    this.position.x = this.playerSprite.x;
    this.position.y = this.playerSprite.y;
    this.onFloor = this.playerSprite.body.onFloor() && this.playerSprite.body.velocity.y === 0;

    this.hpText.setPosition(this.playerSprite.x + 50, this.playerSprite.y - 30);
    this.polearm.setPosition(this.playerSprite.x + this.polearm.width / 2, this.playerSprite.y + this.polearm.height / 2);
    this.update(dt);

    if (!this.gamepad && this.scene.input.gamepad.getPad(this.instanceId)) {
      this.gamepad = this.scene.input.gamepad.getPad(this.instanceId);
      this.gamepad.on('down', (gamepad: number) => {
        console.log(gamepad);
        if (gamepad === 0) {
          this.controls.jump.isDown = true;
        } else if (gamepad === 2) {
          this.controls.attack.isDown = true;
        }
      });

      this.gamepad.on('up', (gamepad: number) => {
        if (gamepad === 0) {
          this.controls.jump.isDown = false;
        } else if (gamepad === 2) {
          this.controls.attack.isDown = false;
        }
      });
      console.log(this.gamepad, 'gamepad connected');
    }

    const joyStick = this.gamepad?.leftStick ?? this.gamepad?.rightStick;

    if (joyStick !== undefined) {
      if (joyStick.x > this.deadZoneX) {
        this.controls.right.isDown = true;
      } else {
        this.controls.right.isDown = false;
      }
      if (joyStick.x < -this.deadZoneX) {
        this.controls.left.isDown = true;
      } else {
        this.controls.left.isDown = false;
      }

      if (this.enableTapJump) {
        if (joyStick.y < -this.deadZoneY) {
          this.controls.jump.isDown = true;
        } else {
          this.controls.jump.isDown = false;
        }
      }

      if (this.enableDropBelowTerrain) {
        if (joyStick.y > this.deadZoneY) {
          this.playerSprite.body.checkCollision.down = false;
        } else {
          this.playerSprite.body.checkCollision.down = true;
        }
      }
    }
  }

  onIdleUpdate() {
    if (this.onFloor) {
      this.playAnimationIfNotAttacking('idle');
    }
  }

  onWalkUpdate() {
    if (this.onFloor) {
      this.playAnimationIfNotAttacking('walk');
    }
  }

  onJumpEnter() {
    this.playAnimationIfNotAttacking('jump');
  }

  onJumpUpdate() {
    this.playAnimationIfNotAttacking('jump');
    if (this.onFloor) {
      this.handleOnFloorAnimation();
    }
  }

  handleOnFloorAnimation() {
    if (!this.onFloor) return;

    if (this.controls.left.isDown || this.controls.right.isDown) {
      this.setState('walk');
    } else {
      this.setState('idle');
    }
  }

  handlePlayerAction() {
    if (this.controls.left.isDown) {
      this.playerSprite.setVelocityX(-300);
      this.playerSprite.flipX = false;
      this.polearm.flipX = false;
      if (this.onFloor && !this.isAttacking) {
        this.setState('walk');
      }
    } else if (this.controls.right.isDown) {
      this.playerSprite.flipX = true;
      this.polearm.flipX = true;
      this.playerSprite.setVelocityX(300);

      if (this.onFloor && !this.isAttacking) {
        this.setState('walk');
      }
    }

    if ((this.controls.jump.isDown) && this.onFloor) {
      this.playerSprite.body.setVelocityY(-500);
      this.setState('jump');
    } else if (!this.controls.left.isDown && !this.controls.right.isDown && this.onFloor && !this.isAttacking) {
      this.playerSprite.setVelocityX(0);
      this.setState('idle');
    }

    if (this.controls.attack.isDown && this.isAttacking === false) {
      this.setState('swing');
    }
  }

  onSwingEnter() {
    this.playerGroup.playAnimation('swing');
    this.isAttacking = true;
    this.scene.sound.play('spearattack', {
      volume: 0.2
    });
    // spawn hitbox
    this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));

    this.playerSprite.on('animationcomplete', () => {
      console.log('finished swing attack');

      if (this.onFloor) {
        this.handleOnFloorAnimation();
      } else {
        this.setState('jump');
      }

      (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false;
      this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);

      this.isAttacking = false;

    });

  }

  onSwingUpdate() {
    // move hitbox to the correct position
    this.attackZone.x = this.polearm.x + 70 * (this.polearm.flipX ? 1 : -1);
    this.attackZone.y = this.polearm.y;
    console.log('on swing update' + this.playerSprite.anims.currentFrame.index);
  }

  playAnimationIfNotAttacking(animationName: string) {
    if (this.isAttacking) return;
    if (this.playerSprite.anims.currentAnim.key === animationName) return;

    this.playerGroup.playAnimation(animationName);
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
