// src/scenes/Terminal.js
import { commandHandlers } from '../utils/CommandHandlers.js';
import { TerminalManager } from '../utils/TerminalManager.js';
import { gameData } from '../utils/GameData.js';
import { soundManager } from '../utils/SoundManager.js';

// --- Konstanta untuk Tampilan ---
const FONT_FAMILY = '"Share Tech", sans-serif';
const FONT_SIZE = "16px";
const HISTORY_LIMIT = 200;

// Konstanta untuk area terminal, disesuaikan dengan permintaan Anda
// Ini mendefinisikan area di dalam container yang dipusatkan di layar
const PROMPT_BASE = "GhostFox@Computer";
const TERMINAL_AREA_X = -340;       // Posisi X relatif dari tengah container
const TERMINAL_AREA_Y = -275;       // Posisi Y relatif dari tengah container
const TERMINAL_AREA_WIDTH = 560;    // Lebar area terminal
const TERMINAL_AREA_HEIGHT = 360;   // Tinggi area terminal

// Gaya Tampilan UI Atas (Timer & Koin)
const UI_Y_OFFSET = 30;
const TIMER_FONT_SIZE = '24px';
const TIMER_FILL_COLOR = '#FFFF00';
const COIN_FONT_SIZE = '20px';
const COIN_FILL_COLOR = '#FFD700';
const UI_STROKE_COLOR = '#000000';
const UI_STROKE_THICKNESS = 4;
// --- Akhir Konstanta ---

export class Terminal extends Phaser.Scene {
  constructor() {
    super("Terminal");
    // Inisialisasi semua properti state di sini agar jelas
    Object.assign(this, {
        terminalHistory: [], inputBuffer: "", scrollOffset: 0,
        currentLevelKey: null, currentLevel: null, levels: null, commandsMeta: null,
        allowedCommands: [], levelFiles: {}, levelDirectories: [], currentDirectory: "/",
        countdownEvent: null, remainingTime: 0, timerTextDisplay: null, isTimeUp: false,
        coinTextDisplay: null, coinChangeHandler: null, keyboardSound: null
    });
  }

  // Preloading sebaiknya dipusatkan di MainMenu, ini hanya fallback.
  preload() {
    this.load.image('background-room', 'assets/room.png');
    this.load.json("levels", "src/data/levels.json");
    this.load.json("commands", "src/data/commands.json");
    this.load.json('dataChat', 'src/data/chats.json');
  }

  init(data) {
    this.currentLevelKey = data.levelKey || '1';
    
    // Reset state untuk setiap level baru untuk menghindari carry-over
    Object.assign(this, {
        terminalHistory: [], inputBuffer: "", scrollOffset: 0,
        remainingTime: 0, isTimeUp: false, currentDirectory: "/"
    });

    // Hentikan dan hancurkan objek dari instance scene sebelumnya
    this.countdownEvent?.remove();
    this.timerTextDisplay?.destroy();
    this.coinTextDisplay?.destroy();
    if (this.coinChangeHandler) {
        gameData.emitter.off('coinChanged', this.coinChangeHandler);
    }
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // --- Latar Belakang & Suara ---
    this.add.image(0, 0, 'background-room').setOrigin(0).setDisplaySize(width, height);
    soundManager.playBGM(this, 'bgmTerminal', { loop: true, volume: 0.2 });
    this.keyboardSound = this.sound.add('keyboard', { volume: 0.6 });

    // --- Muat Data Game ---
    this.levels = this.cache.json.get("levels");
    this.chats = this.cache.json.get("dataChat");

    this.commandsMeta = this.cache.json.get("commands");
    const staticLevelData = this.levels?.[this.currentLevelKey];
    if (!staticLevelData) {
        console.error(`Terminal.js: Data untuk level key "${this.currentLevelKey}" tidak ditemukan.`);
        this.scene.start('Levels'); // Kembali jika level tidak ada
        return;
    }
    
    // Gunakan deep copy agar modifikasi runtime tidak mengubah cache
    this.currentLevel = JSON.parse(JSON.stringify(staticLevelData));
    // this.curretLevelChat = JSON.parse(this)
    this.allowedCommands = this.currentLevel.commands || [];
    this.levelFiles = this.currentLevel.files || {};
    this.levelDirectories = this.currentLevel.directories || [];

    // Inisialisasi status objektif & level berdasarkan GameData
    const objectivesPresent = this.currentLevel.objectives?.length > 0;
    if (objectivesPresent) {
      this.currentLevel.objectives.forEach(obj => obj.isComplete = gameData.isObjectiveComplete(obj.id));
    }
    this.currentLevel.isPassed = gameData.isLevelComplete(this.currentLevelKey) || (objectivesPresent && this.currentLevel.objectives.every(obj => obj.isComplete));

    if (this.currentLevel.clues) {
        this.currentLevel.clues.forEach(clue => { clue.isRevealed = false; });
    }

    // --- Setup UI ---
    this.setupTerminalUI(); // Menggunakan kode UI yang Anda berikan
    this.setupTopUI();
    
    // Luncurkan Chat Scene sebagai overlay
    if (this.scene.manager.keys.Chat) {
        this.scene.launch('Chat', { levelKey: this.currentLevelKey });
    }

    // // --- Pesan Awal & Listeners ---
    if (this.currentLevel.narrative) this.printLine('Narrative : \n' + this.currentLevel.narrative);
    this.refreshOutput(true);

    this.input.keyboard.on("keydown", this.handleKeyInput, this);
    this.input.on('wheel', this.handleScroll, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
  }

  /**
   * Mengatur tampilan terminal di tengah layar, sesuai dengan permintaan Anda.
   */
  setupTerminalUI() {
    const { width, height } = this.cameras.main;
    this.terminalOutputContainer = this.add.container(width / 2, height / 2);

    // Latar belakang area terminal (transparan, untuk debugging jika perlu)
    const terminalAreaBackground = this.add.graphics();
    terminalAreaBackground.fillStyle(0x000000, 0.0); // Ubah alpha (misal: 0.5) untuk melihat batas area
    terminalAreaBackground.fillRect(TERMINAL_AREA_X, TERMINAL_AREA_Y, TERMINAL_AREA_WIDTH, TERMINAL_AREA_HEIGHT);
    this.terminalOutputContainer.add(terminalAreaBackground);

    // Objek teks untuk output terminal
    this.outputText = this.add.text(TERMINAL_AREA_X, TERMINAL_AREA_Y, "", {
      fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, color: '#00ff00',
      wordWrap: { width: TERMINAL_AREA_WIDTH - 20, useAdvancedWrap: true },
      lineSpacing: 4
    });
    this.terminalOutputContainer.add(this.outputText);

    // Masker untuk membuat efek scroll
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff); // Warna tidak penting untuk mask geometri
    maskShape.fillRect(
        this.terminalOutputContainer.x + TERMINAL_AREA_X, 
        this.terminalOutputContainer.y + TERMINAL_AREA_Y, 
        TERMINAL_AREA_WIDTH, 
        TERMINAL_AREA_HEIGHT
    );
    this.outputText.setMask(maskShape.createGeometryMask());
  }

