import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine";
import config from '../config';
import { PlayerAnimation } from "./PlayerAnimation";

type PlayerProps = {
  id: string;
  scene: GameScene;
  controls: controls;
  position: {
    x: number;
    y: number;
  };
};

export interface controls {
  [index: string]: Phaser.Input.Keyboard.Key;
};

export class Player extends StateMachine {
  static numberOfInstances = 0;
  instanceId = 0;

  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone: Phaser.GameObjects.GameObject;
  onFloor = false;
  playerAnimation: PlayerAnimation;

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
    scene.load.atlas('sword', 'assets/sword.png', 'assets/sword.json');
    scene.load.audio('spearattack', ['sfx/swordattack.mp3']);
  }

  constructor({
    id,
    scene,
    controls,
    position,
  }: PlayerProps) {
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

    this.sprite = this.scene.physics.add.sprite(this.position.x, this.position.y, 'sword').setDepth(1);
    this.hpText = this.scene.add.text(this.sprite.x, this.sprite.y - this.sprite.height, `HP: ${this.hp}`).setOrigin(0.5);
    this.attackZone = this.scene.add.rectangle(-1000, -1000, 140, 25, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    this.playerAnimation = new PlayerAnimation(this, scene, this.sprite, 'sword');

    this.createAnimations();
    this.create();
    this.defineStates();
  }

  createAnimations() {

    this.playerAnimation.createFrame({
      key: 'alert',
      numberOfFrames: 4,
      offset: [{
        x: 10,
        y: 0,
      }]
    });

    this.playerAnimation.createFrame({
      key: 'stand1',
      numberOfFrames: 4,
      bodySize: [{
        x: 40,
        y: 70,
      }],
      offset: [{
        x: 10,
        y: 0,
      }]
    });

    this.playerAnimation.createFrame({
      key: 'walk1',
      numberOfFrames: 5,
      offset: [{
        x: 10,
        y: 0,
      }]
    });

    this.playerAnimation.createFrame({
      key: 'jump',
      numberOfFrames: 2,
      offset: [{
        x: 10,
        y: 0,
      }]
    });

    this.playerAnimation.createFrame({
      key: 'swingO2',
      numberOfFrames: 5,
      dontRepeat: true,
      bodySize: [{
        x: 40,
        y: 70,
      }],
      offset: [{
        x: 80,
        y: 21,
      }],
      isAttack: true,
    });

    this.playerAnimation.createFrame({
      key: 'stabO1',
      numberOfFrames: 3,
      dontRepeat: true,
      offset: [{
        x: 80,
        y: -5,
      }],
      isAttack: true,
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
      onExit: () => {
        console.log('exit swing');
        this.controls.swing.isDown = false;
        this.isAttacking = false;
        if (this.onFloor) {
          this.handleOnFloorAnimation();
        } else {
          this.setState('jump');
        }
      }
    });

    this.addState('stab', {
      onEnter: () => this.onStabEnter(),
      onUpdate: () => this.onStabUpdate(),
      onExit: () => {
        console.log('exit stab');
        this.controls.attack.isDown = false;
        this.isAttacking = false;
        if (this.onFloor) {
          this.handleOnFloorAnimation();
        } else {
          this.setState('jump');
        }
      }
    });


    this.addState('alert', {
      onEnter: () => this.onAlertEnter(),
      onUpdate: () => this.onAlertUpdate(),
    })

    // initialize state as idle
    this.setState('idle');
  }

  create() {
    this.sprite.setScale(2, 2);

    this.setPlayerFacingRight(true);
    this.hpText.setScale(2, 2);

    this.sprite.body.checkCollision.up = false;
    this.sprite.body.checkCollision.left = false;
    this.sprite.body.checkCollision.right = false;

    this.sprite.body.collideWorldBounds = true;

    this.playerAnimation.playAnimation('stand1');

    // this.playerGroup.add(this.playerSprite).add(this.polearm).add(this.hpText).add(this.attackZone);

    // this.playerGroup.scaleXY(1, 1);
    // this.playerGroup.playAnimation('idle');

    // Add collision between scene map and player
    this.scene.physics.add.collider(this.scene.tilemapLayer, this.sprite);

    this.attackGroup.add(this.attackZone);

  }

  update(dt: number) {
    this.handleGamepadControls();
    this.handlePlayerAction();
    this.handleFriction();
    this.betterJumping();

    // Keep position and velocity synced with sprite 
    this.position.x = this.sprite.x;
    this.position.y = this.sprite.y;

    this.velocity.x = this.sprite.body.velocity.x;
    this.velocity.y = this.sprite.body.velocity.y;

    this.onFloor = this.sprite.body.onFloor() && this.sprite.body.velocity.y === 0;

    this.hpText.setPosition(this.sprite.x, this.sprite.y - this.sprite.height);
    this.onUpdate(dt);
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
          this.sprite.body.checkCollision.down = false;
        } else {
          this.sprite.body.checkCollision.down = true;
        }
      }

      if (joyStick.y > this.deadZoneY) {
        this.isFastFalling = true;
      }
    }
  }

  betterJumping() {
    // better jumping
    if (this.sprite.body.velocity.y > 0 && !this.startedFallingFromJump) {
      this.startedFallingFromJump = true;
      if (this.isFastFalling) {
        this.sprite.body.velocity.y += this.sprite.body.velocity.y * 120;
      } else {
        this.sprite.body.velocity.y += (this.sprite.body.velocity.y * this.fallMultiplier - 1);
      }
    } else if (this.sprite.body.velocity.y < 0 && !this.controls.jump.isDown) {
      this.sprite.body.velocity.y += (this.sprite.body.velocity.y * (this.lowJumpMultiplier - 1));
      this.startedFallingFromJump = false;
    }
  }

  handleFriction() {
    if (this.onFloor && this.sprite.body.velocity.x > 0 && !this.controls.right.isDown) {
      this.sprite.body.velocity.x -= 50;
    } else if (this.onFloor && this.sprite.body.velocity.x < 0 && !this.controls.left.isDown) {
      this.sprite.body.velocity.x += 50;
    }
  }

  onAlertEnter() {
    this.playerAnimation.playAnimation('alert');
  }

  onAlertUpdate() {
    this.scene.time.delayedCall(500, () => {
      this.setState('idle');
    })
  }

  onIdleUpdate() {
    if (this.onFloor) {
      this.playerAnimation.playAnimation('stand1');
    }
  }

  onWalkUpdate() {
    if (this.onFloor) {
      this.playerAnimation.playAnimation('walk1');
    }
  }

  onJumpEnter() {
    this.playerAnimation.playAnimation('jump');
    // this.playerSprite.body.velocity.y = -150;
  }

  onJumpUpdate() {
    this.playerAnimation.playAnimation('jump');
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
      this.sprite.setVelocityX(-600);

      if (!this.isAttacking) {
        this.setPlayerFacingRight(false);

        if (this.onFloor) {
          this.setState('walk');
        }
      }
    } else if (this.controls.right.isDown) {
      this.sprite.setVelocityX(600);

      if (!this.isAttacking) {
        this.setPlayerFacingRight(true);

        if (this.onFloor) {
          this.setState('walk');
        }
      }
    }


    if ((this.controls.jump.isDown) && this.onFloor) {
      this.sprite.body.setVelocityY(-450);
      // this.playerSprite.body.setAllowGravity(false);
      // this.playerSprite.body.setAccelerationY(600);
      if (!this.isAttacking) {
        this.setState('jump');
      }
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
    this.playerAnimation.playAnimation('stabO1');
    this.isAttacking = true;
    if (this.currentState) {
      this.currentState.startTime = new Date().getTime();
    }

    this.scene.sound.play('spearattack', {
      volume: 0.2
    });

  }

  onStabUpdate() {
    const currentTime = new Date().getTime();
    const currentMS = currentTime - (this.currentState?.startTime ?? 0);
    const currentFrame = Math.floor(currentMS / 16);
    console.log('stab frame: ' + currentFrame);

    // move hitbox to the correct position
    if (currentFrame === 15) {
      // spawn hitbox

      this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));
      this.attackZone.damage = 5;
      this.attackZone.body.height = 25;
      this.attackZone.body.width = 130;

      this.attackZone.x = this.sprite.x + 110 * (this.sprite.flipX ? 1 : -1);
      this.attackZone.y = this.sprite.y + 30;
    } else if (currentFrame >= 20) {
      this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);
    } else if (currentFrame >= 40) {
      this.isAttacking = false;
    }
  }

  onSwingEnter() {
    this.playerAnimation.playAnimation('swingO2');
    this.isAttacking = true;
    if (this.currentState) {
      this.currentState.startTime = new Date().getTime();
    }

    this.scene.sound.play('spearattack', {
      volume: 0.2
    });
  }

  onSwingUpdate() {
    const currentTime = new Date().getTime();
    const currentMS = currentTime - (this.currentState?.startTime ?? 0);
    const currentFrame = Math.floor(currentMS / 16);
    console.log('swing frame: ' + currentFrame);

    // move hitbox to the correct position
    if (currentFrame === 30) {
      // spawn hitbox
      this.scene.physics.world.add((this.attackZone.body as Phaser.Physics.Arcade.Body));
      this.attackZone.damage = 10;
      this.attackZone.body.height = 150;
      this.attackZone.body.width = 140;
      this.attackZone.x = this.sprite.x + 70 * (this.sprite.flipX ? 1 : -1);
      this.attackZone.y = this.sprite.y - 30;
    } else if (currentFrame > 40) {
      this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);
    } else if (currentFrame >= 66) {
      this.isAttacking = false;
    }
  }

  onDamageTaken(attack: Phaser.Types.Physics.Arcade.GameObjectWithBody, player: Player) {
    if (!this.damageTakenRecently) {
      console.log(attack);
      this.hp -= attack.damage;
      attack.body.width = 0;
      attack.body.height = 0;
      this.scene.physics.world.remove(this.attackZone.body as Phaser.Physics.Arcade.Body);
      this.hpText.text = `HP: ${this.hp}`;
      this.damageTakenRecently = true;
      this.setState('alert');

      if (player.sprite.x > this.sprite.x) {
        this.sprite.body.velocity.x -= 500;
        this.setPlayerFacingRight(false);
      } else {
        console.log('enemy is to the left, should launch to the right');
        this.sprite.body.velocity.x += 500;
        this.setPlayerFacingRight(true);
      }

      this.sprite.setTint(0xFF0000);

      const tween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.5,
        ease: 'Cubic.easeOut',
        duration: 500,
        repeat: -1,
        yoyo: true
      });

      this.scene.time.delayedCall(60 * (attack.damage ?? 5), () => {
        this.damageTakenRecently = false;
        this.sprite.alpha = 1;
        this.scene.tweens.remove(tween);
        this.sprite.setTint(0xffffff);
      })
    }
  }

  setPlayerFacingRight(right: boolean) {
    if (right) {
      this.sprite.flipX = true;
    } else {
      this.sprite.flipX = false;
    }
  }
}
