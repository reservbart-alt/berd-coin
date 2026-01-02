// ================================
// TELEGRAM SAFE INIT
// ================================
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// ================================
// HAPTIC
// ================================
function hapticTap() {
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// ================================
// PHASER CONFIG
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
let coinBaseScale = 1;

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
    coin.setInteractive();

    const targetCoinWidth = w * 0.5;
    coinBaseScale = targetCoinWidth / coin.width;
    coin.setScale(coinBaseScale);

    // ===== SCORE TEXT =====
    scoreText = this.add.text(w / 2, 30, '0', {
        fontFamily: 'Luckiest Guy',
        fontSize: Math.floor(w * 0.08) + 'px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5, 0);

    // ===== LOAD SCORE =====
    if (tg?.CloudStorage) {
        tg.CloudStorage.getItem('score', (err, value) => {
            if (!err && value) {
                score = parseInt(value);
                scoreText.setText(score);
                updateCoinLevel();
            }
        });
    }

    // ===== CLICK =====
    coin.on('pointerdown', () => {
        hapticTap();

        score += 1;
        scoreText.setText(score);
        updateCoinLevel();

        // animation (safe)
        this.tweens.killTweensOf(coin);
        this.tweens.add({
            targets: coin,
            scale: coinBaseScale * 0.9,
            duration: 70,
            ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: coin,
                    scale: coinBaseScale,
                    duration: 90,
                    ease: 'Back.Out'
                });
            }
        });

        if (tg?.CloudStorage) {
            tg.CloudStorage.setItem('score', score.toString());
        }
    });
}

// ================================
// COIN LEVEL
// ================================
function updateCoinLevel() {
    if (score >= 10) {
        coin.setTexture('lvl3');
    } else if (score >= 5) {
        coin.setTexture('lvl2');
    } else {
        coin.setTexture('lvl1');
    }
}
