import { GameScene } from "../scenes/Game";
import ANIMATION_UPDATE from "phaser/src/animations/events/ANIMATION_UPDATE_EVENT";
import ANIMATION_COMPLETE_EVENT from "phaser/src/animations/events/ANIMATION_COMPLETE_EVENT";
import { Player } from "./Player";

type createFrame = {
  key: string;
  numberOfFrames: number;
  isAttack?: boolean;
  dontRepeat?: boolean;
  bodySize?: {
    x: number;
    y: number;
  }[],
  offset: {
    x: number;
    y: number;
  }[]
}

type animationDataMap = {
  [index: string]: animationData;
}

type animationData = {
  isAttack: boolean;
  bodySize: {
    x: number;
    y: number;
  }[],
  offset: {
    x: number;
    y?: number;
  }[],
};

const FRAME_RATE = 5;

export class PlayerAnimation {
  scene: GameScene;
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  atlasKey: string;
  animationDataMap: animationDataMap;
  player: Player;

  constructor(player: Player, scene: GameScene, sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    atlasKey: string) {
    this.player = player;
    this.scene = scene;
    this.sprite = sprite;
    this.atlasKey = atlasKey;
    this.animationDataMap = {};

    this.sprite.on(ANIMATION_UPDATE, (event: any) => {
      console.log('update');
      const animationKey = event.manager.currentAnim.key;
      const bodySize = this.animationDataMap[animationKey]?.bodySize;
      const offset = this.animationDataMap[animationKey]?.offset;

      const currentFrameIndex = event.manager?.currentFrame?.index - 1;

      const bodySizeForCurrentFrame = bodySize[currentFrameIndex];
      const offsetForCurrentFrame = offset[currentFrameIndex];

      if (bodySizeForCurrentFrame && (this.sprite.body.x !== bodySizeForCurrentFrame.x || this.sprite.body.y !== bodySizeForCurrentFrame.y)) {
        console.log('update body size');
        this.sprite.setBodySize(bodySizeForCurrentFrame.x, bodySizeForCurrentFrame.y);
      }
      if (offsetForCurrentFrame) {
        console.log('update offset');
        this.sprite.setOffset(offsetForCurrentFrame.x, offsetForCurrentFrame.y);
      }
    });

    this.sprite.on(ANIMATION_COMPLETE_EVENT, (event: any) => {
      const isAttack = this.animationDataMap[event.key]?.isAttack;
      if (isAttack) {
        console.log('isattacking false')
        this.player.isAttacking = false;

        // update logic to manage setting animation when exiting one
        if (!this.player.controls.left.isDown && !this.player.controls.right.isDown && this.player.onFloor && !this.player.damageTakenRecently) {
          this.player.setState('idle')
        } else if (!this.player.onFloor) {
          this.player.setState('jump')
        }
      }
    });
  }


  createFrame(options: createFrame) {
    const { key, numberOfFrames, dontRepeat = false, isAttack = false } = options;
    this.sprite.anims.create({
      key,
      frames: this.scene.anims.generateFrameNames(
        this.atlasKey,
        {
          start: 0,
          end: numberOfFrames - 1,
          prefix: `${key}_`,
          suffix: '.png',
        }
      ),
      frameRate: FRAME_RATE,
      repeat: dontRepeat ? 0 : -1,
    });
    this.animationDataMap[key] = {
      bodySize: options?.bodySize ?? [],
      offset: options?.offset ?? [],
      isAttack: isAttack,
    }

    console.log(this.animationDataMap);
  }

  playAnimation(animationKey: string) {
    const currentAnimationKey = this.sprite.anims.currentAnim?.key;
    const locked = this.player.isAttacking && this.sprite.anims.currentFrame.isLast === false;

    // don't play animation if already playing it
    if (currentAnimationKey === animationKey) return;
    if (locked) return;

    const bodySize = this.animationDataMap[animationKey]?.bodySize;
    const offset = this.animationDataMap[animationKey]?.offset;

    if (bodySize[0]) {
      this.sprite.setBodySize(bodySize[0].x, bodySize[0].y);
    }
    if (offset[0]) {
      this.sprite.setOffset(offset[0].x, offset[0].y);
    }

    this.sprite.play(animationKey);
  }
}