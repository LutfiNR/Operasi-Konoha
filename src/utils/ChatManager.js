export class ChatManager {
  constructor(terminal) {
    this.terminal = terminal; // akses ke printLine atau output
  }

  async showMessages(messages) {
    for (const msg of messages) {
      await this.delay(msg.delay || 1000);
      this.terminal.printLine(`[${msg.from}] : ${msg.text}`);
    }
  }

  delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  showIntro(levelId, chatData) {
    if (chatData[levelId]?.intro) {
      this.showMessages(chatData[levelId].intro);
    }
  }

  showObjectiveSuccess(levelId, objId, chatData) {
    const msg = chatData[levelId]?.onObjectiveComplete?.[objId];
    if (msg) {
      this.showMessages([msg]);
    }
  }

  showFailure(levelId, failType, chatData) {
    const msg = chatData[levelId]?.onFail?.[failType];
    if (msg) {
      this.showMessages([msg]);
    }
  }
}