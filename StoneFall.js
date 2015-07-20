// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// init
init = function(){
  var createCanvas = newCanvas(document),
      newImage = createImage(imageData),
      canvas = createCanvas(512,600),
      reset = resetGame(canvas),
      update = updateGame(reset),
      render = renderGame(newImage, canvas);
      
  //add canvas to dom
  document.getElementById('canvas_container').appendChild(canvas);
  
  //game loop
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
        
    var playerLink = "evo3";
    if (gameData.player.type == 0)
      playerLink = playerLink + "g";
    else if (gameData.player.type == 1)
      playerLink = playerLink + "f";
    else if (gameData.player.type == 2)
      playerLink = playerLink + "w";
    if (gameData.player.isDoubleJumping || gameData.player.isDashing)
      playerLink = playerLink + "s";
    if (gameData.player.isFacingRight)
      playerLink = playerLink + "r";
    else
      playerLink = playerLink + "l";

    if (gameData.player.isVineWhipping && gameData.player.isFacingRight)
      vineImage = createImage("vineR", function()
      {
          context.drawImage(vineImage, player.xPos+30, player.yPos-10);
      });
    else if (gameData.player.isVineWhipping)
      vineImage = createImage("vineL", function()
      {
          context.drawImage(vineImage, player.xPos-30, player.yPos-10);
      });    
    
    playerImage = createImage(playerLink, function()
    {
      context.drawImage(playerImage, player.xPos, player.yPos);
    });
    
    
    
    var fallLink = "fall";
    if (gameData.fallingObject.secondBounce)
      fallLink = fallLink + "Ice";
    else if (gameData.fallingObject.firstBounce)
      fallLink = fallLink + "Fire2";
    else
      fallLink = fallLink + "Fire1";
    
    objectImage = createImage(fallLink, function()
    {
      context.drawImage(objectImage, fallingObject.xPos, fallingObject.yPos);
    });
    
    
    var lifeLink = "evo1";
    if (gameData.player.type == 0)
      lifeLink = lifeLink + "gr";
    else if (gameData.player.type == 1)
      lifeLink = lifeLink + "fr";
    else if (gameData.player.type == 2)
      lifeLink = lifeLink + "wr";
    
    lifeImage = createImage(lifeLink, function()
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
    
    //Type switch
    if (16 in player.keysDown && !player.typeChanged) //Shift
    {
      player.type++;
      player.type %= 3;
      player.typeChanged = true;
    }
    if (!(16 in player.keysDown))
    {
      player.typeChanged = false;
    }
         
    //Handles jumping
    if (38 in player.keysDown && !player.isDashing) //Up
    {
      if (!player.isDoubleJumping)
      {
        if (!player.isJumping)
        {
          player.isJumping = true;
          player.prepDoubleJump = false;
          player.yVel = 10;
        }
        else if (player.prepDoubleJump && player.type == 1)
        {
          player.isDoubleJumping = true;
          player.yVel = 10;
        }
      }
    }
    if (!(38 in player.keysDown))
    {
      player.prepDoubleJump = true;
    }
    
    if (player.isJumping)
    {
      player.yPos -= player.yVel;
      player.yVel -= .5;
      if (player.yPos > height-96)
      {
        player.isJumping = false;
        player.isDoubleJumping = false;
        player.prepDoubleJump = false;
      }
    }

    //Handles down arrow abilities
    if (40 in player.keysDown)
    {
      if (player.type == 0 && player.vineTimer <= 0)
      {
        player.isVineWhipping = true;
        player.vineTimer = 0;
      }
      if (player.type == 2)
      {
        player.isDashing = true;
      }  
    }
    if (player.isDashing)
    {
      if (player.xPos < width-64 && player.isFacingRight)
        player.xPos += 2 * player.speed * modifier;
      else if (player.xPos > 0 && !player.isFacingRight)
        player.xPos -= 2 * player.speed * modifier;
      player.dashDistance++;
      if (player.dashDistance > 12)
      {
        player.isDashing = false;
        player.dashDistance = 0;
      }
    }
    
    if (player.isVineWhipping)
    {
      player.vineTimer++;
      if (player.vineTimer > 20)
      {
        player.isVineWhipping = false;
        //player.vineTimer = 0;
      }
    }
    else
    {
      player.vineTimer--;
    }

    //Handles left movement
    if (37 in player.keysDown && !player.isDashing)
    {
      player.isFacingRight = false;
      if (player.xPos > 0)
        player.xPos -= player.speed * modifier;
    }
    
    //Handles right movement
    if (39 in player.keysDown && !player.isDashing)
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
    
    //Handle vine whip
    if (player.isVineWhipping
        && player.xPos <= (fallingObject.xPos + 42) //Left 
        && fallingObject.xPos <= (player.xPos + 74) //Right
        && player.yPos <= (fallingObject.yPos + 22) //Up
        && fallingObject.yPos <= (player.yPos + 24)) //Down
    {
      fallingObject.yPos -= fallingObject.yVel;
      fallingObject.yVel = -fallingObject.yVel;
    }
        
    //Check for and handle hit
    if (player.xPos <= (fallingObject.xPos + 32) //Left 
        && fallingObject.xPos <= (player.xPos + 64) //Right
        && player.yPos <= (fallingObject.yPos + 5) //Up
        && fallingObject.yPos <= (player.yPos + 64)) //Down
    {
      if (player.type == 0)
        gameData.lives -= 1;
      
      if (player.type == 1)
        if (fallingObject.secondBounce)
          gameData.lives -= 1;
        else if (fallingObject.firstBounce)
          gameData.experience += 1;
        else
          gameData.experience += 3;
      
      if (player.type == 2)
        if (fallingObject.secondBounce)
          gameData.experience += 1;
        else if (fallingObject.firstBounce)
          gameData.lives -= 1;
        else
          gameData.lives -= 1;
      
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
    if (gameData.player.type == 0)
      gameData.experience++;
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
    yVel: 0,
    isFacingRight: true,
    isJumping: false,
    isDoubleJumping: false,
    prepDoubleJump: false,
    isDashing: false,
    dashDistance: 0,
    isVineWhipping: false,
    vineTimer: 0,
    keysDown: {},
    type: 1, //0=Grass, 1=Fire, 2=Water
    typeChanged: false
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
  evo1gr: "http://i.imgur.com/6d5rQy0.gif",
  evo3gr: "http://i.imgur.com/cwr6C9l.gif",
  evo3gl: "http://i.imgur.com/d1kuvgj.gif",
  vineR: "http://i.imgur.com/Pchad2n.png",
  vineL: "http://i.imgur.com/xcLMF9O.png",
  
  evo1fr: "http://i.imgur.com/FAtEepv.gif",
  evo1fl: "http://i.imgur.com/MCXX0ex.gif",
  evo2fr: "http://i.imgur.com/lVVB3dx.gif",
  evo2fl: "http://i.imgur.com/YzSsYs9.gif",
  evo3fr: "http://i.imgur.com/zO9Sa9I.gif",
  evo3fl: "http://i.imgur.com/0zRrSDU.gif",
  evo3fsr: "http://i.imgur.com/MHOliIv.png",
  evo3fsl: "http://i.imgur.com/MHOliIv.png",
  
  evo1wr: "http://i.imgur.com/lLJkU4y.gif",
  evo3wr: "http://i.imgur.com/wNsRGWa.gif",
  evo3wl: "http://i.imgur.com/9VlIZDZ.gif",
  evo3wsr: "http://i.imgur.com/HaZnjEl.gif",
  evo3wsl: "http://i.imgur.com/C4MJqaZ.gif",
  
  fallFire1: "http://i.imgur.com/oNAXO36.png",
  fallFire2: "http://i.imgur.com/t5sekS5.png",
  fallIce: "http://i.imgur.com/cExq73r.png",
  glacierBackground: "http://i.imgur.com/c4AmR5y.jpg",
};