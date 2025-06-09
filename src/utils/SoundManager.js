// src/utils/SoundManager.js

/**
 * Objek untuk mengelola suara game, memastikan hanya satu BGM yang diputar.
 * Ini adalah alternatif yang lebih bersih daripada menggunakan variabel global `window`.
 */
export const soundManager = {
    currentBGM: null,
    currentBGMKey: null,

    /**
     * Memainkan trek musik latar (BGM). Jika BGM lain sedang diputar, akan dihentikan terlebih dahulu.
     * @param {Phaser.Scene} scene - Instance scene untuk memainkan suara.
     * @param {string} key - Kunci aset BGM yang akan diputar.
     * @param {Phaser.Types.Sound.SoundConfig} [config] - Konfigurasi opsional untuk suara.
     */
    playBGM(scene, key, config = { loop: true, volume: 0.3 }) {
        if (!scene?.sound) return;

        if (this.currentBGM?.isPlaying && this.currentBGMKey === key) {
            return; // BGM yang diminta sudah diputar
        }

        this.stopBGM(); // Hentikan BGM yang sedang berjalan

        this.currentBGMKey = key;
        this.currentBGM = scene.sound.add(key, config);
        this.currentBGM.play();
    },

    /**
     * Menghentikan musik latar yang sedang diputar.
     */
    stopBGM() {
        if (this.currentBGM?.isPlaying) {
            this.currentBGM.stop();
        }
        this.currentBGM = null;
        this.currentBGMKey = null;
    },

    /**
     * Memainkan efek suara (SFX) sekali.
     * @param {Phaser.Scene} scene - Instance scene untuk memainkan suara.
     * @param {string} key - Kunci aset SFX yang akan diputar.
     * @param {Phaser.Types.Sound.SoundConfig} [config] - Konfigurasi opsional untuk suara.
     */
    playSFX(scene, key, config = { volume: 0.8 }) {
        if (scene?.sound) {
            scene.sound.play(key, config);
        }
    }
};
