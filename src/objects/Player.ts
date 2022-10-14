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
  // playerGroup: Phaser.GameObjects.Group;
  // polearm: Phaser.GameObjects.Sprite;

  onFloor = false;

  position: {
    x: number;
    y: number;
  }

  velocity: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };

  fallMultiplier = 30;
  lowJumpMultiplier = 0.1;
  startedFallingFromJump = false;

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
  isFastFalling: boolean = false;

  attackGroup: Phaser.Physics.Arcade.Group;

  static preload(scene: Phaser.Scene) {
    // scene.load.atlas('player1', 'assets/player1.png', 'assets/player1.json');
    // scene.load.atlas('polearm', 'assets/polearm.png', 'assets/polearm.json');
    scene.load.atlas('sword', 'assets/sword.png', 'assets/sword.json');
    // scene.load.atlas('sword', 'assets/swords2.png', 'assets/swords2.json');

    scene.load.audio('spearattack', ['sfx/swordattack.mp3']);
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

    // this.playerGroup = this.scene.add.group();
    this.attackGroup = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    })

    this.playerSprite = this.scene.physics.add.sprite(this.position.x, this.position.y, 'sword').setDepth(1);
    this.hpText = this.scene.add.text(this.playerSprite.x, this.playerSprite.y - this.playerSprite.height, `HP: ${this.hp}`).setOrigin(0.5);
    this.attackZone = this.scene.add.rectangle(-1000, -1000, 140, 25, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    this.createAnimations();
    this.create();
    this.defineStates();
  }

  createAnimations() {
    this.playerSprite.anims.create({
      key: 'alert',
      frames: this.scene.anims.generateFrameNames(
        'sword',
        {
          start: 0,
          end: 3,
          prefix: 'alert_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });

    this.playerSprite.anims.create({
      key: 'idle',
      frames: this.scene.anims.generateFrameNames(
        'sword',
        {
          start: 1,
          end: 3,
          prefix: 'stand1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
      repeat: -1,
    });



    this.playerSprite.anims.create({
      key: 'jump',
      frames: this.scene.anims.generateFrameNames(
        'sword',
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
        'sword',
        {
          start: 0,
          end: 4,
          prefix: 'swingO2_',
          suffix: '.png',
        }
      ),
      frameRate: 4,
      repeat: 0,
    });

    this.playerSprite.anims.create({
      key: 'stab',
      frames: this.scene.anims.generateFrameNames(
        'sword',
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
        'sword',
        {
          start: 0,
          end: 4,
          prefix: 'walk1_',
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

    this.addState('stab', {
      onEnter: () => this.onStabEnter(),
      onUpdate: () => this.onStabUpdate(),
    });


    this.addState('alert', {
      onEnter: () => this.onAlertEnter(),
      onUpdate: () => this.onAlertUpdate(),
    })

    // initialize state as idle
    this.setState('idle');
  }

  create() {
    this.playerSprite.setScale(2, 2);
    // this.playerSprite.setOffset(0, 0);
    this.playerSprite.setBodySize(50, 70);
    this.playerSprite.setOffset(30, 40);
    this.hpText.setScale(2, 2);



    this.playerSprite.body.checkCollision.up = false;
    this.playerSprite.body.checkCollision.left = false;
    this.playerSprite.body.checkCollision.right = false;

    this.playerSprite.body.collideWorldBounds = true;

    this.playerSprite.play('idle');

    // this.playerGroup.add(this.playerSprite).add(this.polearm).add(this.hpText).add(this.attackZone);

    // this.playerGroup.scaleXY(1, 1);
    // this.playerGroup.playAnimation('idle');

    // Add collision between scene map and player
    this.scene.physics.add.collider(this.scene.tilemapLayer, this.playerSprite);



    this.attackGroup.add(this.attackZone);

    this.playerSprite.on('animationcomplete', (event: any) => {
      if (event.key === 'stab') {
        console.log('finished stab attack');

        if (this.onFloor) {
          this.handleOnFloorAnimation();
        } else {
          this.setState('jump');
        }

        this.controls.attack.isDown = false;
        this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);

        this.isAttacking = false;
      }

      if (event.key === 'swing') {
        console.log('finished swing attack');

        if (this.onFloor) {
          this.handleOnFloorAnimation();
        } else {
          this.setState('jump');
        }

        this.controls.attack.isDown = false;
        (this.attackZone.body as Phaser.Physics.Arcade.Body).enable = false;
        this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);

        this.isAttacking = false;
      }

    });

  }

  handleGamepadControls() {

    if (!this.gamepad && this.scene.input.gamepad.getPad(this.instanceId)) {
      this.gamepad = this.scene.input.gamepad.getPad(this.instanceId);
      this.gamepad.on('down', (gamepad: number) => {
        console.log('button pressed ' + gamepad)
        switch (gamepad) {
          // A button (xbox 360)
          case 0:
            this.controls.jump.isDown = true;
            break;
          // B button (xbox 360)    
          case 1:
            this.controls.swing.isDown = true;
            break;
          // X button (xbox 360)    
          case 2:
            this.controls.attack.isDown = true;
            break;
        }
      });

      this.gamepad.on('up', (gamepad: number) => {
        switch (gamepad) {
          // A button (xbox 360)
          case 0:
            this.controls.jump.isDown = false;
            break;
          // B button (xbox 360)    
          case 1:
            this.controls.swing.isDown = false;
            break;
          // X button (xbox 360)    
          case 2:
            this.controls.attack.isDown = false;
            break;
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

      if (joyStick.y > this.deadZoneY) {
        this.isFastFalling = true;
      }
    }
  }

  betterJumping() {
    // better jumping
    if (this.playerSprite.body.velocity.y > 0 && !this.startedFallingFromJump) {
      this.startedFallingFromJump = true;
      if (this.isFastFalling) {
        this.playerSprite.body.velocity.y += this.playerSprite.body.velocity.y * 120;
      } else {
        this.playerSprite.body.velocity.y += (this.playerSprite.body.velocity.y * this.fallMultiplier - 1);
      }
    } else if (this.playerSprite.body.velocity.y < 0 && !this.controls.jump.isDown) {
      this.playerSprite.body.velocity.y += (this.playerSprite.body.velocity.y * (this.lowJumpMultiplier - 1));
      this.startedFallingFromJump = false;
    }
  }

  onUpdate(dt: number) {
    this.handleGamepadControls();

    if (this.onFloor && this.playerSprite.body.velocity.x > 0 && !this.controls.right.isDown) {
      this.playerSprite.body.velocity.x -= 50;
    } else if (this.onFloor && this.playerSprite.body.velocity.x < 0 && !this.controls.left.isDown) {
      this.playerSprite.body.velocity.x += 50;
    }


    this.handlePlayerAction();

    // Keep position and velocity synced with sprite 
    this.position.x = this.playerSprite.x;
    this.position.y = this.playerSprite.y;

    this.velocity.x = this.playerSprite.body.velocity.x;
    this.velocity.y = this.playerSprite.body.velocity.y;

    this.onFloor = this.playerSprite.body.onFloor() && this.playerSprite.body.velocity.y === 0;

    this.hpText.setPosition(this.playerSprite.x, this.playerSprite.y - this.playerSprite.height);
    // this.polearm.setPosition(this.playerSprite.x + this.polearm.width / 2, this.playerSprite.y + this.polearm.height / 2);
    this.update(dt);

    this.betterJumping();
  }

  onAlertEnter() {
    this.playAnimationIfNotAttacking('alert');
  }

  onAlertUpdate() {
    this.scene.time.delayedCall(500, () => {
      this.setState('idle');
    })
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
    // this.playerSprite.body.velocity.y = -150;
  }

  onJumpUpdate() {
    this.playAnimationIfNotAttacking('jump');
    // this.playerSprite.body.setMaxSpeed(50);
    if (this.onFloor) {
      this.controls.jump.isDown = false;
      this.handleOnFloorAnimation();
    } else {
      // console.log(Math.abs(this.playerSprite.body.velocity.y), this.playerSprite.body.maxSpeed);
      // if (Math.abs(this.playerSprite.body.velocity.y) < this.playerSprite.body.maxSpeed) {
      //   this.playerSprite.body.velocity.y +=  -10;
      //   console.log('start accelerating');
      // } else {
      //   console.log('stopped accelerating');
      // }
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
    if (this.damageTakenRecently) return;

    if (this.onFloor) {
      this.isFastFalling = false;
    }

    if (this.controls.left.isDown) {
      this.playerSprite.setVelocityX(-600);

      if (!this.isAttacking) {
        this.flipPlayer(true);

        if (this.onFloor ) {
          this.setState('walk');
        }
      }
    } else if (this.controls.right.isDown) {
      this.playerSprite.setVelocityX(600);

      if (!this.isAttacking) {
        this.flipPlayer(false);

        if (this.onFloor) {
          this.setState('walk');
        }
      }
    }


    if ((this.controls.jump.isDown) && this.onFloor) {
      this.playerSprite.body.setVelocityY(-450);
      // this.playerSprite.body.setAllowGravity(false);
      // this.playerSprite.body.setAccelerationY(600);
      console.log('jump');
      this.setState('jump');
    } else if (!this.controls.left.isDown && !this.controls.right.isDown && this.onFloor && !this.isAttacking && !this.damageTakenRecently) {
      this.setState('idle');
    } 
    
    if (this.controls.attack.isDown && this.isAttacking === false) {
      this.setState('stab');
    } else if (this.controls.swing.isDown && this.isAttacking === false) {
      this.setState('swing');
    }
  }

  onStabEnter() {
    this.playerSprite.play('stab');
    if (this.currentState) {
      this.currentState.startTime = new Date().getTime();
    }

    this.isAttacking = true;
    this.scene.sound.play('spearattack', {
      volume: 0.2
    });
    // spawn hitbox
    this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));
    this.attackZone.damage = 5;
    this.attackZone.body.height = 25;
    this.attackZone.body.width = 100;
    this.attackZone.x = 999999;
    this.attackZone.y = 999999;
  }

  onStabUpdate() {
    const currentTime = new Date().getTime();
    const currentMS = currentTime - (this.currentState?.startTime ?? 0);
    const currentFrame = Math.floor(currentMS / 144);
    console.log('stab frame: ' + currentFrame);

    // move hitbox to the correct position
    if (currentFrame > 1) {
      this.attackZone.x = this.playerSprite.x + 110 * (this.playerSprite.flipX ? -1 : 1);
      this.attackZone.y = this.playerSprite.y + 30;
    }
  }

  onSwingEnter() {
    this.playerSprite.play('swing');
    if (this.currentState) {
      this.currentState.startTime = new Date().getTime();
    }

    this.isAttacking = true;
    this.scene.sound.play('spearattack', {
      volume: 0.2
    });
    // spawn hitbox
    this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));
    this.attackZone.damage = 10;
    this.attackZone.body.height = 150;
    this.attackZone.body.width = 140;
    this.attackZone.x = 999999;
    this.attackZone.y = 999999;
  }

  onSwingUpdate() {
    const currentTime = new Date().getTime();
    const currentMS = currentTime - (this.currentState?.startTime ?? 0);
    const currentFrame = Math.floor(currentMS / 144);
    console.log('swing frame: ' + currentFrame);

    // move hitbox to the correct position
    if (currentFrame > 2) {
      this.attackZone.x = this.playerSprite.x + 70 * (this.playerSprite.flipX ? -1 : 1);
      this.attackZone.y = this.playerSprite.y - 30;
    }
  }


  playAnimationIfNotAttacking(animationName: string) {
    if (this.isAttacking) return;
    if (this.playerSprite.anims.currentAnim.key === animationName) return;

    this.playerSprite.play(animationName);
  }

  onDamageTaken(attack: Phaser.Types.Physics.Arcade.GameObjectWithBody, player: Player) {
    let rotationTween;
    if (!this.damageTakenRecently) {
      console.log(attack);
      this.hp -= attack.damage;
      attack.body.width = 0;
      attack.body.height = 0;
      this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);
      this.hpText.text = `HP: ${this.hp}`;
      this.damageTakenRecently = true;
      this.setState('alert');

      if (player.playerSprite.x > this.playerSprite.x) {
        this.playerSprite.body.velocity.x -= 500;
        this.flipPlayer(false);
      } else {
        console.log('enemy is to the left, should launch to the right');
        this.playerSprite.body.velocity.x += 500;
        this.flipPlayer(true);
      }

      this.playerSprite.setTint(0xFF0000);

      const tween = this.scene.tweens.add({
        targets: this.playerSprite,
        alpha: 0.5,
        ease: 'Cubic.easeOut',
        duration: 500,
        repeat: -1,
        yoyo: true
      });

      this.scene.time.delayedCall(60 * (attack.damage ?? 5), () => {
        this.damageTakenRecently = false;
        this.playerSprite.alpha = 1;
        this.scene.tweens.remove(tween);
        this.playerSprite.setTint(0xffffff);
      })
    }
  }

  flipPlayer(flip: boolean) {
    if (flip) {
      this.playerSprite.flipX = true;
      this.playerSprite.setBodySize(40, 70);
      this.playerSprite.setOffset(70, 40);
    } else {
      this.playerSprite.flipX = false;
      this.playerSprite.setBodySize(40, 70);
      this.playerSprite.setOffset(30, 40);
    }
  }
}
