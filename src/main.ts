import Phaser from 'phaser'
import './style.css'
import { WorldScene } from './scenes/WorldScene'

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    width: 960,
    height: 540,

    backgroundColor: '#000000',

    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },

    scene: [
        WorldScene
    ]
}

new Phaser.Game(config)