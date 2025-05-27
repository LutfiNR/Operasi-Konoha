// MainMenu.js

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.image('menu-bg', 'assets/mainmenu.png'); // Ganti sesuai path
        // Load the click sound
        this.load.audio('clickSound', 'assets/click-sound.mp3');
        this.load.audio('bgm1', 'assets/background.mp3');
        this.load.audio('bgm2', 'assets/bgm2.mp3');
        this.load.audio('complete', 'assets/complete.mp3');
        this.load.audio('notification', 'assets/notif1.mp3');
        this.load.audio('keyboard', 'assets/keyboard.mp3');
        this.load.audio('timesup', 'assets/times up.mp3');

    }

    create() {
        // Tampilkan background
        // Assuming your game dimensions are 1280x720 for these coordinates to center the background
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu-bg').setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Sound instance (optional, can also create and play on the fly)
        // Creating it once can be slightly more performant if played many times,
        // but for simple clicks, this.sound.play('clickSound') directly is also fine.
        window.clickSfx = this.sound.add('clickSound');
        window.bgm1 = this.sound.add('bgm1', { loop: true, volume: 2 });
        window.bgm2 = this.sound.add('bgm2', { loop: true, volume: 2 });
        window.notifSHX = this.sound.add('notification',{volume:2});
        window.completeSFX = this.sound.add('complete',{volume:2});
        window.timesupSFX = this.sound.add('timesup',{volume:2});
        window.keyboardSFX = this.sound.add('keyboard',{volume:2});

        if (window.bgm2 && window.bgm2.isPlaying) {
        window.bgm2.stop();
        }

        if (!window.bgm1 || !window.bgm1.isPlaying) {
        window.bgm1 = this.sound.add('bgm1', { loop: true, volume: 2 });
        window.bgm1.play();
        }

        // Tombol START
        const startButton = this.add.text(this.cameras.main.centerX, 445, ' ', { // Text is empty, relying on padding for clickable area
            fontSize: '36px',
            fontFamily: 'Arial', // Consider loading a custom font for better aesthetics
            padding: { x: 245, y: 24 }, // This creates a large clickable area
            // backgroundColor: '#00000000', // Initial transparent background
            color: '#ffffff', // Text color (though text is ' ')
            align: 'center',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // Added useHandCursor for better UX

        // Tombol EXIT
        const exitButton = this.add.text(this.cameras.main.centerX, 562, ' ', {
            fontSize: '36px',
            fontFamily: 'Arial',
            padding: { x: 245, y: 24 },
            // backgroundColor: '#00000000',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Hover Effects
        const hoverEffect = (button) => {
            // Set initial style to ensure consistency if pointer is already over on creation
            button.setStyle({ backgroundColor: '#00000000' });
            button.on('pointerover', () => button.setStyle({ backgroundColor: '#ffffff22' })); // Semi-transparent white
            button.on('pointerout', () => button.setStyle({ backgroundColor: '#00000000' })); // Fully transparent
        };
        hoverEffect(startButton);
        hoverEffect(exitButton);

        // Action START
        startButton.on('pointerdown', () => {
            clickSfx.play(); // Play click sound
            // Optional: Add a small delay before scene transition for sound to play
            // this.time.delayedCall(100, () => {
            //     this.scene.start('Levels');
            // });
            this.scene.start('Levels');
        });

        // Action EXIT
        exitButton.on('pointerdown', () => {
            window.clickSfx.play(); // Play click sound
            // Note: alert() can be disruptive in web games.
            // Consider an in-game confirmation or closing the browser tab/window if it's a web build.
            // For now, keeping the alert as requested.
            // To make the sound audible before the alert potentially pauses execution:
            this.time.delayedCall(50, () => { // Small delay
                alert('Terima kasih telah mencoba!');
                // If this were a desktop app (e.g., with Electron), you might use:
                // window.close(); or specific app quit commands.
            });
        });
    }
}

// If this file is a module, you might not need the `export { MainMenu };` line
// if the class itself is exported as default or named.
// For consistency with `export class MainMenu`, this separate export is fine.
