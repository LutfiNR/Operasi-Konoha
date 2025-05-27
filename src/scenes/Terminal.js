// src/scenes/Terminal.js
import { commandHandlers } from '../utils/commandHandlers.js';
import { TerminalManager } from '../utils/TerminalManager.js';
import { gameData } from '../utils/GameData.js';
import { chatManager } from '../utils/ChatManager.js'; // Though TerminalManager mostly calls it now

// --- Constants ---
const TERMINAL_PROMPT = "computer@root:~$ ";
const TERMINAL_OUTPUT_TEXT_COLOR = "#00ff00";
const TERMINAL_FONT_FAMILY = "Roboto"; // Ensure this font is loaded
const TERMINAL_FONT_SIZE = "16px";
const TERMINAL_HISTORY_LIMIT = 200;

const OUTPUT_AREA_X = -340; // Relative to terminalOutputContainer center
const OUTPUT_AREA_Y = -275; // Relative to terminalOutputContainer center

const TIMER_DISPLAY_Y_OFFSET = 30; // Pixels from the top
const TIMER_FONT_SIZE = '24px';
const TIMER_FILL_COLOR = '#FFFF00';
const TIMER_STROKE_COLOR = '#000000';
const TIMER_STROKE_THICKNESS = 4;

const TERM_COIN_DISPLAY_X = 20; // Position from left for coin display
const TERM_COIN_DISPLAY_Y = TIMER_DISPLAY_Y_OFFSET; // Align Y with timer
const TERM_COIN_FONT_SIZE = '20px';
const TERM_COIN_FILL_COLOR = '#FFD700';
const TERM_COIN_STROKE_COLOR = '#4A2F00';
const TERM_COIN_STROKE_THICKNESS = 3;
// --- End Constants ---

export class Terminal extends Phaser.Scene {
  constructor() {
    super("Terminal");
    // Configurable properties
    this.visibleTextHeight = 360;
    this.chatboxWidth = 560;

    // Runtime state properties (will be reset in init or managed in create)
    this.terminalHistory = [];
    this.inputBuffer = "";
    this.scrollOffset = 0;
    this.currentLevelKey = null;
    this.currentLevel = null; // Holds data for the currently loaded level (deep copy)
    this.levels = null;
    this.commandsMeta = null;
    this.allowedCommands = [];
    this.levelFiles = {};
    this.levelDirectories = [];
    this.countdownEvent = null;
    this.remainingTime = 0;
    this.timerTextDisplay = null;
    this.isTimeUp = false;
    this.coinTextDisplay = null;
    this.coinChangeHandler = null; // For storing the bound coin change listener
  }

  preload() {
    this.load.image('background-room', 'assets/room.png');
    this.load.json("levels", "src/data/levels.json");
    this.load.json("commands", "src/data/commands.json");
    this.load.json('dataChat', 'src/data/chats.json'); // Ensure chat data is loaded
    this.load.audio('bgm1', 'assets/background.mp3');
    this.load.audio('bgm2', 'assets/bgm2.mp3');
    this.load.audio('complete', 'assets/complete.mp3');
    this.load.audio('notification', 'assets/notif1.mp3');
    this.load.audio('keyboard', 'assets/keyboard.mp3');
    this.load.audio('timesup', 'assets/times up.mp3');
  }

  init(data) {
    this.currentLevelKey = data.levelKey || '1';
    console.log(`[Terminal INIT] Level Key: ${this.currentLevelKey}`);

    // Reset all level-specific and timer-specific states
    this.terminalHistory = [];
    this.inputBuffer = "";
    this.scrollOffset = 0;
    this.remainingTime = 0;
    this.isTimeUp = false;

    if (this.countdownEvent) {
      this.countdownEvent.remove(false); this.countdownEvent = null;
    }
    if (this.timerTextDisplay) {
      this.timerTextDisplay.destroy(); this.timerTextDisplay = null;
    }
    if (this.coinTextDisplay) {
        this.coinTextDisplay.destroy(); this.coinTextDisplay = null;
    }
    // Remove previous coin change listener if it exists
    if (this.coinChangeHandler) {
        gameData.emitter.off('coinChanged', this.coinChangeHandler);
        this.coinChangeHandler = null;
    }
  }

