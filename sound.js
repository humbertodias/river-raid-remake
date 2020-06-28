

var sndFileNames = {

    "ex4": ["ex4.mp3", .3],
    "ex2": ["ex2.mp3", .7],
    "ex5": ["ex5.mp3", .3],
    "ex6": ["ex6.mp3", .3],
    "ex7": ["ex7.mp3", .4],
    "ex8": ["ex8.wav", .3],
    "ex9": ["ex9.mp3", .6],
    "ex10": ["ex10.wav", 1],
    "melt": ["melt.mp3", .2],
    "shot2": ["shot2.wav", .2],
    "hit": ["hit.wav", .1],
    "fuel": ["fuel.mp3", .1],
    "fuel_full": ["fuel_full2.mp3", 1],
    "low_fuel": ["low_fuel.wav", .3],
    "death": ["crash.wav", .3],
    "bridge": ["bridge2.mp3", .3],
    "extra_life": ["extra_life.mp3", .3],
    "mission": ["mission.wav", .3],
    "win": ["win.wav", .3],
};


var music = new Audio("snd/effci-01.mp3");
music.volume = .8;

// loop music
music.addEventListener('ended', function () {
    console.log('music playing')
    this.currentTime = 0;
    this.play();
}, false);


var snd = {};

for (var si in sndFileNames) {
    snd[si] = new Audio("snd/" + sndFileNames[si][0]);
    if (sndFileNames[si][1]) {
        snd[si].volume = sndFileNames[si][1];
    }
}


function playSound(soundName) {
    if (!snd[soundName]) {
        return;
    }
    snd[soundName].currentTime = 0;
    snd[soundName].play();
}

function keepPlayingSound(soundName) {

    if (!snd[soundName]) {
        return;
    }
    if (snd[soundName].currentTime >= snd[soundName].duration) {
        snd[soundName].currentTime = 0;
    }
    snd[soundName].play();
}



