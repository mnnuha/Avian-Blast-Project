window.onload = function() {
    var canvas = document.getElementById("viewport");
    var context = canvas.getContext("2d");

    

    const menuScreen = document.getElementById("menuScreen");
    const playBtn = document.getElementById("playBtn");
    const tutorialBtn = document.getElementById("tutorialBtn");
    const tutorialPopup = document.getElementById("tutorialPopup");
    const closeTutorial = document.getElementById("closeTutorial");
    const restartBtn = document.getElementById("restartBtn");

    playBtn.addEventListener("click", () => {
        menuScreen.style.display = "none"; // hide menu
        startGame(); // start your game (you already have this function)
    });

    tutorialBtn.addEventListener("click", () => {
        tutorialPopup.classList.add("show"); // show popup
       
    });

    closeTutorial.addEventListener("click", () => {
        tutorialPopup.classList.remove("show"); // hide popup
        
    });


    restartBtn.addEventListener("click", () => {
        restartBtn.style.display = "none";
        newGame(currentLevel); // reset level
        gamestate = gamestates.ready;
    });

       
    //Frame tracking variables for FPS calculation
    var lastframe = 0;
    var fpstime = 0;
    var framecount = 0;
    var fps = 0;

    var initialized = false;
    
    //Game level settings
    var level = {
        x: 4,
        y: 83,
        width: 0,
        height: 0, 
        columns: 15, 
        rows: 14, 
        tilewidth: 40, 
        tileheight: 40, 
        rowheight: 34,
        radius: 20,
        tiles: [] //2D array for bubbles
    };

    var currentLevel = 1;

    //Configuration for levels (rows, number of colors)
    var levelsConfig = {
        1: {rows: 14, bubblecolors: 5},
       
    };

    //Tile constructor
    var Tile = function(x, y, type, shift) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.removed = false;
        this.shift = shift;
        this.velocity = 0;
        this.alpha = 1;
        this.processed = false;
    };

    //Player properties
    var player = {
        x: 0,
        y: 0,
        angle: 0,
        tiletype: 0,
        bubble: {
                    x: 0,
                    y: 0,
                    angle: 0, 
                    speed: 1000,
                    dropspeed: 900,
                    tiletype: 0,
                    visible: false 
                },
        nextbubble: {
                        x: 0,
                        y: 0,
                        tiletype: 0

                    }
    };

    //Neighbor offsets for detecting clusters
    var neighborsoffsets =  [[[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1],[0, -1]], 

                             [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]]];

    //Total number of bubble colors
    var bubblecolors = 7;

    //Game states
    var gamestates = { init: 0, ready: 1, shootbubble: 2, removecluster: 3, gameover: 4, gamewin: 5};
    var gamestate = gamestates.init;

    var score = 0;

    var turncounter = 0; 
    var rowoffset = 0;

    var animationstate = 0;
    var animationtime = 0;

    var showcluster = false;
    var cluster = [];
    var floatingclusters = [];

    var images = [];
    var bubbleimage;
    
    var loadcount = 0;
    var loadtotal = 0;
    var preloaded = false;

        //Load images function
        function loadImages(imagefiles, callback) {
            
            loadcount = 0;
            loadtotal = imagefiles.length;
            preloaded = false;

            var loadedimages = [];
            for (var i=0; i < imagefiles.length; i++) {

                var image = new Image();

                image.onload = function () {
                    loadcount++; 
                    if (loadcount == loadtotal) {

                        preloaded = true;
                        if (callback) callback();
                    }
                };

                image.src = imagefiles[i];
                loadedimages.push(image);  
            
            }

            return loadedimages;
        }

        //Initialize game
        function init() {

            images = loadImages(["Bubbles.png"], startGame);
                 
        }

        //Start the game 
        function startGame() {
            bubbleimage = images[0];

            //Mouse controls
            canvas.addEventListener("mousemove", onMouseMove);
            canvas.addEventListener("mousedown", onMouseDown);

            //Initialize empty tiles
            for (var i=0; i<level.columns; i++) {
                level.tiles[i] = [];
                
            } 
          
            level.width = level.columns * level.tilewidth + level.tilewidth / 2;
            level.height = (level.rows - 1) * level.rowheight + level.tileheight;

            player.x = level.x + level.width / 2 - level.tilewidth / 2;
            player.y = level.y + level.height;
            player.angle = 90;
            player.tiletype = 0;

            player.nextbubble.x = player.x - 2 * level.tilewidth;
            player.nextbubble.y = player.y;

            newGame(currentLevel); //Set up level
            main(0); // Start main loop
        }

        //Main game loop
        function main(tframe) {
            window.requestAnimationFrame(main);

            if (!initialized) {

                //Draw loading screen
                context.clearRect(0, 0, canvas.width, canvas.height);

                drawFrame();

                var loadpercentage = loadcount/loadtotal;
                context.strokeStyle = "#56c204";
                context.lineWidth =3;
                context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width - 37, 32);
                context.fillStyle = "#56c204";
                context.fillRect(18.5, 0.5 + canvas.height - 51, loadpercentage*(canvas.width-37), 32);

                var loadtext = "Loaded" + loadcount + "/" + loadtotal + " images";
                context.fillStyle = "#000000";
                context.font = "16px Verdana";
                context.fillText(loadtext, 18, 0.5 + canvas.height - 63);

                if (preloaded) {
                    
                    setTimeout(function(){initialized = true;}, 1000);

                }
            
            } else {
                //Update and render the game
                update(tframe);
                render(); 
            }
        }

        //Update game state
        function update(tframe) {
            var dt = (tframe - lastframe) / 1000;
            lastframe = tframe;

            updateFps(dt);
            
            if (gamestate == gamestates.ready) {
                //Waits for player input
            } else if (gamestate == gamestates.shootbubble) {

                stateShootBubble(dt); //Move bubble

            } else if (gamestate == gamestates.removecluster) {

                stateRemoveCluster(dt);//Remove matched bubbles
            }
        }

        //Change game state
        function setGameState(newgamestate) {
            gamestate = newgamestate;

            animationstate = 0;
            animationtime = 0;
         
        } 

        //Move the shooting bubble and detect collisions
        function stateShootBubble(dt) {

            player.bubble.x += dt * player.bubble.speed * Math.cos(degToRad(player.bubble.angle));
            player.bubble.y += dt * player.bubble.speed * -1*Math.sin(degToRad(player.bubble.angle));

            //Bounce on walls
            if (player.bubble.x <= level.x) {
                
                player.bubble.angle = 180 - player.bubble.angle;
                player.bubble.x = level.x;

            } else if (player.bubble.x + level.tilewidth >= level.x + level.width) {

                player.bubble.angle = 180 - player.bubble.angle;
                player.bubble.x = level.x + level.width - level.tilewidth;
            
            } 

            //Hit top of screen
            if (player.bubble.y <= level.y) {

                player.bubble.y = level.y;
                snapBubble();
                return;
            }

            //Check collision with other bubbles
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    var tile = level.tiles[i][j];

                    if (tile.type < 0) {
                        continue;
                    }

                    var coord = getTileCoordinate(i, j);
                    if (circleIntersection(player.bubble.x + level.tilewidth/2, 
                                           player.bubble.y + level.tileheight/2, 
                                           level.radius,
                                           coord.tilex + level.tilewidth/2,
                                           coord.tiley + level.tileheight/2, 
                                           level.radius)) {

                        snapBubble();
                        return;
                    } 
                }
            }
        } 

        //Remove clusters and floating bubbles
        function stateRemoveCluster(dt) {
            if (animationstate == 0) {
                
                //Mark cluster as removed
                for (var i=0; i<cluster.length; i++) {
                    
                    cluster[i].type = -1;

                }

                score += cluster.length * 100;

                floatingclusters = findFloatingClusters(); //Find bubbles not connected on top
                
                    for ( var i =0 ; i < floatingclusters.length; i++) {
                        for (var j =0 ; j < floatingclusters[i].length; j++) {
                            floatingclusters[i][j].type = -1;
                            score += 100;
                        }
                }

                animationstate = 1; //Start fading animation 
            }
            
            if (animationstate == 1) {

                //Animate fading and falling
                var tilesleft = false;
                for (var i=0; i<cluster.length; i++) {
                    var tile = cluster[i];

                    if (tile.type >= 0) {
                        tilesleft = true;

                        tile.alpha -= dt * 15;
                        if (tile.alpha < 0) {
                            tile.alpha = 0;
                        }

                        if (tile.alpha == 0) {
                            tile.type = -1;
                            tile.alpha = 1;
                        }
                    }
                }

                for (var i=0; i<floatingclusters.length; i++) {
                    for (var j=0; j<floatingclusters[i].length; j++) {
                        var tile = floatingclusters[i][j];

                        if (tile.type >= 0) {
                            var tilesleft = false;

                            tile.velocity += dt * 700;
                            tile.shift += dt * tile.velocity;

                            tile.alpha -= dt * tile.velocity;

                            tile.alpha -= dt * 8;
                            if (tile.alpha < 0) {
                                tile.alpha = 0;
                            }

                            if (tile.alpha == 0 || (tile.y * level.rowheight + tile.shift >
                            (level.rows - 1) * level.rowheight + level.tileheight)) {
                                tile.type = -1;
                                tile.shift = 0;
                                tile.alpha = 1;
                            } 
                         
                        }
                    }
                }

                if (!tilesleft) {
                    nextBubble();

                    if (checkWin()) {
                        setGameState(gamestates.gamewin);
                    } else {
                        var gameOver= false;
                        for (var i = 0; i < level.columns; i++) {
                            if (level.tiles[i][level.rows - 1].type != -1) {
                                gameOver = true;
                                break;
                            }
                        }
                        if (gameOver) setGameState(gamestates.gameover);
                        else setGameState(gamestates.ready);
                    }

                    

                }
            }
        }

        //Snap bubble into grid after collision
        function snapBubble(){
            var centerx = player.bubble.x + level.tilewidth/2;
            var centery = player.bubble.y + level.tileheight/2;
            var gridpos = getGridPosition(centerx, centery);

            //Clamp positions to grid
            if (gridpos.x < 0) {
                gridpos.x = 0;
            }

            if (gridpos.x >= level.columns) {
                gridpos.x = level.columns - 1;
            }

            if (gridpos.y < 0) {
                gridpos.y = 0;
            }

            if (gridpos.y >= level.rows) {

                gridpos.y = level.rows - 1;
            }

            var addtile = false;
            if (level.tiles[gridpos.x][gridpos.y].type != -1) {
                for (var newrow=gridpos.y+1; newrow<level.rows; newrow++) {
                    if (level.tiles[gridpos.x][newrow].type == -1){
                        gridpos.y = newrow;
                        addtile = true;
                        break;
                    }
                    
                }
                
            } else {
                addtile = true;
            }

            if (addtile) {

                player.bubble.visible = false;

                level.tiles[gridpos.x][gridpos.y].type = player.bubble.tiletype;
               

                //Check for clusters
                cluster = findCluster(gridpos.x, gridpos.y, true, true, false);
                
                if (cluster.length >= 3) {

                    for (var i=0; i<cluster.length; i++) {
                        if (cluster[i].type === -2) {
                            explodeBomb(cluster[i].x, cluster[i].y);
                        }
                    }

                    setGameState(gamestates.removecluster);
                    return;

                }
            }

            turncounter++;
            if (currentLevel > 1 && turncounter >= 8) {

             addBubbles();
             turncounter = 0;

            }

            nextBubble();
            setGameState(gamestates.ready);
            
            checkGameOver();

        }

        //Starts a new game
        function newGame(levelIndex) {
    
            if (typeof levelIndex !== "undefined") {
                currentLevel = levelIndex;
            }

            //Reset score and game stats
            score = 0;
            turncounter = 0;
            rowoffset = 0;
            animationstate = 0;
            animationtime = 0;

            //Set tile dimensions and radius
            level.tilewidth = 40;
            level.tileheight = 40;
            level.radius = level.tilewidth / 2;
            level.rowheight = Math.floor(level.tileheight * 0.85);

            //Initialize the grid with empty tiles
            level.tiles = [];
            for (var i = 0; i < level.columns; i++) {
                level.tiles[i] = [];
                for (var j = 0; j < level.rows; j++) {
                    
                    level.tiles[i][j] = new Tile(i, j, -1, 0);
                }
            }

           
            createLevel(); //Fill the grid with bubbles for this level

           
            setGameState(gamestates.ready); //Set game state to ready
            nextBubble(); //Prepare first bubble to shoot 
            nextBubble(); //Prepare the next bubble
        }

        //Creates the level layout based on configuration
        function createLevel() {
            var config = levelsConfig[currentLevel];
            level.rows = config.rows;
            bubblecolors = config.bubblecolors;
                        
            for (var j=0; j<level.rows; j++) {
                
                for (var i=0; i<level.columns; i++) {
                    let tileType = -1;

                    //Only populates first 5 rows on level 1
                    if (currentLevel === 1) {
                                                
                        if (j < 5) {
                            tileType = randRange(0, bubblecolors - 1); // Random bubble color
                            if (config.specialBubbles && randRange(0, 10) === 0) {
                                tileType = -2;
                            }
                        }
                    }
                                      
                    level.tiles[i][j].type = tileType;

                }
            }
        }
        
        function checkWin() {
            for (var i = 0; i < level.columns; i++) {
                for (var j = 0; j < level.rows; j++) {
                    if (level.tiles[i][j].type >= 0) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        //Checks if the game is over (any bubble reached the bottom) 
        function checkGameOver() {
            for (var i=0; i<level.columns; i++) {
                if (level.tiles[i][level.rows-1].type != -1) {
                    nextBubble();
                    setGameState(gamestates.gameover); //Set game over state
                    return true;

                }
            }

            return false;

        }


        //Shifts bubbles down and adds new bubbles at the top
        function addBubbles() {
            for (var i=0; i<level.columns; i++) {
                for (var j = level.rows - 1; j > 0; j--) {
                    level.tiles[i][j]. type = level.tiles[i][j - 1].type;
                   
                }

                  level.tiles[i][0].type = getExistingColor();
            } 
        
           
        }

        //Returns a list of all bubble colors currently in the grid
        function findColors() {
            var foundcolors = [];
            var colortable = [];
            for (var i=0; i<bubblecolors; i++) {
                colortable.push(false);
            }

            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    var tile = level.tiles[i][j];
                    if (tile.type >= 0) {
                        if (!colortable[tile.type]) {
                            colortable[tile.type] = true;
                            foundcolors.push(tile.type);
                        }

                    }
                }

            }

            return foundcolors;
        }

        //Finds a cluster of connected bubbles of the same type
        function findCluster(tx, ty, matchtype, reset, skipremoved) {

            if (reset) {
                resetProcessed();
            }

            var targettile = level.tiles[tx][ty];

            var toprocess = [targettile];
            targettile.processed = true;
            var foundcluster = []; 

            while (toprocess.length > 0) {

                var currenttile = toprocess.pop();

                if (currenttile.type == -1) {
                    continue;
                }

                if (skipremoved && currenttile.removed) {
                    continue;
                }

                if (!matchtype || (currenttile.type == targettile.type)) {
                    foundcluster.push(currenttile);

                    var neighbors = getNeighbors(currenttile);

                    for (var i=0; i<neighbors.length; i++) {
                        if (!neighbors[i].processed) {
                            toprocess.push(neighbors[i]);
                            neighbors[i].processed = true;
                        }
                    }
                }
            }

            return foundcluster;
        }

        //Finds clusters not connected to the top (floating clusters)
        function findFloatingClusters() {

            resetProcessed();

            var foundclusters = [];

            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    var tile = level.tiles[i][j];
                    if (!tile.processed) {

                        var foundcluster = findCluster(i, j, false, false, true);
                        
                        if (foundcluster.length <= 0) {
                            continue;
                        }

                        var floating = true;
                        for (var k=0; k<foundcluster.length; k++) {
                            if (foundcluster[k].y == 0) {
                                floating = false;
                                break; 
                            }
                        } 
                        
                        if (floating) {

                            foundclusters.push(foundcluster);
                        }
                    
                    } 
                }
            }

            return foundclusters;
          
        }

        //Resets processed satte for all tiles
        function resetProcessed() {
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    level.tiles[i][j].processed = false;
                }
            }
        }

        //Resets removed state for all tiles
        function resetRemoved() {
            for (var i=0; i<level.columns; i++) {
                for (var j=0; j<level.rows; j++) {
                    level.tiles[i][j].removed = false;
                }
            }
        }

        //Returns neighboring tiles of a tile
        function getNeighbors(tile) {
            var tilerow = (tile.y + rowoffset) % 2;
            var neighbors = [];

            var n = neighborsoffsets[tilerow];

            for (var i=0; i<n.length; i++) {

                var nx = tile.x + n[i][0];
                var ny = tile.y + n[i][1];

                if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
                    neighbors.push(level.tiles[nx][ny]); 
                }
            }

            return neighbors;

        } 
        
        //Update FPS counter
        function updateFps(dt) {
            if (fpstime > 0.25) {
                fps = Math.round(framecount / fpstime);

                fpstime = 0;
                framecount = 0;
            } 

            fpstime += dt;
            framecount++;
        }

        //Draws text centerd at a location
        function drawCenterText(text, x, y, width) {
            var textdim = context.measureText(text);
            context.fillText(text, x + (width=textdim.width)/2, y);
        }

        function drawPopupBox(title, boxColor, textColor) {
            const boxWidth = 300;
            const boxHeight = 120;

            const centerX = level.x + level.width / 2;
            const centerY = level.y + level.height / 2;

            const x = centerX - boxWidth / 2;
            const y = centerY - boxHeight / 2;

            context.fillStyle = boxColor;
            context.strokeStyle = "#434040ff";
            context.lineWidth = 3;
            context.fillRect(x, y, boxWidth, boxHeight);
            context.strokeRect(x, y, boxWidth, boxHeight);

            const boxCenterX = x + boxWidth / 2;
            

            context.textAlign = "center";
            context.textBaseline = "middle";


            context.fillStyle = textColor;
            context.font = "bold 24px Arial";
            context.fillText(title, boxCenterX, y + 40);

            
        } 

        //Main render function called every frame
        function render() {

            drawFrame();

            var yoffset = level.tileheight/2;

            //Draw grid background
            
            context.fillStyle = "#dbdbdb"
            context.fillRect(level.x - 4, level.y - 4, level.width + 8, level.height + 4 - yoffset);

            renderTiles();

            //Draw bottom area
            context.fillStyle = "#c4c4c4"
            context.fillRect(level.x - 4, level.y - 4 + level.height + 4 - yoffset, level.width + 8, 2*level.tileheight + 3);
            
            //Draw score
            context.fillStyle = "#ffffff";
            context.font = "18px Verdana";
            var scorex = level.x + level.width - 150;
            var scorey = level.y + level.height + level.tileheight - yoffset - 8;
            drawCenterText("Score:", scorex, scorey, 150);
            context.font = "24px Verdana";
            drawCenterText(score, scorex, scorey+30, 150);

            //Highlight clusters
            if (showcluster) {
                renderCluster(cluster, 255, 128, 128);

                for (var i=0; i<floatingclusters.length; i++) {
                    var col = Math.floor(100 + 100 * i / floatingclusters.length);
                    renderCluster(floatingclusters[i], col, col, col);
              
                }
            }

            renderPlayer(); //Draw player bubble and aiming line


            //Draw win screen 
            if (gamestate == gamestates.gamewin || gamestate == gamestates.gameover) {
                // Popup box dimensions
                let boxWidth = 300;
                let boxHeight = 120;
                let centerX = level.x + level.width / 2;
                let centerY = level.y + level.height / 2;
                let x = centerX - boxWidth / 2;
                let y = centerY - boxHeight / 2;

                // Draw the popup text
                if (gamestate == gamestates.gamewin) {
                    drawPopupBox("YOU WIN!", "#fbfbfbff", "#000000ff");
                } else {

                    drawPopupBox("YOU LOSE!", "#fbfbfbff", "#000000ff");
                }

                // Show and position the restart button
     
               restartBtn.style.display = "block";
             
                            
            }  else {
                restartBtn.style.display = "none";
            }


        }

        //Draws background and UI frame
        function drawFrame() {
            
            context.fillStyle = "e8eaec";
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = "#215a2bff";
            context.fillRect(0, 0, canvas.width, 79);

            context.fillStyle = "#ffffff";
            context.font = "24px Verdana";
            context.fillText("Bubble Shooter", 10, 37);

            context.fillStyle = "#ffffff";
            context.font = "12px Verdana";
            
            
        } 

        function renderTiles() {

            for (var j=0; j<level.rows; j++) {
                for (var i=0; i<level.columns; i++) {
                    
                    var tile = level.tiles[i][j];

                    var shift = tile.shift;

                    var coord = getTileCoordinate(i, j);

                    if (tile.type >= 0) {

                        context.save();
                        context.globalAlpha = tile.alpha;

                        drawBubble(coord.tilex, coord.tiley + shift, tile.type);

                        context.restore();

                    }
                }
            }
        }

        //Draws a highlighted rectangle over each tile in a cluster
        function renderCluster(cluster, r, g, b) {
            for (var i=0; i<cluster.length; i++) {
                var coord = getTileCoordinate(cluster[i].x, cluster[i].y);

                context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                context.fillRect(coord.tilex+level.tilewidth/4, coord.tiley+level.tileheight/ 
                4, level.tilewidth/2, level.tileheight/2);
                
            }
        }
        
        //Draws the player(canon) and the next bubble to shoot
        function renderPlayer() {
            
            const centerx = player.x + level.tilewidth / 2;
            const centery = player.y + level.tileheight / 2;

            const arrowLength = 2.5 * level.tilewidth;
            const dir = getDirection(player.angle);


            context.lineWidth = 2;
            context.strokeStyle = "#000033";
            context.beginPath();
            context.moveTo(centerx, centery);
            context.lineTo(centerx + arrowLength * dir.dx,
                           centery + arrowLength * dir.dy);

            context.stroke();

            drawTrajectory(centerx + dir.dx * arrowLength, centery + dir.dy * arrowLength, player.angle);
            
            //Draw cannon base
            context.fillStyle = "#7a7a7a";
            context.beginPath();
            context.arc(centerx, centery, level.radius+12, 0, 2*Math.PI, false);
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = "#8c8c8c";
            context.stroke();

                        
            //Draw the next bubble in the queue
            drawBubble(player.nextbubble.x, player.nextbubble.y, player.nextbubble.tiletype);

            //Draw the currently active bubble if visible
            if(player.bubble.visible) {
                drawBubble(player.bubble.x, player.bubble.y, player.bubble.tiletype);
            }

        }

        function getDirection(angle) {
            const rad = degToRad(angle);
            return {
                dx: Math.cos(rad), 
                dy: -Math.sin(rad) 
            };
        }

        function drawTrajectory(px, py, angle) {
            const step = 2;
            let dir = getDirection(angle);
            let currentAngle = angle;

            const maxVertical  = 90;
            const maxDiagonal = 300;
            const maxSteps = maxVertical + (1 - Math.abs(dir.dy)) * (maxDiagonal - maxVertical);

            let curDir = {dx: dir.dx, dy: dir.dy};

            context.strokeStyle = "rgba(222, 59, 59, 0.4)";
            context.lineWidth = 2;
            context.setLineDash([5, 5]);
            context.beginPath();
            context.moveTo(px, py);

            const topBoundary = level.y;
          
            
            for (let i = 0; i < maxSteps; i++) {
                // Predict next step
                let nextX = px + curDir.dx * step;
                let nextY = py + curDir.dy * step;

                // Bounce off left wall
                if (nextX <= level.x) {
                    nextX = level.x + (level.x - nextX); // reflect distance past wall
                    currentAngle = 180 - currentAngle;
                    curDir = getDirection(currentAngle);
               
                }

                // Bounce off right wall
                if (nextX >= level.x + level.width) {
                    nextX = (level.x + level.width) - (nextX - (level.x + level.width));
                    currentAngle = 180 - currentAngle;
                    curDir = getDirection(currentAngle);
                                    
                }

                // Stop at top
                if (nextY <= topBoundary) {
                    nextY = topBoundary;
                    px = nextX;
                    py = nextY;
                    context.lineTo(px, py);
                    break;
                }

                px = nextX;
                py = nextY;
                context.lineTo(px, py);
            }

            context.stroke();
            context.setLineDash([]);
        }

            
        //Converts grid column/row to canvas x/y coordinates
        function getTileCoordinate(column, row) {
            var tilex = level.x + column * level.tilewidth;

            if ((row + rowoffset) % 2) {
                tilex += level.tilewidth/2;

            }

            var tiley = level.y + row * level.rowheight;
            return {tilex: tilex, tiley: tiley};
        }

        //Converts canvas x/y coordinates to grid column/row
        function getGridPosition(x, y) {
            var gridy = Math.floor((y - level.y) / level.rowheight);

            var xoffset = 0;
            if ((gridy + rowoffset) % 2) {
                xoffset = level.tilewidth / 2;
            }
            var gridx = Math.floor(((x - xoffset) - level.x) / level.tilewidth);

            return { x: gridx, y: gridy};
            
        } 
        
        
        //Draws a bubble from the sprite sheet at x,y
        function drawBubble(x, y, index) {
            if (index < 0 || index >= bubblecolors)
                return;

            const TOTAL_BUBBLES_IN_SPRITE = 7; // Number of different bubbles in the sprite sheet
            const spriteWidth = bubbleimage.width / TOTAL_BUBBLES_IN_SPRITE;
            const spriteHeight = bubbleimage.height;

                                
            context.drawImage(
                bubbleimage,
                index * spriteWidth, 0, spriteWidth, spriteHeight,
                x, y, level.tilewidth, level.tileheight
            );
                
        }

        //Sets the player's current bubble and generates the next bubble       
        function nextBubble() {

            player.tiletype = player.nextbubble.tiletype;
            player.bubble.tiletype = player.nextbubble.tiletype;
            player.bubble.x = player.x;
            player.bubble.y = player.y;
            player.bubble.visible = true;

           
            var nextcolor = getExistingColor();

            player.nextbubble.tiletype = nextcolor;
        }

        //Returns a random bubble type currently existing on the grid
        function getExistingColor() {
            let existingcolors = findColors();

           
            if (existingcolors.length > 0) {

                return existingcolors[randRange(0, existingcolors.length - 1)];
            }

            return 0;

        }

        //Returns a random integer between low and high
        function randRange(low, high) {
            return Math.floor(low +Math.random()*(high-low+1));
        }

        //Fires the player's bubble
        function shootBubble() {
            player.bubble.x = player.x;
            player.bubble.y = player.y;
            player.bubble.angle = player.angle;
            player.bubble.tiletype = player.tiletype;

            setGameState(gamestates.shootbubble); //Switch state to shooting
        }

        //Checks if two circles intersect
        function circleIntersection(x1, y1, r1, x2, y2, r2) {

            var dx = x1 - x2;
            var dy = y1 - y2;
            var len = Math.sqrt(dx * dx + dy * dy);

            if (len < r1 + r2) {

                return true;
            }

            return false;
        }

        //Converts radians to degrees
        function radToDeg(angle) {
            return angle * (180 / Math.PI);
        }
        
        //Converts degrees to radians
        function degToRad(angle) {
            return angle * (Math.PI / 180);

        }

        //Updates player aiming angle based on mouse position
        function onMouseMove(e) {

             if (gamestate === gamestates.gameover || gamestate === gamestates.gamewin) {
                    return;
                }

            var pos = getMousePos(canvas, e);

            var mouseangle = radToDeg(Math.atan2((player.y+level.tileheight/2) - pos.y, pos.x
            - (player.x+level.tilewidth/2)));

            //Normalize angle
            if (mouseangle < 0) {
                mouseangle = 180 + (180 + mouseangle);
            }

            //Clamp angle between bounds
            var lbound = 1;
            var ubound = 179;
            if (mouseangle > 90 && mouseangle < 270) {

                if (mouseangle > ubound) {
                    mouseangle = ubound;
                } 
                
                } else { 

                    if (mouseangle < lbound || mouseangle >= 270) {
                        mouseangle = lbound;
                    }
                }

                player.angle = mouseangle;

               
        }

        //Handles mouse clucks to shoot bubble or restart game
        function onMouseDown(e) {
         
            if (gamestate == gamestates.ready) {
                shootBubble();
            } else if (gamestate === gamestates.gameover || gamestate === gamestates.gamewin) {
                newGame(); //Restart game
            }
        
        }

        //Converts mouse event coordinates to canvas coordinates
        function getMousePos(canvas, e) {

            var rect = canvas.getBoundingClientRect();
            return {
                x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width), 
                y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
            };
        }

        init(); // Call the initialization function to stat the game

    };            