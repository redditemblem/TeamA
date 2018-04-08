app.service('MusicService', ['$rootScope', function ($rootScope) {

    //Variables
    var playMusic = false;
    var volume = 100;
    const audio = document.getElementById("audioPlayer");
    const musicTracks = [
        {'name' : "Chapter 5 Theme", 'src' : "chapter5.mp3", 'speed' : 1.0},
        {'name' : "Zain: Lone Wolf", 'src' : "ZainTheme.mp3", 'speed' : 0.75},
        {'name' : "Himaya: Branded of a Feather", 'src' : "HimayaTheme.mp3", 'speed': 1.25},
        {'name' : "Ayer: Latent Fury", 'src' : "AyerTheme.mp3", 'speed' : 1.0},
        {'name' : "Daniël: A Change of Perspective", 'src' : "DanielTheme.mp3", 'speed' : 1.0},
        {'name' : "Jetsetter: Refulgent Phosphoratoric Phantasmagoric Symphonia", 'src' : "JetsetterTheme.m4a", 'speed' : 1.0},
        {'name' : "Kiera: Sands of Home and Child", 'src' : "KieraTheme.mp3", 'speed' : 1.0},
        {'name' : "Mars: Self Appointed Hero", 'src' : "MarsTheme.mp3", 'speed' : 1.0},
        {'name' : "Millie: Grave of Sorrow", 'src' : "MillieTheme.mp3", 'speed' : 1.0},
        {'name' : "Relgia: Flameheart Swagger", 'src' : "RelgiaTheme.mp3", 'speed' : 1.0},
        {'name' : "Namaka: Coasting Through Life and Battle", 'src' : "NamakaTheme.mp3", 'speed' : 1.0},
        {'name' : "Nydrandisa: Dulled Light", 'src' : "NyrandisaTheme.mp3", 'speed' : 1.0},
        {'name' : "Seed: Forest Voice", 'src' : "SeedTheme.mp3", 'speed' : 1.0},
        {'name' : "Suleiman: 150 Years of Servitude", 'src' : "SuleimanTheme.mp3", 'speed' : 1.0}
    ];

    //Functions
    this.initalizePlayer = function(){ this.setTrack(musicTracks[0]); };
    this.musicPlaying = function(){ return playMusic; };
    this.getTrackList = function(){ return musicTracks; };

    this.toggleMusic = function(){
        if(playMusic) audio.pause();
        else audio.play();
        playMusic = !playMusic;
    };

    this.setTrack = function(n){
        audio.src = "MUS/" + n.src;
        audio.load();
        audio.playbackRate = n.speed;
        if(playMusic) audio.play();
    };

}]);