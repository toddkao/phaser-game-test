import Phaser from 'phaser';
import config from './config';
import { DebugUI } from './scenes/DebugUI';
import { GameScene } from './scenes/Game';

new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene, DebugUI]
  })
);
