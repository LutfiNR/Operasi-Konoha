// src/utils/GameData.js

// Simple custom event emitter
class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        // Prevent duplicate listeners
        if (!this.events[eventName].includes(listener)) {
            this.events[eventName].push(listener);
        }
    }
    off(eventName, listener) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(l => l !== listener);
    }
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(listener => listener(data));
    }
}

export const gameData = {
  _coin: 10, // Initial coins - private backing field
  completedObjectives: new Set(), // Stores IDs of completed objectives
  completedLevels: new Set(),     // Stores keys of completed levels
  emitter: new EventEmitter(),    // Event emitter for global game events

  get coin() {
    return this._coin;
  },

  set coin(value) {
    const oldValue = this._coin;
    this._coin = Math.max(0, value); // Coins shouldn't go below 0
    if (this._coin !== oldValue) {
        console.log(`GameData: Coin changed from ${oldValue} to ${this._coin}`);
        this.emitter.emit('coinChanged', this._coin); // Emit event with new coin value
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
      console.log(`GameData: Level ${levelKey} marked as complete.`);
    }
  },

  isLevelComplete(levelKey) {
    return this.completedLevels.has(levelKey);
  },

  isLevelUnlocked(levelKey) {
    if (!levelKey) return false;
    // Level "1" (or the first numerically if keys are strings "1", "2" etc.) is always unlocked.
    // Adjust if your first level has a different key or logic.
    if (levelKey === "1") return true;

    const levelNum = parseInt(levelKey);
    if (isNaN(levelNum) || levelNum <= 1) return true; // Fallback for non-numeric or first level

    const prevLevelKey = String(levelNum - 1);
    return this.isLevelComplete(prevLevelKey);
  },

  addCoin(amount) {
    if (typeof amount === 'number' && amount > 0) {
      this.coin += amount; // Uses the setter, will emit 'coinChanged'
    }
  },

  spendCoin(amount) {
    if (typeof amount === 'number' && amount > 0 && this.coin >= amount) {
      this.coin -= amount; // Uses the setter, will emit 'coinChanged'
      return true; // Purchase successful
    }
    return false; // Not enough coins or invalid amount
  },

  reset() {
    this.completedObjectives.clear();
    this.completedLevels.clear();
    this.coin = 10; // Resets via setter, emitting event
    console.log("GameData: Reset to initial state.");
  }
};