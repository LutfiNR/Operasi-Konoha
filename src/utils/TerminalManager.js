// src/utils/TerminalManager.js
import { gameData } from "./GameData.js";
import { chatManager } from "./ChatManager.js";
import { soundManager } from './SoundManager.js';

/**
 * Objek ini mengelola logika tingkat tinggi yang terkait dengan progres game,
 * seperti apa yang terjadi setelah level selesai, serta menyimpan dan memuat data.
 */
export const TerminalManager = {
  /**
   * Menangani semua tindakan setelah sebuah level berhasil diselesaikan.
   * Dipanggil oleh Terminal.js setelah command 'submit' terakhir berhasil.
   * @param {Phaser.Scene} terminalScene - Instance dari scene Terminal.
   * @param {object} level - Objek data untuk level yang baru saja diselesaikan.
   */
  handleLevelCompletion(terminalScene, { level }) {
    if (level?.isPassed) {
      // Mainkan suara penyelesaian level
      soundManager.playSFX(terminalScene, 'complete');

      // Tambahkan koin hadiah ke data game
      if (typeof level.rewardCoin === 'number') {
        gameData.addCoin(level.rewardCoin);
        terminalScene.printLine(`Saldo koin Anda sekarang: ${gameData.coin}.`);
      }

      // Simpan semua progres
      this.saveProgress();

      // Opsional: Tampilkan chat "Level Selesai" jika ada di dataChat.json
      const chatData = terminalScene.cache.json.get('dataChat');
      const levelCompleteChat = chatData?.[terminalScene.currentLevelKey]?.onLevelComplete;
      if (levelCompleteChat) {
        const chatScene = terminalScene.scene.get('Chat'); // Dapatkan scene Chat yang aktif
        if (chatScene?.scene.isActive() && chatScene.chatContainer) {
          chatManager.displayChat({
            scene: chatScene,
            chatContainer: chatScene.chatContainer,
            messages: Array.isArray(levelCompleteChat) ? levelCompleteChat : [levelCompleteChat]
          });
        }
      }

      // Kembali ke menu pemilihan level setelah jeda
      terminalScene.time.delayedCall(5000, () => {
          if (terminalScene.scene.isActive()) {
              terminalScene.scene.start('Levels');
          }
      });
      terminalScene.refreshOutput(true);
    }
  },

  /**
   * Memicu chat kegagalan tambahan jika didefinisikan.
   * Pesan kegagalan utama ditampilkan di terminal oleh command 'submit'.
   * @param {Phaser.Scene} terminalScene - Instance dari scene Terminal.
   * @param {string} levelKey - Kunci dari level saat ini.
   * @param {string} failTypeKey - Kunci untuk pesan kegagalan di dataChat.json.
   */
  notifySubmissionFailure(terminalScene, { levelKey, failTypeKey }) {
    const chatData = terminalScene.cache.json.get('dataChat');
    const failureChat = chatData?.[levelKey]?.onFail?.[failTypeKey];
    if (failureChat) {
      const chatScene = terminalScene.scene.get('Chat');
      if (chatScene?.scene.isActive() && chatScene.chatContainer) {
        chatManager.displayChat({
          scene: chatScene,
          chatContainer: chatScene.chatContainer,
          messages: Array.isArray(failureChat) ? failureChat : [failureChat]
        });
      }
    }
  },

  /**
   * Menyimpan data progres game saat ini ke localStorage.
   */
  saveProgress() {
    try {
      const dataToSave = {
        completedObjectives: Array.from(gameData.completedObjectives),
        completedLevels: Array.from(gameData.completedLevels),
        coin: gameData.coin
      };
      sessionStorage.setItem('cyberHeistGameProgress', JSON.stringify(dataToSave));
      console.log("Progres disimpan:", dataToSave);
    } catch (e) {
      console.error("Gagal menyimpan progres:", e);
    }
  },

  /**
   * Memuat data progres game dari localStorage dan menginisialisasi gameData.
   */
  loadProgress() {
    try {
      const savedData = localStorage.getItem('cyberHeistGameProgress');
      if (savedData) {
        const data = JSON.parse(savedData);
        gameData.completedObjectives = new Set(data.completedObjectives || []);
        gameData.completedLevels = new Set(data.completedLevels || []);
        gameData.coin = typeof data.coin === 'number' ? data.coin : 10;
        console.log("Progres dimuat:", data);
      } else {
        // Jika tidak ada data tersimpan, reset ke kondisi awal
        gameData.reset();
        console.log("Tidak ada progres tersimpan, memulai game baru.");
      }
    } catch (e) {
      console.error("Gagal memuat progres:", e);
      // Jika terjadi error, reset ke kondisi aman
      gameData.reset();
    }
  }
};
