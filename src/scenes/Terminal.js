import { commandHandlers } from "../utils/CommandHandlers.js";

export class Terminal extends Phaser.Scene {
  constructor() {
    super("Terminal");
  }

  preload() {
    this.load.json("levels", "src/data/levels.json");
    this.load.json("commands", "src/data/commands.json");
  }

  init(levelKey) {
    this.currentLevelId = levelKey.levelKey; // menerima level dari parameter scene
  }
  create() {
    // Load JSON
    this.levels = this.cache.json.get("levels");
    this.commandsMeta = this.cache.json.get("commands");
    this.currentLevel = this.levels[this.currentLevelId];

    this.allowedCommands = this.currentLevel.commands || [];
    this.levelFiles = this.currentLevel.files || {};
    this.levelDirectories = this.currentLevel.directories || [];

    // Terminal setup
    this.terminalHistory = [];
    this.inputBuffer = "";

    this.outputText = this.add.text(10, 10, "", {
      fontFamily: "Roboto",
      fontSize: "16px",
      color: "#00ff00"
    });

    this.printLine(this.currentLevel.narrative);
    this.refreshOutput();

    this.input.keyboard.on("keydown", this.handleKeyInput, this);
  }

  handleKeyInput(event) {
    if (event.key === "Enter") {
      this.executeCommand(this.inputBuffer.trim());
      this.inputBuffer = "";
    } else if (event.key === "Backspace") {
      this.inputBuffer = this.inputBuffer.slice(0, -1);
    } else if (event.key.length === 1) {
      this.inputBuffer += event.key;
    }
    this.refreshOutput();
  }

  refreshOutput() {
    const displayText = [...this.terminalHistory, `> ${this.inputBuffer}`].join("\n");
    this.outputText.setText(displayText);
  }

  printLine(text) {
    this.terminalHistory.push(text);
    if (this.terminalHistory.length > 100) {
      this.terminalHistory.shift();
    }
  }

  executeCommand(input) {
    if (!input) return;
    this.printLine(`> ${input}`);

    const args = input.split(" ");
    const base = args[0];

    if (!this.allowedCommands.includes(base)) {
      this.printLine(`Perintah tidak dikeathui, ketik 'help' untuk melihat daftar perintah`);
      return;
    }

    const commandFunc = commandHandlers[base];
    if (commandFunc) {
      commandFunc({
        terminal: this,
        args,
        commandsMeta: this.commandsMeta,
        allowedCommands: this.allowedCommands,
        levelFiles: this.levelFiles,
        levelDirectories: this.levelDirectories
      });
    } else {
      this.printLine(`Command not implemented: ${base}`);
    }
  }
}
