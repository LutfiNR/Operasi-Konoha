// src/utils/commandHandlers.js
import { gameData } from './GameData.js';

export const commandHandlers = {
  shutdown({ terminal }) {
    terminal.printLine("Shutting down...");
    // The Terminal scene's onSceneShutdown method (if implemented correctly)
    // will handle stopping the Chat scene.
    terminal.scene.start('Levels');
  },

  help({ terminal, commandsMeta, allowedCommands }) {
    terminal.printLine("Available commands:");
    if (!allowedCommands || allowedCommands.length === 0) {
        terminal.printLine("No commands are currently allowed for this level.");
        return;
    }
    allowedCommands.forEach((cmdName) => {
      const meta = commandsMeta ? commandsMeta[cmdName] : null;
      let helpLine = `- ${cmdName}`;
      if (meta) {
        if (meta.usage) helpLine += ` ${meta.usage}`;
        helpLine += ` : ${meta.description || 'No description available.'}`;
      }
      terminal.printLine(helpLine);
    });
  },

  echo({ terminal, args }) {
    terminal.printLine(args.slice(1).join(" "));
  },

  clear({ terminal }) {
    terminal.terminalHistory = [];
    terminal.inputBuffer = "";    // Also clear the current input line visually
    terminal.refreshOutput(true); // Refresh to show the cleared terminal
  },

  ls({ terminal, levelFiles, levelDirectories }) {
    const files = Object.keys(levelFiles || {});
    const dirs = (levelDirectories || []).map(d => `${d}/`); // Add trailing slash to dirs
    const allEntries = [...files, ...dirs];

    if (allEntries.length === 0) {
      terminal.printLine("No files or directories found in current location.");
    } else {
      terminal.printLine(allEntries.join("  "));
    }
  },

  cat({ terminal, args, levelFiles }) {
    const fileName = args[1];
    if (!fileName) {
      terminal.printLine("Usage: cat <filename>");
      return;
    }
    const content = levelFiles ? levelFiles[fileName] : undefined;
    if (typeof content === 'string') {
      terminal.printLine(content);
    } else {
      terminal.printLine(`cat: ${fileName}: No such file or directory`);
    }
  },

  submit({ terminal, args }) {
    const submittedAnswer = args.slice(1).join(" ").trim();

    if (!submittedAnswer) {
      terminal.printLine("Usage: submit <your_answer>");
      terminal.printLine("Please provide an answer to submit.");
      return;
    }

    terminal.printLine(`Submitting: "${submittedAnswer}"...`); // Terminal feedback

    const currentLevelData = terminal.currentLevel;
    const currentLevelKey = terminal.currentLevelKey;

    if (!currentLevelData || !Array.isArray(currentLevelData.objectives) || currentLevelData.objectives.length === 0) {
      terminal.printLine("No objectives for this level, or 'submit' is not applicable.");
      return;
    }

    let targetObjective = null;
    for (const obj of currentLevelData.objectives) {
      // Ensure objective has an ID for tracking with GameData
      if (obj.type === "send_text" && obj.id && !gameData.isObjectiveComplete(obj.id)) {
        targetObjective = obj;
        break;
      }
    }

    if (!targetObjective) {
      terminal.printLine("No active 'send_text' objective to submit for, or all are complete.");
      return;
    }

    if (submittedAnswer.toLowerCase() === targetObjective.expectedContent.toLowerCase()) {
      // --- Objective Correct ---
      terminal.printLine(targetObjective.onSuccess || "Correct! Objective completed."); // Main notification to Terminal

      targetObjective.isComplete = true; // Update runtime state for current scene logic
      gameData.completeObjective(targetObjective.id); // Update persistent game state

      // Check if all objectives for the level are now complete using GameData as source of truth
      const allObjectivesComplete = currentLevelData.objectives.every(obj => obj.id && gameData.isObjectiveComplete(obj.id));

      if (allObjectivesComplete) {
        currentLevelData.isPassed = true; // Update runtime state for current scene
        gameData.markLevelAsComplete(currentLevelKey); // Update persistent game state

        terminal.printLine("Congratulations! All objectives for this level are complete. Level passed!");
        if (typeof currentLevelData.rewardCoin === 'number' && currentLevelData.rewardCoin > 0) {
          terminal.printLine(`You earned ${currentLevelData.rewardCoin} coins.`);
          // The actual coin addition to gameData is handled by TerminalManager via handleLevelCompletion
        }
        
        if (typeof terminal.handleLevelCompletion === 'function') {
          terminal.handleLevelCompletion({ level: currentLevelData, success: true });
        }
      } else {
        terminal.printLine("Objective complete! Proceed to the next objective or task.");
      }
    } else {
      // --- Incorrect Answer ---
      terminal.printLine(targetObjective.onFailure || "Incorrect answer. Please try again."); // Main notification to Terminal
      
      // Optional: Call Terminal's method if supplementary chat notification is desired
      if (typeof terminal.notifySubmissionFailure === 'function') {
         terminal.notifySubmissionFailure({
            levelKey: currentLevelKey,
            objective: targetObjective,
            failTypeKey: targetObjective.failTypeKey || "sendWrongFile" // Example key
        });
      }
    }
  },

  clue({ terminal, args }) {
    const currentLevelData = terminal.currentLevel;
    if (!currentLevelData.clues || !Array.isArray(currentLevelData.clues) || currentLevelData.clues.length === 0) {
      terminal.printLine("No clues available for this level.");
      return;
    }

    let nextClue = null;
    let nextClueIndex = -1;
    // 'isRevealed' is a runtime flag on the clue object in currentLevelData.clues,
    // initialized in Terminal.js create()
    for (let i = 0; i < currentLevelData.clues.length; i++) {
      if (!currentLevelData.clues[i].isRevealed) {
        nextClue = currentLevelData.clues[i];
        nextClueIndex = i;
        break;
      }
    }

    if (!nextClue) {
      terminal.printLine("All clues for this level have already been revealed.");
      return;
    }

    const clueCost = nextClue.cost || 0; // Default cost to 0 if not specified

    if (clueCost > 0) {
      terminal.printLine(`This clue costs ${clueCost} coins. Your current balance: ${gameData.coin} coins.`);
      if (!gameData.spendCoin(clueCost)) { // spendCoin checks balance and then subtracts
        terminal.printLine("Not enough coins to purchase this clue.");
        return;
      }
      // gameData.spendCoin already logs the transaction and updates UI via event
      terminal.printLine(`Spent ${clueCost} coins. Your new balance: ${gameData.coin}`);
    } else {
      terminal.printLine("This clue is free!");
    }

    terminal.printLine(`Hint: ${nextClue.text}`);
    currentLevelData.clues[nextClueIndex].isRevealed = true; // Mark as revealed for this session
  }
};