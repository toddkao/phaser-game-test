import Phaser from 'phaser';

export default {
  type: Phaser.WEBGL,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 500 },
        debug: true,
    }
  },
  input: {
    gamepad: true,
  },
  // render: {
  //   pixelArt: true,
  // },
  scale: {
    width: 1920,
    height: 1090,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  fps: {
    min: 60,
    target: 60,
    forceSetTimeOut: true,
  }
};
