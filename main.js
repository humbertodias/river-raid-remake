// CONVENIENCE

Array.prototype.choose = function () { return this[Math.floor(this.length * random())] }
// rudimentary vector math
function absVec(v) {
    return (Math.sqrt(v.x * v.x + v.y * v.y));
}
function normalizeVec(v) {
    mag = absVec(v);
    return { x: v.x / mag, y: v.y / mag };
}
function addVec(v1, v2) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
}
function subVec(v1, v2) {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
}
function mulVec(v, a) {
    return { x: v.x * a, y: v.y * a };
}
// easing
function easeStart(t){
    return t * t * t;
}

function easeEnd(t){
    t = t - 1;
    t = t * t * t + 1;
    return t;
}

// INIT
window.onload = function () {                                                   
    canvas = document.getElementById("canvas");    //get reference to the canvas and drawing context
    ctx = canvas.getContext("2d");                                                   // terrain quantization and scalling
    unitCount = 8;                                          //  units per half canvas
    unit = (canvas.width / 2.0) / unitCount;                // size of one unit in pixels

    // player setup
    player.w = unit * .48;
    player.h = unit * .6;
    player.img = img["player"];
    player.sscale = .53; // scale sprite in respect to bbox
    player.strans = { x: 0, y: .2*unit };

    timeLast = time = (new Date()).getTime() / 1000.0; // init timer vars

    // keyboard event handlers
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    setInterval(frame, 1/60.0);     // setup main loop
    titleScreen(); // init game state

    window.audioContext = new AudioContext();

}

// DRAWING CONTEXT
var canvas;
var ctx;
var unitCount;
var unit;

// LOAD GRAPHICS
var imgSources = {
    player: "player.png", heli: "heli.png", heli_b: "heli_b.png", ship: "ship.png", ship_b: "ship_b.png", jet: "jet2.png", jet_b: "jet2_b.png", fuel: "fuel.png", fuel_b: "fuel_b.png",
    building: "building.png", building2: "building2.png", building3: "building3.png", building4: "building4.png", building5: "building5.png",
    tank: "tank.png", tank_b: "tank_b.png",
    tree1: "tree1.png", tree2: "tree2.png", tree3: "tree3.png", tree4: "tree4.png", tree5: "tree5.png", tree6: "tree6.png", tree7: "tree7.png",
    tree8: "tree8.png", tree9: "tree9.png", tree10: "tree10.png", tree11: "tree11.png", tree12: "tree12.png", tree13: "tree13.png", tree14: "tree14.png",
    ao_sea_tile_vert: "ao_sea_tile_vert.png",
    ao_sea_tile_slope: "ao_sea_tile_slope.png",
    ao_sea_tile_slope_inner: "ao_sea_tile_slope_inner.png",
    ao_sea_tile_slope_outter: "ao_sea_tile_slope_outter.png",
    ao_sea_tile_slope_outter2: "ao_sea_tile_slope_outter2.png",
    ao_sea_tile_back1: "ao_sea_tile_back1.png",
    ao_sea_tile_back2: "ao_sea_tile_back2.png",
    ao_sea_tile_island_start: "ao_sea_tile_island_start.png",
    ao_sea_tile_island_start2: "ao_sea_tile_island_start2.png",
    bridge_shadow: "bridge_shadow.png",
    ripple: "ripple.png",
    shockwave: "shockwave.png",
    fuel_gauge: "fuel_gauge.png",
    fuel_gauge_tip: "fuel_gauge_tip.png",
    logo: "logo.png",
    player_trail: "player_trail.png",
    canal1: "canal1.png", canal2: "canal2.png", canal3: "canal3.png", canal4: "canal4.png", canal5: "canal5.png",
    bridge_c: "bridge_construction.png", bridge_c2: "bridge_construction2.png"
};
for (var i = 1; i <= 7; ++i) {
    imgSources["player" + i] = "player" + i + ".png";
}

var img = [];
for (i in imgSources) {
    img[i] = new Image();
    img[i].src = "img/" + imgSources[i];
}

// GAME SETTINGS
var slope = 0.3639702342; // 20 degrees
var islandLen = { min: 3, max: 30 }; // { min: 5, max: 20 };
var islandInterval = { min: 2, max: 70 }; // { min: 35, max: 70 };
var bridgeInterval = { min: 100, max: 170 };
var spriteInterval = { firstBridge: 2, lastBridge: 1.3 };
var sceneryInterval = { min: .2, max: .6 };
var waterColor = ["#6C90Cd", "#7a8b5d", "#668d97", "#ab9271", "#aa5555"] 
var landColors = [/*"#886644"*/ "#566D32", "#285838", "#cccccc", "#73543f", "#252525"];
var bulletVel = 900.0;
var fuelRate = { consumption: .03, intake: .7 };
var scrollSpeed = { min: 130, max: 440, optimal: 255, current: 270, accel: 300 };
var extraLifeEvery = 50000;
var finalBridge = 25;


var spriteTypes = {
    "ship": { vel: [100, 130], move: [.5, 1.5], size: [1.6, .5], strans: { x: -.1, y: .1 }, sscale: .008, score: 50, boxExtensionFront: .35 }, // move: [probability, maxdelay]
    "heli": { vel: [130, 160], move: [.7, 1.9], size: [1.4, .6], strans: { x: -.1, y: .3 }, sscale: .0046, score: 75 },
    "jet": { vel: [280, 320], move: [1, .7], size: [1.5, .45], strans: { x: .4, y: 0 }, sscale: .0061, score: 100 },
    "fuel": { vel: [0.0], move: [0, 0], size: [.8, 1.4], strans: { x: 0, y: .2 }, sscale: .01, score: 150 },
    "tank": { vel: [100, 230], move: [0, 0], size: [1.9, .7], strans: { x: 0, y: 0 }, sscale: .0095, score: 1000 }
};

var sceneryTypes = {
    "building": { size: [2.5, 1.0], strans: { x: 0, y: 0 }, sscale: .007, score: 150 },
    "building2": { size: [2.2, 1.5], strans: { x: 0, y: 0 }, sscale: .0096, score: 150 },
    "building3": { size: [2.5, 1.0], strans: { x: 0, y: 0 }, sscale: .007, score: 150 },
    "building4": { size: [2.7, 1.0], strans: { x: 0, y: 0 }, sscale: .009, score: 150 },
    "building5": { size: [2.5, 1.5], strans: { x: 0, y: -.6 }, sscale: .008, score: 150 },
    "tree1": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree2": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree3": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree4": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree5": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree6": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree7": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree8": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree9": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree10": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .011, score: 10 },
    "tree11": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree12": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree13": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "tree14": { size: [.8, .55], strans: { x: 0, y: -.1 }, sscale: .014, score: 10 },
    "canal1": { size: [.7 * 344 / 64, .7 * 180 / 64], strans: { x: .02, y: -.1 }, sscale: .7 * 1 / 64, score: 0, indestructible: true },
    "canal2": { size: [.7 * 344 / 64, .7 * 180 / 64], strans: { x: .02, y: -.1 }, sscale: .7 * 1 / 64, score: 0, indestructible: true },
    "canal3": { size: [.7 * 344 / 64, .7 * 180 / 64], strans: { x: .02, y: -.1 }, sscale: .7 * 1 / 64, score: 0, indestructible: true },
    "canal4": { size: [.7 * 344 / 64, .7 * 180 / 64], strans: { x: .02, y: -.1 }, sscale: .7 * 1 / 64, score: 0, indestructible: true },
    "canal5": { size: [.7 * 344 / 64, .7 * 180 / 64], strans: { x: .02, y: -.1 }, sscale: .7 * 1 / 64, score: 0, indestructible: true },
    "bridge_c": { size: [1 * 700 / 64, 1 * 159 / 64], strans: { x: .02, y: -.1 }, sscale: 1 * 1 / 64, score: 0, bridgePart: true },
    "bridge_c2": { size: [1 * 700 / 64, 1 * 159 / 64], strans: { x: .02, y: -.1 }, sscale: 1 * 1 / 64, score: 0, bridgePart: true },
};

// GAME STATE
var debug = false;
var playing = false;
var gameover = 0;
var gamewin = 0;
var title = true;
var paused = false;
// time
var time = 0.0;
var timeLast = 0.0;
// scroll
var scroll = 0.0;
// terrain
var bank = []
var island = []
var nextIslandAt = islandInterval.min;
// player
var player = { x: 0, y: 0, w: 10, h: 10, velx: 300.0, roll:0, dyingTime:0 };
var bullets = [];
// bridge
var bridge = null;
var bridgeCount = 0;
var nextBridgeAt;
// sprites
var sprites = [];
var nextSpriteAt;
var explosions = [];
// scenery
var scenery = [];
var nextSceneryAt;
// ripples
var ripples = [];
// score
var score;
var scorePopups = [];
// cam shake
var shake = { time: 0, dur: 0, ampli: 25};
// message
var messageTime, mesageDur, message;
var introMessageTime;
// title
titleScroll = 0;

// HELPER FUNCTIONS