  setupTopUI() {
    const { width } = this.cameras.main;
    const style = { fontFamily: FONT_FAMILY, stroke: UI_STROKE_COLOR, strokeThickness: UI_STROKE_THICKNESS };

    this.coinTextDisplay = this.add.text(20, UI_Y_OFFSET, `Coins: ${gameData.coin}`,
      { ...style, fontSize: COIN_FONT_SIZE, color: COIN_FILL_COLOR }
    ).setOrigin(0, 0.5);
    
    this.timerTextDisplay = this.add.text(width / 2, UI_Y_OFFSET, "", 
      { ...style, fontSize: TIMER_FONT_SIZE, color: TIMER_FILL_COLOR, align: 'center' }
    ).setOrigin(0.5, 0.5);

    this.coinChangeHandler = (val) => this.coinTextDisplay.setText(`Coins: ${val}`);
    gameData.emitter.on('coinChanged', this.coinChangeHandler);

    if (this.currentLevel.isPassed) this.timerTextDisplay.setText("Time: CLEARED!");
    else if (this.currentLevel.countdown > 0) this.startCountdown();
    else this.timerTextDisplay.setVisible(false);
  }

  startCountdown() {
    this.remainingTime = this.currentLevel.countdown;
    this.timerTextDisplay.setText(`Time: ${this.formatTime(this.remainingTime)}`);
    this.countdownEvent = this.time.addEvent({
      delay: 1000, callback: this.updateCountdown, callbackScope: this, loop: true
    });
  }
  
  updateCountdown() {
    if (this.isTimeUp || this.currentLevel.isPassed) {
      this.countdownEvent?.remove(); this.countdownEvent = null;
      if (this.currentLevel.isPassed && this.timerTextDisplay?.scene) this.timerTextDisplay.setText("Time: CLEARED!");
      return;
    }
    this.remainingTime--;
    if (this.timerTextDisplay?.scene) this.timerTextDisplay.setText(`Time: ${this.formatTime(this.remainingTime)}`);
    if (this.remainingTime <= 0) {
      this.isTimeUp = true; this.handleTimeUp();
    }
  }

  handleTimeUp() {
    soundManager.playSFX(this, 'timesup');
    this.printLine("\nTIME'S UP! LEVEL FAILED.");
    this.refreshOutput(true);
    this.input.keyboard.off("keydown", this.handleKeyInput, this);
    this.time.delayedCall(4000, () => { if (this.scene.isActive()) this.scene.start('Levels'); });
  }

  onSceneShutdown() {
    this.countdownEvent?.remove();
    gameData.emitter.off('coinChanged', this.coinChangeHandler);
    if (this.scene.manager.isActive('Chat')) this.scene.stop('Chat');
    soundManager.stopBGM();
    this.input.keyboard.off("keydown", this.handleKeyInput, this);
    this.input.off('wheel', this.handleScroll, this);
  }

