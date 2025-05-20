export class Chat extends Phaser.Scene {
    constructor() {
        super('Chat');
    }

    preload() {
        this.load.json('dataChat', 'src/data/chats.json'); // Memuat data chat
        this.load.image('smartphone', 'assets/smartphone.png'); // Memuat gambar smartphone
    }

    init(data) {
        this.currentLevelId = data.levelKey || '1'; // Menerima level dari parameter scene
    }

    create() {
        // Menampilkan gambar smartphone sebagai background
        const smartphone = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'smartphone')
            .setOrigin(0.5)
            .setDisplaySize(400, 700);

        // Menambahkan area chat di dalam smartphone
        const chatBox = this.add.graphics();
        chatBox.fillStyle(0xFFFFFF, 0); // Latar belakang transparan
        chatBox.fillRect(-170, -320, 340, 640); // Ukuran area chat

        // Membuat container untuk chat
        this.chatContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);
        this.chatContainer.add(chatBox); // Menambahkan area chat ke container

        // Menambahkan ruang untuk pesan chat
        this.messages = [];
        this.messageIndex = 0;
        
        // Memuat data percakapan
        const chatData = this.cache.json.get('dataChat');
        const levelChatData = chatData[this.currentLevelId];

        this.displayChat(levelChatData.intro);
    }
    

    // Fungsi untuk menampilkan pesan chat dengan delay
    displayChat(messages) {
        if (this.messageIndex < messages.length) {
            const message = messages[this.messageIndex];

            // Membuat teks pesan
            const text = this.add.text(-170, -320 + (this.messageIndex * 60), `${message.from}: \n${message.text}`, {
                fontFamily: 'Roboto',
                fontSize: '20px',
                color: '#000',
                wordWrap: { width: 300 }
            });

            text.setAlpha(0);
            this.tweens.add({
                targets: text,
                alpha: 1,
                duration: 500
            });

            // Menambahkan pesan ke dalam container chat
            this.chatContainer.add(text);

            // Update index pesan
            this.messageIndex++;

            // Mengatur delay sebelum menampilkan pesan berikutnya
            this.time.delayedCall(message.delay || 1000, () => {
                this.displayChat(messages); // Menampilkan pesan selanjutnya
            });
        }
    }

    update() {
        // Di sini bisa menambahkan logika untuk menampilkan pesan berikutnya atau interaksi pengguna
    }
}
