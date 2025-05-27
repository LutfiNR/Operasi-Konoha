// src/utils/TerminalManager.js
import { gameData } from "./GameData.js";
import { chatManager } from "./ChatManager.js"; // Assuming it's in the same 'utils' folder

export const TerminalManager = {
  /**
   * Handles actions after a level is successfully completed.
   * Assumes the level's 'isPassed' and individual objectives' 'isComplete' states
   * in GameData have already been updated by the command handler.
   * @param {Phaser.Scene} terminalScene - The Terminal scene instance.
   * @param {object} level - The currentLevelData object from the Terminal scene.
   */
  handleLevelCompletion(terminalScene, { level }) {
    if (level && level.isPassed) { // Ensure level is indeed passed
      // 1. Update coin balance in GameData (addCoin triggers event)
      if (typeof level.rewardCoin === 'number' && level.rewardCoin > 0) {
        gameData.addCoin(level.rewardCoin);
        // The 'submit' handler already printed "You earned X coins."
        // This line confirms the new total in the terminal.
        terminalScene.printLine(`Your coin balance is now: ${gameData.coin}.`);
      }

      // 2. Save all progress (includes coins, completed objectives, and completed levels)
      this.saveProgress();

      // 3. Optional: Trigger a *supplementary* "Level Truly Over, Big Congrats" chat.
      // The immediate "Level Passed!" message is now in the terminal via submit command.
      const chatData = terminalScene.cache.json.get('dataChat');
      const levelKeyForChat = terminalScene.currentLevelKey; // Use the key from Terminal scene instance

      const levelCompleteChatMessages = chatData?.[levelKeyForChat]?.onLevelComplete;
      if (levelCompleteChatMessages) {
        const chatSceneInstance = terminalScene.scene.get('Chat'); // Get active Chat scene instance
        if (chatSceneInstance && chatSceneInstance.scene.isActive() && chatSceneInstance.chatContainer) {
          chatManager.displayChat({
            scene: chatSceneInstance,
            chatContainer: chatSceneInstance.chatContainer,
            messages: Array.isArray(levelCompleteChatMessages) ? levelCompleteChatMessages : [levelCompleteChatMessages]
          });
        } else {
          console.warn("TerminalManager: Chat scene or container not available for 'onLevelComplete' chat.");
        }
      }
      terminalScene.refreshOutput(true); // Refresh terminal after any prints from here
    }
  },

  /**
   * Triggers a supplementary chat sequence for a failed submission, if defined.
   * Primary failure message is printed by 'submit' to the terminal.
   * @param {Phaser.Scene} terminalScene - The Terminal scene instance.
   * @param {string} levelKey - The key of the current level.
   * @param {object} objective - The objective attempted.
   * @param {string} failTypeKey - The key for the failure message in dataChat.json (e.g., "sendWrongFile").
   */
  notifySubmissionFailure(terminalScene, levelKey, objective, failTypeKey) {
    console.log(`TerminalManager: Notifying submission failure for objective ${objective.id}, type ${failTypeKey}.`);
    const chatData = terminalScene.cache.json.get('dataChat');
    const failureChatMessages = chatData?.[levelKey]?.onFail?.[failTypeKey];

    if (failureChatMessages) {
      const chatSceneInstance = terminalScene.scene.get('Chat');
      if (chatSceneInstance && chatSceneInstance.scene.isActive() && chatSceneInstance.chatContainer) {
        chatManager.displayChat({
          scene: chatSceneInstance,
          chatContainer: chatSceneInstance.chatContainer,
          messages: Array.isArray(failureChatMessages) ? failureChatMessages : [failureChatMessages]
        });
      } else {
        console.warn("TerminalManager: Chat scene or container not available for supplementary failure chat.");
      }
    }
  },

  saveProgress() {
    try {
      const dataToSave = {
        completedObjectives: Array.from(gameData.completedObjectives),
        completedLevels: Array.from(gameData.completedLevels),
        coin: gameData.coin
      };
      localStorage.setItem('cyberHeistGameProgress', JSON.stringify(dataToSave)); // Use a unique game key
      console.log("Progress saved via TerminalManager.", dataToSave);
    } catch (e) {
      console.error("TerminalManager: Failed to save progress:", e);
    }
  },

  loadProgress(sceneContextForPrinting) { // sceneContextForPrinting is optional for printing messages
    try {
      const savedData = localStorage.getItem('cyberHeistGameProgress');
      let UImessage = "No saved progress found. Initializing new game data."; // For UI/console
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        gameData.completedObjectives = new Set(parsedData.completedObjectives || []);
        gameData.completedLevels = new Set(parsedData.completedLevels || []);
        // Ensure coin is a number, default to initial if corrupt or missing from save
        gameData.coin = (typeof parsedData.coin === 'number' ? parsedData.coin : 10); // Setter handles event
        UImessage = `Progress loaded! Coins: ${gameData.coin}. Levels completed: ${gameData.completedLevels.size}`;
        console.log("Progress loaded via TerminalManager.", parsedData);
      } else {
        gameData.reset(); // Initialize gameData to default if no save found
        UImessage = `No saved progress. Initializing game data. Coins: ${gameData.coin}.`;
      }
      
      // Optional printing to a scene (e.g., a Boot scene), primarily for debugging.
      if (sceneContextForPrinting && typeof sceneContextForPrinting.printLine === 'function') {
        // sceneContextForPrinting.printLine(UImessage);
      } else {
        console.log(UImessage); // Fallback to console
      }
    } catch (e) {
      console.error("TerminalManager: Failed to load progress:", e);
      gameData.reset(); // Reset to a known safe state on error
      const errorUIMessage = "Error loading progress. Starting with fresh game data.";
      if (sceneContextForPrinting && typeof sceneContextForPrinting.printLine === 'function') {
        // sceneContextForPrinting.printLine(errorUIMessage);
      } else {
        console.log(errorUIMessage);
      }
    }
  }
};