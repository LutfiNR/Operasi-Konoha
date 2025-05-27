// src/scenes/Levels.js
import { CardComponent } from '../components/Card.js'; // Adjust path if needed
import { gameData } from '../utils/GameData.js';
import { TerminalManager } from '../utils/TerminalManager.js';

// --- Constants for styling and layout ---
const SCENE_TITLE = 'CASE';
const TITLE_FONT_FAMILY = 'Roboto'; // Ensure this font is loaded
const TITLE_FONT_STYLE = 'Bold';
const TITLE_FONT_SIZE = '48px';
const TITLE_FILL_COLOR = '#CD4AF5';
const TITLE_Y_OFFSET = 50;

const CARD_COLUMNS = 5;
const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_SPACING = 50;

const COIN_TEXT_X_OFFSET = -20; // From right edge of screen
const COIN_TEXT_Y_OFFSET = 20;  // From top edge of screen
const COIN_FONT_SIZE = '20px';
const COIN_FILL_COLOR = '#FFD700';
const COIN_STROKE_COLOR = '#4A2F00'; // Dark brown stroke for definition
const COIN_STROKE_THICKNESS = 3;
// --- End Constants ---

export class Levels extends Phaser.Scene {
    constructor() {
        super('Levels');
        this.coinText = null;
        this.coinChangeHandler = null; // To store the bound event handler
    }

    preload() {
        this.load.image('background-level', 'assets/background.png');
        this.load.audio('bgm1', 'assets/background.mp3');
        this.load.audio('bgm2', 'assets/bgm2.mp3');
        this.load.audio('complete', 'assets/complete.mp3');
        this.load.audio('notification', 'assets/notif1.mp3');
        this.load.audio('keyboard', 'assets/keyboard.mp3');
        this.load.audio('timesup', 'assets/times up.mp3');
        this.load.image('card', 'assets/card.png');
        this.load.image('cardLocked', 'assets/card-locked.png');
        this.load.json('levels', 'src/data/levels.json'); // Static level definitions
    }

