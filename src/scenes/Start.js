export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
        this.terminal = new Terminal();
    }

    preload() {
    }

    create() {
        this.terminal.open(document.getElementById('game-caontainer'));
        this.terminal.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');
    }

    update() {
        this.background.tilePositionX += 2;
    }
    
}
