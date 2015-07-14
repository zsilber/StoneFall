// Cross-browser support
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

init = function(){
  var createCanvas = newCanvas(document),
      newImage = createImage(imageData),
      canvas = createCanvas(512,600),
      reset = resetGame(canvas),
      update = updateGame(reset),
      render = renderGame(newImage, canvas);
      
  //Add canvas
  document.getElementById('canvas_container').appendChild(canvas);
  
  //Game loop
  var then = Date.now(),
  mainLoop = function(){
    var gameState = gameData,
        now = Date.now(),
        delta = now - then;
    gameState = render(update(gameState, delta / 1000));
    then = now;
    requestAnimationFrame(mainLoop);
  };
  gameData = reset(gameData);
  mainLoop();
}

window.addEventListener('load',init);

addEventListener('keydown', function(event){
    gameData.player.keysDown[event.keyCode] = true;
  }, false);

addEventListener('keyup', function(event){
    delete gameData.player.keysDown[event.keyCode];
  }, false);

function renderGame(createImage, canvas)
{
  return function(gameData) {
    var context = canvas.getContext("2d"),
        player = gameData.player,
        fallingObject = gameData.fallingObject;

    bgImage = createImage('glacierBackground', function(){
      context.drawImage(bgImage, 0, 0);
    });
        
    if (gameData.player.isDoubleJumping)
    {
      playerImage = createImage('evo3j', function(){
          context.drawImage(playerImage, player.xPos, player.yPos);
      });
    }
    else if (gameData.player.isFacingRight)
    {
      playerImage = createImage('evo3r', function(){
          context.drawImage(playerImage, player.xPos, player.yPos);
      });
    }
    else if (!(gameData.player.isFacingRight))
    {
      playerImage = createImage('evo3l', function(){
          context.drawImage(playerImage, player.xPos, player.yPos);
      });
    }
    
    if (gameData.fallingObject.secondBounce)
    {
      objectImage = createImage('ice', function()
      {
          context.drawImage(objectImage, fallingObject.xPos, fallingObject.yPos);
      });
    }
    else if (gameData.fallingObject.firstBounce)
    {
      objectImage = createImage('fire2', function()
      {
          context.drawImage(objectImage, fallingObject.xPos, fallingObject.yPos);
      });
    }
    else
    {
      objectImage = createImage('fire1', function()
      {
          context.drawImage(objectImage, fallingObject.xPos, fallingObject.yPos);
      });
    }
    
    lifeImage = createImage('evo1r', function()
    {
      for (i = 0; i < gameData.lives; i++)
      {
        context.drawImage(lifeImage, 512-64*(i+1), 0);
      }
    });
    
    //Display score
    context.fillStyle = "rgb(255, 149, 68)";
	  context.font = "24px Verdana";
	  context.textAlign = "left";
	  context.textBaseline = "top";
	  context.fillText("Experience: " + gameData.experience, 16, 16);
  };
};

