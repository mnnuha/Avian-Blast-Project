
//Get canvas and context
const canvas = document. getElementById('game');
const context = canvas.getContext('2d');

//Game setup values
const grid = 44;

//Level layout mapped out with the color initials
const level1 = [
    ['R', 'R', 'Y', 'Y', 'B', 'B', 'G', 'G', 'R', 'R', 'Y', 'Y', 'B', 'B', 'G', 'G'],
    ['R', 'R', 'Y', 'Y', 'B', 'B', 'G', 'G', 'Y', 'Y', 'R', 'R', 'B', 'B', 'G'],
    ['B', 'B', 'G', 'G', 'R', 'R', 'Y', 'Y', 'B', 'B', 'G', 'G', 'R', 'R', 'Y'],
    ['B', 'G', 'G', 'R', 'R', 'Y', 'Y', 'B', 'B', 'R', 'R', 'Y', 'Y', 'G', 'R'],
    

];

//pastel color map for the respective initials
const colorMap = {
     'R': '#FFB3BA',
     'G': '#BFFCC6',
     'B': '#B3C6FF',
     'Y': '#FFFFBA'
};

const colors = Object.values(colorMap);

//Game variables
const bubbleGap = 1;
const wallSize = 4;
const bubbles = [];
let particles = [];
let score = 0;
let gameOver = false;
let gameWon = false;
let showTutorial = true;

//Math functions
function degToRad(deg) {
    return (deg * Math.PI) / 180;
}

function rotatePoint(x, y, angle) {
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);

    return {
        x: x * cos - y * sin, 
        y: x * sin + y * cos
    };
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDistance(obj1, obj2) {
    const distX = obj1.x - obj2.x;
    const distY = obj1.y - obj2.y;
    return Math.sqrt(distX * distX + distY * distY);
} 

function collides(obj1, obj2) {
    
    return getDistance(obj1, obj2) < obj1.radius + obj2.radius;
}

//Find closest bubble for colllision purposes
function getClosestBubble(obj, activeState = false) {
    const closestBubbles = bubbles
        .filter(bubble => bubble.active == activeState && collides(obj, bubble));

        if (!closestBubbles.length) {
            return;
        }

        return closestBubbles
            .map(bubble => {
                return {
                    distance: getDistance(obj, bubble), 
                    bubble
                }
            })
            .sort((a,b) => a.distance - b.distance)[0].bubble;  
}

//Creates and places a bubble in the grid
function createBubble(x, y, color) {
    const row = Math.floor(y / grid);
    const col = Math.floor(x / grid);

    const startX = row % 2 === 0 ? 0 : 0.5 * grid;

    const center = grid / 2;

    bubbles.push({
        x: wallSize + (grid + bubbleGap) * col + startX + center, 
        y: wallSize + (grid + bubbleGap - 4) * row + center, 

        radius: grid / 2,
        color: color, 
        active: color ? true : false 
    });

}

// Gets neighboring bubbles
function getNeighbors(bubble) {
    const neighbors = [];

    const dirs = [

        rotatePoint(grid, 0, 0),
        rotatePoint(grid, 0, degToRad(60)), 
        rotatePoint(grid, 0, degToRad(120)), 
        rotatePoint(grid, 0, degToRad(180)),
        rotatePoint(grid, 0, degToRad(240)), 
        rotatePoint(grid, 0, degToRad(300))  
    ];

    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];

        const newBubble = {
            x: bubble.x + dir.x, 
            y: bubble.y + dir.y, 
            radius: bubble.radius 
        };

        const neighbor = getClosestBubble(newBubble, true);
        if (neighbor && neighbor !== bubble && !neighbors.includes(neighbor)) {
             neighbors.push(neighbor);
        }
           
    }

     return neighbors;
   
}

     
//Remove matching bubbles (3+ of same color)
function removeMatch(targetBubble){
    const matches = [targetBubble];

    bubbles.forEach(bubble => bubble.processed = false);
    targetBubble.processed = true;

    let neighbors = getNeighbors(targetBubble);
    for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];

        if (!neighbor. processed) {
            neighbor.processed = true;

            if (neighbor.color === targetBubble.color) {
                matches.push(neighbor);
                neighbors = neighbors.concat(getNeighbors(neighbor));
            }
        }
    } 


    if (matches.length >= 3) {
        score += matches.length * 10;
        matches.forEach(bubble => {
            bubble.active = false;
        });
    }
} 

