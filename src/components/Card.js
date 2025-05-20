export class CardComponent extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, levelKey,levelData, onClick) {
        super(scene, x, y);

        this.width = width;
        this.height = height;
        const isLocked = levelData.isLocked;
        const bgKey = isLocked ? 'cardLocked' : 'card';
        // Background image
        const cardImage = scene.add.image(0, 0, bgKey)
            .setDisplaySize(width, height)
            .setOrigin(0.5);


        // Add children to container
        this.add(cardImage);

        // Enable interaction
        this.setSize(width, height);
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        this.on('pointerover', () => cardImage.setTint(0xdddddd));
        this.on('pointerout', () => cardImage.clearTint());
        this.on('pointerdown', () => {
            if (onClick) onClick();
        });

        // Add to scene
        scene.add.existing(this);
    }
}
