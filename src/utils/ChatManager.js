// src/utils/ChatManager.js
export const chatManager = {
  displayChat({ scene, chatContainer, messages }) {
    if (!scene || !chatContainer || !messages || messages.length === 0) {
      console.warn("ChatManager.displayChat: Invalid parameters or no messages.");
      return;
    }

    let messageIndex = 0; // Index of the current message to be displayed

    // --- Configuration based on original Chat.js displayChat method ---
    const textBaseX = 320;
    const textBaseY = -195;
    const bubbleBaseX = 310;
    const bubbleBaseY = -200;
    const messageYSpacing = 60;
    const textFontFamily = 'Roboto'; // Ensure this font is loaded
    const textFontSize = '16px';
    const textColor = '#000';
    const textWordWrapWidth = 300;
    const textFadeInDuration = 200;
    const bubbleFillColor = 0xf2f2f2; // Hex 0xf2f2f2
    const bubbleFillAlpha = 0.1;
    const bubbleWidth = 300;
    const bubbleHeight = 50;
    const bubbleCornerRadius = 6;
    // --- End Configuration ---

    function showNext() {
      // Ensure scene and its properties are still valid, especially chatContainer
      if (!scene || !scene.scene || !chatContainer.scene || messageIndex >= messages.length) {
        // Scene might have been stopped or container destroyed
        return;
      }

      const currentMessageData = messages[messageIndex];

      const currentTextY = textBaseY + (messageIndex * messageYSpacing);
      const chatText = scene.add.text(textBaseX, currentTextY, currentMessageData.text || "", {
        fontFamily: textFontFamily,
        fontSize: textFontSize,
        color: textColor,
        wordWrap: { width: textWordWrapWidth }
      });

      chatText.setAlpha(0);
      scene.tweens.add({
        targets: chatText,
        alpha: 1,
        duration: textFadeInDuration
      });

      const currentBubbleY = bubbleBaseY + (messageIndex * messageYSpacing);
      const chatBubble = scene.add.graphics();
      chatBubble.fillStyle(bubbleFillColor, bubbleFillAlpha);
      chatBubble.fillRoundedRect(bubbleBaseX, currentBubbleY, bubbleWidth, bubbleHeight, bubbleCornerRadius);

      chatContainer.add(chatBubble);
      
      chatContainer.add(chatText); // Text on top of bubble

      // Prepare for the next message
      const delayForThisMessage = currentMessageData.delay || 1000; // Delay *after* this message is shown
      const originalDelayMultiplier = (messageIndex + 1) / 2; // Original multiplier using 1-based index
      const actualDelayForNextMessage = delayForThisMessage * originalDelayMultiplier;
      
      messageIndex++; // Move to the next message index

      if (messageIndex < messages.length) { // Only schedule if there's a next message
          scene.time.delayedCall(actualDelayForNextMessage, showNext);
      }
    }

    showNext(); // Start displaying the first message
  }
};