const songs = [
  {
    title: "Local Forecast",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Local%20Forecast.mp3"
  },
  {
    title: "Airport Lounge",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Airport%20Lounge.mp3"
  },
  
    {
  title: "Acid Trumpet",
  url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Acid%20Trumpet.mp3"
},
  {
    title: "Aurea Carmina",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Aurea%20Carmina.mp3"
  },
  {
    title: "Lobby Time",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lobby%20Time.mp3"
  },
  {
    title: "Secret of Tiki Island",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Secret%20of%20Tiki%20Island.mp3"
  },
  {
    title: "Leopard Print Elevator",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Leopard%20Print%20Elevator.mp3"
  },
  {
    title: "Destiny Day",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Destiny%20Day.mp3"
  },
  {
    title: "Funky Chunk",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Chunk.mp3"
  },
  {
    title: "Fig Leaf Times Two",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fig%20Leaf%20Times%20Two.mp3"
  }
];

let currentSong = 0;
const audioPlayer = document.getElementById('audioPlayer');
const currentSongDiv = document.getElementById('currentSong');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextSongBtn = document.getElementById('nextSongBtn');
const prevSongBtn = document.getElementById('prevSongBtn');

function loadSong(index) {
  audioPlayer.src = songs[index].url;
  currentSongDiv.textContent = songs[index].title + " - Kevin MacLeod";
  audioPlayer.play();
  playPauseBtn.textContent = "⏸";
}

playPauseBtn.onclick = () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.textContent = "⏸";
  } else {
    audioPlayer.pause();
    playPauseBtn.textContent = "▶";
  }
};

nextSongBtn.onclick = () => {
  currentSong = (currentSong + 1) % songs.length;
  loadSong(currentSong);
};

prevSongBtn.onclick = () => {
  currentSong = (currentSong - 1 + songs.length) % songs.length;
  loadSong(currentSong);
};

audioPlayer.onended = () => {
  nextSongBtn.onclick();
};

// Initialize
loadSong(currentSong);