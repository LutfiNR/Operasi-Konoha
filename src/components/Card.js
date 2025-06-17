// src/components/Card.js
import { soundManager } from '../utils/SoundManager.js';

/**
 * Komponen UI yang bisa digunakan kembali untuk menampilkan kartu level.
 */
export class CardComponent extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - Scene tempat kartu ini akan ditambahkan.
     * @param {number} x - Posisi x kartu.
     * @param {number} y - Posisi y kartu.
     * @param {number} width - Lebar kartu.
     * @param {number} height - Tinggi kartu.
     * @param {string} levelKey - Kunci (ID) dari level yang direpresentasikan kartu ini.
     * @param {object} levelData - Objek data untuk level, termasuk status `isLocked` dan `isPassed`.
     * @param {Function} onClick - Fungsi callback yang akan dieksekusi saat kartu diklik.
     */
    constructor(scene, x, y, width, height, levelKey, levelData, onClick) {
        super(scene, x, y);

        this.levelData = levelData;
        this.onClick = onClick;

        // Tentukan tekstur gambar berdasarkan status terkunci
        const textureKey = this.levelData.isLocked ? 'cardLocked' : 'card';
        this.cardImage = scene.add.image(0, 0, textureKey)
            .setDisplaySize(width, height)
            .setOrigin(0.5);

        // Tambahkan semua elemen ke dalam kontainer
        this.add([this.cardImage]);

        // Tambahkan tanda centang jika level sudah selesai
        if (this.levelData.isPassed) {
            const checkmark = scene.add.text(width * 0.3, -height * 0.3, '✓', {
                fontSize: `${height * 0.2}px`,
                color: '#00FF00', // Warna hijau cerah
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            this.add(checkmark);
        }

        // Atur ukuran dan buat interaktif
        this.setSize(width, height);
        this.setInteractive({ useHandCursor: true });

        // Daftarkan event handler
        this.on('pointerover', this.onPointerOver, this);
        this.on('pointerout', this.onPointerOut, this);
        this.on('pointerdown', this.onPointerDown, this);
        this.on('pointerup', this.onPointerUp, this);

        // Tambahkan kontainer ini ke dalam scene
        scene.add.existing(this);
    }

    onPointerOver() {
        // Efek hover hanya berlaku jika kartu tidak terkunci
        if (!this.levelData.isLocked) {
            this.cardImage.setTint(0xDDDDDD); // Warna menjadi lebih terang
        }
    }

    onPointerOut() {
        this.cardImage.clearTint(); // Hapus tint
    }

    onPointerDown() {
        if (!this.levelData.isLocked) {
            this.cardImage.setTint(0xAAAAAA); // Warna menjadi lebih gelap
            soundManager.playSFX(this.scene, 'clickSound'); // Mainkan suara klik
        } else {
            // Opsional: Mainkan suara "terkunci" jika ada
            // soundManager.playSFX(this.scene, 'lockedSound');
        }
    }

    onPointerUp() {
        // Jalankan callback hanya jika kartu tidak terkunci
        if (!this.levelData.isLocked) {
            // Kembalikan ke warna hover jika pointer masih di atas kartu
            if (this.input?.pointerOver) {
                this.onPointerOver();
            } else {
                this.onPointerOut();
            }
            if (this.onClick) {
                this.onClick();
            }
        }
    }
}
