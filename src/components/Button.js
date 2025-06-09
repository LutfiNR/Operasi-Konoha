// src/components/Button.js
import { soundManager } from '../utils/SoundManager.js';

/**
 * Komponen UI yang bisa digunakan kembali untuk membuat tombol interaktif.
 */
export class ButtonComponent extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - Scene tempat tombol ini akan ditambahkan.
     * @param {number} x - Posisi x tombol.
     * @param {number} y - Posisi y tombol.
     * @param {string} texture - Kunci aset gambar untuk latar belakang tombol.
     * @param {string} text - Teks yang akan ditampilkan pada tombol.
     * @param {Function} onClick - Fungsi callback yang akan dieksekusi saat tombol diklik.
     * @param {object} [size] - Ukuran tombol {width, height}.
     * @param {Phaser.Types.GameObjects.Text.TextStyle} [textStyle] - Gaya kustom untuk teks.
     */
    constructor(scene, x, y, texture, text, onClick, size, textStyle = {}) {
        super(scene, x, y);

        // Gambar latar belakang tombol
        this.buttonBackground = scene.add.image(0, 0, texture)
            .setDisplaySize(size.width, size.height)
            .setOrigin(0.5);

        // Teks pada tombol
        const defaultStyle = {
            fontFamily:  '"Orbitron", sans-serif',
            fontSize: `${size.height * 0.8}px`,
            fontStyle: '500',
            color: '#ffffff',
            align: 'center',
        };
        const style = { ...defaultStyle, ...textStyle };
        this.buttonText = scene.add.text(0, 0, text, style).setOrigin(0.5);

        // Tambahkan elemen ke dalam kontainer
        this.add([this.buttonBackground, this.buttonText]);

        // Atur ukuran dan buat interaktif
        this.setSize(size.width, size.height);
        this.setInteractive({ useHandCursor: true });

        // Simpan fungsi callback
        this.onClick = onClick;

        // Daftarkan event handler
        this.on('pointerover', this.onPointerOver, this);
        this.on('pointerout', this.onPointerOut, this);
        this.on('pointerdown', this.onPointerDown, this);
        this.on('pointerup', this.onPointerUp, this);

        // Tambahkan kontainer ini ke dalam scene
        scene.add.existing(this);
    }

    /**
     * Handler saat pointer mouse berada di atas tombol.
     */
    onPointerOver() {
        this.buttonBackground.setTint(0xDDDDDD); // Warna menjadi lebih terang
    }

    /**
     * Handler saat pointer mouse keluar dari area tombol.
     */
    onPointerOut() {
        this.buttonBackground.clearTint(); // Hapus tint
    }

    /**
     * Handler saat tombol ditekan.
     */
    onPointerDown() {
        this.buttonBackground.setTint(0xAAAAAA); // Warna menjadi lebih gelap
        soundManager.playSFX(this.scene, 'clickSound'); // Mainkan suara klik
    }

    /**
     * Handler saat tekanan pada tombol dilepaskan.
     */
    onPointerUp() {
        // Kembalikan ke warna hover jika pointer masih di atas tombol,
        // atau hapus tint jika pointer sudah keluar.
        if (this.input?.pointerOver) {
            this.onPointerOver();
        } else {
            this.onPointerOut();
        }

        // Jalankan fungsi callback
        if (this.onClick) {
            this.onClick();
        }
    }
}
