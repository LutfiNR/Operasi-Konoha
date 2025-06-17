// src/utils/commandHandlers.js
import { gameData } from './GameData.js';
import { TerminalManager} from './TerminalManager.js';

// --- Helper untuk navigasi path ---
function normalizePath(path, currentDir) {
    if (path.startsWith('/')) return path === '/' ? '/' : (path.endsWith('/') ? path : path + '/');
    const parts = (currentDir === '/' ? [] : currentDir.substring(1).split('/').filter(p => p));
    path.split('/').forEach(part => {
        if (part === '..') { if (parts.length > 0) parts.pop(); }
        else if (part && part !== '.') parts.push(part);
    });
    const newPath = '/' + parts.join('/');
    return newPath === '/' ? '/' : newPath + '/';
}

export const commandHandlers = {
  help({ terminal, commandsMeta, allowedCommands }) {
    terminal.printLine("Available commands:");
    // allowedCommands sekarang diterima dengan benar
    allowedCommands.forEach(cmd => {
      const meta = commandsMeta[cmd];
      terminal.printLine(`- ${cmd}${meta?.usage ? ` ${meta.usage}` : ''} : ${meta?.description || ''}`);
    });
  },
  clear({ terminal }) {
    terminal.terminalHistory = [];
    terminal.inputBuffer = "";
    terminal.refreshOutput(true);
  },
  cd({ terminal, args }) {
    const targetDir = args[1];
    if (!targetDir) { terminal.printLine("Usage: cd <directory>"); return; }
    
    const newPath = normalizePath(targetDir, terminal.currentDirectory);
    // Validasi direktori (disimulasikan dengan memeriksa apakah ada file di dalamnya)
    const isValid = Object.keys(terminal.levelFiles).some(file => ('/' + file).startsWith(newPath)) || newPath === '/';
    if (isValid) {
      terminal.currentDirectory = newPath;
    } else {
      terminal.printLine(`cd: ${targetDir}: No such directory`);
    }
  },
  ls({ terminal, args }) {
    const path = args[1] ? normalizePath(args[1], terminal.currentDirectory) : terminal.currentDirectory;
    const entries = new Set();
    const prefix = path === '/' ? '' : path.substring(1);
    
    for (const file in terminal.levelFiles) {
      if (file.startsWith(prefix)) {
        const remainder = file.substring(prefix.length);
        const entry = remainder.split('/')[0];
        if (entry) {
            if (remainder.includes('/')) entries.add(entry + '/');
            else entries.add(entry);
        }
      }
    }
    if (entries.size > 0) terminal.printLine(Array.from(entries).sort().join("  "));
    else terminal.printLine("No files or directories found.");
  },
  cat({ terminal, args }) {
    const targetFile = args[1];
    if (!targetFile) { terminal.printLine("Usage: cat <file>"); return; }

    const filePath = normalizePath(targetFile, terminal.currentDirectory).replace(/\/$/, '');
    const content = terminal.levelFiles[filePath.substring(1)];

    if (typeof content === 'string') {
        terminal.printLine(content);
        terminal.checkObjectiveTrigger({ type: 'read_file_trigger', target: filePath.substring(1) });
    } else {
        terminal.printLine(`cat: ${targetFile}: No such file`);
    }
  },
  submit({ terminal, args }) {
    const submittedAnswer = args.slice(1).join(" ").trim();
    if (!submittedAnswer) { terminal.printLine("Usage: submit <your_answer>"); return; }
    terminal.printLine(`Submitting: "${submittedAnswer}"...`);
    const { currentLevel, currentLevelKey } = terminal;
    let targetObjective = null;
    for (const obj of (currentLevel.objectives || [])) {
      if (obj.id && !gameData.isObjectiveComplete(obj.id) && (obj.type === "send_text" || obj.type === "send_text_choice")) {
        targetObjective = obj; break;
      }
    }
    if (!targetObjective) { terminal.printLine("No active objective to submit for."); return; }
    let isCorrect = false;
    let successMessage = targetObjective.onSuccess;
    if (targetObjective.type === "send_text_choice") {
        const choiceKey = submittedAnswer.toUpperCase().replace(/\s+/g, '_');
        if ((targetObjective.expectedContent || []).map(c => c.toUpperCase()).includes(submittedAnswer.toUpperCase())) {
            isCorrect = true;
            successMessage = targetObjective[`onSuccess_${choiceKey}`] || targetObjective.onSuccess;
        }
    } else if (submittedAnswer.toLowerCase() === targetObjective.expectedContent.toLowerCase()) {
        isCorrect = true;
    }
    if (isCorrect) {
      terminal.checkObjectiveTrigger({ directSuccess: true, objective: targetObjective, successMessage: successMessage });
    } else {
      terminal.printLine(targetObjective.onFailure || "Incorrect answer.");
      if (typeof terminal.notifySubmissionFailure === 'function') {
         terminal.notifySubmissionFailure({ levelKey: currentLevelKey, failTypeKey: "genericFail" });
      }
    }
  },
  clue({ terminal }) {
    const clues = terminal.currentLevel.clues || [];
    let nextClue = clues.find(c => !c.isRevealed);
    if (!nextClue) { terminal.printLine("No more clues available."); return; }
    const cost = nextClue.cost || 0;
    terminal.printLine(`This clue costs ${cost} coins.`);
    if (gameData.spendCoin(cost)) {
      TerminalManager.saveProgress();
      terminal.printLine(`Hint: ${nextClue.text}`);
      nextClue.isRevealed = true;
    } else {
      terminal.printLine("Not enough coins.");
    }
  },
  exploit({ terminal, args }) {
    const command = `exploit ${args.slice(1).join(" ")}`;
    terminal.printLine(`> ${command}`);
    terminal.checkObjectiveTrigger({ type: 'command_trigger', target: command, targetPrefix: 'exploit' });
  },
  run({ terminal, args }) {
    const command = `run ${args.slice(1).join(" ")}`;
    terminal.printLine(`> ${command}`);
    terminal.checkObjectiveTrigger({ type: 'command_trigger', target: command, targetPrefix: 'run' });
  },
  decrypt({ terminal, args }) {
    const command = `decrypt ${args.slice(1).join(" ")}`;
    terminal.printLine(`> ${command}`);
    terminal.checkObjectiveTrigger({ type: 'command_trigger', target: command, targetPrefix: 'decrypt' });
  },
  compile({ terminal, args }) {
    // Urutkan file untuk pemeriksaan yang konsisten
    const command = `compile ${args.slice(1).sort().join(" ")}`;
    terminal.printLine(`> ${command}`);
    terminal.checkObjectiveTrigger({ type: 'command_trigger', target: command, targetPrefix: 'compile' });
  }
};