function updateGame(resetGame){
  return function(gameData, modifier){
    var player = gameData.player;
    var fallingObject = gameData.fallingObject;
    var width = 512;
    var height = 600;
         
    //Handles jumping
    if (38 in player.keysDown) //Up
    {
      if (!player.isDoubleJumping)
      {
        if (!player.isJumping)
        {
          player.isJumping = true;
          player.prepDoubleJump = false;
          player.upVel = 10;
        }
        else if (player.prepDoubleJump)
        {
          player.isDoubleJumping = true;
          player.upVel = 10;
        }
      }
	  }
    if (!(38 in player.keysDown))
    {
      player.prepDoubleJump = true;
    }
    
    if (player.isJumping)
    {
      player.yPos -= player.upVel;
      player.upVel -= .5;
      if (player.yPos > height-96)
      {
        player.isJumping = false;
        player.isDoubleJumping = false;
        player.prepDoubleJump = false;
      }
    }

    //Handles possible use for down arrow
    if (40 in player.keysDown)
    {
    
    }
    
    //Handles left movement
    if (37 in player.keysDown)
    {
      player.isFacingRight = false;
      if (player.xPos > 0)
		    player.xPos -= player.speed * modifier;
	  }
    
    //Handles right movement
    if (39 in player.keysDown)
    {
      player.isFacingRight = true;
      if (player.xPos < width-64)
		    player.xPos += player.speed * modifier;
	  }
    
    //Handles falling motion
    if (fallingObject.yPos < height-64) //Falls in air
    {
        fallingObject.yVel += .5;
        fallingObject.yPos += fallingObject.yVel;
    }
    else //Bounces off ground
    {
      if (fallingObject.firstBounce)
        fallingObject.secondBounce = true;
      fallingObject.firstBounce = true;
      
      fallingObject.yPos -= fallingObject.yVel;
      fallingObject.yVel = -fallingObject.yVel*.6;
    }
    
    if (fallingObject.xPos < width-32 && fallingObject.xPos > 0) //Keeps horizontal velocity
      fallingObject.xPos += fallingObject.xVel;
    else //Bounces off side walls (dampens velocity)
    {
      if (fallingObject.firstBounce)
        fallingObject.secondBounce = true;
      fallingObject.firstBounce = true;
      
      fallingObject.xPos -= fallingObject.xVel;
      fallingObject.xVel = -fallingObject.xVel*.8;
    }
    
    //Reset when object settles on ground
    if (Math.abs(fallingObject.yVel) < .2 && fallingObject.yPos > height-(64+2))
      gameData = resetGame(gameData);
        
    //Check for and handle hit
    if (player.xPos <= (fallingObject.xPos + 32) 
        && fallingObject.xPos <= (player.xPos + 64) 
        && player.yPos <= (fallingObject.yPos + 5)
        && fallingObject.yPos <= (player.yPos + 64))
    {
      if (fallingObject.secondBounce)
        gameData.lives -= 1;
      else if (fallingObject.firstBounce)
        gameData.experience += 1;
      else
        gameData.experience += 3;
      gameData = resetGame(gameData);
    }
    return gameData;
  };
};

//reset game
function resetGame(canvas){
  return function(gameData){
    gameData.fallingObject.xPos = Math.random() * (canvas.width - 32);
    gameData.fallingObject.yPos = 0;
    gameData.fallingObject.xVel = 20*Math.random()-10;
    gameData.fallingObject.yVel = 0;
    gameData.fallingObject.firstBounce = false;
    gameData.fallingObject.secondBounce = false;
    if (gameData.lives == -1)
    {
      gameData.lives = 3;
      gameData.experience = 0;
    }
    return gameData;
  };
};

//create a canvas
function newCanvas(document){
  return function(width, height) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };
};

//create an image 
function createImage(imageData) {
  return function(imageName, callback){
    var image = new Image();
    image.src = imageData[imageName];
    image.onload = callback;
    image.onerror = function(e) {console.log('Image error log: ' + e)};
    return image;
  };
}

var gameData =
{
  player:
  {
    speed: 400, //PixPerSec
    xPos: 512 / 2,
    yPos: 600 - 96,
    isJumping: false,
    isDoubleJumping: false,
    isFacingRight: true,
    prepDoubleJump: false,
    upVel: 0,
    keysDown: {}
  },
  
  fallingObject:
  {
    xPos: 0,
    yPos: 0,
    xVel: 0,
    yVel: 0,
    firstBounce: false,
    secondBounce: false
  },
  
  experience: 0,
  lives: 3
};

var imageData =
{
  evo1r: "http://i.imgur.com/FAtEepv.gif",
  evo1l: "http://i.imgur.com/MCXX0ex.gif",
  evo2r: "http://i.imgur.com/lVVB3dx.gif",
  evo2l: "http://i.imgur.com/YzSsYs9.gif",
  evo3r: "http://i.imgur.com/zO9Sa9I.gif",
  evo3l: "http://i.imgur.com/0zRrSDU.gif",
  evo3j: "http://i.imgur.com/MHOliIv.png",
  fire1: "http://i.imgur.com/oNAXO36.png",
  fire2: "http://i.imgur.com/t5sekS5.png",
  ice: "http://i.imgur.com/cExq73r.png",
  glacierBackground: "http://i.imgur.com/c4AmR5y.jpg",
  
  background : "http://i.imgur.com/WZfpm0W.png",
  player: "http://pldh.net/media/pokemon/md2/sprite/006.png",
  badGuy: "http://megaicons.net/static/img/icons_sizes/528/1941/32/gold-coin-icon.png",
  badGuy2: "http://png-2.findicons.com/files/icons/1180/sticker_1/32/skull_bw.png"
};