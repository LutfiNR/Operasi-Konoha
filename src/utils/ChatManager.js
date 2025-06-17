// src/utils/ChatManager.js
import { soundManager } from './SoundManager.js';

export const chatManager = {
  /**
   * @param {Phaser.Scene} config.scene - Instance scene Chat.
   * @param {Phaser.GameObjects.Container} config.scrollableContent - Kontainer untuk elemen chat yang bisa di-scroll.
   * @param {Array<object>} config.messages - Array berisi objek pesan.
   */
  displayChat({ scene, scrollableContent, messages }) {
    if (!scene || !scrollableContent || !messages || messages.length === 0) {
      console.warn("ChatManager.displayChat: Parameter tidak valid.");
      return;
    }

    let messageIndex = 0;
    const initialY = 10;
    let currentY = initialY;

    const textFontFamily = 'Share Tech, sans-serif';
    const textFontSize = '16px';
    const textWordWrapWidth = 280;

    function showNext() {
      if (!scene.sys.settings.active || messageIndex >= messages.length) {
        return;
      }

      const msg = messages[messageIndex];
      soundManager.playSFX(scene, 'notification');

      const sender = msg.from || "X";
      const textColor = (sender.toLowerCase() === 'system') ? '#a0a0a0' : '#000000';

      const tempText = scene.add.text(0, 0, `[${sender}] ${msg.text}`, {
        fontFamily: textFontFamily, fontSize: textFontSize,
        wordWrap: { width: textWordWrapWidth }
      }).setVisible(false);
      
      const bubbleWidth = 300;
      const bubbleHeight = tempText.height + 15;
      tempText.destroy();

      const chatBubble = scene.add.graphics();
      chatBubble.fillStyle(0xe1e1e1, 0.95);
      chatBubble.fillRoundedRect(-150, currentY, bubbleWidth, bubbleHeight, 10);
      
      const chatText = scene.add.text(-140, currentY + 7.5, `${msg.text}`, {
        fontFamily: textFontFamily, fontSize: textFontSize, color: textColor,
        wordWrap: { width: textWordWrapWidth }, align: 'left'
      }).setOrigin(0, 0);

      chatBubble.setAlpha(0);
      chatText.setAlpha(0);
      scene.tweens.add({ targets: [chatBubble, chatText], alpha: 1, duration: 300 });
      
      scrollableContent.add([chatBubble, chatText]);
      currentY += bubbleHeight + 10;

      // --- Perubahan untuk Scroll ---
      // Panggil metode di scene Chat untuk memperbarui tinggi total konten
      if (typeof scene.updateContentHeight === 'function') {
        scene.updateContentHeight(currentY);
      }
      // --- Akhir Perubahan ---

      const delay = msg.delay || 1500;
      messageIndex++;
      if (messageIndex < messages.length) {
        scene.time.delayedCall(delay, showNext, [], this);
      }
    }
    showNext();
  }
};
