// ================================
// TELEGRAM SAFE INIT
// ================================
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// ================================
// HAPTIC (ВИБРАЦИЯ)
// ================================
function hapticTap() {
    if (tg && tg.HapticFeedback) {
        try {
            tg.HapticFeedback.impactOccurred('light');
        } catch (e) {
            // silently ignore
        }
    }
}

// ================================
// SAVE / LOAD SCORE (CLOUD + FALLBACK)
// ================================
function saveScore(value) {
    if (tg?.CloudStorage) {
        try {
            tg.CloudStorage.setItem('score', value.toString());
        } catch (e) {
            localStorage.setItem('score', value.toString());
        }
    } else {
        localStorage.setItem('score', value.toString());
    }
}

function loadScore(callback) {
    if (tg?.CloudStorage) {
        tg.CloudStorage.getItem('score', (err, value) => {
            if (!err && value !== null) {
                callback(parseInt(value));
            } else {
                const local = localStorage.getItem('score');
                callback(local ? parseInt(local) : 0);
            }
        });
    } else {
        const local = localStorage.getItem('score');
        callback(local ? parseInt(local) : 0);
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

    // ===== LOAD SAVED SCORE =====
    loadScore((saved) => {
        score = saved;
        scoreText.setText(score);
        updateCoinLevel();
    });

    // ===== CLICK =====
    coin.on('pointerdown', () => {
        // вибрация
        hapticTap();

        // логика
        score += 1;
        scoreText.setText(score);
        updateCoinLevel();
        saveScore(score);

        // анимация (safe, не ломается)
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
    });
}

// ================================
// COIN LEVEL
// ================================
function updateCoinLevel() {
    if (!coin) return;

    if (score >= 10) {
        coin.setTexture('lvl3');
    } else if (score >= 5) {
        coin.setTexture('lvl2');
    } else {
        coin.setTexture('lvl1');
    }
}