  handleKeyInput(event) {
    if (this.isTimeUp) return;
    this.keyboardSound.play();
    if (event.key === "Enter") {
      const commandInput = this.inputBuffer.trim(); this.inputBuffer = "";
      if (commandInput) this.executeCommand(commandInput);
      this.refreshOutput(true);
    } else if (event.key === "Backspace") {
      this.inputBuffer = this.inputBuffer.slice(0, -1); this.refreshOutput();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      this.inputBuffer += event.key; this.refreshOutput();
    }
  }

  executeCommand(input) {
    if (this.isTimeUp && input.toLowerCase() !== "shutdown") {
        this.printLine("Time is up. Only 'shutdown' is allowed."); return;
    }
    this.printLine(`${this.getPrompt()}${input}`);
    const args = input.split(" ");
    const baseCommand = args[0].toLowerCase();
    const handler = commandHandlers[baseCommand];
    if (this.allowedCommands.includes(baseCommand) && handler) {
      try { 
        handler({ terminal: this, args, commandsMeta: this.commandsMeta , allowedCommands: this.allowedCommands}); }
      catch (e) { console.error(`Error executing ${baseCommand}:`, e); this.printLine(`An error occurred.`); }
    } else { this.printLine(`bash: ${baseCommand}: command not found`); }
  }

  checkObjectiveTrigger({ type, target, targetPrefix, directSuccess = false, objective = null, successMessage = null }) {
    if (directSuccess && objective) { this.completeObjective(objective, successMessage); return; }
    for (const obj of (this.currentLevel.objectives || [])) {
        if (obj.type === type && obj.id && !gameData.isObjectiveComplete(obj.id)) {
            let match = false;
            if (type === 'read_file_trigger' && obj.targetFile === target) match = true;
            if (type === 'command_trigger') {
                const commandString = (obj.targetCommand || obj.targetCommandPrefix || "");
                if (obj.targetCommand === target || (obj.targetCommandPrefix && target.startsWith(obj.targetCommandPrefix))) {
                    match = true;
                    if (obj.revealsFiles) {
                        Object.assign(this.levelFiles, obj.revealsFiles);
                        this.printLine("New file data accessible.");
                    }
                }
            }
            if (match) { this.completeObjective(obj); break; }
        }
    }
  }

  completeObjective(objective, message) {
    this.printLine(`\nObjective Updated: ${objective.description}`);
    this.printLine(message || objective.onSuccess || "Objective complete!");
    objective.isComplete = true;
    gameData.completeObjective(objective.id);
    soundManager.playSFX(this, 'notification');
    const allObjectivesComplete = (this.currentLevel.objectives || []).every(obj => gameData.isObjectiveComplete(obj.id));
    if (allObjectivesComplete && !this.currentLevel.isPassed) {
        this.currentLevel.isPassed = true;
        gameData.markLevelAsComplete(this.currentLevelKey);
        this.printLine("Congratulations! Level passed!");
        this.handleLevelCompletion({ level: this.currentLevel, success: true });
    }
  }

  getPrompt() {
    const path = this.currentDirectory === "/" ? "/" : this.currentDirectory.slice(0, -1);
    return `${PROMPT_BASE}:${path}$ `;
  }
  
  printLine(text) {
    String(text).split('\n').forEach(line => {
      this.terminalHistory.push(line);
      if (this.terminalHistory.length > HISTORY_LIMIT) this.terminalHistory.shift();
    });
  }

  refreshOutput(scrollToBottom = false) {
    const fullText = `${this.terminalHistory.join("\n")}\n\n${this.getPrompt()}${this.inputBuffer}`;
    this.outputText.setText(fullText);
    this.time.delayedCall(0, () => {
      if (!this.outputText?.scene) return;
      if (scrollToBottom) this.scrollToBottom();
      else { this.clampScroll(); this.outputText.y = TERMINAL_AREA_Y - this.scrollOffset; }
    });
  }

  scrollToBottom() {
    const height = this.outputText.height;
    this.scrollOffset = (height > TERMINAL_AREA_HEIGHT) ? height - TERMINAL_AREA_HEIGHT : 0;
    this.outputText.y = TERMINAL_AREA_Y - this.scrollOffset;
  }

  clampScroll() {
    const maxScroll = Math.max(0, this.outputText.height - TERMINAL_AREA_HEIGHT);
    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, maxScroll);
  }

  handleScroll(pointer, gameObjects, deltaX, deltaY) {
    if (this.isTimeUp) return;
    this.scrollOffset += (deltaY > 0 ? 20 : -20);
    this.clampScroll();
    this.outputText.y = TERMINAL_AREA_Y - this.scrollOffset;
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  handleLevelCompletion({ level, success }) {
    if (success) {
      this.countdownEvent?.remove();
      if (this.timerTextDisplay?.scene) this.timerTextDisplay.setText("Time: CLEARED!");
      TerminalManager.handleLevelCompletion(this, { level });
    }
  }

  notifySubmissionFailure({ levelKey, failTypeKey }) {
    TerminalManager.notifySubmissionFailure(this, { levelKey, failTypeKey });
  }
}
