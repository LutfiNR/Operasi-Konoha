// gameData.js
export const gameData = {
  completedObjectives: new Set(),
  coin: 0,
  completeObjective(id) {
    this.completedObjectives.add(id);
  },
  addCoin(amount) {
    this.coin += amount;
  }
};
