// src/scenes/Chat.js
import { chatManager } from '../utils/ChatManager.js';

/**
 * Scene ini berfungsi sebagai lapisan visual (overlay) untuk menampilkan
 * chat di dalam gambar smartphone.
 */
export class Chat extends Phaser.Scene {
  constructor() {
    super('Chat');
    this.chatContainer = null;
    this.currentLevelKey = '1';
  }

  // Preloading sebaiknya dipusatkan di MainMenu. Ini hanya fallback
  // jika scene ini dijalankan secara terpisah.
  preload() {
    this.load.json('dataChat', 'src/data/chats.json');
    this.load.image('smartphone', 'assets/smartphone.png');
  }

  /**
   * Menerima data saat scene dimulai.
   * @param {object} data - Objek data yang dikirim dari scene sebelumnya.
   * @param {string} data.levelKey - Kunci (ID) dari level saat ini.
   */
  init(data) {
    this.currentLevelKey = data.levelKey || '1';
    // Membersihkan container jika scene di-restart tanpa dihancurkan
    if (this.chatContainer) {
        this.chatContainer.destroy();
        this.chatContainer = null;
    }
  }

  create() {
    const { width, height } = this.cameras.main;

    // Menampilkan gambar smartphone di pojok kanan bawah
    this.add.image(width, height, 'smartphone')
      .setOrigin(1, 1)
      .setDisplaySize(360, 640);

    // Kontainer chat dipusatkan di layar, elemen di dalamnya diposisikan relatif
    // Diberi sedikit offset ke atas agar pas dengan layar smartphone
    this.chatContainer = this.add.container(width / 2, height / 2 - 40);

    const chatData = this.cache.json.get('dataChat');
    const levelChatData = chatData ? chatData[this.currentLevelKey] : null;

    // Teks judul "X" di bagian atas area chat
    this.chatContainer.add(this.add.text(0, -250, "X", {
      fontFamily: 'Roboto, sans-serif',
      fontSize: '24px',
      color: '#1d74fd',
    }).setOrigin(0.5));

    // Panggil chatManager untuk menampilkan pesan intro jika ada
    if (levelChatData?.intro) {
      chatManager.displayChat({
        scene: this, // Kirim instance scene Chat ini
        chatContainer: this.chatContainer,
        messages: levelChatData.intro
      });
    } else {
      console.warn(`Chat.js: Data chat atau intro tidak ditemukan untuk level: ${this.currentLevelKey}`);
    }
  }
}