//Drops any disconnected bubbles
function dropFloatingBubbles() {
    const activeBubbles = bubbles.filter(bubble => bubble.active);
    activeBubbles.forEach(bubble => bubble.processed = false);

    let neighbors = activeBubbles
        .filter(bubble => bubble.y - grid <= wallSize);

    for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];

        if (!neighbor.processed) {
            neighbor.processed = true; 
            neighbors = neighbors.concat(getNeighbors(neighbor));
        }
    }

    activeBubbles
        .filter(bubble => !bubble.processed)
        .forEach(bubble => {
            bubble.active = false;

            particles.push({
                x: bubble.x, 
                y: bubble.y,
                color: bubble.color,
                radius: bubble.radius, 
                active: true 
            });
        });

        const remaining = bubbles.filter(b => b.active);
        if (remaining.length === 0) {
            gameWon = true;
            gameOver = true;
        }
}

//Initialize grid bubbles
for (let row = 0; row < 10; row++) {
    for (let col = 0; col < (row % 2 === 0 ? 15 : 14); col++){
        const color = level1 [row]?. [col];
        createBubble(col * grid, row * grid, colorMap[color]);  
    }
}

//Current bubble setup (the shooting bubble)
const curBubblePos = {
    x: canvas.width / 2, 
    y: canvas.height - grid * 1.5

};
const curBubble = {
    x: curBubblePos.x, 
    y: curBubblePos.y, 
    color: 'red', 
    radius: grid / 2, 
    speed: 8, 
    dx: 0, 
    dy:0 

};

//Shooting angle controls
let shootDeg = 0;
const minDeg = degToRad(-60);
const maxDeg = degToRad(60);
let shootDir = 0;


//Generates a new bubble to shoot
function getNewBubble() {
    curBubble.x = curBubblePos.x;
    curBubble.y = curBubblePos.y;
    curBubble.dx = curBubble.dy = 0;

    const activeColors = [...new Set(bubbles.filter(b => b.active).map(b => b.color))];

    if (activeColors.length === 0) {
        gameOver = true;
        gameWon = true;
        return;

    }

    const randInt = getRandomInt(0, activeColors.length -1);
    curBubble.color = activeColors[randInt];
}


//Handles collisions when a bubble hits another
function handleCollision(bubble) {
    bubble.color = curBubble.color;
    bubble.active = true;
    removeMatch(bubble);
    dropFloatingBubbles();

    if (!gameOver) {
        getNewBubble();
    }
    
}

