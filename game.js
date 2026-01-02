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

// =======================
// Save / Load
// =======================
function saveGame() {
    localStorage.setItem('berd_save', JSON.stringify({
        score,
        tapPower,
        autoMining,
        energy,
        maxEnergy,
        lastExitTime
    }));
}

function loadGame() {
    const data = localStorage.getItem('berd_save');
    if (!data) return;

    const save = JSON.parse(data);
    score = save.score ?? 0;
    tapPower = save.tapPower ?? 1;
    autoMining = save.autoMining ?? 0;
    energy = save.energy ?? 100;
    maxEnergy = save.maxEnergy ?? 100;
    lastExitTime = save.lastExitTime ?? 0;
}

// =======================
// Offline Income
// =======================
function applyOfflineIncome() {
    if (!lastExitTime || autoMining <= 0) return;

    const diffSec = Math.floor((Date.now() - lastExitTime) / 1000);
    const maxSec = 6 * 60 * 60;
    score += Math.min(diffSec, maxSec) * autoMining;
}

// =======================
// Haptic
// =======================
function hapticTap() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    } else if (navigator.vibrate) {
        navigator.vibrate(15);
    }
}

// =======================
// Phaser Init
// =======================
new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
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

    // твои иконки
    this.load.image('icon_tap', 'assets/tundra.png');
    this.load.image('icon_energy', 'assets/kasta.png');
    this.load.image('icon_mining', 'assets/benz.png');

    // временные
    this.load.image('icon_coin', 'assets/lvl1.webp');
    this.load.image('icon_game', 'assets/lvl2.webp');
}

// =======================
// Create
// =======================
function create() {
    loadGame();
    applyOfflineIncome();

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, 'bg').setDisplaySize(w, h);

    scoreText = this.add.text(w / 2, 20, score, {
        fontFamily: 'Luckiest Guy',
        fontSize: Math.floor(w * 0.12) + 'px',
        color: '#ffffff'
    }).setOrigin(0.5, 0);

    energyText = this.add.text(w / 2, 100, `⚡ ${energy}/${maxEnergy}`, {
        fontFamily: 'Luckiest Guy',
        fontSize: Math.floor(w * 0.05) + 'px',
        color: '#ffffff'
    }).setOrigin(0.5, 0);

    coin = this.add.image(w / 2, h / 2, getCoinTexture())
        .setDisplaySize(Math.min(w, h) * 0.45, Math.min(w, h) * 0.45)
        .setInteractive();

    coin.on('pointerdown', () => {
        if (energy <= 0) return;
        hapticTap();

        energy--;
        score += tapPower;

        animateCoin(this);
        updateCoinTexture();
        updateUI();
        saveGame();
    });

    // regen energy
    this.time.addEvent({
        delay: 3000,
        loop: true,
        callback: () => {
            if (energy < maxEnergy) {
                energy++;
                updateUI();
                saveGame();
            }
        }
    });

    // auto mining
    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            if (autoMining > 0) {
                score += autoMining;
                updateUI();
                saveGame();
            }
        }
    });

    createBottomPanel(this);
}

// =======================
// UI Helpers
// =======================
function updateUI() {
    scoreText.setText(score);
    energyText.setText(`⚡ ${energy}/${maxEnergy}`);
}

function animateCoin(scene) {
    scene.tweens.add({
        targets: coin,
        scale: 0.9,
        duration: 70,
        yoyo: true
    });
}

function getCoinTexture() {
    if (score < 5) return 'lvl1';
    if (score < 10) return 'lvl2';
    return 'lvl3';
}

function updateCoinTexture() {
    coin.setTexture(getCoinTexture());
}

// =======================
// Prices
// =======================
const getMultitapPrice = () => tapPower * 100;
const getAutoMiningPrice = () => (autoMining + 1) * 200;
const getEnergyPrice = () => maxEnergy * 2;

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
        { icon: 'icon_tap', value: () => `x${tapPower}`, price: getMultitapPrice, action: buyMultitap },
        { icon: 'icon_mining', value: () => autoMining, price: getAutoMiningPrice, action: buyAutoMining },
        { icon: 'icon_energy', value: () => maxEnergy, price: getEnergyPrice, action: buyEnergy },
        { icon: 'icon_game', value: () => '', price: () => Infinity, action: comingSoon }
    ];

    const bw = w / 4;
    buttons.forEach((btn, i) => {
        createButton(scene, i * bw + bw / 2, panelY + panelH / 2, bw - 10, panelH - 10, btn);
    });
}

function createButton(scene, x, y, w, h, btn) {
    const c = scene.add.container(x, y);

    const bg = scene.add.rectangle(0, 0, w, h, 0x222222)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive();

    // 🔥 БОЛЬШАЯ ИКОНКА
    const icon = scene.add.image(0, -h * 0.12, btn.icon)
        .setDisplaySize(h * 0.6, h * 0.6);

    const valueText = scene.add.text(0, h * 0.18, btn.value(), {
        fontFamily: 'Luckiest Guy',
        fontSize: Math.floor(h * 0.28) + 'px',
        color: '#ffffff'
    }).setOrigin(0.5);

    const coinIcon = scene.add.image(-h * 0.25, h * 0.42, 'icon_coin')
        .setDisplaySize(h * 0.32, h * 0.32);

    const priceText = scene.add.text(h * 0.1, h * 0.42, btn.price(), {
        fontFamily: 'Luckiest Guy',
        fontSize: Math.floor(h * 0.22) + 'px',
        color: '#ffffff'
    }).setOrigin(0, 0.5);

    c.add([bg, icon, valueText, coinIcon, priceText]);

    function refresh() {
        valueText.setText(btn.value());
        priceText.setText(btn.price());
        bg.setFillStyle(score >= btn.price() ? 0x222222 : 0x555555, score >= btn.price() ? 1 : 0.6);
    }

    refresh();

    bg.on('pointerdown', () => {
        if (score < btn.price()) return;
        hapticTap();

        btn.action();

        scene.tweens.add({
            targets: c,
            scale: 0.95,
            duration: 80,
            yoyo: true
        });

        refresh();
        updateUI();
        updateCoinTexture();
        saveGame();
    });

    scene.time.addEvent({
        delay: 500,
        loop: true,
        callback: refresh
    });
}

// =======================
// Upgrades
// =======================
function buyMultitap() {
    score -= getMultitapPrice();
    tapPower += 2;
}

function buyAutoMining() {
    score -= getAutoMiningPrice();
    autoMining++;
}

function buyEnergy() {
    score -= getEnergyPrice();
    maxEnergy += 50;
    energy = maxEnergy;
}

function comingSoon() {
    alert('Мини-игры скоро 👀');
}

// =======================
// Save on Exit
// =======================
window.addEventListener('beforeunload', () => {
    lastExitTime = Date.now();
    saveGame();
});
