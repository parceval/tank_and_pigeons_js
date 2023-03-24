// import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 1344,
    height: 1024,
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
};

const game = new Phaser.Game(config);

let background, prevBackground, currentBackground = 0, bgPosition = 0;
let tank, pigeons, bullets, poops, particles, lives, score;
let gameOver = false, hitTime, endIdleTime;
let tankClean, tankHit, tankExplosion, pigeonImg, bulletImg, poopImg, redParticleImg;
let shootSound, screamSound, tankHitSound, tankExplosionSound, pigeonRespawnSound, waveClearedSound;
let font;

function preload() {
    // Load images
    this.load.image('background1', 'images/background1.png');
    this.load.image('background2', 'images/background2.jpg');
    this.load.image('background3', 'images/background3.jpg');
    this.load.image('background_end', 'images/background_end.png');
    this.load.image('tank_clean', 'images/tank_clean.png');
    this.load.image('tank_hit', 'images/tank_hit.png');
    this.load.image('tank_explosion', 'images/tank_explosion.png');
    this.load.image('pigeon', 'images/pigeon.png');
    this.load.image('bullet', 'images/bullet.png');
    this.load.image('poop', 'images/poop.png');
    this.load.image('red_particle', 'images/red_particle.png');

    // Load sounds
    this.load.audio('shoot_sound', 'sounds/shoot_sound.wav');
    this.load.audio('scream_sound', 'sounds/scream_sound.wav');
    this.load.audio('tank_hit', 'sounds/tank_hit.wav');
    this.load.audio('tank_explosion', 'sounds/tank_explosion.wav');
    this.load.audio('pigeon_respawn', 'sounds/pigeon_respawn.wav');
    this.load.audio('wave_cleared', 'sounds/wave_cleared.wav');
}

function create() {
    // Set up background
    background = this.add.image(0, 0, 'background1').setOrigin(0, 0);
    prevBackground = background;

    // Set up tank
    tankClean = this.textures.get('tank_clean').getSourceImage();
    tankHit = this.textures.get('tank_hit').getSourceImage();
    tankExplosion = this.textures.get('tank_explosion').getSourceImage();
    tank = this.physics.add.sprite(400, 480, 'tank_clean');

    // Set up pigeons
    pigeonImg = this.textures.get('pigeon').getSourceImage();
    pigeons = this.physics.add.group({
        key: 'pigeon',
        repeat: 9,
        setXY: { x: 50, y: 50, stepX: 75 },
    });

    // Set up bullets
    bulletImg = this.textures.get('bullet').getSourceImage();
    bullets = this.physics.add.group();

    // Set up poops
    poopImg = this.textures.get('poop').getSourceImage();
    poops = this.physics.add.group();

    // Set up particles
    redParticleImg = this.textures.get('red_particle').getSourceImage();
    particles = this.physics.add.group();

    // Set up sounds

    shootSound = this.sound.add('shoot_sound');
    screamSound = this.sound.add('scream_sound');
    tankHitSound = this.sound.add('tank_hit');
    tankExplosionSound = this.sound.add('tank_explosion');
    pigeonRespawnSound = this.sound.add('pigeon_respawn');
    waveClearedSound = this.sound.add('wave_cleared');

    // Set up score and lives
    score = 0;
    lives = 5;
    font = {
        fontSize: '36px',
        fill: '#000',
    };

    // Set up collisions
    this.physics.add.collider(bullets, pigeons, bulletHitPigeon, null, this);
    this.physics.add.collider(tank, poops, poopHitTank, null, this);

    // Set up keyboard input
    this.input.keyboard.on('keydown-SPACE', shootBullet, this);
}

function update() {
    // Tank movement
    if (!gameOver) {
        const cursors = this.input.keyboard.createCursorKeys();
        if (cursors.left.isDown && tank.x > 0) {
            tank.setVelocityX(-200);
        } else if (cursors.right.isDown && tank.x < config.width - tank.width) {
            tank.setVelocityX(200);
        } else {
            tank.setVelocityX(0);
        }
    }

    // Update bullets
    bullets.children.iterate((bullet) => {
        if (bullet.y < 0) {
            bullets.remove(bullet, true, true);
        }
    });

    // Update poops
    poops.children.iterate((poop) => {
        if (poop.y > config.height) {
            poops.remove(poop, true, true);
        }
    });

    // Update pigeons
    pigeons.children.iterate((pigeon) => {
        // Pigeon movement
        if (pigeon.x < 0 || pigeon.x > config.width - pigeon.width) {
            pigeon.setVelocityX(-pigeon.body.velocity.x);
            pigeon.toggleFlipX();
        }
        // Pigeon pooping
        if (Math.random() < 0.01) {
            poops.create(pigeon.x + pigeon.width / 2, pigeon.y + pigeon.height, 'poop');
        }
    });

    // Update particles
    particles.children.iterate((particle) => {
        // Remove particles that are off-screen
        if (particle.y > config.height) {
            particles.remove(particle, true, true);
        }
    });

    // Update game over state
    if (lives <= 0) {
        gameOver = true;
        // Implement game over logic here
    }
    checkWaveCleared();
}

function shootBullet() {
    if (!gameOver) {
        const bullet = bullets.create(tank.x + tank.width / 2, tank.y, 'bullet');
        bullet.setVelocityY(-400);
        shootSound.play();
    }
}

function bulletHitPigeon(bullet, pigeon) {
    bullets.remove(bullet, true, true);
    pigeons.remove(pigeon, true, true);
    screamSound.play();
    score += 1;
    // Implement pigeon explosion particle effect here
}

function poopHitTank(tank, poop) {
    poops.remove(poop, true, true);
    lives -= 1;
    tankHitSound.play();
    // Implement tank hit logic here
}

let backgroundIndex = 0;

function changeBackground() {
    backgroundIndex = (backgroundIndex + 1) % backgroundImages.length;
    this.background.setTexture('background' + (backgroundIndex + 1));
}

function checkWaveCleared() {
    if (pigeons.countActive(true) === 0) {
        score += 10;
        waveClearedSound.play();
        changeBackground();
        respawnPigeons();
    }
}

function bulletHitPigeon(bullet, pigeon) {
    bullets.remove(bullet, true, true);
    pigeons.remove(pigeon, true, true);
    screamSound.play();
    score += 1;
  
    // Pigeon explosion particle effect
    createPigeonExplosion(pigeon.x, pigeon.y);
  }
  
  function createPigeonExplosion(x, y) {
    const numParticles = Phaser.Math.Between(10, 100);
    for (let i = 0; i < numParticles; i++) {
      const particle = particles.create(x, y, 'red_particle');
      particle.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
      particle.setCollideWorldBounds(false);
      this.time.addEvent({
        delay: Phaser.Math.Between(1000, 3000),
        callback: () => {
          particles.remove(particle, true, true);
        },
      });
    }
  }

  function saveScore(name, score) {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.splice(10); // Keep top 10 scores
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  }
  
  function getLeaderboard() {
    return JSON.parse(localStorage.getItem('leaderboard')) || [];
  }
  