//Main animation loop
function loop() {
    requestAnimationFrame(loop);
    context.clearRect(0,0,canvas.width,canvas.height);

    if (showTutorial) {
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        //Show tutorial screen
        if (showTutorial) {
            context.fillStyle = 'black';
            context.font = '24px Arial';
            context.textAlign = 'center';
    
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            context.fillText('Bubble Shooter Tutorial', centerX, centerY - 100);
            context.font = '18px Arial'
            context.fillText('Use ← and → arrows to aim', centerX, centerY - 50);
            context.fillText('Press SPACE to shoot', centerX, centerY - 20);
            context.fillText('Match 3 or more bubbles to clear them', centerX, centerY + 10);
            context.fillText('Clear all bubbles to win!', centerX, centerY + 40);
            context.fillText('Press ENTER to start', centerX, centerY + 90);

            return;
        }
    }

    //Game over screen 
    if (gameOver) {
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'white';
        context.font = '32px Arial';
        context.textAlign = 'center';
        context.fillText(gameWon ? 'You Win!' : 'Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        context.font = '24px Arial';
        context.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
        context.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 60);
        
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.textAlign = 'left';
        context.fillText('Score: ' + score, 10, canvas.height - 10);
        return;
       
    }

    //Aiming logic
    shootDeg = shootDeg + degToRad(2) * shootDir;

    if (shootDeg < minDeg) {
        shootDeg = minDeg;
    }

    else if (shootDeg > maxDeg) {
        shootDeg = maxDeg
    }

    //Moves the current bubble (shooting bubble)
    curBubble.x += curBubble.dx;
    curBubble.y += curBubble.dy;

    if (curBubble.x - grid / 2 < wallSize) {
        curBubble.x = wallSize + grid / 2;
        curBubble.dx *= -1;
    }

    //Checks if the  bubbles hits the right wall and bounce it back
    else if (curBubble.x + grid / 2 > canvas.width - wallSize) {
        curBubble.x = canvas.width - wallSize - grid / 2;
        curBubble.dx *= -1;
    }
    
    //Handles collsion if the bubble hits the top wall(ceiling)
    if (curBubble. y - grid / 2 < wallSize) {
        const closestBubble = getClosestBubble(curBubble);
        handleCollision(closestBubble);
    }

    //Cheeck for collision with any existing bubbles
    for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i];

        if (bubble.active && collides(curBubble, bubble)) {
            const closestBubble = getClosestBubble(curBubble);
            if (!closestBubble) {
                window. alert('Game Over');
                window.location.reload(); 
            }
             if (closestBubble) {
                handleCollision(closestBubble);
             }
        }
    }

    //Animate falling particles
    particles.forEach(particle => {
        particle.y += 8;
    });

    particles = particles.filter(particles => particles.y < canvas.height - grid / 2); 

    //Draws the live score counter   
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.textAlign = 'left';
    context.fillText('Score: ' + score, 10, canvas.height - 10);

    //Draws the walls
    context.fillStyle = 'lightgrey';
    context.fillRect(0, 0, canvas.width, wallSize);
    context.fillRect(0, 0, wallSize, canvas.height);
    context.fillRect(canvas.width - wallSize, 0, wallSize, canvas.height);

    //Draws alll bubbles
    bubbles.concat(particles).forEach(bubble => {
        if (!bubble.active) return;
        context.fillStyle = bubble.color;

        context.beginPath();
        context.arc(bubble.x, bubble.y, bubble.radius, 0, 2 * Math.PI);
        context.fill();
    });

    //Draw aiming arrow
    context.save();

    context.translate(curBubblePos.x, curBubblePos.y);
    context.rotate(shootDeg);

    context.translate(0, -grid / 2 * 4.5);

    context.strokeStyle = 'white';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, grid * 2);
    context.moveTo(0, 0);
    context.lineTo(-10, grid * 0.4);
    context.moveTo(0, 0);
    context.lineTo(10, grid * 0.4);
    context.stroke();

    context.restore();

    //Draw current bubble
    context.fillStyle = curBubble.color;
    context.beginPath();
    context.arc(curBubble.x, curBubble.y, curBubble.radius, 0, 2 * Math.PI);
    context.fill();

}

//Handles keyboard controls
document.addEventListener( 'keydown', (e) => {

    if (showTutorial && (e.code === 'Enter')) {
        showTutorial = false;
        getNewBubble();
    }

    if (e.code === 'ArrowLeft') {
        shootDir = -1;
    }
    else if (e.code === 'ArrowRight') {
        shootDir = 1;
    }

    if (e.code === 'Space' && curBubble.dx === 0 && curBubble.dy === 0) {
        curBubble.dx = Math.sin(shootDeg) * curBubble.speed;
        curBubble.dy = -Math.cos(shootDeg) * curBubble.speed;
    }

    if (e.code === 'KeyR' && gameOver) {
        window.location.reload();
    }
});

document.addEventListener('keyup', (e) => {
    if (
        (e.code === 'ArrowLeft' && shootDir === -1) ||
        (e.code === 'ArrowRight' && shootDir === 1)
    ) {
        shootDir = 0;
    }
});

//Start game
getNewBubble();
requestAnimationFrame(loop); 
