// src/scenes/Chat.js
import { chatManager } from '../utils/ChatManager.js';

/**
 * Scene ini berfungsi sebagai lapisan visual (overlay) untuk menampilkan
 * chat di dalam gambar smartphone, lengkap dengan fungsionalitas scroll.
 */
export class Chat extends Phaser.Scene {
  constructor() {
    super('Chat');
    this.chatContainer = null;
    this.scrollableContent = null; // Kontainer untuk pesan yang bisa di-scroll
    this.currentLevelKey = '1';

    // Properti untuk scrolling
    this.visibleHeight = 520; // Tinggi area chat yang terlihat di layar smartphone
    this.contentHeight = 0;   // Tinggi total semua pesan chat
  }

  preload() {
    this.load.json('dataChat', 'src/data/chats.json');
    this.load.image('smartphone', 'assets/smartphone.png');
  }

  init(data) {
    this.currentLevelKey = data.levelKey || '1';
    if (this.chatContainer) {
        this.chatContainer.destroy();
        this.chatContainer = null;
    }
    // Reset tinggi konten untuk setiap level baru
    this.contentHeight = 0;
  }

  create() {
    const { width: gameWidth, height: gameHeight } = this.cameras.main;

    const phoneWidth = 360;
    const phoneHeight = 640;
    this.add.image(gameWidth, gameHeight, 'smartphone')
      .setOrigin(1, 1)
      .setDisplaySize(phoneWidth, phoneHeight);

    const phoneScreenTopY = gameHeight - phoneHeight + 80;
    const phoneScreenCenterX = gameWidth - (phoneWidth / 2);
    
    // chatContainer sekarang berfungsi sebagai "viewport" atau area yang terlihat
    this.chatContainer = this.add.container(phoneScreenCenterX, phoneScreenTopY);
    
    // scrollableContent adalah kontainer di dalam viewport yang akan kita gerakkan
    this.scrollableContent = this.add.container(0, 0);
    this.chatContainer.add(this.scrollableContent);

    // --- Mask untuk Clipping ---
    // Buat mask untuk memotong pesan yang keluar dari area layar smartphone.
    const maskGraphics = this.make.graphics();
    maskGraphics.fillStyle(0xffffff);
    // Posisi mask relatif terhadap posisi chatContainer.
    // X,Y dimulai dari sudut kiri atas area yang terlihat.
    const maskX = -phoneWidth / 2 + 20; // Disesuaikan dengan padding gambar smartphone
    const maskY = -35;
    maskGraphics.fillRect(
        this.chatContainer.x + maskX, 
        this.chatContainer.y + maskY, 
        phoneWidth - 40, // Lebar area chat
        this.visibleHeight
    );
    const mask = maskGraphics.createGeometryMask();
    this.chatContainer.setMask(mask);
    // --- Akhir Mask ---
    
    // Posisikan judul "X" di dalam scrollableContent
    this.scrollableContent.add(this.add.text(0, -25, "X", {
      fontFamily: '"Share Tech", sans-serif',
      fontSize: '24px',
      color: '#1d74fd',
    }).setOrigin(0.5));

    const chatData = this.cache.json.get('dataChat');
    const levelChatData = chatData ? chatData[this.currentLevelKey] : null;

    if (levelChatData?.intro) {
      chatManager.displayChat({
        scene: this,
        scrollableContent: this.scrollableContent, // Kirim kontainer yang bisa di-scroll
        messages: levelChatData.intro
      });
    } else {
      console.warn(`Chat.js: Data chat atau intro tidak ditemukan untuk level: ${this.currentLevelKey}`);
    }

    // Tambahkan event listener untuk mouse wheel
    this.input.on('wheel', this.handleScroll, this);
  }

  /**
   * Mengatur tinggi total konten chat. Dipanggil oleh ChatManager.
   * @param {number} newHeight - Tinggi total yang baru dari semua pesan.
   */
  updateContentHeight(newHeight) {
      this.contentHeight = newHeight;
      // Scroll otomatis ke bawah saat pesan baru masuk
      this.scrollToBottom();
  }

  handleScroll(pointer, gameObjects, deltaX, deltaY, deltaZ) {
      if (!this.scrollableContent) return;

      // Ubah posisi y dari kontainer pesan
      this.scrollableContent.y -= deltaY * 0.5; // * 0.5 untuk memperlambat scroll

      this.clampScroll();
  }

  /**
   * Membatasi scroll agar tidak melebihi batas atas dan bawah konten.
   */
  clampScroll() {
      const maxScroll = Math.max(0, this.contentHeight - this.visibleHeight);
      this.scrollableContent.y = Phaser.Math.Clamp(this.scrollableContent.y, -maxScroll, 0);
  }

  /**
   * Menggerakkan tampilan ke pesan paling bawah.
   */
  scrollToBottom() {
      const maxScroll = Math.max(0, this.contentHeight - this.visibleHeight);
      this.scrollableContent.y = -maxScroll;
  }
}
