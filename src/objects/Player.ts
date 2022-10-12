import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine";

export interface controls {
  [index: string]: Phaser.Input.Keyboard.Key;
}

export class Player extends StateMachine {
  static numberOfInstances = 0;
  instanceId = 0;

  playerSprite!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone!: Phaser.GameObjects.GameObject;
  playerGroup!: Phaser.GameObjects.Group;
  playerContainer!: Phaser.GameObjects.Container;
  polearm!: Phaser.GameObjects.Sprite;
  position: {
    x: number;
    y: number;
  }



  gamepad: Phaser.Input.Gamepad.Gamepad | undefined;

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
          end: 2,
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
          end: 2,
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
      frameRate: 5,
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
      frameRate: 5,
      repeat: -1,
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
      yoyo: true,
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
      yoyo: true,
    });
  }

  onCreate() {
    this.playerGroup = this.scene.add.group();
    this.playerContainer = this.scene.add.container();
    this.playerSprite = this.scene.physics.add.sprite(this.position.x, this.position.y, 'player1').setDepth(1);
    this.playerSprite.setOrigin(0, 0);
    this.playerSprite.setBodySize(50, 70, false);
    this.playerSprite.body.collideWorldBounds = true;

    this.polearm = this.scene.add.sprite(this.playerSprite.x, this.playerSprite.y, 'polearm').setDepth(0);

    this.hpText = this.scene.add.text(this.playerSprite.x + 50, this.playerSprite.y - 20, `HP: ${this.hp}`).setOrigin(0.5);

    this.attackZone = this.scene.add.rectangle(-1000, -1000, 70, 25, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    this.createAnimations();

    this.playerGroup.add(this.playerSprite).add(this.polearm).add(this.hpText).add(this.attackZone);

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


    this.attackGroup.add(this.attackZone);

  }

  onUpdate(dt: number) {
    this.hpText.setPosition(this.playerSprite.x + 50, this.playerSprite.y - 30);
    this.polearm.setPosition(this.playerSprite.x + this.polearm.width / 2, this.playerSprite.y + this.polearm.height / 2);
    this.update(dt);

    // this.gamepad = this.scene.input.gamepad.getPad(0);

    console.log(this.instanceId);

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
      // if (this.gamepad.pad.)
    }

    const joyStick = this.gamepad?.leftStick ?? this.gamepad?.rightStick;

    if (joyStick !== undefined) {
      if (joyStick.x > 0.1) {
        this.controls.right.isDown = true;
      } else {
        this.controls.right.isDown = false;
      }
      if (joyStick.x < -0.1) {
        this.controls.left.isDown = true;
      } else {
        this.controls.left.isDown = false;
      }

      if (joyStick.y < -0.1) {
        this.controls.jump.isDown = true;
      } else {
        this.controls.jump.isDown = false;
      }
    }
  }

  onIdleEnter() {
    this.playerGroup.playAnimation('idle');
    this.playerSprite.setVelocityX(0);
  }

  onIdleUpdate() {
    this.handleLateralMovement();
    if (this.controls.attack.isDown) {
      this.playerSprite.setState('stab')
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
      this.polearm.flipX = false;
      this.setState('walk');
    } else if (this.controls.right.isDown) {
      this.playerSprite.flipX = true;
      this.polearm.flipX = true;
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
    this.attackZone.x = this.polearm.x + 70 * (this.polearm.flipX ? 1 : -1);
    this.attackZone.y = this.polearm.y;
    
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
