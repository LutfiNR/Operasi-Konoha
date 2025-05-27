// src/scenes/Chat.js
import { chatManager } from '../utils/ChatManager.js'; // Adjust path if necessary

export class Chat extends Phaser.Scene {
  constructor() {
    super('Chat');
  }

  preload() {
    this.load.json('dataChat', 'src/data/chats.json');
    this.load.image('smartphone', 'assets/smartphone.png');
    this.load.audio('bgm1', 'assets/background.mp3');
        this.load.audio('bgm2', 'assets/bgm2.mp3');
        this.load.audio('complete', 'assets/complete.mp3');
        this.load.audio('notification', 'assets/notif1.mp3');
        this.load.audio('keyboard', 'assets/keyboard.mp3');
        this.load.audio('timesup', 'assets/times up.mp3');
  }

  init(data) {
    this.currentLevelKey = data.levelKey || '1'; // Matches key from Terminal
    console.log(`[Chat INIT] Level Key: ${this.currentLevelKey}`);

    // Clean up container if scene is reused (e.g. if not fully stopped and restarted)
    if (this.chatContainer) {
        this.chatContainer.destroy(); // Destroy container and its children
        this.chatContainer = null;
    }
  }

  create() {
    const gameWidth = this.sys.game.config.width;
    const gameHeight = this.sys.game.config.height;
    console.log(`[Chat CREATE] For Level Key: ${this.currentLevelKey}`);

    // Smartphone background, positioned by its bottom-right corner to game's bottom-right
    this.add.image(gameWidth, gameHeight, 'smartphone')
      .setOrigin(1, 1)
      .setDisplaySize(360, 640);

    // Chat container, centered on the screen.
    // Chat elements within ChatManager are positioned relative to this container's center.
    this.chatContainer = this.add.container(gameWidth / 2, gameHeight / 2);

    const chatData = this.cache.json.get('dataChat');
    // Ensure levelChatData is gracefully handled if currentLevelKey isn't in chatData
    const levelChatData = chatData ? chatData[this.currentLevelKey] : null;

    // "Anonymous" title text, matches original positioning
    this.chatContainer.add(this.add.text(400, -250, "Petunjuk", {
      fontFamily: 'Roboto', // Ensure Roboto is loaded
      fontSize: '24px',
      color: '#1d74fd',
    }));

    // Display intro messages using chatManager
    if (levelChatData && levelChatData.intro) {
      chatManager.displayChat({
        scene: this, // Pass this Chat scene instance
        chatContainer: this.chatContainer,
        messages: levelChatData.intro
      });
    } else {
      console.warn(`Chat.js: Chat data or intro messages not found for levelKey: ${this.currentLevelKey}`);
    }
  }

  // update() can be removed if not used for active interactions in chat
}