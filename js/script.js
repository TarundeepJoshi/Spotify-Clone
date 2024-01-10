let currentSong = new Audio();
let songs;
let currentFolder;
let currentPlayingIndex = -1;

// Time format of song duration
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currentFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    // Show all songs in the playlist
    let songOl = document.querySelector(".songList").getElementsByTagName("ol")[0];
    songOl.innerHTML = ""; // Clear existing content

    for (let i = 0; i < songs.length; i++) {
        let li = document.createElement("li");
        li.innerHTML = `<img style="filter: invert(1);" src="img/musical-note.png" alt="">
             <div class="song-info">
                 <div>${songs[i].replaceAll("(PaglaSongs).mp3", " ")}</div>
             </div>
             <img style="filter: invert(1);" src="img/play-button.svg" alt="">`;

        // Attach event listener to the new list item
        li.addEventListener("click", () => {
            playMusic(songs[i].trim(), false, i);
        });

        songOl.appendChild(li);
    }

    return songs;
}

const playMusic = (track, pause = false, index) => {
    currentSong.src = `/${currentFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause-button.svg";
        updatePlayIcon(index);
    }

    document.querySelector(".songInfo").innerHTML = track.replaceAll("(PaglaSongs).mp3", " ");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Listen for the ended event to play the next song automatically
    currentSong.addEventListener("ended", () => {
        playNextSong(index);
    });
};


function playNextSong(index) {
    currentSong.pause();
    console.log("Next song automatically played");
    let nextIndex = (index + 1) % songs.length;
    playMusic(songs[nextIndex], false, nextIndex);
}

function updatePlayIcon(index) {
    // Reset the previous played song's icon
    if (currentPlayingIndex !== -1) {
        let prevSong = document.querySelector(`.songList ol li:nth-child(${currentPlayingIndex + 1}) img:last-child`);
        prevSong.src = "img/play-button.svg";
    }

    // Update the current played song's icon
    let currentSongIcon = document.querySelector(`.songList ol li:nth-child(${index + 1}) img:last-child`);
    currentSongIcon.src = "img/pause-button.svg";
    currentPlayingIndex = index;
}

// Display albums of playlist
async function displayAlbums() {
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".card-Container");
    let radioCardContainer = document.querySelector(".radio-card-Container");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/")[4];

            // Get metadata of songs
            let a = await fetch(`/songs/${folder}/info.json`);
            let response = await a.json();
            console.log(response);

            // Create a new card element
            let card = document.createElement("div");
            card.dataset.folder = folder;
            card.classList.add("card");
            card.innerHTML = `<img src="/songs/${folder}/cover.jpg" alt="">
            
            <h3>${response.title}</h3>
            <p>${response.description}</p>`;

            // Append the new card to the container
            cardContainer.appendChild(card);
        }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            // playMusic(songs[0])
        });
    });
}

async function main() {
    // Get the list of songs
    await getSongs("songs/hothitshindi");
    playMusic(songs[0], true, 0);

    await displayAlbums();

    // Attach event listener to play button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause-button.svg";
            updatePlayIcon(currentPlayingIndex);
        } else {
            currentSong.pause();
            play.src = "img/play-button.svg";
            updatePlayIcon(-1);
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        const currentTime = currentSong.currentTime;
        const duration = currentSong.duration;

        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentTime)} / ${secondsToMinutesSeconds(duration)}`;

        // Calculate the left position as a percentage of the total duration
        const leftPosition = (currentTime / duration) * 100;
        document.querySelector(".circle").style.left = leftPosition + '%';
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Add an event listener for hamburger
    // FOR OPEN LEFT SIDE
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left-side").style.left = "0";
    });
    // FOR CLOSE LEFT SIDE
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left-side").style.left = "-30rem";
    });

    // Add an event listener to previous song
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1], false, index - 1);
        }
    });

    // Add an event listener to next song
    next.addEventListener("click", () => {
        playNextSong(currentPlayingIndex);
    });

}


main();
