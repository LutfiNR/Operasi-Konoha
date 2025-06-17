// src/scenes/Levels.js
import { CardComponent } from '../components/Card.js';
import { gameData } from '../utils/GameData.js';
import { TerminalManager } from '../utils/TerminalManager.js';
import { soundManager } from '../utils/SoundManager.js';

// --- Konstanta untuk gaya visual dan tata letak ---
const SCENE_TITLE = 'PILIH MISI';
const TITLE_FONT_FAMILY = '"Orbitron", sans-serif';
const TITLE_FONT_STYLE = 'Bold';
const TITLE_FONT_SIZE = '48px';
const TITLE_FILL_COLOR = '#FFFFFF';
const TITLE_STROKE_COLOR = '#CD4AF5';
const TITLE_STROKE_THICKNESS = 4;
const TITLE_Y_OFFSET = 60;

const CARD_COLUMNS = 5;
const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_SPACING = 40;

const COIN_TEXT_X_OFFSET = -20; // Jarak dari tepi kanan layar
const COIN_TEXT_Y_OFFSET = 20;  // Jarak dari tepi atas layar
const COIN_FONT_SIZE = '24px';
const COIN_FILL_COLOR = '#FFD700'; // Warna emas
const COIN_STROKE_COLOR = '#4A2F00'; // Stroke coklat tua untuk definisi
const COIN_STROKE_THICKNESS = 4;
// --- Akhir Konstanta ---

export class Levels extends Phaser.Scene {
    constructor() {
        super('Levels');
        this.coinText = null;
        this.coinChangeHandler = null; // Untuk menyimpan referensi ke event handler
    }

    // Preloading sebaiknya dipusatkan di MainMenu. Ini hanya fallback
    // jika scene ini dijalankan secara langsung.
    preload() {
        this.load.image('background-level', 'assets/background.png');
        this.load.image('card', 'assets/card.png');
        this.load.image('cardLocked', 'assets/card-locked.png');
        this.load.json('levels', 'src/data/levels.json');
    }

    create() {
        // Muat progres di awal untuk memastikan gameData (koin, level selesai) sudah yang terbaru.
        TerminalManager.loadProgress();

        // Latar belakang
        this.add.image(0, 0, 'background-level').setOrigin(0)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Pastikan BGM yang benar sedang diputar
        soundManager.playBGM(this, 'bgmMainMenu', { loop: true, volume: 0.4 });

        // Judul Scene
        this.add.text(this.cameras.main.centerX, TITLE_Y_OFFSET, SCENE_TITLE, {
            fontFamily: TITLE_FONT_FAMILY, fontStyle: TITLE_FONT_STYLE,
            fontSize: TITLE_FONT_SIZE, color: TITLE_FILL_COLOR,
            stroke: TITLE_STROKE_COLOR, strokeThickness: TITLE_STROKE_THICKNESS
        }).setOrigin(0.5).setLetterSpacing(6);

        // --- Tampilan Koin ---
        this.coinText = this.add.text(
            this.cameras.main.width + COIN_TEXT_X_OFFSET, COIN_TEXT_Y_OFFSET,
            `Coins: ${gameData.coin}`,
            { fontFamily: TITLE_FONT_FAMILY, fontSize: COIN_FONT_SIZE, color: COIN_FILL_COLOR,
              stroke: COIN_STROKE_COLOR, strokeThickness: COIN_STROKE_THICKNESS }
        ).setOrigin(1, 0).setLetterSpacing(2);

        // Daftarkan listener untuk event 'coinChanged' dari gameData
        this.coinChangeHandler = (newCoinValue) => {
            if (this.coinText?.scene) { // Periksa apakah objek teks masih valid
                this.coinText.setText(`Coins: ${newCoinValue}`);
            }
        };
        gameData.emitter.on('coinChanged', this.coinChangeHandler);
        // --- Akhir Tampilan Koin ---

        const staticLevelsData = this.cache.json.get('levels');
        if (!staticLevelsData) {
            console.error('Levels.js: Data level statis ("levels.json") tidak ditemukan.');
            this.add.text(this.cameras.main.centerX, this.cameras.main.height / 2, 'Gagal memuat level!', {color: 'red'}).setOrigin(0.5);
            return;
        }

        const levelKeys = Object.keys(staticLevelsData);
        if (levelKeys.length === 0) {
            this.add.text(this.cameras.main.centerX, this.cameras.main.height / 2, 'Tidak ada level yang dikonfigurasi.', {color: '#fff'}).setOrigin(0.5);
            return;
        }

        // --- Siapkan data level runtime dengan status terkunci/selesai yang dinamis ---
        const runtimeLevels = {};
        levelKeys.forEach(key => {
            runtimeLevels[key] = {
                ...staticLevelsData[key], // Salin data statis
                isPassed: gameData.isLevelComplete(key),      // Ambil dari GameData
                isLocked: !gameData.isLevelUnlocked(key)      // Ambil dari GameData
            };
        });

        // --- Perhitungan Grid ---
        const rows = Math.ceil(levelKeys.length / CARD_COLUMNS);
        const totalGridWidth = CARD_COLUMNS * (CARD_WIDTH + CARD_SPACING) - CARD_SPACING;
        const totalGridHeight = rows * (CARD_HEIGHT + CARD_SPACING) - CARD_SPACING;
        const startX = this.cameras.main.centerX - totalGridWidth / 2;
        const startY = this.cameras.main.centerY - totalGridHeight / 2 + 40; // Didorong sedikit ke bawah

        // --- Buat Komponen Kartu ---
        levelKeys.forEach((levelKey, index) => {
            const currentRuntimeLevel = runtimeLevels[levelKey];
            const col = index % CARD_COLUMNS;
            const row = Math.floor(index / CARD_COLUMNS);
            
            const x = startX + col * (CARD_WIDTH + CARD_SPACING) + CARD_WIDTH / 2;
            const y = startY + row * (CARD_HEIGHT + CARD_SPACING) + CARD_HEIGHT / 2;

            new CardComponent(this, x, y, CARD_WIDTH, CARD_HEIGHT,
                levelKey,
                currentRuntimeLevel, // Kirim data dengan status dinamis
                () => {
                    // Hanya mulai level jika tidak terkunci
                    if (!currentRuntimeLevel.isLocked) {
                        this.scene.start('Terminal', { levelKey: levelKey });
                    }
                }
            );
        });

        // Daftarkan listener untuk event SHUTDOWN agar bisa membersihkan listener lain
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    }

    /**
     * Membersihkan event listener saat scene ini berhenti untuk mencegah memory leak.
     */
    onSceneShutdown() {
        console.log("Scene Levels berhenti, menghapus listener 'coinChanged'.");
        if (this.coinChangeHandler) {
            gameData.emitter.off('coinChanged', this.coinChangeHandler);
            this.coinChangeHandler = null;
        }
    }
}
