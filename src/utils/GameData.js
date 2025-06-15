// src/utils/GameData.js

/**
 * Kelas sederhana untuk menangani event kustom.
 * Memungkinkan bagian-bagian game yang berbeda untuk berkomunikasi tanpa harus terikat satu sama lain.
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Mendaftarkan sebuah listener untuk sebuah event.
     * @param {string} eventName - Nama event.
     * @param {Function} listener - Fungsi yang akan dipanggil saat event terjadi.
     */
    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        // Mencegah listener ganda
        if (!this.events[eventName].includes(listener)) {
            this.events[eventName].push(listener);
        }
    }

    /**
     * Menghapus sebuah listener dari sebuah event.
     * @param {string} eventName - Nama event.
     * @param {Function} listener - Fungsi listener yang ingin dihapus.
     */
    off(eventName, listener) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(l => l !== listener);
        }
    }

    /**
     * Memicu sebuah event dan memberitahu semua listener-nya.
     * @param {string} eventName - Nama event yang akan dipicu.
     * @param {*} data - Data yang akan dikirimkan ke listener.
     */
    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => listener(data));
        }
    }
}

/**
 * Objek global untuk menyimpan semua state game.
 * Bertindak sebagai "sumber kebenaran tunggal" untuk progres pemain.
 */
export const gameData = {
  _coin: 10, // Nilai koin awal (disimpan secara internal)
  completedObjectives: new Set(), // Menyimpan ID dari objektif yang sudah selesai
  completedLevels: new Set(),     // Menyimpan kunci (key) dari level yang sudah selesai
  emitter: new EventEmitter(),    // Instance EventEmitter untuk event 'coinChanged'

  /**
   * Getter untuk koin, agar bisa diakses dengan `gameData.coin`.
   */
  get coin() {
    return this._coin;
  },

  /**
   * Setter untuk koin. Setiap kali nilai koin diubah,
   * ia akan memicu event 'coinChanged'.
   */
  set coin(value) {
    const oldValue = this._coin;
    this._coin = Math.max(0, value); // Koin tidak boleh kurang dari 0
    if (this._coin !== oldValue) {
        // Hanya memicu event jika nilainya benar-benar berubah
        this.emitter.emit('coinChanged', this._coin);
    }
  },

  completeObjective(id) {
    if (id) {
      this.completedObjectives.add(id);
    }
  },

  isObjectiveComplete(id) {
    return this.completedObjectives.has(id);
  },

  markLevelAsComplete(levelKey) {
    if (levelKey) {
      this.completedLevels.add(levelKey);
      console.log(`GameData: Level ${levelKey} ditandai selesai.`);
    }
  },

  isLevelComplete(levelKey) {
    return this.completedLevels.has(levelKey);
  },

  /**
   * Menentukan apakah sebuah level sudah terbuka.
   * Logikanya adalah level berikutnya terbuka jika level sebelumnya sudah selesai.
   * @param {string} levelKey - Kunci level yang akan diperiksa.
   * @returns {boolean}
   */
  isLevelUnlocked(levelKey) {
    if (!levelKey || levelKey === "1") return true; // Level 1 selalu terbuka
    
    const levelNum = parseInt(levelKey);
    if (isNaN(levelNum) || levelNum <= 1) return true; // Fallback jika bukan urutan angka

    const prevLevelKey = String(levelNum - 1);
    return this.isLevelComplete(prevLevelKey);
  },

  addCoin(amount) {
    if (typeof amount === 'number' && amount > 0) {
      this.coin += amount; // Menggunakan setter, akan memicu event
    }
  },

  /**
   * Mengurangi koin jika saldo mencukupi.
   * @param {number} amount - Jumlah koin yang akan dikurangi.
   * @returns {boolean} - True jika berhasil, false jika koin tidak cukup.
   */
  spendCoin(amount) {
    if (typeof amount === 'number' && amount >= 0 && this.coin >= amount) {
      this.coin -= amount; // Menggunakan setter, akan memicu event
      return true;
    }
    return false;
  },

  /**
   * Mengembalikan semua data ke kondisi awal.
   */
  reset() {
    this.completedObjectives.clear();
    this.completedLevels.clear();
    this.coin = 10; // Menggunakan setter untuk mereset koin
    console.log("GameData: Direset ke kondisi awal.");
  }
};
