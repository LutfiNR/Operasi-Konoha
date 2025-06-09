// src/scenes/MainMenu.js
import { ButtonComponent } from '../components/Button.js';
import { soundManager } from '../utils/SoundManager.js';

/**
 * Scene ini adalah layar menu utama tempat pemain memulai permainan.
 */
export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    /**
     * Memuat semua aset yang diperlukan untuk menu utama dan aset global
     * seperti musik dan efek suara untuk seluruh permainan.
     */
    preload() {
        // Aset visual
        this.load.image('menu-bg', 'assets/background.png');
        this.load.image('button-texture', 'assets/Button.png');
        this.load.image('title', 'assets/Title.png');

        // Aset suara (BGM dan SFX untuk seluruh game)
        this.load.audio('bgmMainMenu', 'assets/background.mp3');
        this.load.audio('bgmTerminal', 'assets/bgm2.mp3');
        this.load.audio('clickSound', 'assets/click-sound.mp3');
        this.load.audio('complete', 'assets/complete.mp3');
        this.load.audio('notification', 'assets/notif1.mp3');
        this.load.audio('keyboard', 'assets/keyboard.mp3');
        this.load.audio('timesup', 'assets/times up.mp3');
    }

    create() {
        // Tampilkan gambar latar belakang yang memenuhi layar
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu-bg')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Mulai BGM untuk menu utama menggunakan SoundManager
        soundManager.playBGM(this, 'bgmMainMenu', { loop: true, volume: 0.4 });

        this.add.image(this.cameras.main.centerX, 230, 'title').setDisplaySize(900, 300);
        // --- Tombol ---

        // Tombol START
        new ButtonComponent(
            this,
            this.cameras.main.centerX, // Posisi X di tengah layar
            445,                       // Posisi Y
            'button-texture',          // Kunci tekstur tombol
            'START',                   // Teks pada tombol
            () => {
                // Pindah ke scene 'Levels' saat diklik
                this.scene.start('Levels');
            },
            { width: 400, height: 120 }, // Ukuran tombol
            { fontSize: '32px' }       // Gaya teks kustom
        );
        
        // Tombol EXIT
        new ButtonComponent(
            this,
            this.cameras.main.centerX,
            562,
            'button-texture',
            'EXIT',
            () => {
                // Menampilkan alert setelah jeda singkat agar suara sempat terdengar.
                // Di game web, alert kurang ideal. Ini bisa diganti dengan modal
                // atau logika untuk menutup tab (window.close()).
                this.time.delayedCall(100, () => {
                   alert('Terima kasih telah bermain!');
                });
            },
            { width: 400, height: 120 },
            { fontSize: '32px' }
        );
    }
}
