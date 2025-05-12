const playPauseBtn = document.getElementById('play-pause-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeLabel = document.getElementById('current-time');
const totalTimeLabel = document.getElementById('total-time');
const likeBtn = document.getElementById('like-btn');
const audio = document.getElementById('audio');
const currentLyric = document.getElementById('current-lyric');

let isPlaying = false;
let isBuffering = false;
let bufferCheckInterval;
const BUFFER_SIZE = 0.5; // Kurangi buffer size menjadi 0.5 detik

// Cek kalau audio gagal load
audio.addEventListener('error', () => {
    console.error('Error loading audio file. Check src path or file format.');
    totalTimeLabel.textContent = '0:00';
});

// Set total duration when audio metadata is loaded
audio.addEventListener('loadedmetadata', () => {
    totalTimeLabel.textContent = formatTime(Math.floor(audio.duration));
});

// Format time in MM:SS
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

// Tambahkan array lirik dengan timestamp (dalam detik)
const lyrics = [
    { time: 1, text: "Tak pernah kurasakan" },
    { time: 5, text: "Rasa yang t'lah lama hilang" },
    { time: 10, text: "Kini hadir kembali" },
    { time: 12, text: "Saat melihatmu" },
    { time: 17, text: "Ingin rasanya diri ini" },
    { time: 22, text: "Memiliki dirimu" },
    { time: 26, text: "Namun semua hanya mimpi indah bagiku" },
    // Tambahkan lirik lainnya sesuai dengan timestamp lagu
];

let currentLyricIndex = 0;

// Update lirik berdasarkan waktu
function updateLyrics() {
    if (!isPlaying) return;
    
    const currentTime = audio.currentTime;
    
    // Loop dari akhir array untuk menemukan lirik yang sesuai
    for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].time) {
            // Hanya update jika lirik berubah
            if (currentLyricIndex !== i) {
                currentLyricIndex = i;
                currentLyric.classList.add('fade');
                setTimeout(() => {
                    currentLyric.textContent = lyrics[i].text;
                    currentLyric.classList.remove('fade');
                }, 300);
            }
            return;
        }
    }
    
    // Jika tidak ada lirik yang sesuai, kembalikan ke judul
    if (currentLyricIndex !== -1) {
        currentLyricIndex = -1;
        currentLyric.classList.add('fade');
        setTimeout(() => {
            currentLyric.textContent = "Our Story";
            currentLyric.classList.remove('fade');
        }, 300);
    }
}

// Update progress bar and current time
function updateProgress() {
    if (isPlaying) {
        const remaining = audio.duration - audio.currentTime;
        // Jangan tampilkan loading jika mendekati akhir lagu
        if (remaining <= 1) {
            isBuffering = false;
            if (isPlaying) playPauseBtn.innerHTML = '⏸';
        }
        
        currentTimeLabel.textContent = formatTime(Math.floor(audio.currentTime));
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        updateLyrics();

        if (audio.currentTime >= audio.duration) {
            isPlaying = false;
            playPauseBtn.innerHTML = '▶';
            audio.currentTime = 0;
            progressBar.value = 0;
            currentTimeLabel.textContent = '0:00';
            currentLyricIndex = 0;
        }
    }
}

// Play/Pause functionality
playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        if (!isBuffering) {
            audio.play().catch(err => {
                console.error('Error playing audio:', err);
                isPlaying = false;
                playPauseBtn.innerHTML = '▶';
            });
            playPauseBtn.innerHTML = '⏸';
        }
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '▶';
    }
});

// Like button functionality
likeBtn.addEventListener('click', () => {
    likeBtn.classList.toggle('liked');
    likeBtn.innerHTML = likeBtn.classList.contains('liked') ? '♥' : '♡';
});

// Update progress bar when dragged
progressBar.addEventListener('input', () => {
    const newTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = newTime;
    currentTimeLabel.textContent = formatTime(Math.floor(newTime));
});

// Tambahkan event listeners untuk buffering
audio.addEventListener('waiting', () => {
    isBuffering = true;
    playPauseBtn.innerHTML = '⏳'; // Menunjukkan loading
});

audio.addEventListener('playing', () => {
    isBuffering = false;
    if (isPlaying) {
        playPauseBtn.innerHTML = '⏸';
    }
});

// Tambahkan fungsi untuk mengecek buffer
function checkBuffer() {
    if (!audio.buffered.length || !isPlaying) return;
    
    const currentBuffer = audio.buffered.end(audio.buffered.length - 1);
    const bufferAhead = currentBuffer - audio.currentTime;
    
    // Hanya pause jika buffer benar-benar habis
    if (bufferAhead <= 0 && !isBuffering) {
        isBuffering = true;
        playPauseBtn.innerHTML = '⏳';
    } else if (bufferAhead > 0 && isBuffering) {
        isBuffering = false;
        if (isPlaying) {
            audio.play().catch(() => {});
            playPauseBtn.innerHTML = '⏸';
        }
    }
}

// Update event listeners yang ada
audio.addEventListener('loadeddata', () => {
    clearInterval(bufferCheckInterval); // Hapus interval yang ada
    bufferCheckInterval = setInterval(checkBuffer, 250); // Check setiap 250ms
});

audio.addEventListener('seeking', () => {
    isBuffering = true;
    playPauseBtn.innerHTML = '⏳';
});

audio.addEventListener('seeked', () => {
    isBuffering = false;
    if (isPlaying) {
        audio.play();
        playPauseBtn.innerHTML = '⏸';
    }
});

// Update every second
setInterval(updateProgress, 100); // Ubah dari 1000 ke 100 untuk update lebih sering