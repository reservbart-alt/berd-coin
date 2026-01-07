// =======================
// CONSTS
// =======================
const SAVE_KEY = 'berd_save_v1';

// =======================
// SHOP PRICES (CHANGE ONLY HERE)
// =======================
const PRICES = {
    multitap: (tapPower) => tapPower * 100,
    automining: (autoMining) => (autoMining + 1) * 200,
    energy: (maxEnergy) => maxEnergy * 2
};

// =======================
// COIN LEVELS (CHANGE HERE)
// =======================
function getCoinTextureByScore(score) {
    if (score < 150) return 'lvl1';
    if (score < 1000) return 'lvl2';
    if (score < 5000) return 'lvl3';
    return 'lvl3';
}

// =======================
// Telegram WebApp
// =======================
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// =======================
// Game State
// =======================
let score = 0;
let tapPower = 1;
let autoMining = 0;
let energy = 100;
let maxEnergy = 100;
let lastExitTime = 0;

let scoreText;
let energyText;
let coin;
let coinBaseSize = 0;
let currentCoinTexture = 'lvl1';

// =======================
// Save / Load
// =======================
function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: 1,
        score,
        tapPower,
        autoMining,
        energy,
        maxEnergy,
        lastExitTime
    }));
}

function loadGame() {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return;
    const s = JSON.parse(data);
    if (s.version !== 1) return;

    score = s.score ?? 0;
    tapPower = s.tapPower ?? 1;
    autoMining = s.autoMining ?? 0;
    energy = s.energy ?? 100;
    maxEnergy = s.maxEnergy ?? 100;
    lastExitTime = s.lastExitTime ?? 0;
}

// =======================
// Phaser Init
// =======================
new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000',
    scene: { preload, create }
});

// =======================
// Preload
// =======================
function preload() {
    this.load.image('bg', 'assets/bg.jpg');

    this.load.image('lvl1', 'assets/lvl1.webp');
    this.load.image('lvl2', 'assets/lvl2.webp');
    this.load.image('lvl3', 'assets/lvl3.webp');

    this.load.image('icon_tap', 'assets/tundra.png');
    this.load.image('icon_mining', 'assets/kasta.png');
    this.load.image('icon_energy', 'assets/benz.png');
    this.load.image('icon_coin', 'assets/moneta.png');
    this.load.image('icon_game', 'assets/lvl2.webp'); // mini-game soon
}

// =======================
// Create
// =======================
function create() {
    loadGame();

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, 'bg').setDisplaySize(w, h);

    // =======================
    // SCORE + ICON
    // =======================
    scoreText = this.add.text(w / 2, 20, score, {
        fontSize: Math.floor(w * 0.12) + 'px',
        color: '#fff'
    }).setOrigin(0.5, 0);

    const scoreIcon = this.add.image(0, 0, 'icon_coin')
        .setDisplaySize(w * 0.08, w * 0.08);

    function updateScoreIcon() {
        scoreIcon.x = scoreText.x - scoreText.width / 2 - scoreIcon.displayWidth / 2 - 8;
        scoreIcon.y = scoreText.y + scoreText.height / 2;
    }
    updateScoreIcon();

    const _setScore = scoreText.setText.bind(scoreText);
    scoreText.setText = (v) => {
        _setScore(v);
        updateScoreIcon();
    };

    // =======================
    // ENERGY + BENZ
    // =======================
    energyText = this.add.text(w / 2, 100, `${energy}/${maxEnergy}`, {
        fontSize: Math.floor(w * 0.05) + 'px',
        color: '#fff'
    }).setOrigin(0.5, 0);

    const energyIcon = this.add.image(0, 0, 'icon_energy')
        .setDisplaySize(w * 0.06, w * 0.06);

    function updateEnergyIcon() {
        energyIcon.x = energyText.x - energyText.width / 2 - energyIcon.displayWidth / 2 - 6;
        energyIcon.y = energyText.y + energyText.height / 2;
    }
    updateEnergyIcon();

    const _setEnergy = energyText.setText.bind(energyText);
    energyText.setText = (v) => {
        _setEnergy(v);
        updateEnergyIcon();
    };

    // =======================
    // MAIN COIN
    // =======================
    coinBaseSize = Math.min(w, h) * 0.45;
    currentCoinTexture = getCoinTextureByScore(score);

    coin = this.add.image(w / 2, h / 2, currentCoinTexture)
        .setDisplaySize(coinBaseSize, coinBaseSize)
        .setInteractive();

    coin.on('pointerdown', () => {
        if (energy <= 0) return;

        energy--;
        score += tapPower;

        animateCoin(this);
        updateUI();
        saveGame();
    });

    // =======================
    // ENERGY REGEN
    // =======================
    this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
            if (energy < maxEnergy) {
                energy++;
                updateUI();
                saveGame();
            }
        }
    });

    createBottomPanel(this);
}