  create() {
    const gameWidth = this.sys.game.config.width;
    const gameHeight = this.sys.game.config.height;
    console.log(`[Terminal CREATE] Starting for Level Key: ${this.currentLevelKey}`);

    const bg = this.add.image(0, 0, 'background-room').setOrigin(0);
    bg.setDisplaySize(gameWidth, gameHeight);

    if (window.bgm1 && window.bgm1.isPlaying) {
  window.bgm1.stop();
}

if (!window.bgm2 || !window.bgm2.isPlaying) {
  window.bgm2 = this.sound.add('bgm2', { loop: true, volume: 2 });
  window.bgm2.play();
}

    this.levels = this.cache.json.get("levels"); // All static level definitions
    this.commandsMeta = this.cache.json.get("commands");

    if (!this.levels || !this.commandsMeta) {
      console.error("Terminal.js: Critical data 'levels.json' or 'commands.json' not loaded.");
      this.add.text(gameWidth / 2, gameHeight / 2, "FATAL ERROR: Missing game data.", { fontSize: '18px', color: '#ff0000', align: 'center' }).setOrigin(0.5);
      return;
    }
    
    // Create a deep copy of the current level data to allow runtime modifications (e.g., clue.isRevealed)
    // without affecting the cached JSON data.
    const staticLevelData = this.levels[this.currentLevelKey];
    if (!staticLevelData) {
      console.error(`Terminal.js: Level data for key "${this.currentLevelKey}" not found in levels.json.`);
      this.add.text(gameWidth / 2, gameHeight / 2, `Error: Level ${this.currentLevelKey} data missing.`, { fontSize: '18px', color: '#ff0000' }).setOrigin(0.5);
      return;
    }
    this.currentLevel = JSON.parse(JSON.stringify(staticLevelData)); // Deep copy
    console.log(`[Terminal CREATE] Loaded static data for level ${this.currentLevelKey}:`, JSON.parse(JSON.stringify(this.currentLevel)));


    this.allowedCommands = this.currentLevel.commands || [];
    this.levelFiles = this.currentLevel.files || {};
    this.levelDirectories = this.currentLevel.directories || [];

    // Initialize/update objective and level completion status based on GameData
    let allObjectivesForCurrentLevelComplete = false;
    const objectivesPresent = this.currentLevel.objectives && Array.isArray(this.currentLevel.objectives) && this.currentLevel.objectives.length > 0;

    if (objectivesPresent) {
      this.currentLevel.objectives.forEach(obj => {
        if (obj.id) {
          obj.isComplete = gameData.isObjectiveComplete(obj.id); // Runtime flag based on GameData
        } else {
          obj.isComplete = false;
          console.warn("Terminal.js: Objective found without an ID in level:", this.currentLevelKey, obj);
        }
      });
      allObjectivesForCurrentLevelComplete = this.currentLevel.objectives.every(obj => obj.isComplete);
    }
    
    this.currentLevel.isPassed = gameData.isLevelComplete(this.currentLevelKey) || allObjectivesForCurrentLevelComplete;
    console.log(`[Terminal CREATE] FINAL RUNTIME this.currentLevel.isPassed for ${this.currentLevelKey}:`, this.currentLevel.isPassed);

    // Initialize 'isRevealed' for clues (runtime session state for this attempt)
    if (this.currentLevel.clues && Array.isArray(this.currentLevel.clues)) {
        this.currentLevel.clues.forEach(clue => {
            clue.isRevealed = false; // Reset for each level attempt/session
            // For persistent revealed clues, check/set from GameData here
        });
    }

    // --- Terminal UI Setup ---
    this.terminalOutputContainer = this.add.container(gameWidth / 2, gameHeight / 2);
    const terminalAreaBackground = this.add.graphics();
    terminalAreaBackground.fillStyle(0x000000, 0.0);
    terminalAreaBackground.fillRect(OUTPUT_AREA_X, OUTPUT_AREA_Y, this.chatboxWidth, this.visibleTextHeight);
    this.terminalOutputContainer.add(terminalAreaBackground);

    this.outputText = this.add.text(OUTPUT_AREA_X, OUTPUT_AREA_Y, "", {
      fontFamily: TERMINAL_FONT_FAMILY, fontSize: TERMINAL_FONT_SIZE, color: TERMINAL_OUTPUT_TEXT_COLOR,
      wordWrap: { width: this.chatboxWidth - 20, useAdvancedWrap: true }, lineSpacing: 4
    });
    this.terminalOutputContainer.add(this.outputText);

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    const maskGlobalX = this.terminalOutputContainer.x + OUTPUT_AREA_X;
    const maskGlobalY = this.terminalOutputContainer.y + OUTPUT_AREA_Y;
    maskShape.fillRect(maskGlobalX, maskGlobalY, this.chatboxWidth, this.visibleTextHeight);
    this.outputText.setMask(maskShape.createGeometryMask());

    // --- Coin Display ---
    this.coinTextDisplay = this.add.text(
        TERM_COIN_DISPLAY_X,
        TERM_COIN_DISPLAY_Y,
        `Coins: ${gameData.coin}`, // Initial value
        { fontFamily: TERMINAL_FONT_FAMILY, fontSize: TERM_COIN_FONT_SIZE, color: TERM_COIN_FILL_COLOR,
          stroke: TERM_COIN_STROKE_COLOR, strokeThickness: TERM_COIN_STROKE_THICKNESS }
    ).setOrigin(0, 0.5); // Align with timer's vertical center if Y is same

    this.coinChangeHandler = (newCoinValue) => {
        if (this.coinTextDisplay && this.coinTextDisplay.scene) { // Check if text object is still valid
            this.coinTextDisplay.setText(`Coins: ${newCoinValue}`);
        }
    };
    gameData.emitter.on('coinChanged', this.coinChangeHandler);


    // --- Countdown Timer Setup ---
    console.log(`[Terminal CREATE] Timer setup check for level ${this.currentLevelKey}: isPassed = ${this.currentLevel.isPassed}, countdown = ${this.currentLevel.countdown}`);
    if (this.currentLevel.isPassed) {
        this.setupTimerDisplay(true); // Show "Time: CLEARED!"
    } else if (this.currentLevel.countdown && typeof this.currentLevel.countdown === 'number' && this.currentLevel.countdown > 0) {
        this.remainingTime = this.currentLevel.countdown;
        this.setupTimerDisplay(false); // Show initial time
        this.startCountdown();
    } else {
        // No countdown for this level (or already passed). Hide timer display if it was somehow created.
        if (this.timerTextDisplay) this.timerTextDisplay.setVisible(false);
    }

    // --- Launch Chat Scene ---
    if (this.scene.manager.keys.Chat) {
      this.scene.launch('Chat', { levelKey: this.currentLevelKey });
    } else { console.warn("Terminal.js: Scene with key 'Chat' not found. Chat overlay will not be launched."); }

    // --- Initial Terminal Message ---
    if (this.currentLevel.narrative) {
      this.printLine(this.currentLevel.narrative);
    } else {
      this.printLine(`Welcome to ${this.currentLevel.title || `Level ${this.currentLevelKey}`}. Type 'help' for commands.`);
    }
    this.refreshOutput(true);

    // --- Input & Scene Event Listeners ---
    this.input.keyboard.on("keydown", this.handleKeyInput, this);
    this.input.on('wheel', this.handleScroll, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
  }

  setupTimerDisplay(isCleared = false) {
    const gameWidth = this.sys.game.config.width;
    const timeString = isCleared ? "Time: CLEARED!" : `Time: ${this.formatTime(this.remainingTime)}`;
    console.log(`[Terminal setupTimerDisplay] For level ${this.currentLevelKey}, isCleared: ${isCleared}, timeString: "${timeString}"`);
    
    if (this.timerTextDisplay && this.timerTextDisplay.scene) { // Check scene to ensure it's still part of active display
        this.timerTextDisplay.setText(timeString).setVisible(true);
    } else { // Create if null or destroyed
        this.timerTextDisplay = this.add.text(
            gameWidth / 2, // Centered horizontally
            TIMER_DISPLAY_Y_OFFSET,
            timeString,
            { fontFamily: TERMINAL_FONT_FAMILY, fontSize: TIMER_FONT_SIZE, color: TIMER_FILL_COLOR,
              stroke: TIMER_STROKE_COLOR, strokeThickness: TIMER_STROKE_THICKNESS, align: 'center' }
        ).setOrigin(0.5, 0.5); // Center origin
    }
  }

  startCountdown() {
    console.log(`[Terminal startCountdown] For level ${this.currentLevelKey} with remainingTime: ${this.remainingTime}`);
    if (this.countdownEvent) this.countdownEvent.remove(false); // Remove previous if any
    this.isTimeUp = false; // Reset time up flag for the new countdown
    this.countdownEvent = this.time.addEvent({
      delay: 1000, // 1 second
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true
    });
  }

  updateCountdown() {
    if (this.isTimeUp || (this.currentLevel && this.currentLevel.isPassed)) {
      if (this.countdownEvent) {
        console.log(`[Terminal updateCountdown] Stopping timer for level ${this.currentLevelKey} because isTimeUp=${this.isTimeUp} or isPassed=${this.currentLevel?.isPassed}`);
        this.countdownEvent.remove(false);
        this.countdownEvent = null;
      }
      if (this.currentLevel && this.currentLevel.isPassed && this.timerTextDisplay && this.timerTextDisplay.scene && !this.isTimeUp) {
          this.timerTextDisplay.setText("Time: CLEARED!");
      }
      return;
    }

    this.remainingTime--;
    if (this.timerTextDisplay && this.timerTextDisplay.scene) {
      this.timerTextDisplay.setText(`Time: ${this.formatTime(this.remainingTime)}`);
    }

    if (this.remainingTime <= 0) {
      console.log(`[Terminal updateCountdown] Time is up for level ${this.currentLevelKey}`);
      this.isTimeUp = true;
      if (this.countdownEvent) {
        this.countdownEvent.remove(false);
        this.countdownEvent = null;
      }
      this.handleTimeUp();
    }
  }

  formatTime(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  handleTimeUp() {
    console.log(`[Terminal handleTimeUp] For level ${this.currentLevelKey}`);
    // Prevent multiple executions if already passed or time up processed
    if ((this.currentLevel && this.currentLevel.isPassed)) return;

    window.timesupSFX.play();
    this.printLine("\n================================");
    this.printLine("TIME'S UP! LEVEL FAILED.");
    this.printLine("================================");
    this.refreshOutput(true);

    if (this.input.keyboard) {
        // this.input.keyboard.enabled = false; // Alternative: disable all keyboard input
        this.input.keyboard.off("keydown", this.handleKeyInput, this); // More targeted
    }

    const chatData = this.cache.json.get('dataChat');
    const timeUpChatMessages = chatData?.[this.currentLevelKey]?.onFail?.['timeUp'];
    if (timeUpChatMessages) {
      const chatScene = this.scene.get('Chat');
      if (chatScene && chatScene.scene.isActive() && chatScene.chatContainer) {
        chatManager.displayChat({
          scene: chatScene, chatContainer: chatScene.chatContainer,
          messages: Array.isArray(timeUpChatMessages) ? timeUpChatMessages : [timeUpChatMessages]
        });
      }
    }

    this.time.delayedCall(4000, () => { // Give time for messages
      if (this.scene && this.scene.isActive()) { // Ensure scene hasn't been destroyed
        this.scene.start('Levels'); // onSceneShutdown will be called by Phaser
      }
    }, [], this);
  }

  onSceneShutdown() {
    console.log(`[Terminal onSceneShutdown] Cleaning up for level ${this.currentLevelKey || 'UNKNOWN'}`);
    if (this.countdownEvent) {
      this.countdownEvent.remove(false); this.countdownEvent = null;
    }
    if (this.timerTextDisplay) {
      this.timerTextDisplay.destroy(); this.timerTextDisplay = null;
    }
    if (this.coinTextDisplay) {
      this.coinTextDisplay.destroy(); this.coinTextDisplay = null;
    }
    if (this.coinChangeHandler) { // Remove listener
        gameData.emitter.off('coinChanged', this.coinChangeHandler);
        this.coinChangeHandler = null;
    }
    
    // Stop Chat scene if it's active
    if (this.scene.manager && this.scene.manager.isActive('Chat')) {
      this.scene.stop('Chat');
    }
    
    // Clean up scene-specific event listeners
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    if (this.input && this.input.keyboard) {
      this.input.keyboard.off("keydown", this.handleKeyInput, this);
    }
    if (this.input) {
      this.input.off('wheel', this.handleScroll, this);
    }
  }

  handleKeyInput(event) {
    if (this.isTimeUp) return; // Don't process normal input if time is up

    if (event.key === "Enter") {
      const commandInput = this.inputBuffer.trim();
      this.inputBuffer = "";
      if (commandInput) {
          this.executeCommand(commandInput);
      }
      this.refreshOutput(true);
    } else if (event.key === "Backspace") {
      if (this.inputBuffer.length > 0) {
        this.inputBuffer = this.inputBuffer.slice(0, -1);
        this.refreshOutput();
      }
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.inputBuffer += event.key;
      this.refreshOutput();
    }
  }

  executeCommand(input) {
    // Allow 'shutdown' even if time is up, for graceful exit
    if (this.isTimeUp && input.toLowerCase() !== "shutdown") {
        this.printLine("Time is up. Only 'shutdown' command is allowed.");
        return;
    }

    this.printLine(`${TERMINAL_PROMPT}${input}`);
    const args = input.split(" ");
    const baseCommand = args[0].toLowerCase();

    if (!this.allowedCommands.includes(baseCommand) && baseCommand !== "help") {
      this.printLine(`bash: ${baseCommand}: command not found`);
      this.printLine(`Type 'help' for a list of available commands.`);
    } else {
      const commandFunc = commandHandlers[baseCommand];
      if (commandFunc) {
        try {
          commandFunc({
            terminal: this, args, commandsMeta: this.commandsMeta,
            allowedCommands: this.allowedCommands, levelFiles: this.levelFiles,
            levelDirectories: this.levelDirectories
          });
        } catch (error) {
          console.error(`Error executing command ${baseCommand}:`, error);
          this.printLine(`Error: An unexpected error occurred while executing '${baseCommand}'.`);
        }
      } else {
        if (baseCommand === "help" && commandHandlers.help) { // Ensure help handler exists
            commandHandlers.help({
                terminal: this, commandsMeta: this.commandsMeta,
                allowedCommands: this.allowedCommands, args: []
            });
        } else {
            this.printLine(`Command '${baseCommand}' is allowed but not implemented.`);
        }
      }
    }
  }

  printLine(text) {
    const lines = String(text).split('\n');
    lines.forEach(line => {
      this.terminalHistory.push(line);
      if (this.terminalHistory.length > TERMINAL_HISTORY_LIMIT) {
        this.terminalHistory.shift();
      }
    });
  }

  refreshOutput(scrollToBottom = false) {
    const historyToShow = this.terminalHistory.join("\n");
    const promptPrefix = (this.terminalHistory.length > 0 || this.inputBuffer) ? "\n" : "";
    let fullDisplayText;

    // Handle the very first display where history is empty and outputText might be just ""
    if (this.terminalHistory.length === 0 && !this.inputBuffer && this.outputText && this.outputText.text === "") {
         fullDisplayText = `${TERMINAL_PROMPT}${this.inputBuffer}`;
    } else {
         fullDisplayText = `${historyToShow}${promptPrefix}${TERMINAL_PROMPT}${this.inputBuffer}`;
    }
    
    if(this.outputText && this.outputText.scene) { // Check if outputText is still valid
        this.outputText.setText(fullDisplayText);
    }

    this.time.delayedCall(0, () => {
      if (!this.outputText || !this.outputText.scene) return; // Scene might be shutting down
      if (scrollToBottom) {
        this.scrollToBottom();
      } else {
        this.clampScroll();
        if (this.outputText.scene) { // Check again before setting y
            this.outputText.y = OUTPUT_AREA_Y - this.scrollOffset;
        }
      }
    });
  }

  scrollToBottom() {
    if (!this.outputText || !this.outputText.scene) return;
    const maxPossibleScroll = Math.max(0, this.outputText.height - this.visibleTextHeight);
    this.scrollOffset = maxPossibleScroll;
    this.outputText.y = OUTPUT_AREA_Y - this.scrollOffset;
  }

  clampScroll() {
    if (!this.outputText || !this.outputText.scene) return;
    const maxPossibleScroll = Math.max(0, this.outputText.height - this.visibleTextHeight);
    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, maxPossibleScroll);
  }

  handleScroll(pointer, gameObjects, deltaX, deltaY) {
    if (this.isTimeUp) return; // Prevent scrolling if input is effectively disabled
    const scrollAmount = 20;
    if (deltaY < 0) {
      this.scrollOffset -= scrollAmount;
    } else if (deltaY > 0) {
      this.scrollOffset += scrollAmount;
    }
    this.clampScroll();
    if (this.outputText && this.outputText.scene) {
        this.outputText.y = OUTPUT_AREA_Y - this.scrollOffset;
    }
  }
  
  notifyObjectiveSuccess({ levelKey, objective }) {
    // This is called by 'submit' command.
    // Primary notification is now direct terminal print within 'submit'.
    // This can be used for supplementary logic if needed (e.g., sound, non-chat UI).
    console.log(`[Terminal] Hook: Objective Success - Level: ${levelKey}, Objective: ${objective.id}`);
  }
  
  notifySubmissionFailure({ levelKey, objective, failTypeKey }) {
    // Primary notification is direct terminal print within 'submit'.
    // This can call TerminalManager for a *supplementary* chat if desired.
    console.log(`[Terminal] Hook: Submission Failure - Level: ${levelKey}, Objective: ${objective.id}, FailType: ${failTypeKey}`);
    // Example: TerminalManager.notifySubmissionFailure(this, levelKey, objective, failTypeKey);
  }

  handleLevelCompletion({ level, success }) { // level is this.currentLevel
    if (success) {
      console.log(`[Terminal handleLevelCompletion] For level ${this.currentLevelKey}. Time up status: ${this.isTimeUp}`);
      
      // Ensure runtime state is consistent
      this.currentLevel.isPassed = true;

      // Stop the countdown and update display to "CLEARED!" if not already ended by time up
      if (this.countdownEvent) {
        this.countdownEvent.remove(false);
        this.countdownEvent = null;
      }
      if (this.timerTextDisplay && this.timerTextDisplay.scene && !this.isTimeUp) {
        this.timerTextDisplay.setText("Time: CLEARED!");
      }
      
      // Delegate to TerminalManager for coin updates, saving progress,
      // and potentially a distinct "level complete" chat sequence.
      TerminalManager.handleLevelCompletion(this, { level }); // `level` is `this.currentLevel`
    }
  }
}