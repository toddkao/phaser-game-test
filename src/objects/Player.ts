import { GameScene } from "../scenes/Game";
import { StateMachine } from "./StateMachine"

export class Player extends StateMachine {
  playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  attackZone!: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[] | Phaser.GameObjects.Group | Phaser.GameObjects.Group[];
  context: GameScene;

  constructor(id: string, context: GameScene, sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    super(context, id);
    this.context = context;
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

    this.addState('swing', {
      onEnter: () => this.onSwing(),
    })

    this.setState('idle');
  }

  createAnimations() {
    this.context.anims.create({
      key: 'idle',
      frames: this.context.anims.generateFrameNames(
        'idle',
        {
          start: 1,
          end: 4,
          prefix: 'stand1_',
          suffix: '.png',
        }
      ),
      frameRate: 5,
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
    })

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
    // this.playerSprite.setOrigin(0, 0);
    this.playerSprite.setSize(55, 75);
  }

  onIdleEnter() {
    this.playerSprite.play('idle');
    this.playerSprite.setVelocityX(0);
  }

  onIdleUpdate() {
    this.handleLateralMovement();
    if (this.context.cursors.space.isDown) {
      this.playerSprite.setState('swing')
    }
    if ((this.context.cursors.up.isDown) && this.playerSprite.body.onFloor()) {
      this.setState('jump');
    }
  }

  onWalkEnter() {
    this.playerSprite.play('walk');
  }

  onWalkUpdate() {
    this.handleLateralMovement();
    if ((this.context.cursors.up.isDown) && this.playerSprite.body.onFloor()) {
      this.setState('jump');
    }
    if (this.context.cursors.space.isDown) {
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
      if (this.playerSprite.body.velocity.y === 0 && this.playerSprite.body.velocity.x === 0) {
        this.setState('idle');
      } else {
        this.setState('walk');
      }
    }
  }

  handleLateralMovement() {
    if (this.context.cursors.left.isDown) {
      this.playerSprite.setVelocityX(-300);
      this.playerSprite.flipX = false;
    } else if (this.context.cursors.right.isDown) {
      this.playerSprite.flipX = true;
      this.playerSprite.setVelocityX(300);
    }

    if (!this.context.cursors.left.isDown && !this.context.cursors.right.isDown && this.playerSprite.body.onFloor()) {
      this.setState('idle');
    }
  }

  onSwing() {
    this.playerSprite.play('swing')
    this.playerSprite.setVelocityX(0);

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
}