    create() {
        // Load progress once when this scene starts.
        // Pass null if no scene context for printing is needed by loadProgress itself,
        // or pass `this` if Levels scene implements a `printLine` for debug messages.
        TerminalManager.loadProgress(null); // This populates gameData

        const bg = this.add.image(0, 0, 'background-level').setOrigin(0);
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        bg.setDisplaySize(gameWidth, gameHeight);

        if (window.bgm2 && window.bgm2.isPlaying) {
        window.bgm2.stop();
        }

        if (!window.bgm1 || !window.bgm1.isPlaying) {
        window.bgm1 = this.sound.add('bgm1', { loop: true, volume: 2 });
        window.bgm1.play();
        }

        this.add.text(this.cameras.main.centerX, TITLE_Y_OFFSET, SCENE_TITLE, {
            fontFamily: TITLE_FONT_FAMILY, fontStyle: TITLE_FONT_STYLE,
            fontSize: TITLE_FONT_SIZE, fill: TITLE_FILL_COLOR
        }).setOrigin(0.5);

        // --- Coin Display ---
        this.coinText = this.add.text(
            gameWidth + COIN_TEXT_X_OFFSET, // Positioned relative to gameWidth for right alignment
            COIN_TEXT_Y_OFFSET,
            `Coins: ${gameData.coin}`, // Display initial coin value
            {
                fontFamily: TITLE_FONT_FAMILY, // Re-use a suitable font
                fontSize: COIN_FONT_SIZE,
                color: COIN_FILL_COLOR,
                stroke: COIN_STROKE_COLOR,
                strokeThickness: COIN_STROKE_THICKNESS
            }
        ).setOrigin(1, 0); // Origin top-right for easy positioning

        // Define and store the handler so it can be removed later
        this.coinChangeHandler = (newCoinValue) => {
            if (this.coinText && this.coinText.scene) { // Check if scene and text object are still valid
                this.coinText.setText(`Coins: ${newCoinValue}`);
            }
        };
        gameData.emitter.on('coinChanged', this.coinChangeHandler);
        // --- End Coin Display ---

        const staticLevelsData = this.cache.json.get('levels');
        if (!staticLevelsData) {
            console.error('Levels.js: Static levels data ("levels.json") not found.');
            this.add.text(this.cameras.main.centerX, gameHeight / 2, 'Error loading levels!', {color: 'red', align: 'center'}).setOrigin(0.5);
            return;
        }

        const levelKeys = Object.keys(staticLevelsData);
        const totalDefinedLevels = levelKeys.length;

        if (totalDefinedLevels === 0) {
            this.add.text(this.cameras.main.centerX, gameHeight / 2, 'No levels configured.', {color: '#fff', align: 'center'}).setOrigin(0.5);
            return;
        }

        // --- Prepare runtime level data with dynamic lock/pass status ---
        const runtimeLevels = {};
        levelKeys.forEach(key => {
            const staticData = staticLevelsData[key];
            runtimeLevels[key] = {
                ...staticData, // Spread static data from levels.json
                isPassed: gameData.isLevelComplete(key),
                isLocked: !gameData.isLevelUnlocked(key) // Use GameData to determine if unlocked
            };
        });

        // --- Grid Calculation ---
        const rows = Math.ceil(totalDefinedLevels / CARD_COLUMNS);
        const gridContentWidth = CARD_COLUMNS * CARD_WIDTH;
        const gridSpacingWidth = CARD_COLUMNS > 1 ? (CARD_COLUMNS - 1) * CARD_SPACING : 0;
        const totalGridWidth = gridContentWidth + gridSpacingWidth;
        const gridContentHeight = rows * CARD_HEIGHT;
        const gridSpacingHeight = rows > 1 ? (rows - 1) * CARD_SPACING : 0;
        const totalGridHeight = gridContentHeight + gridSpacingHeight;
        const startX = this.cameras.main.centerX - totalGridWidth / 2 + CARD_WIDTH / 2;
        const startY = this.cameras.main.centerY - totalGridHeight / 2 + CARD_HEIGHT / 2;
        // Consider adjusting startY if title overlap is an issue based on your gameHeight.

        // --- Create Card Components ---
        levelKeys.forEach((levelKey, index) => {
            const currentRuntimeLevel = runtimeLevels[levelKey]; // Use data with dynamic lock/pass status
            const row = Math.floor(index / CARD_COLUMNS);
            const col = index % CARD_COLUMNS;
            const x = startX + col * (CARD_WIDTH + CARD_SPACING);
            const y = startY + row * (CARD_HEIGHT + CARD_SPACING);

            // Assuming CardComponent's constructor is:
            // (scene, x, y, width, height, levelKey, levelData, onClickCallback)
            // And CardComponent internally uses currentRuntimeLevel.isLocked to choose its texture
            // and appearance.
            new CardComponent(this, x, y, CARD_WIDTH, CARD_HEIGHT,
                levelKey,
                currentRuntimeLevel, // Pass the processed level data
                () => { // onClick callback
                    if (!currentRuntimeLevel.isLocked) {
                        this.scene.start('Terminal', { levelKey: levelKey });
                    } else {
                        console.log(`Level ${levelKey} is locked.`);
                        // Optionally add visual feedback for clicking a locked card
                        // e.g., this.tweens.add({ targets: cardInstance, x: x-5, duration: 50, yoyo: true, repeat: 3 });
                    }
                }
            );
        });

        // Add listener for scene shutdown to clean up event handlers
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    }

    onSceneShutdown() {
        console.log("Levels scene shutting down, removing coinChanged listener.");
        if (this.coinChangeHandler) {
            gameData.emitter.off('coinChanged', this.coinChangeHandler);
            this.coinChangeHandler = null; // Clear the stored handler
        }
    }
    // update() method can be removed if not used.
}