// random integer in range [lo, hi]
function randint(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

// seeded random numner generator used for explosions (not my code)
var rand_w = 123456789;
var rand_z = 987654321;
function seed(i) { rand_w = (123456789 + i) & 0xffffffff; rand_z = (987654321 - i) & 0xffffffff; }
function random() {
    rand_z = (36969 * (rand_z & 65535) + (rand_z >> 16)) & 0xffffffff;
    rand_w = (18000 * (rand_w & 65535) + (rand_w >> 16)) & 0xffffffff;
    return (((rand_z << 16) + (rand_w & 65535)) >>> 0) / 4294967296;
}

// add section to bank/island
function addSection(bank, width, length) {
    var pointCurrent = bank[bank.length - 1];
    var pointNew = { x: width, y: pointCurrent.y - length };
    var dy = Math.abs(pointNew.x - pointCurrent.x) * slope; // tan slope
    bank.push({ x: pointNew.x, y: pointCurrent.y - dy }); // slope to vertical section
    if(length!=0) bank.push({ x: pointNew.x, y: pointNew.y - dy }); // vertical section
}

// width of bank at given y coordinate
function bankWidth(bank, y, fakeElevation ) {
    fakeElevation = typeof fakeElevation == 'undefined' ? 0 : fakeElevation;
    for (var i = 0; i < bank.length - 1; ++i) {
        var a = Object.assign({},bank[i]);
        var b = Object.assign({}, bank[i + 1]);

        // handle fake elevation
        if (fakeElevation > 0) {
            if (b.x > a.x) {
                b.y -= fakeElevation;
                a.y -= fakeElevation;
            }
            else {
                var inext = i + 2;
                var iprev = i - 1;
                if (inext < bank.length) {
                    if (b.x < bank[inext].x) b.y -= fakeElevation;
                }
                if (iprev >= 0) {
                    if (a.x > bank[iprev].x) a.y -= fakeElevation;
                }
            }
        }
        if (y <= a.y && y >= b.y) 
            if (a.x == b.x)
                return a.x;
            else
                return (a.x >= b.x) ? (a.x + (y - a.y) / slope) : (a.x - (y - a.y) / slope);
    }
    return 0;
}

// river/land bounds at given y coordinate
function terrainBounds(y, fakeElevation) {
    fakeElevation = typeof fakeElevation == 'undefined' ? 0 : fakeElevation;
    var infinity = 100000;
    var wBank = bankWidth(bank, y, fakeElevation);
    var wIsland = bankWidth(island, y, fakeElevation);
    var bounds = [-infinity, wBank, canvas.width - wBank, infinity ];
    if (wIsland) {
        bounds.splice(2, 0, canvas.width / 2 - wIsland);
        bounds.splice(3, 0, canvas.width / 2 + wIsland);
    }
    return bounds;
}

// check whether a point is on land or in water
function pointTerrainType(x, y, fakeElevation) { // returns 0 if on water, 1 if on land
    fakeElevation = typeof fakeElevation == 'undefined' ? 0 : fakeElevation;
    var bounds = terrainBounds(y, fakeElevation);
    var status = false;
    while (x > bounds.shift()) status = !status;
    return status ? 1 : 0;
}

// check if box is fully on land or in water
function boxHitTerrain(x, y, w, h, terrainType, fakeElevation) { // terrainType: 0=water, 1=land
    fakeElevation = typeof fakeElevation == 'undefined' ? 0 : fakeElevation;
    var bounds = terrainBounds(y-h/2, fakeElevation);
    for(var bx of bounds) {
        if (bx > x - w / 2  && bx < x + w / 2 ) return true;      
    }
    var bounds = terrainBounds(y + h / 2);
    for (var bx of bounds) {
        if (bx > x - w / 2 && bx < x + w / 2) return true;    
    }
    for (var i = -w / 2; i <= w / 2; i += w) {
        for (var j = -h/2; j <= h/2; j += h) {
            if (pointTerrainType(x+i, y+j, fakeElevation) == terrainType) return true;
        }
    }
  
    return false;
}

// returns offset to translate point horizontally to nearest wanted terrain type, towards wanted side
function resolvePointTerrain(x, y, wantedTerrain, wantedSide, fakeElevation) { // wantedStatus: 0=put on water, 1=put on land; wantedSide: -1=to left, 1=to right
    fakeElevation = typeof fakeElevation == 'undefined' ? 0 : fakeElevation;
    var bounds = terrainBounds(y, fakeElevation);
    var i = 0;
    var status = false;
    while (x > bounds[i++])
        status = (!status) ? 1 : 0;
    return (status == wantedTerrain) ? 0 :  bounds[i-1 + (wantedSide - 1) / 2] -x;
}

// returns offset to move box horizontally to be fully on wanted terrain type (shortest distance)
function resolveBoxTerrain(x, y, w, h, wantedTerrain, fakeElevation) {
    fakeElevation = typeof fakeElevation == 'undefined' ? 0 : fakeElevation;
    var d1 = resolvePointTerrain(x + w / 2, y - w / 2, wantedTerrain, -1, fakeElevation);
    var d2 = resolvePointTerrain(x + w / 2, y + w / 2, wantedTerrain, -1, fakeElevation);
    var dleft = (Math.abs(d1) > Math.abs(d2)) ? d1 : d2;
    var d3 = resolvePointTerrain(x - w / 2, y - w / 2, wantedTerrain, 1, fakeElevation);
    var d4 = resolvePointTerrain(x - w / 2, y + w / 2, wantedTerrain, 1, fakeElevation);
    var dright = (Math.abs(d3) > Math.abs(d4)) ? d3 : d4;
    if (dright == 0)
        return dleft;
    else if (dleft == 0)
        return dright;
    else
        return(Math.abs(dleft) > Math.abs(dright)) ? dright : dleft;
}

// box/box collision
function boxHit(center1x, center1y, width1, height1, center2x, center2y, width2, height2){
    if (center1x + width1 / 2.0 < center2x - width2 / 2.0) return false;
    if (center1x - width1 / 2.0 > center2x + width2 / 2.0) return false;
    if (center1y + height1 / 2.0 < center2y - height2 / 2.0) return false;
    if (center1y - height1 / 2.0 > center2y + height2 / 2.0) return false;
    return true;
}

function addScenery(name, ix, iy, resolve, flip, marginMin) {
    marginMin = typeof marginMin == 'undefined' ? .2 : marginMin;
    resolve = typeof resolve == 'undefined' ? true : resolve;
    flip = typeof flip == 'undefined' ? false : flip;
    var type = sceneryTypes[name];
    var s = {
        name: name,
        x: ix, y: iy, w: type.size[0] * unit, h: type.size[1] * unit,
        img: img[name],
        sscale: type.sscale * unit,
        strans: { x: type.strans.x * unit, y: type.strans.y * unit },
        score: type.score
    };
    if (type.indestructible) s.indestructible = true;
    if (type.bridgePart) s.bridgePart = true;
    if (flip) s.flip = true;
    s.y -= s.h / 2;
    // constrain to land
    s.xorig = s.x;
    var r = 0;
    var ok = true;
    if (resolve) {
        r = resolveBoxTerrain(s.x, s.y, s.w, s.h, 1, unit);
        s.x += r + Math.sign(r) * unit * (marginMin + Math.random() * .4); // add margin
        ok = !boxHitTerrain(s.x, s.y, s.w, s.h, 0, unit);  // one last check to eliminate misbehaving placement
    }
    if (ok) {
        scenery.push(s);
        return -s.y + s.h / 2.0;
    }
    else return -iy;
}

function addSprite(name, x, y) {
   
    type = spriteTypes[name];

    var s = {
        x: x, y: y,
        name:name,
        w: type.size[0] * unit, h: type.size[1] * unit,
        vel: randint(type.vel[0], type.vel[1]) * Math.sign((Math.random() - .5)),
        moveTime: (Math.random() < type.move[0]) ? Math.random() * type.move[1] : 100000,
        img: img[name],
        sscale: type.sscale * unit,
        strans: { x: type.strans.x * unit, y: type.strans.y * unit },
        score: type.score,
        seed: Math.random() * 10000
    }
    if (type.boxExtensionFront) s.boxExtensionFront = type.boxExtensionFront * unit;

    if (s.name == "jet") {
        s.x = (s.vel > 0) ? -s.w/2 : canvas.width+s.w/2;
    }
    else if (s.name == "tank") {

    }
    else {
        s.xorig = s.x; // debug;
        var r = resolveBoxTerrain(s.x, s.y, s.w, s.h, 0, unit * .5);
        s.x += r + Math.sign(r) * unit * .2;
    }

    if (s.name == "jet" || s.name =="tank" || !boxHitTerrain(s.x, s.y, s.w, s.h, 1, unit * .5)) { // one last check to eliminate misbehaving placement
        sprites.push(s);
    }

    return s;

}

// start game
function startGame() {
    score = 0;
    bridgeCount = 0;
    playing = true;
    player.lives = 3;
    gameover = false;
    message = null;
    title = false;
    introMessageTime = .001;
    player.invulnerable = false;
    startLife();
    music.play();
}

function endGame() {
    playing = false;
}

function startLife() {
    scroll = 0.0;
    scrollSpeed.current = scrollSpeed.optimal;
    player.x = canvas.width / 2.0;
    player.y = canvas.height - 64 - player.h;
    player.roll = 0;
    player.dyingTime = 0;
    player.fuel = 1;
    player.dead = false;
    if (bridge) if (!bridge.destroyed) bridgeCount--;
    if (title) bridgeCount = 0;
    bridge = null;
    nextBridgeAt = bridgeInterval.min * unit;
    nextIslandAt = islandInterval.max * unit;
    nextSpriteAt = spriteInterval.firstBridge * unit;
    nextSceneryAt = sceneryInterval.min * unit;
    sprites = [];
    explosions = [];
    scenery = [];
    bullets = [];
    bank = [];
    island = [];
    ripples = [];
    scorePopups = [];
    shake.time = 0;
    shake.dur = 0;
    fireDelay = 0;
    if (!title) showMessage("GET READY", 2);
    paused = false;


    try{
        let highScore = localStorage.getItem("highScore");
        if(score > highScore)
        localStorage.setItem("highScore", score);
    }catch(e){
    }

}

function titleScreen() {
    gameover = false;
    gamewin = 0;
    introMessageTime = 0;
    title = true;
    startLife();
    titleScroll = canvas.width ;
}

function playerDie() {
    if (player.invulnerable) return;
    if (player.dead && title) return;
    player.lives--; 
    player.dyingTime = 1.3;
    explosions.push({ x: player.x, y: player.y, w: player.w + 1 * unit, h: player.h + 1 * unit, dur: 1 });
    player.dead = true
    playSound("death");
    playSound("ex8");
    if (player.lives == 0) {
        gameover = .1;
        showMessage("GAME OVER", 100000);
        music.pause()
    }
}

function destroyBridge() {
    var ex = { x: canvas.width / 2, y: bridge.y, w: bridge.w + 2 * unit, h: bridge.h + unit, dur: 2, spread:2 }
    explosions.push(ex);
    bridge.explosion = ex;
    bridge.destroyed = true;
    shake.dur = shake.time = .7;
    score += bridge.score;
    for (var s of sprites) {
        if (s.name == "tank") {
             s.moveTime = 100000;
            if (boxHit(bridge.x, bridge.y, bridge.w, bridge.h, s.x, s.y, s.w, s.h)) {
                destroySprite(s);
            }
        }
        else {
            s.selfDestructTime = Math.random() * .3;
        }
    }
    for (var s of scenery) {
        if ( (Math.random() < .7 && !s.indestructible) || s.bridgePart)
            s.selfDestructTime = Math.random() * 1.5;
    }

    scorePopups.push({ x: bridge.x, y: bridge.y, score: bridge.score, dur: (bridge.major? 2.2: 1.5), size: (bridge.major? 60: 48) });
    //playSound("ex6");
    playSound("ex9");
}

function destroySprite(s) {
    s.dead = true;
    var explosionSizeExtra = unit * .5;
    var explosionDur = .6;
    var explosionSpread = .5;
    if (s.name == "fuel") {
        explosionSizeExtra += unit;
        explosionDur = 1;
        explosionSpread = 1.5;
    }
    e = { x: s.x, y: s.y, w: s.w + explosionSizeExtra, h: s.h + explosionSizeExtra, dur: explosionDur, spread:explosionSpread };
    explosions.push(e);
    score += s.score;
    // if hit fuel, explode stuff in vicinity
    if (s.name == "fuel") {
        e.shockwaveRadius = unit * 5;
        for (var se of sprites) {
            if (se.name != "tank") {
                var dist = absVec(subVec(se, s));
                if (dist <= e.shockwaveRadius) se.selfDestructTime = .3 * dist / e.shockwaveRadius;
            }
        }
        for (var se of scenery) {
            if (se.indestructible || se.bridgePart) continue;
            var dist = absVec(subVec(se, s));
            if (dist <= e.shockwaveRadius) se.selfDestructTime = .3 * dist / e.shockwaveRadius;
        }
        playSound("ex5");
    }
    else {
        playSound("ex4");
    }
    // add ripple
    ripples.push({ x: s.x, y: s.y, size: (.5 + Math.random() * 1.4) * unit, vel: 140, dur: 3, time: 0 });
    // add score popup
    var popupSize = 32;
    if (s.name == "tank") popupSize = 48;
    scorePopups.push({ x: s.x, y: s.y, score: s.score, dur: 1, size: popupSize });
    

}

function destroyScenery(s) {
    s.dead = true;
    score += s.score;
    var sizeVary = Math.random() * .5;
    var e = { x: s.x, y: s.y, w: s.w + unit * (.3 + sizeVary), h: s.h + unit * (.3 + sizeVary), dur: 1.6 };
    if (s.bridgePart) {
        e.spread = 3; e.dur = 2.2;
    }
    explosions.push(e);
    // add score popup
    scorePopups.push({ x: s.x, y: s.y, score: s.score, dur: 1, size: 32 });
   // playSound("ex7");
    if (s.name.substr(0,4) == "tree") {
        //playSound("melt");
        playSound("ex8");
    }
    else if (s.bridgePart) {
        playSound("ex10");
    }
    else {
        playSound("ex8");
    }
}

// DRAWING FUNCTIONS

// draw bank
function drawBank(bank, sideOffset = 0) {
    //sideOffset = sideOffset == 'undefined'? 0 :sideOffset;
    if (bank.length > 1) {
        ctx.strokeStyle = "#000000";
        ctx.beginPath();

        restoreFirstPoint = null;
        if (bank[0].x == 0) {
            // handle start of island
            restoreFirstPoint = bank[0];
            var offset = unit * .5;
            //if (bank[1].x < unit * 2) offset = unit * .01;
            bank.splice(0, 1, { x: restoreFirstPoint.x, y: restoreFirstPoint.y - offset *slope })
            bank.splice(1, 0, { x: restoreFirstPoint.x + offset, y: restoreFirstPoint.y - offset * slope })
        }
        restoreLastPoint = null;
        if (bank[bank.length - 1].x == 0) {
            // handle end of island
            restoreLastPoint = bank.pop();
            var offset = unit*.5;
            //offset = (bank[bank.length - 2].x < unit * 2) offset = unit * .01;
            bank.push({ x: restoreLastPoint.x + offset, y: restoreLastPoint.y + offset * slope });
            bank.push({ x: restoreLastPoint.x, y: restoreLastPoint.y + offset * slope });
        }
        ctx.moveTo(-sideOffset, Math.max(bank[0].y, canvas.height - scroll + sideOffset));
        ctx.lineTo(bank[0].x, bank[0].y);

        if (bank.length > 2) {
            for (i = 0; i < bank.length - 2; ++i) {
                var a =  bank[i];
                var b = bank[i + 1];
                var c =  bank[i + 2];
                // fake elevation
                //if ((a.x == b.x && c.x > b.x) || (a.x < b.x && b.x == c.x)) { a.y -= fakeElevation; b.y -= fakeElevation; c.y -= fakeElevation; }
                var ab = subVec(b, a);
                var cb = subVec(b, c);
                var abAbs = absVec(ab);
                var cbAbs = absVec(cb);
                var n1 = normalizeVec(ab);
                var n2 = normalizeVec(cb);
                var offset = Math.min(abAbs/2, cbAbs/2, unit * .5);
                var p1 = addVec(a, mulVec(n1, abAbs - offset));
                var p2 = addVec(c, mulVec(n2, cbAbs - offset));

                ctx.lineTo(p1.x, p1.y);
                ctx.quadraticCurveTo(b.x, b.y, p2.x, p2.y);
                //ctx.lineTo(p1.x, p1.y);
                //ctx.lineTo(p2.x, p2.y);
            }
            // ctx.lineTo(bank[i].x, bank[i].y);
        }
        ctx.lineTo(bank[bank.length - 1].x, bank[bank.length-1].y);
        ctx.lineTo(-sideOffset, Math.max(bank[bank.length-1].y, -scroll - sideOffset));

        ctx.closePath();
        ctx.fill();
        if (restoreFirstPoint) {
            bank.shift();
            bank.splice(0, 1, restoreFirstPoint);
        }
        if (restoreLastPoint) {
            bank.pop();
            bank.pop();
            bank.push(restoreLastPoint);
        }
    }

}

// draw all of land
function drawLand() {
    drawBank(bank, shake.ampli);  // draw left bank
    ctx.transform(-1, 0, 0, 1, canvas.width, 0);
    drawBank(bank, shake.ampli); // draw right bank
    ctx.translate(canvas.width / 2, 0.0);
    drawBank(island) // draw right island
    ctx.scale(-1, 1);
    drawBank(island) // draw left island
    ctx.translate(-canvas.width / 2, 0.0);
}

// draw ao
function drawAo(bank) {
    var image;
    var imageRatio;
    var ymin, ymax;

    ybounds = [] // vertical bounds for each corner point tile
    if (bank.length) {
        ybounds.push([bank[0].y, bank[0].y]);
        // handle island start
        if (bank[0].x == 0) {
            var a = bank[0];
            if (bank[1].x > unit) {
                image = img["ao_sea_tile_island_start"];
                imageRatio = image.height / image.width;
                ymin = a.y - unit * 1.4;
                ymax = ymin + unit * 2;
                ctx.drawImage(image, a.x, ymin, unit * 2 / imageRatio, ymax - ymin);
            }
            else {
                image = img["ao_sea_tile_island_start2"];
                imageRatio = image.height / image.width;
                ymin = a.y - unit * 1.65;
                ymax = ymin + unit * 2.4;
                ctx.drawImage(image, a.x, ymin, (ymax - ymin) / imageRatio, ymax - ymin);
            }
            ybounds = [[ymin, ymax]];
        }
    }

    for (var i = 1; i < bank.length-1; ++i) {
        var a = bank[i - 1];
        var b = bank[i];
        var c = bank[i + 1]

        // corner tiles
        // from vertical
        if (b.x == a.x) {
            // from vertical to right
            if (c.x > b.x) {
                if (c.x - b.x > unit+.1) {  // regular from vertical to right right is more than one unit wide
                    image = img["ao_sea_tile_slope_inner"]
                    imageRatio = image.height / image.width;
                    ymin = b.y - unit * .4 - 62;
                    ymax = ymin + unit * 2;
                    ctx.drawImage(image, b.x, ymin, unit, ymax - ymin);
                }
                else { // special case: from vertical to right that is one unit wide
                    image = img["ao_sea_tile_slope_outter2"];
                    imageRatio = image.height / image.width;
                    ymin = b.y - unit * 1.700;
                    ymax = ymin + unit * 2;
                    ctx.drawImage(image, b.x, ymin, unit * 2 / imageRatio, ymax - ymin);
                }
            }
            // from vertical to left
            if (c.x < b.x) {
                image = img["ao_sea_tile_back1"];
                imageRatio = image.height / image.width;
                // handle special case 
                if (a.y - b.y > unit * 2) {
                    ymin = b.y - 20
                    ymax = ymin + unit * imageRatio;
                }
                else {
                    ymin = b.y
                    ymax = ymin + unit * .4 * imageRatio;
                }
                ctx.drawImage(image, b.x, ymin, unit * 1.5, ymax - ymin);
            }
            // to vertical from vertical
            if (c.x == b.x) {
                ymin = ymax = b.y;
            }
        }
        // to vertical
        else if (c.x == b.x) {
            //  from right to vertical
            if (a.x > b.x) {
                image = img["ao_sea_tile_back2"];
                imageRatio = image.height / image.width;
                ymin = b.y - unit * .52;
                ymax = ymin + unit;
                ctx.drawImage(image, b.x, ymin, (ymax - ymin) / imageRatio, ymax - ymin);
            }
            // from left to vertical 
            if (a.x < b.x) {
                if (b.x - a.x > unit) {
                    image = img["ao_sea_tile_slope_outter"];
                    imageRatio = image.height / image.width;
                    ymin = b.y - unit * 1.350;
                    ymax = ymin + unit * 3;
                    ctx.drawImage(image, b.x - unit, ymin, unit * 3 / imageRatio, ymax - ymin);
                }
                else if(i==1 && bank[0].x !=0) {
                    ymin = ymax = b.y;
                }
            }

            // to verical from vertical
            if (a.x == b.x) {
                ymin = ymax = b.y;
            }

        }
        ybounds.push([ymin, ymax]);
    }
    if(bank.length) ybounds.push( [bank[bank.length - 1].y, bank[bank.length - 1].y] );
    
    // fill gaps between a and b
    for (var i = 1; i < ybounds.length ; ++i) {
        var a = bank[i - 1];
        var b = bank[i];
        if (Math.abs(a.x - b.x)<.1) { // vertical
            var ymin = ybounds[i][1];
            var ymax = ybounds[i - 1][0] - ybounds[i][1];
            if (ymin < ymax) {
                ctx.drawImage(img["ao_sea_tile_vert"], a.x, ymin, unit * 1.5, ymax);
            }
        }
        if (a.x < b.x) {  // slope
            var tileCount = (b.x - a.x) / unit;
            tileh = unit * 2; // + unit * slope;
            image = img["ao_sea_tile_slope"];
            imgRatio = image.height / image.width;
            for (var t = 1; t < tileCount - 1; t++) {
                 ctx.drawImage(image, a.x + unit * t, a.y - unit * t * slope - unit * 1.375, unit, unit*imgRatio);
            }
        }
    }

    if(debug){
        // debug print points and draw contur;
        if (bank.length) {
            for (var i = 0; i < bank.length; ++i) {
                var cs = ctx.fillStyle;
                ctx.fillStyle = "#000000";
                var pp = bank[i];
                ctx.fillRect(pp.x - 5, pp.y - 5, 10, 10);
                ctx.fillText("index " + i + "/" + (bank.length - 1), pp.x + 10, pp.y);
                ctx.fillStyle = cs;
            }
        
            ctx.strokeStyle = "#000000";
            ctx.beginPath();
            ctx.moveTo(bank[0].x, bank[0].y)
            for (var i = 1; i < bank.length ; ++i) {
                var cs = ctx.fillStyle;
                ctx.fillStyle = "#000000";
                var pp = bank[i];
                ctx.lineTo(pp.x, pp.y);
            }
            ctx.stroke();
        }
    }
}


function drawAoAll(){
    drawAo(bank);
    ctx.transform(-1, 0, 0, 1, canvas.width, 0);
    drawAo(bank);
    ctx.translate(canvas.width / 2, 0.0);
    drawAo(island);
    ctx.scale(-1, 1);
    drawAo(island);
    ctx.translate(-canvas.width / 2, 0.0);
}

function showMessage(msg, dur) {
    if (message == msg) {
        messageDur = dur;
        messageTime = dur/2;
    }
    else {
        messageTime = 0;
        messageDur = dur;
        message = msg;
    }
}

function skin(y) {
    var s = bridgeCount;
    if (bridge) {
        if (y > bridge.y) s--;
    }
    return Math.floor((s %25) / 5);
}

function treeSet(y) {
    var tskin = skin(y);
    if (tskin == 1) return ["tree6", "tree7", "tree8"];
    else if (tskin == 2) return ["tree2", "tree4", "tree5"];
    else if (tskin == 3) return ["tree9", "tree10", "tree11"];
    else if (tskin == 4) return ["tree12", "tree13", "tree14"];
    else return["tree1", "tree2", "tree3"];
}

// KEYBOARD EVENT HANDLERS
var command = [];
var fireDelay = 0;
var controlMapping = { 37: 'left', 39: 'right', 38: 'up', 40: 'down', 32: 'fire' };
var lastKeyDown;
function keyDownHandler(event) {
    //if (event.keyCode == 65) bridgeCount++;
    if([37,39,38,40,32].includes(event.keyCode)) event.preventDefault();
    if (event.keyCode == lastKeyDown) return;
    if (event.keyCode == 68){
        debug = !debug;
    }
    if (event.keyCode == 80 && !title && !gameover && !player.dyingTime && !gamewin) {
        paused = !paused;
        if (paused) {
            showMessage("PAUSED", 1000000);
            music.pause()
        }
        else {
            showMessage("PAUSED",1);
            music.play()
        }

    }
    if (title) startGame();
    else if (gameover > .5) titleScreen();
    //else if (gamewin > 10) titleScreen();
    else if(!paused) command[controlMapping[event.keyCode]] = true;
    lastKeyDown = event.keyCode;
    if (event.keyCode == 27) titleScreen();
   

}
function keyUpHandler(event) {
    if ([37, 39, 38, 40, 32].includes(event.keyCode)) event.preventDefault();
    command[controlMapping[event.keyCode]] = false;
    lastKeyDown = null;
}

// MAIN LOOP 
function frame() {
    var scoreBefore = score;

    // get absolute time, calculate delta time
    timeLast = time;
    time = (new Date()).getTime() / 1000.0;
    dt = time - timeLast;
    dt_nopause = dt;
    if (paused) {
        dt = 0;
    }
    if (gameover) {
        gameover += dt;
        if (gameover > 8) {
            titleScreen();
            return;
        }
    }
    if (gamewin) {
        gamewin += dt;
        if (gamewin > 2 && gamewin < 10) {
            keepPlayingSound("win");
        }
        if (Math.floor(5 * (time - dt)) != Math.floor(5 * time)) {
            var px = randint(0, canvas.width);
            var py = randint(- scroll - unit * 5, canvas.height - scroll - unit * 5);
            explosions.push({
                x: px, y: py,
                w: (1.5 + Math.random()) * unit, h: (1.5 + Math.random()) * unit,
                dur: 1.5, spread: 4,
                color: ["#0000ff", "#ffffff", "#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000"]
            });
        }
        /*
        if (gamewin > 25) {
            titleScreen();
            return;
        }
        */

    }

    if (introMessageTime && ! title) {
        introMessageTime += dt;
        if (introMessageTime > 2) {
            showMessage("MISSION: DEMOLISH " + finalBridge + " BRIDGES", 5);
            introMessageTime = 0;
            playSound("mission");
        }
    }

    // player death state
    if (!title) {
        if (player.dyingTime > 0) {
            player.dyingTime -= dt;
            if (player.dyingTime <= 0 && !gameover) startLife();
        }

        // player fuel consumption
        if (!player.dead && !gamewin) {
            if (!player.invulnerable) player.fuel -= dt * fuelRate.consumption;
            if (!player.dead && player.fuel < .15) {
                showMessage("LOW FUEL", 1);
                if (!paused) keepPlayingSound("low_fuel");
            }
            if (player.fuel <= 0) {
                showMessage("OUT OF FUEL", 1.5);
                playerDie();
            }
            player.fuel = Math.min(Math.max(0, player.fuel), 1)
        }
    }

    // scroll
    if (!title) {
        if (!player.dead) {
            if (gamewin > 1.5) scroll += dt * scrollSpeed.max * 1.3;
            else  scroll += dt * scrollSpeed.current;
        }
    }
    else {
        scroll += dt * 70;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(0, scroll);

    // TERRAIN GENERATION
    {
        // generate bank
        if (bank.length == 0) {

            if (!title) {
                bank = [{ x: unit, y: canvas.height }, { x: unit, y: 0 }];
                addSection(bank, 2 * unit, 5 * unit);
                addSection(bank, 5 * unit, 3 * unit);
                addSection(bank, 4 * unit, 5 * unit);
            }
            else {
                bank = [{ x: unit, y: canvas.height }, { x: unit, y: 0 }];
                scroll = canvas.height;
            }

        }
        var minLen = 2;//2;
        var maxLen = 15;
        while (bank[bank.length - 1].y + 2 * unit > - scroll) {
            var w = randint(1, unitCount - 1);
            addSection(bank, w * unit, randint(minLen, maxLen) * unit);
        }

        // generate island
        if (scroll > nextIslandAt && !island.length) {
            if (bridgeCount > 0) { // no islands before first bridge
                var islandMaxWidth = randint(1, 5);
                var beforeAndAfterSpace = (Math.max(2, islandMaxWidth) + randint(1, 4)) * unit;
                var starty = bank[bank.length - 1].y - beforeAndAfterSpace;
                var unitsLeft = Math.floor(randint(islandLen.min, islandLen.max));
                if (islandMaxWidth == 1) { unitsLeft = Math.min(unitsLeft, (islandLen.min + islandLen.max) * .3); } // prevent too long thin islands
                island = [{ x: 0, y: starty }]; // start island
                while (unitsLeft > 1) {
                    sectionUnits = randint(2, Math.min(6, unitsLeft));
                    addSection(island, randint(1, islandMaxWidth/*2*/) * unit, sectionUnits * unit);
                    unitsLeft -= sectionUnits;
                }
                addSection(island, 0.0, 0.0); // finish island
                var endy = island[island.length - 1].y;
                addSection(bank, (randint(1, 6 - islandMaxWidth)) * unit, -((endy - starty) - beforeAndAfterSpace - unit)); // wide section in bank to make space for island
            }
            nextIslandAt += randint(islandInterval.min, islandInterval.max) * unit;
        }
        // generate bridge
        if (scroll > nextBridgeAt && !bridge && !title && !gamewin) {
            var majorBridge = ((bridgeCount + 1) % 5 == 0) ? true : false;
            var halfw = randint(1, 2);
            var bridgeh = unit * 1.6;
            if (bridgeCount > 1) bridgeh = [unit * 1.6, unit * 1.6, unit * 1.6, unit * 2.5].choose();
            if(majorBridge) bridgeh = unit * 2.5; //  major bridge is always large
            addSection(bank, (unitCount - halfw) * unit, bridgeh + randint(4, 8) * unit);
            bridge = {
                x: canvas.width / 2, y: (bank[bank.length - 1].y + bank[bank.length - 2].y) / 2,
                w: 2 * halfw * unit, h: bridgeh,
                leftBank: canvas.width / 2 - halfw * unit, rightBank: canvas.width / 2 + halfw * unit,
                destroyed: false,
                seed: time,
                score: majorBridge ? 2500 : 1000,
                major: majorBridge
            };
            nextBridgeAt += randint(bridgeInterval.min, bridgeInterval.max) * unit;
            bridgeCount += 1;

            // bridge scenery
            var x = 0;
            while (x < canvas.width + unit * .5) {
                if (x < bridge.leftBank - unit * .2 || x > bridge.rightBank + unit * .2) {
                    var treey = bridge.y + bridge.h / 2 + unit * .6 + randint(-10, 10);
                    addScenery(treeSet(treey).choose(), x, treey, false);
                }
                x += randint(50, 100);
            }
            if (majorBridge) { // construction on major bridge
                addScenery("bridge_c", canvas.width / 2, bridge.y + bridge.h / 2 + unit * .05, false);
                addScenery("bridge_c2", canvas.width / 2, bridge.y - bridge.h / 2 + unit * .2, false);
            }
            x = 0;
            while (x < canvas.width + unit * .5) {
                if (x < bridge.leftBank - unit * .2 || x > bridge.rightBank + unit * .2) {
                    var treey = bridge.y - bridge.h / 2 - unit * .4 + randint(-10, 10);
                    addScenery(treeSet(treey).choose(), x, treey, false);
                }
                x += randint(50, 100);
            }

            if (majorBridge) showMessage("APPROACHING MAJOR BRIDGE", 2.3);
            else showMessage("APPROACHING BRIDGE", 2);
            playSound("bridge");

            // bridge tank(s)
            if (bridgeCount > 2) {
                // how many tanks we can fit on bridge
                var tankCount = Math.floor(bridge.h / (spriteTypes["tank"].size[1] * unit + unit * .5));
                var stepy = bridge.h / (tankCount + 1);
                var ty = (bridge.y + bridge.h / 2 - stepy);
                for (var i = 0; i < tankCount; ++i) {
                    var tank = addSprite("tank", 0, ty);
                    // position on left or right side
                    tank.x = unit * 1.5;
                    if (tank.vel < 0) {
                        tank.x = canvas.width - tank.x;
                    }
                    ty -= stepy;
                }
            }
        }
        var pruney = -scroll + canvas.height + unit * 1.5
        // prune bank
        if (bank.length > 1) if (bank[2].y > pruney) bank.shift();
        // prune island
        if (island.length > 2) {
            if (island[2].y > pruney)
                island.shift();
        }
        if (island.length) if (island[island.length - 1].y > pruney) island = [];
        // prune bridge
        if (bridge) if (bridge.y - bridge.h / 2.0 > -scroll + canvas.height) bridge = null;
    }
    // generate scenery
    if (scroll > nextSceneryAt - sceneryInterval.min * unit - unit * 2) {
        if (bridge) // prevent placing over bridge
            while (Math.abs(-nextSceneryAt - bridge.y) < unit * 3) nextSceneryAt += randint(sceneryInterval.min, sceneryInterval.max) * unit;
        var name;
        var y;
        if (Math.random() > .8) { // canal
            name = "canal" + (skin(-nextSceneryAt) + 1);
            // check if we can add canal
            var ch = img[name].height;
            var bounds1 = terrainBounds(-nextSceneryAt - sceneryTypes[name].size[1] * unit, unit);
            var bounds2 = terrainBounds(-nextSceneryAt, unit);
            if (bounds1[1] == bounds2[1]) {
                if (Math.random() > .5) {
                    y = addScenery(name, bounds1[1] - sceneryTypes[name].size[0] * unit / 2, -nextSceneryAt, false, false);
                }
                else {
                    y = addScenery(name, bounds1[bounds1.length - 2] + sceneryTypes[name].size[0] * unit / 2, -nextSceneryAt, false, true);
                }
            }
            else {
                y = nextSceneryAt;
            }
        }
        else {
            var tskin = skin(-nextSceneryAt);
            if (Math.random() > .8) {
                if (tskin == 1) name = "building2";
                else if (tskin == 2) name = "building3";
                else if (tskin == 3) name = "building4";
                else if (tskin == 4) name = "building5";
                else name = "building";
            }
            else {
                name = treeSet(-nextSceneryAt).choose();
            }
            y = addScenery(name, randint(0, canvas.width), -nextSceneryAt);
        }

        nextSceneryAt = y + randint(sceneryInterval.min, sceneryInterval.max) * unit;
    }
    // prune scenery
    for (var i = 0; i < scenery.length; ++i) {
        var s = scenery[i];
        if (s.selfDestructTime && !s.dead) {
            s.selfDestructTime -= dt;
            if (s.selfDestructTime <= 0) {
                destroyScenery(s);
            }
        }
        if (s.y - s.w / 2 - unit * 2 > -scroll + canvas.height || s.dead) {
            scenery.splice(i--, 1);
        }
    }

    // generate sprites
    if (scroll > nextSpriteAt - unit && !gamewin) {

        var spriteIntervalCurrent = spriteInterval.lastBridge + (easeEnd((finalBridge - bridgeCount) / finalBridge)) * (spriteInterval.firstBridge - spriteInterval.lastBridge);
        if (bridge) // prevent placing over bridge
            while (Math.abs(-nextSpriteAt - bridge.y) < unit * 2) nextSpriteAt += spriteIntervalCurrent * unit;

        var probability = .5 + .5 * (bridgeCount / 10); // some sort of difficulty ramping up
        var jetProbability = .00 + Math.min(.25, .25 * ((bridgeCount - 3) / 15));
        if (bridgeCount < 5) jetProbability = 0;
        if (Math.random() < probability) {
            var type;
            if (Math.random() < jetProbability) {
                type = "jet"
            }
            else {
                var fuelProbability = .07 + (.33333 - .07) * ((finalBridge - bridgeCount) / finalBridge);
                if (Math.random() < fuelProbability) type = "fuel";
                else type = ["ship", "heli"].choose();
            }
            if (player.fuel < .5 * (8 - bridgeCount) / 8) { // assist with extra fuel on first few bridges
                type = "fuel";
            }
            addSprite(type, randint(0, canvas.width), -nextSpriteAt);
        }
        nextSpriteAt += spriteIntervalCurrent * unit;
    }
    // animate sprites
    for (var i = 0; i < sprites.length; ++i) {
        s = sprites[i];
        if (s.y - s.h / 2.0 > -scroll + canvas.height || s.dead) {
            sprites.splice(i--, 1);
            continue;
        }
        s.moveTime -= dt;
        if (s.moveTime < 0) {
            s.x += dt * s.vel;
            if (s.name != "jet" && s.name != "tank") {
                if (boxHitTerrain(s.x, s.y, s.w, s.h, 1, unit * .5)) {
                    s.vel = -s.vel; // change side if moving sideways and hit ground
                    s.x += dt * s.vel;
                }
            }
        }
        if (s.name == "heli") {
            if (time * 50 % 2 > 1) s.img = img["heli"];
            else s.img = img["heli_b"];
        }
        if (s.name == "ship") {
            if ((time + s.seed) * 5 % 2 > 1) s.img = img["ship"];
            else s.img = img["ship_b"];
        }
        if (s.name == "fuel") {
            if (time * 3 % 2 > 1) s.img = img["fuel"];
            else s.img = img["fuel_b"];
        }
        if (s.name == "jet") {
            if ((time + s.seed) * 3 % 2 > 1) s.img = img["jet"];
            else s.img = img["jet_b"];
        }
        if (s.name == "tank") {
            if (bridge) if (!bridge.destroyed) {
                if (bridge.y + bridge.h / 2 > -scroll) {
                    s.moveTime = 0;
                }
            }
            if (s.moveTime <= 0) {
                if ((time + s.seed) * 6 % 2 > 1) s.img = img["tank"];
                else s.img = img["tank_b"];
            }
        }
        if (s.selfDestructTime && !s.dead) {
            s.selfDestructTime -= dt;
            if (s.selfDestructTime <= 0) {
                destroySprite(s);
            }
        }
    }

    // move player
    if (!title) {
        if (command['left']) {
            player.x -= dt * player.velx;
            player.roll -= dt * 10;
        }
        else if (command['right']) {
            player.x += dt * player.velx;
            player.roll += dt * 10;
        }
        else { // handle roll
            rollBefore = player.roll;
            player.roll -= Math.sign(player.roll) * dt * 4;
            if (Math.sign(player.roll) != Math.sign(rollBefore)) player.roll = 0;
        }
        player.roll = Math.max(-1, Math.min(player.roll, 1));
        // regulate scroll speed
        if (command['up']) scrollSpeed.current += dt * scrollSpeed.accel;
        else if (command['down']) scrollSpeed.current -= dt * scrollSpeed.accel;
        else scrollSpeed.current += dt * scrollSpeed.accel * - Math.sign(scrollSpeed.current - scrollSpeed.optimal);
        scrollSpeed.current = Math.min(Math.max(scrollSpeed.min, scrollSpeed.current), scrollSpeed.max); // keep scroll speed in bounds
        // move player with scroll
        var slowFastEffect = .001 * unit * (scrollSpeed.current - scrollSpeed.optimal);
        player.y = -scroll + canvas.height - 105 - slowFastEffect;
        // constrain player to screen
        player.x = Math.min(Math.max(player.w / 2.0, player.x), canvas.width - player.w / 2.0);

        // fire bullet
        fireDelay -= dt;
        if (command['fire'] && fireDelay <= 0 && !bullets.length && !player.dead && !gamewin) {
            bullets.push({ x: player.x, y: player.y, w: unit * .125, h: unit * .5 });
            playSound("shot2");
            fireDelay = .2;
        }
        // move bullets and hit test 
        for (var i = 0; i < bullets.length; ++i) {
            var b = bullets[i];
            b.y -= dt * (bulletVel + scrollSpeed.current);
            var keepBullet = true;
            // bullet hit bridge
            if (bridge) {
                if (!bridge.destroyed && bridge.y + bridge.h / 2.0 > -scroll) {
                    if (boxHit(b.x, b.y - b.h / 2.0, b.w, b.h, canvas.width / 2.0, bridge.y, bridge.w, bridge.h)) {
                        keepBullet = false;
                        destroyBridge();
                        //showMessage("BRIDGE DOWN", 2);
                        if (bridgeCount >= finalBridge) {
                            showMessage("MISSION ACCOMPLISHED!", 10000);
                            player.invulnerable = true;
                            gamewin = .0001;

                        }
                    }
                }
            }
            // bullet hit sprite
            for (var s of sprites) {
                if (!s.dead) {
                    var we = s.w, xe = s.x;
                    if (s.boxExtensionFront) {
                        we = s.w + s.boxExtensionFront;
                        if (s.vel > 0) xe = s.x + s.boxExtensionFront / 2;
                        else xe = s.x - s.boxExtensionFront / 2;
                    }
                    if (boxHit(b.x, b.y - b.h / 2.0, b.w, b.h, xe, s.y, we, s.h)) {
                        keepBullet = false;
                        destroySprite(s);

                    }
                }
            }
            if (b.y < -scroll) keepBullet = false // bullet went out of screen
            if (boxHitTerrain(b.x, b.y - b.h / 2.0, b.w, b.h, 1, unit * .5)) {
                explosions.push({ x: b.x, y: b.y, w:unit*.6, h: unit*.6, dur: 1, spread: 7, color:[landColors[skin(b.y)]] });
                keepBullet = false; // bullet hit land
                playSound("hit");
            }
            if (!keepBullet) { bullets.splice(i, 1); --i; }
        }

        // player.hit
        if (!player.dead) {
            // player hit bridge
            if (bridge) {
                if (!bridge.destroyed && boxHit(player.x, player.y, player.w, player.h, bridge.x, bridge.y, bridge.w, bridge.h) && player.dyingTime <= 0) {
                    destroyBridge();
                    playerDie();
                }
            }
            // player hit terrain
            if (boxHitTerrain(player.x, player.y, player.w, player.h, 1, unit * .75) && !player.dead) {
                playerDie();
            }
            // player hit sprite
            for (s of sprites) {
                if (boxHit(player.x, player.y, player.w, player.h, s.x, s.y, s.w, s.h)) {
                    if (s.name == "fuel") {
                        player.fuel += dt * fuelRate.intake; // refuel
                        if (player.fuel < 1) {
                            if (!paused) keepPlayingSound("fuel");
                        }
                        else {
                            if (!paused) keepPlayingSound("fuel_full");
                        }
                    }
                    else if (!player.dead) {
                        destroySprite(s);
                        playerDie();
                        break;
                    }
                }
            }
        }
    }// if(!title)

    // check if extra life
    if (Math.floor(score / extraLifeEvery) != Math.floor(scoreBefore / extraLifeEvery) && player.lives < 10 && !gameover) {
        player.lives++;
        if (!gamewin) {
            showMessage("EXTRA LIFE", 2);
            playSound("extra_life");
        }
    }



    // DRAW FRAME

    // shake
    shake.time -= dt;
    if (shake.dur > 0 && shake.time > 0) {
        ctx.save();
        var shakeMagnitude = shake.ampli * (shake.time / shake.dur);
        ctx.translate(Math.random() * shakeMagnitude, Math.random() * shakeMagnitude);
    }

    // draw river
    if (!bridge) {
        var wcolor = waterColor[skin(-scroll)]
        ctx.fillStyle = (shake.time / shake.dur) > .05 ? "#ee4444" : wcolor;
        ctx.fillRect(0, -scroll, canvas.width, canvas.height);
    }
    else {
        var wcolor1 = waterColor[skin(bridge.y - 10)];
        var wcolor2 = waterColor[skin(bridge.y + 10)];
        wcolor1 = (shake.time / shake.dur) > .05 ? "#ee4444" : wcolor1;
        wcolor2 = (shake.time / shake.dur) > .05 ? "#ee4444" : wcolor2;
        ctx.fillStyle =  wcolor1;
        ctx.fillRect(0, -scroll, canvas.width, bridge.y -(- scroll));
        ctx.fillStyle = wcolor2;
        ctx.fillRect(0, bridge.y, canvas.width, -scroll + canvas.height - bridge.y);

 
        // water under bridge
        if (bridge) {
            if (shake.time <= 0) {
                var ymin = bridge.y - bridge.h / 2.0 - 1 - unit * 1;
                var ymax = ymin + bridge.h + unit * .2 + 2 + unit * 1;
                var grad = ctx.createLinearGradient(0, ymin, 0, ymax);
                grad.addColorStop(0, wcolor1);
                grad.addColorStop(1, wcolor2);
                ctx.fillStyle = grad;
                ctx.fillRect(bridge.leftBank, ymin, bridge.w, ymax - ymin);
            }
        }
   
    }

    // draw ripples
    for (var i = 0; i < ripples.length; ++i) {
        r = ripples[i];
        r.time += dt;
        if (r.time >= r.dur) {
            ripples.splice(i, 1);
            --i;
            continue;
        }
        r.size += dt * r.vel;
        ctx.globalAlpha = .95 * Math.max(0, 1 - r.time / r.dur);
        ctx.drawImage(img["ripple"], r.x - r.size / 2, r.y - r.size / 2, r.size, r.size);
    }
    ctx.globalAlpha = 1;

    // draw land
    ctx.fillStyle = bridge ? landColors[skin(bridge.y+10)]: landColors[skin(-scroll)]// bridge ? landColors[bridgeCount % landColors.length] : landColors[(bridgeCount+1)%landColors.length];
    drawLand();
    if (bridge) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-shake.ampli, -scroll - shake.ampli, canvas.width + shake.ampli, Math.max(0, bridge.y + scroll) + shake.ampli);
        ctx.clip();
        ctx.fillStyle = landColors[skin(bridge.y - 10)]; //landColors[(bridgeCount + 1) % landColors.length];
        drawLand();
        ctx.restore();
    }

    // draw bridge
    if (bridge) {
        ctx.fillStyle = bridgeCount < 20 ? "#333333" : "#111111"; //"#444444"; // top
        ctx.fillRect(-shake.ampli, bridge.y - bridge.h / 2.0, canvas.width+shake.ampli*2, bridge.h);
        ctx.fillStyle = "#cc9922";
        var laneCount = Math.floor(bridge.h / (unit * .8));
        var laneh = bridge.h / laneCount;
        var w = unit * .27; h = unit * .04; x = -shake.ampli;
        for (var lan = 1; lan < laneCount; ++lan) {
            var x = 0;
            while (x < canvas.width + shake.ampli) {
                ctx.fillRect(x,  lan*laneh + bridge.y - bridge.h/2 - h / 2, w, h);
                x += w * 2;
            }
        }
        ctx.fillStyle = ctx.fillStyle = bridgeCount < 20 ? "#222222":"#000000";//"#333333"; //side
        ctx.fillRect(canvas.width / 2.0 - bridge.w / 2.0, bridge.y + bridge.h / 2.0, bridge.w, unit*.2);

        if (bridge.destroyed) {
            // water under bridge
            var ymin = bridge.y - bridge.h / 2.0 - 1 - unit *1 ;
            var ymax = ymin + bridge.h + unit * .2 + 2 + unit *1;
            var grad = ctx.createLinearGradient(0, ymin, 0, ymax);
            var wcolor1 = (shake.time / shake.dur) > .05 ? "#ee4444" : waterColor[skin(bridge.y - 10)];
            var wcolor2 = (shake.time / shake.dur) > .05 ? "#ee4444" : waterColor[skin(bridge.y + 10)];
            grad.addColorStop(0, wcolor1);
            grad.addColorStop(1, wcolor2);
            ctx.fillStyle = grad;
            ctx.fillRect(bridge.leftBank, ymin, bridge.w, ymax - ymin);

            // bridge blackened
            ctx.fillStyle = bridgeCount < 20 ? "#040404" : "#000000";// "#222222";
            seed(bridge.seed);
            var h = unit * .2;
            var steps = Math.floor(bridge.h / h);
            h = bridge.h / steps;
            for (var i = 0; i < steps; ++i) {
                var w = (random() * unit * 3 + unit * .3) * Math.min(1, 10 * (1 - bridge.explosion.time / bridge.explosion.dur));
                ctx.fillRect(bridge.leftBank - w, bridge.y - bridge.h / 2 + h * i, w + random() * unit * .4, h + 1);
                w = (random() * unit * 3 + unit*.3) * Math.min(1, 10 * (1 - bridge.explosion.time / bridge.explosion.dur));
                ctx.fillRect(bridge.rightBank - random() * unit * .4, bridge.y - bridge.h / 2 + h * i, w, h + 1);
            }
        }      

        // bridge decoration
        ctx.save();
        for (var i = 0; i < 2; ++i) {
            ctx.fillStyle = landColors[skin(bridge.y+10)];//landColors[bridgeCount % landColors.length];
            ctx.fillRect(-shake.ampli, bridge.y + bridge.h / 2 - unit * .1, canvas.width / 2 - bridge.w / 2 + shake.ampli, unit * .1 + 2);
            ctx.fillStyle = "#001122";
            ctx.globalAlpha = .3;
            ctx.fillRect(-shake.ampli, bridge.y - bridge.h / 2 - unit * .15, canvas.width / 2 - bridge.w / 2 + shake.ampli, unit * .15);
            ctx.globalAlpha = 1;
            ctx.translate(canvas.width / 2 + bridge.w / 2 + shake.ampli, 0);
        }
        ctx.restore();
    }

    // draw ao
 
    // clip out ao from bridge
    var ymin, ymax;
    if (bridge) if (!bridge.destroyed) {
        ymin = bridge.y - bridge.h / 2.0;
        ymax = ymin + bridge.h + unit * .2 + 1;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, -scroll);
        ctx.lineTo(canvas.width, -scroll );
        ctx.lineTo(canvas.width, -scroll +canvas.height);
        ctx.lineTo(0, -scroll +canvas.height)
        ctx.closePath();
        ctx.moveTo(bridge.leftBank, ymin);
        ctx.lineTo(bridge.leftBank, ymax);
        ctx.lineTo(bridge.rightBank, ymax);
        ctx.lineTo(bridge.rightBank, ymin);
        ctx.closePath();
        ctx.clip();
    }
    // draw all ao
    ctx.globalAlpha = .7;
    drawAoAll();
    // restore clip
    if (bridge) if (!bridge.destroyed) {
        ctx.restore()
    }
    // draw bridge shadow
    if (bridge) if (!bridge.destroyed) {
        ctx.globalAlpha = .8;
        ctx.drawImage(img["bridge_shadow"], bridge.leftBank, ymax -2, bridge.w, unit*2);
        //ctx.fillRect( canvas.width / 2 - bridge.w / 2, bridge.y + bridge.h / 2, bridge.w, unit );
    }
    ctx.globalAlpha = 1;

    // draw sprites and scenery
    var jets = [];
    var sce = scenery.slice();
    var spr = sprites.slice();
    var sc = sce.length ? sce.pop() : null;
    var sp = spr.length ? spr.pop() : null;

    while (sp || sc) {
        var drawSprite = false;
        var drawScenery = false;
        if (sp && sc) {
            if (sc.y < sp.y) drawScenery = true;
            else drawSprite = true;
        }
        else if (sp) drawSprite = true;
        else if (sc) drawScenery = true;

        if (drawScenery) {
            // draw scenery
            var s = sc;
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.translate(- s.sscale * s.img.width / 2, - s.sscale * s.img.height / 2);
            if (s.flip) {
                ctx.scale(-1, 1);
                ctx.drawImage(s.img, s.strans.x - s.img.width * s.sscale, s.strans.y, s.sscale * s.img.width, s.sscale * s.img.height);
            }
            else {
                ctx.drawImage(s.img, s.strans.x, s.strans.y, s.sscale * s.img.width, s.sscale * s.img.height);
            }
            ctx.restore();
            //ctx.strokeRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);

            sc = sce.length ? sce.pop() : null;
        }
        if (drawSprite) {
            // draw sprite
            var s = sp;
            if (s.name == "jet") {
                jets.push(s);
            }
            else {
                ctx.save();
                ctx.translate(s.x, s.y);
                if (s.vel) ctx.scale(-Math.sign(s.vel), 1);
                ctx.translate(- s.sscale * s.img.width / 2, - s.sscale * s.img.height / 2);
                ctx.drawImage(s.img, s.strans.x, s.strans.y, s.sscale * s.img.width, s.sscale * s.img.height);
                ctx.restore();
            }
            sp = spr.length ? spr.pop() : null;
        }
    }
    // draw jets
    for (s of jets) {
        ctx.save();
        ctx.translate(s.x, s.y);
        if (s.vel) ctx.scale(-Math.sign(s.vel), 1);
        ctx.translate(- s.sscale * s.img.width / 2, - s.sscale * s.img.height / 2);
        ctx.drawImage(s.img, s.strans.x, s.strans.y, s.sscale * s.img.width, s.sscale * s.img.height);
        ctx.restore();
    }

    // animate/draw explosions
    for (var i = 0; i < explosions.length; ++i) {
        var e = explosions[i];
        var ageNorm = (e.time / e.dur);
        // draw shockwave
        if (e.shockwaveRadius) {
            var radCurrent = easeEnd(Math.min(e.shockwaveRadius, (e.dur - e.time) * 700) / e.shockwaveRadius) * e.shockwaveRadius;
            ctx.globalAlpha = easeEnd(1 - radCurrent / e.shockwaveRadius);
            ctx.fillStyle = "#ffffff";
            //ctx.fillRect(e.x - radCurrent, e.y - radCurrent, radCurrent * 2, radCurrent * 2);
            var image = img["shockwave"];
            var ratio = image.height / image.width;
            ctx.drawImage(image, e.x - radCurrent, e.y - radCurrent, radCurrent * 2, radCurrent * 2 * ratio);
            ctx.globalAlpha = 1;
        }

        spread = .5;
        if (e.spread) {
            spread = e.spread;
        }
        if (e.time == null) { e.time = e.dur; e.seed = time; }
        var color = ["#ffffff", "#ff6600", "#ff0000", "#222222", "#444444", "#222222", "#000000"];
        if (e.color) color = e.color;

        //seed((e.time + time) * .1);
        seed(e.seed);
        var ratio = e.h / e.w;
        var pixsize = Math.ceil(unit * .12);
        for (var v = -e.h/ 2 -pixsize/2 ; v < e.h / 2 + pixsize/2; v+= pixsize) {
            for (var u = -e.w/2 - pixsize/2  ; u < e.w / 2+ pixsize/2; u += pixsize) {
                ctx.fillStyle = color[Math.floor(random() * (0, color.length))];
                
                //var rad = 10;//= Math.sqrt(( (v-e.h/pixsize/2)  * ratio) * ((v-e.h/pixsize/2) * ratio) + (u-e.w/pixsize/2) * (u-e.w/pixsize/2))/ Math.max(e.w,e.h); 
                var rad = Math.sqrt(u * u * (ratio * ratio) + v * v) / (e.h * .5);
                var jitter = -ageNorm/3 + random() * ageNorm/1.5;
                ctx.fillStyle = color[Math.floor(Math.max(Math.min(jitter + rad * (1.2 - ageNorm), 1), 0) * (color.length - 1))];
                var deltax = u * ratio * spread * (1-ageNorm) * random();
                var deltay = v * spread * (1 - ageNorm) * random();
                if (random() < .9 * ageNorm /rad  && rad <= 1.1)
                    ctx.fillRect(e.x + u + deltax, e.y + v + deltay,  pixsize + 1, pixsize+1);
            }
        }
        e.time -= dt;
        if (e.time < 0) {
            explosions.splice(i--, 1)
        }
    }


    // draw player

    if (!player.dead && !title) {
        iindex = Math.floor((.5 + player.roll * .5) * 6) +1;
        var image = img["player" + iindex]; 
        ctx.drawImage(
            image,
            player.x - player.sscale * image.width / 2 + player.strans.x,
            player.y - player.sscale * image.height / 2 + player.strans.y,
            image.width * player.sscale, image.height * player.sscale
        );
        var w = unit * .155;
        ctx.globalAlpha = Math.max(0, 1 - (scrollSpeed.max - scrollSpeed.current) / (scrollSpeed.max - scrollSpeed.optimal));
        ctx.drawImage(img["player_trail"], player.x - w / 2, player.y + unit * .4, w, unit * .5);
        ctx.globalAlpha = 1;

        
        // DEBUG
        if(debug){
            var r = 0;
            var testFakeElev = unit;
            ctx.fillStyle = "#0000ff";
            ctx.fillRect(player.x - 5 + r, player.y - 5, 10, 10);
            ctx.fillStyle = "#ff00ff";
            r = resolvePointTerrain(player.x, player.y, 0, -1, testFakeElev); // resoleve left test
            ctx.fillRect(Math.max(0, player.x - 5 + r), player.y - 5, 10, 10);
            r = resolvePointTerrain(player.x, player.y, 0, 1, testFakeElev); // resoleve right test
            ctx.fillRect(Math.min(canvas.width - 5, player.x - 5 + r), player.y - 5, 10, 10);
            r = resolveBoxTerrain(player.x, player.y, player.w, player.h, 0, testFakeElev);
            r += unit * .3 * Math.sign(r);
            ctx.strokeStyle = "#ff00ff";
            ctx.strokeRect(player.x - player.w/2 + r, player.y - player.h/2, player.w, player.h);
        }
       
    }

    // draw bullets
    for (var b of bullets) {
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(b.x - b.w / 2.0, b.y - b.h, b.w, b.h);
    }

    // animate ad draw score popups
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffff00";
    for (var i = 0; i < scorePopups.length; ++i) {
        s = scorePopups[i];
        if (!s.time) s.time = 0;
        s.time += dt;
        if (s.time > s.dur) {    ctx.font = "32px Arial";
            scorePopups.splice(i, 1);
            --i;
            continue;
        }
        ctx.font = "" + s.size + "px Arial";
        var yoffset = easeEnd(s.time / s.dur) * unit * 1;
        ctx.globalAlpha = 1 - Math.max(0,(s.time-s.dur*.8 )/ (s.dur *.2));
        ctx.fillText(s.score, s.x, s.y - yoffset);
    }
    ctx.globalAlpha = 1;

    if (shake.time > 0) {
        ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0); 

    if (!title) {
        // draw hud bar
        ctx.fillStyle = "#444444";
        ctx.globalAlpha = .3;
        ctx.fillRect(0, canvas.height - 64, canvas.width, 64);
        ctx.globalAlpha = 1;
        // print score
        ctx.textAlign = "right"
        ctx.fillStyle = "#ffff00";
        ctx.font = "40px Arial";
        ctx.fillText(("000000" + score).substr(-6, 6), canvas.width / 2 -10, canvas.height - 16);
        // print bridge count
        var destroyedCount = bridgeCount;
        if (bridge) {
            destroyedCount = bridge.destroyed ? bridgeCount : Math.max(0,bridgeCount-1);
        }
        ctx.fillText(destroyedCount, canvas.width - 12, canvas.height - 16);

        // print lives
        var x = 10;
        for (var i = 0; i < player.lives - 1; ++i) {
            ctx.drawImage(img["player"], x, canvas.height - 64 + 12, player.w, player.h);
            x += 36;
        }

        // fuel gauge
        {
            var image = img["fuel_gauge"];
            var ratio = image.width / image.height;
            var w = 200;
            ctx.drawImage(image, canvas.width / 2 +10, canvas.height - 50, w, w / ratio);
            var scale = w / image.width;
            image = img["fuel_gauge_tip"];
            ctx.drawImage(image, canvas.width / 2 + 10 +9 +player.fuel * 171, canvas.height - 35, image.width*scale, image.height*scale);
        }

        // message
        if (message) {
            messageTime += dt_nopause;
            if (messageTime < messageDur) {
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2 - unit * .2);
                var scal = Math.min(1, messageTime / .2);
                var alpha = Math.min(1, (messageDur - messageTime) / .5);
                ctx.globalAlpha = alpha;
                ctx.scale(scal, scal);
                ctx.font = "48px Arial";
                ctx.fillStyle = "#ffff33";
                ctx.textAlign = "center";
                ctx.fillText(message, 0, 0);
                ctx.restore();
            }
            else {
                message = null;
            }
        }
    }

    // title screen
    if (title) {
        // logo
        var w = 700;
        image = img["logo"];
        var ratio = image.width / image.height;
        ctx.drawImage(image, canvas.width / 2 - w / 2, unit * 2, w, w/ratio);

        ctx.fillStyle = "#ffff33";
        var msg;
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        msg = ["CONTROLS:", "LEFT/RIGHT ARROW - move", "UP/DOWN ARROW - fast/slow", "SPACE - shoot", "P - pause", "D - debug"];
        var y = canvas.height / 2 + unit*1.3;
        for (var line of msg) {
            ctx.fillText(line, canvas.width / 2, y);
            y += 24;
        }

        if ((time * 4) % 2 > 1) {
            ctx.textAlign = "center";
            ctx.fillText("< PRESS ANY KEY TO START >", canvas.width / 2, unit * 5.1);
        }

        ctx.font = "32px Arial";
        ctx.textAlign = "left";
        msg = "A remake of an 8-bit classic River Raid";
        ctx.fillText(msg, titleScroll, canvas.height - 20);
        titleScroll -= dt * 250;
        if (titleScroll < -1500 /*-ctx.measureText(msg).width*/) titleScroll = canvas.width;
       

        // IMPLEMENT HIGH SCORE:
        
        // try{
        //     localStorage.setItem("highScore", 10);
        // }
        // catch (e) {

        // }
        
        var high = null;
        try{
            var high = localStorage.getItem('highScore');
        }
        catch(e){

        }
        if (!high) {
            high = "[enable cookies]";
        }
        ctx.textAlign = "center";
        ctx.fillText("High" , canvas.width / 2, 25);
        ctx.fillText(high , canvas.width / 2, 60);
    }


}


