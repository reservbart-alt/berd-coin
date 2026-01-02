// ================================
// SAFE TELEGRAM INIT
// ================================
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// ================================
// PHASER CONFIG (ПРОСТОЙ И НАДЁЖНЫЙ)
// ================================
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: {
        preload,
        create
    }
};

const game = new Phaser.Game(config);

// ================================
// GAME STATE
// ================================
let score = 0;
let scoreText;
let coin;
let bg;

// ================================
// PRELOAD
// ================================
function preload() {
    this.load.image('bg', 'assets/bg.jpg');
    this.load.image('lvl1', 'assets/lvl1.webp');
    this.load.image('lvl2', 'assets/lvl2.webp');
    this.load.image('lvl3', 'assets/lvl3.webp');
}

// ================================
// CREATE
// ================================
function create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // ===== BACKGROUND =====
    bg = this.add.image(w / 2, h / 2, 'bg');
    bg.setDisplaySize(w, h);

    // ===== COIN =====
    coin = this.add.image(w / 2, h / 2, 'lvl1');
    coin.setScale(0.4);
    coin.setInteractive();

    // ===== SCORE TEXT =====
    scoreText = this.add.text(20, 20, 'Score: 0', {
        fontSize: '40px',
        color: '#ff0000',
        fontStyle: 'bold'
    });

    // ===== CLICK =====
    coin.on('pointerdown', () => {
        score += 1;
        scoreText.setText('Score: ' + score);

        // смена уровня монеты
        if (score >= 10) {
            coin.setTexture('lvl3');
        } else if (score >= 5) {
            coin.setTexture('lvl2');
        } else {
            coin.setTexture('lvl1');
        }

        // анимация
        this.tweens.add({
            targets: coin,
            scale: coin.scale * 0.9,
            duration: 80,
            yoyo: true
        });

        if (tg) {
            tg.sendData(JSON.stringify({ score }));
        }
    });
}