// =======================
// UI UPDATE
// =======================
function updateUI() {
    scoreText.setText(score);
    energyText.setText(`${energy}/${maxEnergy}`);
    updateCoinTexture();
}

// =======================
// COIN TEXTURE UPDATE
// =======================
function updateCoinTexture() {
    const newTexture = getCoinTextureByScore(score);
    if (newTexture !== currentCoinTexture) {
        currentCoinTexture = newTexture;
        coin.setTexture(currentCoinTexture);
    }
}

// =======================
// COIN ANIMATION
// =======================
function animateCoin(scene) {
    scene.tweens.killTweensOf(coin);

    coin.displayWidth = coinBaseSize;
    coin.displayHeight = coinBaseSize;

    scene.tweens.add({
        targets: coin,
        displayWidth: coinBaseSize * 0.9,
        displayHeight: coinBaseSize * 0.9,
        duration: 80,
        yoyo: true,
        ease: 'Sine.easeInOut'
    });
}

// =======================
// Bottom Panel
// =======================
function createBottomPanel(scene) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    const panelH = Math.floor(h * 0.13);
    const panelY = h - panelH;

    scene.add.rectangle(w / 2, panelY + panelH / 2, w, panelH, 0x000000, 0.6);

    const buttons = [
        {
            icon: 'icon_tap',
            label: () => `x${tapPower}`,
            price: () => PRICES.multitap(tapPower),
            action: () => {
                const p = PRICES.multitap(tapPower);
                if (score >= p) {
                    score -= p;
                    tapPower += 2;
                }
            }
        },
        {
            icon: 'icon_mining',
            label: () => autoMining,
            price: () => PRICES.automining(autoMining),
            action: () => {
                const p = PRICES.automining(autoMining);
                if (score >= p) {
                    score -= p;
                    autoMining++;
                }
            }
        },
        {
            icon: 'icon_energy',
            label: () => maxEnergy,
            price: () => PRICES.energy(maxEnergy),
            action: () => {
                const p = PRICES.energy(maxEnergy);
                if (score >= p) {
                    score -= p;
                    maxEnergy += 50;
                    energy = maxEnergy;
                }
            }
        },
        {
            icon: 'icon_game',
            label: () => 'soon',
            price: () => null,
            action: () => alert('Мини-игра скоро 👀')
        }
    ];

    const bw = w / 4;
    buttons.forEach((btn, i) => {
        createButton(scene, i * bw + bw / 2, panelY + panelH / 2, bw - 10, panelH - 10, btn);
    });
}

// =======================
// Button
// =======================
function createButton(scene, x, y, w, h, btn) {
    const c = scene.add.container(x, y);

    const bg = scene.add.rectangle(0, 0, w, h, 0x222222)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive();

    const icon = scene.add.image(0, -h * 0.22, btn.icon)
        .setDisplaySize(h * 0.45, h * 0.45);

    const label = scene.add.text(0, 0, btn.label(), {
        fontSize: Math.floor(h * 0.28) + 'px',
        color: '#ffffff'
    }).setOrigin(0.5);

    c.add([bg, icon, label]);

    let priceIcon = null;
    let priceText = null;

    if (btn.price() !== null) {
        priceIcon = scene.add.image(-h * 0.18, h * 0.32, 'icon_coin')
            .setDisplaySize(h * 0.22, h * 0.22);

        priceText = scene.add.text(h * 0.05, h * 0.32, btn.price(), {
            fontSize: Math.floor(h * 0.22) + 'px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        c.add([priceIcon, priceText]);
    }

    bg.on('pointerdown', () => {
        btn.action();
        label.setText(btn.label());
        if (priceText) priceText.setText(btn.price());
        updateUI();
        saveGame();
    });
}

// =======================
// Save on Exit
// =======================
window.addEventListener('beforeunload', () => {
    lastExitTime = Date.now();
    saveGame();
});
