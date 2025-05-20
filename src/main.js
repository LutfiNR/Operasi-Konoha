 import { Terminal } from './scenes/Terminal.js'
 import { Levels } from './scenes/Levels.js'
 import { Chat } from './scenes/Chat.js'



const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    dom:{
        createContainer: true
    },
    scene: [
        Levels,
        Terminal,
        Chat,
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            