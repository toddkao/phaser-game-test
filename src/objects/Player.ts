import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine";

export interface controls {
  [index: string]: Phaser.Input.Keyboard.Key;
}

export class Player extends StateMachine {
  playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone!: Phaser.GameObjects.GameObject;
  context: GameScene;
  hp: number = 100;
  hpText!: Phaser.GameObjects.Text;
  controls: controls;

  static preload(scene: Phaser.Scene) {
    scene.load.atlas('swing', 'assets/swing.png', 'assets/swing.json');
    scene.load.atlas('stab', 'assets/stab.png', 'assets/stab.json');
    scene.load.atlas('walk', 'assets/walk.png', 'assets/walk.json');
    scene.load.atlas('idle', 'assets/idle.png', 'assets/idle.json');
    scene.load.atlas('jump', 'assets/jump.png', 'assets/jump.json');
  }

  constructor(id: string, context: GameScene, sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, controls: controls) {
    super(context, id);
    this.context = context;
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
    this.context.anims.create({
      key: 'idle',
      frames: this.context.anims.generateFrameNames(
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

        
    this.context.anims.create({
      key: 'jump',
      frames: this.context.anims.generateFrameNames(
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

    this.context.anims.create({
      key: 'swing',
      frames: this.context.anims.generateFrameNames(
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

    this.context.anims.create({
      key: 'stab',
      frames: this.context.anims.generateFrameNames(
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

    this.context.anims.create({
      key: 'walk',
      frames: this.context.anims.generateFrameNames(
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

    this.attackZone = this.context.add.rectangle(0, 0, 32, 64, 0xffffff, 0) as unknown as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    this.hpText = this.context.add.text(this.playerSprite.x, this.playerSprite.y - 90, `HP: ${this.hp}`)
    .setOrigin(0.5);


    this.playerSprite.on('animationupdate', (anim, frame, sprite, frameKey)=> {
      if (anim.key === 'stab') {
        // this.context.physics.world.disable(this.attackZone);
        console.log(frame.index);
        // if(frame.index == 1) {
        //   this.attackZone.x = this.playerSprite.x
        //   this.attackZone.y = this.playerSprite.y
        // }
        // if(frame.index == 2) {
        //   this.attackZone.x = this.playerSprite.x;
        //   this.attackZone.y = this.playerSprite.y - 20
        //   this.attackZone.body.height = 84;
        // }
        // if(frame.index == 3) {
        //   this.attackZone.x = this.playerSprite.x;
        //   this.attackZone.y = this.playerSprite.y;
        //   this.attackZone.body.height = 32
        // }
      }
    });

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

    // if (this.playerSprite.body.velocity.y === 0 && this.playerSprite.body.velocity.x === 0 && this.playerSprite.body.onFloor()) {
    //   this.setState('idle');
    // }
  }

  onStabEnter() {
    this.playerSprite.play('stab');

    // TODO: move sword swing hitbox into place
    // does it need to start part way into the animation?
    // const startHit = (anim: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
    //   if (frame.index < 5) {
    //     return
    //   }

    //   this.playerSprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

    //   this.swordHitbox.x = this.knight.flipX
    //     ? this.knight.x - this.knight.width * 0.25
    //     : this.knight.x + this.knight.width * 0.25

    //   this.swordHitbox.y = this.knight.y + this.knight.height * 0.2

    //   this.swordHitbox.body.enable = true
    //   this.physics.world.add(this.swordHitbox.body)
    // }

    // this.knight.on(Phaser.Animations.Events.ANIMATION_UPDATE, startHit)

    // this.knight.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'attack', () => {
    //   this.knightStateMachine.setState('idle')

    //   // TODO: hide and remove the sword swing hitbox
    //   this.swordHitbox.body.enable = false
    //   this.physics.world.remove(this.swordHitbox.body)
    // })
  }

  onStabUpdate() {
    if (this.playerSprite.anims.currentFrame.index === 3) {
      this.setState('idle');
    }
  }
}
