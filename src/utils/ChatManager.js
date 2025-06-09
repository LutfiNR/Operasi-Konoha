// src/utils/ChatManager.js
import { soundManager } from './SoundManager.js';

/**
 * Objek ini mengelola logika untuk menampilkan urutan pesan chat
 * secara grafis di dalam sebuah scene.
 */
export const chatManager = {
  /**
   * Menampilkan serangkaian pesan chat di dalam kontainer yang diberikan.
   * @param {object} config - Objek konfigurasi.
   * @param {Phaser.Scene} config.scene - Instance scene tempat chat akan ditampilkan.
   * @param {Phaser.GameObjects.Container} config.chatContainer - Kontainer untuk menampung elemen chat.
   * @param {Array<object>} config.messages - Array berisi objek pesan.
   */
  displayChat({ scene, chatContainer, messages }) {
    if (!scene || !chatContainer || !messages || messages.length === 0) {
      console.warn("ChatManager.displayChat: Parameter tidak valid atau tidak ada pesan.");
      return;
    }

    let messageIndex = 0;
    const textBaseX = 0; // Teks akan dipusatkan di kontainer
    const textBaseY = -220; // Posisi Y awal untuk chat
    let currentY = textBaseY;

    // Konfigurasi gaya visual
    const textFontFamily = 'Roboto, sans-serif';
    const textFontSize = '16px';
    const textWordWrapWidth = 280; // Lebar maksimal teks sebelum pindah baris

    function showNext() {
      // Pastikan scene dan container masih aktif sebelum melanjutkan
      if (!scene.scene.isActive() || !chatContainer.scene || messageIndex >= messages.length) {
        return;
      }

      const msg = messages[messageIndex];
      const sender = msg.from || "X"; // Default pengirim jika tidak ada
      const textColor = (sender.toLowerCase() === 'system') ? '#a0a0a0' : '#000000';

      soundManager.playSFX(scene, 'notification');

      // Gunakan teks sementara untuk mengukur dimensi bubble secara dinamis
      const tempText = scene.add.text(0, 0, `[${sender}] ${msg.text}`, {
        fontFamily: textFontFamily, fontSize: textFontSize, color: textColor,
        wordWrap: { width: textWordWrapWidth }
      }).setVisible(false);

      const textWidth = tempText.width;
      const textHeight = tempText.height;
      tempText.destroy(); // Hapus teks sementara setelah pengukuran

      const bubbleWidth = textWidth + 20;
      const bubbleHeight = textHeight + 15;

      // Buat gelembung chat (bubble)
      const chatBubble = scene.add.graphics();
      chatBubble.fillStyle(0xf2f2f2, 0.95); // Warna abu-abu terang semi-transparan
      chatBubble.fillRoundedRect(
        -bubbleWidth / 2, 
        currentY, 
        bubbleWidth, 
        bubbleHeight, 
        10 // Radius sudut
      );
      
      // Buat teks chat yang sebenarnya
      const chatText = scene.add.text(textBaseX, currentY + 7.5, `[${sender}] ${msg.text}`, {
        fontFamily: textFontFamily, fontSize: textFontSize, color: textColor,
        wordWrap: { width: textWordWrapWidth }, align: 'center'
      }).setOrigin(0.5, 0);

      // Animasi fade-in
      chatText.setAlpha(0);
      chatBubble.setAlpha(0);
      scene.tweens.add({
        targets: [chatText, chatBubble],
        alpha: 1,
        duration: 300,
        ease: 'Power2'
      });

      // Tambahkan elemen ke kontainer
      chatContainer.add([chatBubble, chatText]);

      // Perbarui posisi Y untuk pesan berikutnya
      currentY += bubbleHeight + 10;

      const delay = msg.delay || 1500; // Jeda sebelum pesan berikutnya muncul
      messageIndex++;
      if (messageIndex < messages.length) {
        scene.time.delayedCall(delay, showNext);
      }
    }

    // Mulai tampilkan pesan pertama
    showNext();
  }
};
