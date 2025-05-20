import {CardComponent} from '../components/Card.js';

export class Levels extends Phaser.Scene {
    constructor() {
        super('Levels');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('card', 'assets/card.png');
        this.load.image('cardLocked', 'assets/card-locked.png');
        this.load.json('levels','src/data/levels.json');
    }

    create() {

        // Background setup
        const bg = this.add.image(0, 0, 'background').setOrigin(0);
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        bg.setDisplaySize(gameWidth, gameHeight);

        this.add.text(this.cameras.main.centerX, 50, 'CASE', {fontFamily: "Roboto",fontStyle:"Bold", fontSize: '48px', fill: '#CD4AF5' }).setOrigin(0.5);

        // Get the JSON data
        const levels = this.cache.json.get('levels');
        const levelKeys = Object.keys(levels);

        const cardWidth = 120;
        const cardHeight = 180;
        const spacing = 50;
        const columns = 5;

        const totalLevels = levelKeys.length;
        const rows = Math.ceil(totalLevels / columns);

        const gridWidth = columns * cardWidth + (columns - 1) * spacing;
        const gridHeight = rows * cardHeight + (rows - 1) * spacing;

        const startX = this.cameras.main.centerX - gridWidth / 2 + cardWidth / 2;
        const startY = this.cameras.main.centerY - gridHeight / 2 + cardHeight / 2;

        levelKeys.forEach((levelKey, index) => {
            const levelData = levels[levelKey];
    const row = Math.floor(index / columns);
    const col = index % columns;

    const x = startX + col * (cardWidth + spacing);
    const y = startY + row * (cardHeight + spacing);

    const card = new CardComponent(this, x, y, cardWidth, cardHeight, levelKey,levelData, () => {
        if(!levelData.isLocked){
            this.scene.start('Terminal', {levelKey });
        }
    });
});

}

    update() {
    }
}
