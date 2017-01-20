/// <reference path="phaser.min.js" />

var gameRatio = window.innerWidth / window.innerHeight;
var game = new Phaser.Game(Math.ceil(640 * gameRatio), 640, Phaser.CANVAS); 

var spacefield,
    bgVelocity = 3,
    player,
    cursors,
    bullets,fireButton,bulletTime = 0,
    enemies,
    score = 0,scoreText,winText,
    firstRunLandscape,
    fx,
    left = false,right = false,
    i = 0, scoreLimit = 0;

var audioJSON = {
  spritemap: {
    'shot': {
      start: 17,
      end: 18,
      loop: false
    }
  }
};

if (window.innerWidth < 500) {
  i = 9;
  scoreLimit = 3600;
} else if (window.innerWidth < 900) {
  i = 10;
  scoreLimit = 4000;
} else {
  i = 13;
  scoreLimit = 5200;
}

var mainState = {
  preload: function () {
    firstRunLandscape = game.scale.isGameLandscape;
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
    game.scale.forceOrientation(true, false);
    game.scale.enterIncorrectOrientation.add(handleIncorrect);
    game.scale.leaveIncorrectOrientation.add(handleCorrect);

    game.load.image('starfield', "assets/space.jpg");
    game.load.image('player', "assets/kotsberg.png");
    game.load.image('bullet', "assets/bullet.png");
    game.load.image('enemy', 'assets/carlsberg.png');
    game.load.spritesheet('left', 'assets/left.png', 50, 50);
    game.load.spritesheet('right', 'assets/right.png', 50, 50);
    game.load.audiosprite('sfx', 'assets/sounds/shot-sound.ogg', null, audioJSON);
  },
  create: function () {
    spacefield = game.add.tileSprite(0, 0, Math.ceil(640 * gameRatio), 640, 'starfield');
    player = game.add.sprite(game.world.centerX - 60, game.world.centerY + 120, 'player');
    game.physics.enable(player, Phaser.Physics.ARCADE);
    cursors = game.input.keyboard.createCursorKeys();
    
    enemies = game.add.group();
    enemies.enableBody = true;
    enemies.physicsBodyType = Phaser.Physics.ARCADE;
    createEnemies();

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(500, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);
    bullets.setAll('OutOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    game.input.onTap.add(function () {
      if(!left && !right){
        fireBullet();
      }
    }, this);

    fx = game.add.audioSprite('sfx');

    if (!game.device.desktop) {
      buttonleft = game.add.button(50, game.world.centerY + 250, 'left', null, this, 0, 1, 0, 1);
      buttonleft.fixedToCamera = true;
      buttonleft.events.onInputOver.add(function () { left = true; });
      buttonleft.events.onInputOut.add(function () { left = false; });
      buttonleft.events.onInputDown.add(function () { left = true; });
      buttonleft.events.onInputUp.add(function () { left = false; });

      buttonright = game.add.button(1.9 * screen.availWidth - 50, game.world.centerY + 250, 'right', null, this, 0, 1, 0, 1);
      buttonright.fixedToCamera = true;
      buttonright.events.onInputOver.add(function () { right = true; });
      buttonright.events.onInputOut.add(function () { right = false; });
      buttonright.events.onInputDown.add(function () { right = true; });
      buttonright.events.onInputUp.add(function () { right = false; });
    }

    scoreText = game.add.text(game.world.centerX - 110, game.world.centerY + 270, 'Score: ', { font: '32px monospace', fill: '#7bb60c' });
    winText = game.add.text(game.world.centerX - 150, game.world.centerY - 50, '    Congrats!! \nYou Win the game!!', { font: '32px monospace', fill: '#7bb60c' });
    winText.visible = false;
  },
  update: function () {
    player.body.velocity.x = 0;
    spacefield.tilePosition.y += bgVelocity;
    game.physics.arcade.overlap(bullets, enemies, collisionHandler, null, this);

    if (cursors.left.isDown || left) {
      player.body.velocity.x = -350;
    }
    if (cursors.right.isDown || right) {
      player.body.velocity.x = 350;
    }
    if (fireButton.isDown || game.input.activePointer.leftButton.isDown) {
      fireBullet();
    }
    scoreText.text = 'Score: ' + score;
    if (score == scoreLimit) {
      winText.visible = true;
      scoreText.visible = true;
      setTimeout(function () {
        window.location.assign("http://visit.2626.today/");
      }, 3000);
    }
  }
};

function handleCorrect() {
  window.location.reload();
  if (!game.device.desktop) {
    if (firstRunLandscape) {
      gameRatio = window.innerWidth / window.innerHeight;
      game.width = Math.ceil(640 * gameRatio);
      game.height = 640;
      game.renderer.resize(game.width, game.height);
      game.state.start("mainState");
    }
    document.getElementById("turn").style.display = "none";
  }
}

function handleIncorrect() {
  if (!game.device.desktop) {
    document.getElementById("turn").style.display = "block";
  }
}

function createEnemies() {
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < i; x++) {
      var enemy = enemies.create(x * 90, y * 90, 'enemy');
      enemy.anchor.setTo(1, 1);
    }
  }
  enemies.x = 100;
  enemies.y = 50;

  var tween = game.add.tween(enemies).to({ x: 200 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);
  tween.onLoop.add(descend, this);
}

function descend() {
  enemies.y += 20;
}

function fireBullet() {
  if (game.time.now > bulletTime) {
    bullet = bullets.getFirstExists(false);
    if (bullet) {
      fx.play('shot');
      bullet.reset(player.x + 25, player.y);
      bullet.body.velocity.y = -400;
      bulletTime = game.time.now + 200;
    }
  }
}

function collisionHandler(bullet, enemy) {
  bullet.kill();
  enemy.kill();
  score += 100;
}

game.state.add('mainState', mainState);
game.state.start('mainState');


