// Base setup: Canvas and Dimensions
const canvas = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateBackgroundStars();
    
    // Dynamically re-align formed constellation stars to fit new window dimensions!
    if (isConstellationActive && constellationStars.length > 0) {
        const newTargets = getTextCoordinates();
        constellationStars = [];
        newTargets.forEach(target => {
            const star = new ShootingStar(target.x, target.y, null, null, target);
            star.state = 'joined';
            constellationStars.push(star);
        });
    }
});

/* ==========================================================================
   1. BACKGROUND STARS GENERATION (DOM Elements for performance)
   ========================================================================== */
function generateBackgroundStars() {
    const container = document.getElementById('twinkleStars');
    container.innerHTML = ''; // Clear existing
    // Over 3x denser star count!
    const starCount = Math.floor((width * height) / 2500);

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        const size = Math.random() * 2 + 0.4;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 95}%`; // Cover almost the whole height of the screen
        
        star.style.opacity = Math.random();
        star.style.animationDuration = `${Math.random() * 4 + 2}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        
        container.appendChild(star);
    }
}
generateBackgroundStars();

/* ==========================================================================
   2. UNIFIED SHOOTING & CONSTELLATION STAR SYSTEM (Canvas)
   ========================================================================== */
class ShootingStar {
    constructor(startX, startY, targetX, targetY, targetPoint = null) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        
        this.targetPoint = targetPoint; // If set, this star will land on the text grid
        
        // Target coordinates
        this.tx = targetPoint ? targetPoint.x : targetX;
        this.ty = targetPoint ? targetPoint.y : targetY;
        
        // Calculate direction and velocity
        const dx = this.tx - startX;
        const dy = this.ty - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Slower and gentler speed for letters stars (7 to 11) compared to regular ones (8 to 12)
        this.speed = targetPoint ? Math.random() * 4 + 7 : Math.random() * 4 + 8;
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        
        this.length = Math.random() * 40 + 40;
        this.opacity = targetPoint ? 0.15 : 1; // Letter stars start very faint
        this.maxOpacity = Math.random() * 0.35 + 0.55; // 0.55 to 0.9
        
        // States: 'falling', 'joined', 'dispersing'
        this.state = 'falling';
        
        // Colors: soft white, golden yellow, or romantic pink
        this.color = '255, 255, 255';
        const rand = Math.random();
        if (rand < 0.45) {
            this.color = '255, 140, 170'; // soft pink
        } else if (rand < 0.75) {
            this.color = '255, 210, 110'; // warm gold
        }
        
        this.seed = Math.random() * 100;
        this.life = 0;
        this.maxLife = 80;
        this.width = targetPoint ? 1.0 : 1.5; // Thinner trail for letter-forming stars to look subtle
        
        // Easing interpolation factor for smooth landing
        this.speedFactor = Math.random() * 0.02 + 0.015;
    }

    update() {
        if (this.state === 'falling') {
            this.x += this.vx;
            this.y += this.vy;
            this.life++;
            
            if (this.targetPoint) {
                // Fade in gradually as it approaches the text grid
                if (this.opacity < this.maxOpacity) {
                    this.opacity += 0.015;
                }
                
                // Check if we arrived at the target coordinates
                const dx = this.tx - this.x;
                const dy = this.ty - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Lock into place if close enough, or if it passed the target height moving downwards
                if (dist < this.speed || (this.vy > 0 && this.y >= this.ty)) {
                    this.state = 'joined';
                    this.x = this.tx;
                    this.y = this.ty;
                    this.opacity = this.maxOpacity;
                }
            } else {
                // Regular star decays over time
                this.opacity = 1 - (this.life / this.maxLife);
            }
        } else if (this.state === 'joined') {
            // Cosmic floating motion (micro-hovering)
            const floatOffset = Math.sin(Date.now() * 0.003 + this.seed) * 0.5;
            this.x = this.tx + floatOffset;
            this.y = this.ty + Math.cos(Date.now() * 0.0025 + this.seed) * 0.4;
            
            // Continuous starlight twinkling
            this.opacity = this.maxOpacity - (Math.sin(Date.now() * 0.006 + this.seed) * 0.18);
        } else if (this.state === 'dispersing') {
            // Floating down like stardust
            this.y += Math.random() * 0.6 + 0.3;
            this.x += Math.sin(Date.now() * 0.005 + this.seed) * 0.15;
            this.opacity -= 0.015;
        }
    }

    draw() {
        if (this.state === 'falling') {
            ctx.beginPath();
            const grad = ctx.createLinearGradient(
                this.x, this.y, 
                this.x - this.vx * (this.length / this.speed), 
                this.y - this.vy * (this.length / this.speed)
            );
            grad.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
            grad.addColorStop(0.1, `rgba(${this.color}, ${this.opacity * 0.8})`);
            grad.addColorStop(1, `rgba(${this.color}, 0)`);
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x - this.vx * (this.length / this.speed), 
                this.y - this.vy * (this.length / this.speed)
            );
            ctx.stroke();
        } else {
            // Twinkling dot representation
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.targetPoint ? 1.6 : 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
            
            if (this.state === 'joined') {
                ctx.shadowBlur = 6;
                ctx.shadowColor = `rgba(${this.color}, 0.85)`;
            }
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }
}

const shootingStars = [];
let constellationStars = [];
let isConstellationActive = false;

// Draw Loop
function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw regular shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.update();
        star.draw();
        
        if (star.life >= star.maxLife || star.state === 'joined') {
            // Move special stars to constellation container once joined
            if (star.state === 'joined') {
                constellationStars.push(star);
            }
            shootingStars.splice(i, 1);
        }
    }
    
    // Draw constellation stars
    for (let i = constellationStars.length - 1; i >= 0; i--) {
        const cStar = constellationStars[i];
        cStar.update();
        cStar.draw();
        
        if (cStar.state === 'dispersing' && cStar.opacity <= 0) {
            constellationStars.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animate);
}
animate();

// Spawn regular shooting stars periodically when the sequence is not running
setInterval(() => {
    if (!document.hidden && !isConstellationActive && Math.random() < 0.45) {
        spawnRandomShootingStar();
    }
}, 4000);

function spawnRandomShootingStar() {
    const startX = Math.random() * width * 0.6;
    const startY = -50;
    const targetX = startX + (Math.random() * 300 + 200);
    const targetY = Math.random() * height * 0.5 + 100;
    
    shootingStars.push(new ShootingStar(startX, startY, targetX, targetY, null));
}

// Click on Canvas to cast a wish (spawn custom shooting star)
canvas.addEventListener('click', (e) => {
    const targetX = e.clientX;
    const targetY = e.clientY;
    
    const startX = targetX - (Math.random() * 200 + 150);
    const startY = targetY - (Math.random() * 150 + 100);
    
    shootingStars.push(new ShootingStar(startX, startY, targetX + 150, targetY + 100, null));
    
    playChirpSound(600, 0.05, 0.2); // Soft chime click sound
});

/* ==========================================================================
   3. PROCEDURAL AUDIO SYNTHESIZER (Web Audio API)
   ========================================================================== */
let audioCtx = null;
let masterGain = null;
let synthPadNode = null;
let cricketInterval = null;
let isAudioPlaying = false;

function initAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
    
    // Lowpass filter for smooth analog warmth
    const lpFilter = audioCtx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
    lpFilter.Q.setValueAtTime(1.5, audioCtx.currentTime);
    
    const frequencies = [87.31, 130.81, 196.00]; // F2, C3, G3 (Open fifth chord)
    
    frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.detune.setValueAtTime((idx - 1) * 6, audioCtx.currentTime); 
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        
        osc.connect(gain);
        gain.connect(lpFilter);
        osc.start();
    });
    
    // Slow sweeping LFO for warm movement
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 120;
    
    lfo.connect(lfoGain);
    lfoGain.connect(lpFilter.frequency);
    lfo.start();
    
    lpFilter.connect(masterGain);
    
    startCrickets();
}

function startCrickets() {
    if (cricketInterval) clearInterval(cricketInterval);
    
    cricketInterval = setInterval(() => {
        if (!isAudioPlaying || document.hidden) return;
        if (Math.random() < 0.7) {
            triggerCricketChirp();
        }
    }, 1800);
}

function triggerCricketChirp() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const duration = 0.15;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    const baseFreq = 3800 + Math.random() * 300;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.type = 'sine';
    
    const bpFilter = audioCtx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.setValueAtTime(baseFreq, now);
    bpFilter.Q.setValueAtTime(8, now);
    
    osc.connect(gain);
    gain.connect(bpFilter);
    bpFilter.connect(masterGain);
    
    gain.gain.setValueAtTime(0, now);
    
    // Create 3 tiny quick pulses for a single "chirp" (ch-ch-ch)
    const pulses = 3;
    const pulseLen = duration / pulses;
    for (let i = 0; i < pulses; i++) {
        const start = now + i * pulseLen;
        const peak = start + pulseLen * 0.3;
        const end = start + pulseLen;
        
        gain.gain.linearRampToValueAtTime(0.012, peak);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
    }
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
}

function playChirpSound(frequency, duration, volume) {
    if (!audioCtx || !isAudioPlaying || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    
    gain.connect(masterGain);
    osc.connect(gain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
}

function playSlideSound(startFreq, endFreq, duration, volume) {
    if (!audioCtx || !isAudioPlaying || audioCtx.state === 'suspended') return;
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    gain.connect(masterGain);
    osc.connect(gain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    osc.start(now);
    osc.stop(now + duration + 0.05);
}

/* ==========================================================================
   4. UI CONTROLS & INTERACTION
   ========================================================================== */
const audioBtn = document.getElementById('audioBtn');
const audioIcon = document.getElementById('audioIcon');
const audioBadge = document.getElementById('audioBadge');
const resetConstellationBtn = document.getElementById('resetConstellationBtn');

audioBtn.addEventListener('click', async () => {
    if (!audioCtx) {
        initAudio();
    }
    
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    if (!isAudioPlaying) {
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0.8, now + 1.5);
        isAudioPlaying = true;
        audioBtn.textContent = '🔊 Sonido: ON';
        audioBtn.classList.add('active');
        
        audioBadge.style.opacity = '1';
        setTimeout(() => {
            audioBadge.style.opacity = '0';
        }, 3000);

        // Play arpeggio chord if constellation is currently active
        if (isConstellationActive && resetConstellationBtn.classList.contains('show')) {
            playAnniversaryChord();
        }
    } else {
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + 0.8);
        isAudioPlaying = false;
        audioBtn.innerHTML = '<span class="btn-icon" id="audioIcon">🔈</span> Sonido: OFF';
        audioBtn.classList.remove('active');
    }
});

// Sky Theme Selector
const themeBtns = document.querySelectorAll('.theme-btn');

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const theme = btn.getAttribute('data-theme');
        document.body.className = '';
        document.body.classList.add(`theme-${theme}`);
        
        const burstCount = theme === 'aurora' ? 5 : 3;
        for (let i = 0; i < burstCount; i++) {
            setTimeout(() => {
                if (!isConstellationActive) spawnRandomShootingStar();
            }, i * 250);
        }
        
        playChirpSound(440 + Math.random() * 220, 0.4, 0.15);
    });
});

// Wish button trigger
const wishBtn = document.getElementById('wishBtn');
wishBtn.addEventListener('click', () => {
    const startX = Math.random() * width * 0.3;
    const startY = -40;
    const targetX = startX + (Math.random() * 400 + 400);
    const targetY = Math.random() * height * 0.4 + 200;
    
    shootingStars.push(new ShootingStar(startX, startY, targetX, targetY, null));
    
    wishBtn.style.transform = 'scale(0.95)';
    setTimeout(() => wishBtn.style.transform = 'none', 150);
    
    // Play beautiful chime chord (F-major chord)
    playChirpSound(349.23, 0.8, 0.1); // F4
    setTimeout(() => playChirpSound(440.00, 0.8, 0.1), 100); // A4
    setTimeout(() => playChirpSound(523.25, 1.2, 0.1), 200); // C5
    setTimeout(() => playChirpSound(659.25, 1.5, 0.15), 300); // E5
});

/* ==========================================================================
   5. CHARACTER DIALOGUE & CUTE GESTURES
   ========================================================================== */
const koala = document.getElementById('koalaChar');
const turtle = document.getElementById('turtleChar');

const koalaPhrases = [
    "Qué paz se siente aquí arriba... 🐨",
    "No te sueltes de mi mano mientras vemos caer las estrellas... 🐨❤️🐢",
    "Mira esa estrella de allá, parece titilar a nuestro ritmo... ✨",
    "Pedí un deseo por nosotros, Tortuguita...",
    "El universo entero es hermoso, pero estar aquí contigo lo es más."
];

const turtlePhrases = [
    "El caparazón se siente muy calientito a tu lado... 🐢",
    "Sí, Koalita... me gusta mucho tomar tu mano...",
    "¡Oh! Creo que acabo de ver una estrella fugaz pasar muy veloz... 🌠",
    "Siempre estaré aquí para ver las estrellas contigo.",
    "El cielo es infinito, pero este momento juntos es perfecto."
];

let koalaDialogueTimeout = null;
let turtleDialogueTimeout = null;

koala.addEventListener('click', (e) => {
    e.stopPropagation();
    
    koala.classList.add('active-wiggle');
    koala.classList.add('show-speech');
    
    const randomPhrase = koalaPhrases[Math.floor(Math.random() * koalaPhrases.length)];
    document.getElementById('koalaSpeech').textContent = randomPhrase;
    
    playChirpSound(880, 0.3, 0.15); // A5
    setTimeout(() => playChirpSound(1046.50, 0.4, 0.1), 80); // C6
    
    if (koalaDialogueTimeout) clearTimeout(koalaDialogueTimeout);
    koalaDialogueTimeout = setTimeout(() => {
        koala.classList.remove('active-wiggle');
        koala.classList.remove('show-speech');
    }, 4500);
});

turtle.addEventListener('click', (e) => {
    e.stopPropagation();
    
    turtle.classList.add('active-shy');
    turtle.classList.add('show-speech');
    
    const randomPhrase = turtlePhrases[Math.floor(Math.random() * turtlePhrases.length)];
    document.getElementById('turtleSpeech').textContent = randomPhrase;
    
    playSlideSound(330, 480, 0.35, 0.12); // Cute slide upward
    
    if (turtleDialogueTimeout) clearTimeout(turtleDialogueTimeout);
    turtleDialogueTimeout = setTimeout(() => {
        turtle.classList.remove('active-shy');
        turtle.classList.remove('show-speech');
    }, 4500);
});

/* ==========================================================================
   6. METEOR SHOWER & CONSTELLATION SEQUENCE
   ========================================================================== */
function playAnniversaryChord() {
    if (audioCtx && isAudioPlaying) {
        playChirpSound(349.23, 1.2, 0.15); // F4
        setTimeout(() => playChirpSound(440.00, 1.2, 0.15), 100); // A4
        setTimeout(() => playChirpSound(523.25, 1.5, 0.15), 200); // C5
        setTimeout(() => playChirpSound(659.25, 1.8, 0.20), 300); // E5
        setTimeout(() => playChirpSound(880.00, 2.5, 0.22), 400); // A5
    }
}

// Scans an offscreen canvas to extract grid coordinates of the text
function getTextCoordinates() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Use the full window width to prevent left/right clipping on mobile!
    const boxWidth = width;
    const boxHeight = 240;
    
    tempCanvas.width = boxWidth;
    tempCanvas.height = boxHeight;
    
    // Dynamically scale font size based on screen width
    // Desktop: 72px. Mobile: 3 lines of 40px bold text.
    let fontSize = 72;
    if (width < 480) {
        fontSize = Math.min(40, Math.floor(width * 0.11)); // Giant bold text on mobile!
    } else if (width < 768) {
        fontSize = 54; // Mid-scale tablets
    }
    
    tempCtx.font = `bold ${fontSize}px sans-serif`;
    tempCtx.fillStyle = '#ffffff';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    
    // Draw centered text lines
    if (width < 480) {
        // 3 lines for mobile to prevent clipping and allow massive font size
        tempCtx.fillText("feliz", boxWidth / 2, boxHeight * 0.22);
        tempCtx.fillText("aniversario", boxWidth / 2, boxHeight * 0.50);
        tempCtx.fillText("mi koala", boxWidth / 2, boxHeight * 0.78);
    } else {
        // 2 lines for desktop/tablets
        tempCtx.fillText("feliz aniversario", boxWidth / 2, boxHeight * 0.32);
        tempCtx.fillText("mi koala", boxWidth / 2, boxHeight * 0.68);
    }
    
    // Scan pixel buffer
    const imgData = tempCtx.getImageData(0, 0, boxWidth, boxHeight);
    const pixels = imgData.data;
    const coords = [];
    
    // Step size (star density): 5 on mobile (sharper matrix), 6 on desktop
    const step = width < 480 ? 5 : 6;
    
    // Bounding offsets in upper sky
    const offsetX = 0;
    const offsetY = height * 0.08; // Placed at 8% from screen top to fit 3 lines
    
    for (let y = 0; y < boxHeight; y += step) {
        for (let x = 0; x < boxWidth; x += step) {
            const index = (y * boxWidth + x) * 4;
            const alpha = pixels[index + 3];
            
            if (alpha > 120) {
                coords.push({
                    x: x + offsetX,
                    y: y + offsetY
                });
            }
        }
    }
    
    console.log(`Scan complete. Generated ${coords.length} constellation points.`);
    return coords;
}

// Shuffles targets so the text forms in a randomized, organic order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startCelebration() {
    isConstellationActive = true;
    constellationStars = [];
    
    // Dim background stars to highlight the formed letters
    const bgStars = document.getElementById('twinkleStars');
    if (bgStars) {
        bgStars.style.transition = 'opacity 3s ease';
        bgStars.style.opacity = '0.15';
    }
    
    // Scan targets
    const targets = getTextCoordinates();
    const shuffledTargets = shuffleArray([...targets]);
    
    let targetIndex = 0;
    const totalTargets = shuffledTargets.length;
    
    // Play swelling chord
    playAnniversaryChord();
    
    // Spawn interval (slower tick: 40ms per star, making the formation much more gradual and subtle)
    const spawnTimer = setInterval(() => {
        if (targetIndex >= totalTargets) {
            clearInterval(spawnTimer);
            
            // Show reset button 3 seconds after all stars have been fired
            setTimeout(() => {
                resetConstellationBtn.classList.add('show');
            }, 3000);
            return;
        }
        
        // 1. Spawn the "constellation star" destined to stick to the letter coordinate
        const point = shuffledTargets[targetIndex];
        
        // Spawn far to the top-left of the target to simulate falling trajectory
        const startX = point.x - (Math.random() * 200 + 150);
        const startY = -40;
        
        shootingStars.push(new ShootingStar(startX, startY, null, null, point));
        targetIndex++;
        
        // 2. Spawn 1 to 2 extra "regular" shooting stars crossing the screen from multiple directions
        const extraStarsCount = Math.floor(Math.random() * 2) + 1; // Spawns 1 or 2 stars per tick
        for (let s = 0; s < extraStarsCount; s++) {
            // Choose a random starting side: 0 = Top, 1 = Left side, 2 = Right side
            const side = Math.floor(Math.random() * 3);
            let sX, sY, dX, dY;
            
            if (side === 0) {
                // From Top flying downwards
                sX = Math.random() * width;
                sY = -40;
                dX = sX + (Math.random() * 600 - 300); // fly diagonal
                dY = height + 50;
            } else if (side === 1) {
                // From Left side flying right-down
                sX = -40;
                sY = Math.random() * height * 0.4;
                dX = width + 50;
                dY = sY + (Math.random() * 300 + 100);
            } else {
                // From Right side flying left-down
                sX = width + 40;
                sY = Math.random() * height * 0.4;
                dX = -50;
                dY = sY + (Math.random() * 300 + 100);
            }
            
            // Spawn regular shooting star
            shootingStars.push(new ShootingStar(sX, sY, dX, dY, null));
        }
    }, 40); // Eased spawn tick (40ms = approx 25 targets/second)
}

// Disperse button event handler
resetConstellationBtn.addEventListener('click', () => {
    // 1. Trigger particles to float down and fade away
    constellationStars.forEach(star => {
        star.state = 'dispersing';
    });
    
    // 2. Hide reset button
    resetConstellationBtn.classList.remove('show');
    
    // 3. Fade background stars back to full visibility
    const bgStars = document.getElementById('twinkleStars');
    if (bgStars) {
        bgStars.style.opacity = '1.0';
    }
    

    
    isConstellationActive = false;
    playChirpSound(523.25, 0.6, 0.1);
});

// Helper to serialize inline SVGs into drawable image elements
function svgToImage(svgElement) {
    return new Promise((resolve, reject) => {
        try {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("SVG rendering failed"));
                img.src = e.target.result;
            };
            reader.readAsDataURL(svgBlob);
        } catch (err) {
            reject(err);
        }
    });
}

// Renders the current visual state of the webpage onto an offscreen canvas and triggers a PNG download
async function downloadPostcard() {
    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '⌛ Creando...';
    downloadBtn.style.pointerEvents = 'none';
    
    try {
        const exportCanvas = document.createElement('canvas');
        const eCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = width;
        exportCanvas.height = height;
        
        // 1. Draw active sky gradient background
        const activeTheme = document.body.className;
        let skyGrad = eCtx.createLinearGradient(0, 0, 0, height);
        
        if (activeTheme.includes('theme-aurora')) {
            skyGrad.addColorStop(0, '#050e14');
            skyGrad.addColorStop(0.6, '#0b1a24');
            skyGrad.addColorStop(1, '#142a22');
        } else if (activeTheme.includes('theme-sunset')) {
            skyGrad.addColorStop(0, '#0d0f26');
            skyGrad.addColorStop(0.4, '#201335');
            skyGrad.addColorStop(0.75, '#501d43');
            skyGrad.addColorStop(1, '#8c3b52');
        } else { // theme-space / default
            skyGrad.addColorStop(0, '#070919');
            skyGrad.addColorStop(0.5, '#0c0f2b');
            skyGrad.addColorStop(1, '#17123a');
        }
        
        eCtx.fillStyle = skyGrad;
        eCtx.fillRect(0, 0, width, height);
        
        // 2. Draw nebula glows (simulated screen composite)
        eCtx.globalCompositeOperation = 'screen';
        let nebColor1 = 'rgba(125, 95, 255, 0.1)';
        let nebColor2 = 'rgba(255, 82, 82, 0.1)';
        
        if (activeTheme.includes('theme-aurora')) {
            nebColor1 = 'rgba(0, 210, 211, 0.1)';
            nebColor2 = 'rgba(29, 209, 161, 0.15)';
        } else if (activeTheme.includes('theme-sunset')) {
            nebColor1 = 'rgba(255, 159, 67, 0.12)';
            nebColor2 = 'rgba(238, 82, 83, 0.1)';
        }
        
        // Nebula 1
        let radGrad1 = eCtx.createRadialGradient(width*0.35, height*0.35, 0, width*0.35, height*0.35, Math.min(width, height)*0.3);
        radGrad1.addColorStop(0, nebColor1);
        radGrad1.addColorStop(1, 'rgba(0,0,0,0)');
        eCtx.fillStyle = radGrad1;
        eCtx.beginPath();
        eCtx.arc(width*0.35, height*0.35, Math.min(width, height)*0.3, 0, Math.PI*2);
        eCtx.fill();
        
        // Nebula 2
        let radGrad2 = eCtx.createRadialGradient(width*0.7, height*0.5, 0, width*0.7, height*0.5, Math.min(width, height)*0.4);
        radGrad2.addColorStop(0, nebColor2);
        radGrad2.addColorStop(1, 'rgba(0,0,0,0)');
        eCtx.fillStyle = radGrad2;
        eCtx.beginPath();
        eCtx.arc(width*0.7, height*0.5, Math.min(width, height)*0.4, 0, Math.PI*2);
        eCtx.fill();
        
        eCtx.globalCompositeOperation = 'source-over';
        
        // 3. Draw crescent moon
        const moonX = width * 0.85;
        const moonY = height * 0.14;
        const moonRadius = 40;
        const moonOffset = 10;
        let moonColor = '#fbfdf9';
        
        if (activeTheme.includes('theme-sunset')) {
            moonColor = '#ffeaa7';
        } else if (activeTheme.includes('theme-aurora')) {
            moonColor = '#e8f5e9';
        }
        
        eCtx.shadowBlur = 20;
        eCtx.shadowColor = moonColor;
        eCtx.beginPath();
        eCtx.arc(moonX, moonY, moonRadius, -Math.PI / 2, Math.PI / 2, false);
        eCtx.arc(moonX + moonOffset, moonY, moonRadius, Math.PI / 2, -Math.PI / 2, true);
        eCtx.closePath();
        eCtx.fillStyle = moonColor;
        eCtx.fill();
        eCtx.shadowBlur = 0; // reset
        
        // 4. Draw static background stars
        const stars = document.querySelectorAll('.star');
        eCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        stars.forEach(starEl => {
            const left = parseFloat(starEl.style.left) / 100 * width;
            const top = parseFloat(starEl.style.top) / 100 * height;
            const size = parseFloat(starEl.style.width) || 1.5;
            eCtx.beginPath();
            eCtx.arc(left, top, size / 2, 0, Math.PI * 2);
            eCtx.fill();
        });
        
        // 5. Draw active shooting stars
        shootingStars.forEach(star => {
            if (star.state === 'falling') {
                eCtx.beginPath();
                const grad = eCtx.createLinearGradient(
                    star.x, star.y, 
                    star.x - star.vx * (star.length / star.speed), 
                    star.y - star.vy * (star.length / star.speed)
                );
                grad.addColorStop(0, `rgba(${star.color}, ${star.opacity})`);
                grad.addColorStop(1, `rgba(${star.color}, 0)`);
                eCtx.strokeStyle = grad;
                eCtx.lineWidth = star.width;
                eCtx.moveTo(star.x, star.y);
                eCtx.lineTo(
                    star.x - star.vx * (star.length / star.speed), 
                    star.y - star.vy * (star.length / star.speed)
                );
                eCtx.stroke();
            }
        });
        
        // 6. Draw constellation stars (words formed)
        constellationStars.forEach(star => {
            eCtx.beginPath();
            eCtx.arc(star.x, star.y, star.targetPoint ? 1.6 : 1.2, 0, Math.PI * 2);
            eCtx.fillStyle = `rgba(${star.color}, ${star.opacity})`;
            if (star.state === 'joined') {
                eCtx.shadowBlur = 6;
                eCtx.shadowColor = `rgba(${star.color}, 0.85)`;
            }
            eCtx.fill();
            eCtx.shadowBlur = 0; // reset
        });
        
        // 7. Convert and draw SVG elements (Hill, Koala, Turtle)
        const hillSvg = document.querySelector('.hill-svg');
        const koalaSvg = document.querySelector('.koala-svg');
        const turtleSvg = document.querySelector('.turtle-svg');
        
        const [hillImg, koalaImg, turtleImg] = await Promise.all([
            svgToImage(hillSvg),
            svgToImage(koalaSvg),
            svgToImage(turtleSvg)
        ]);
        
        // Draw Hill
        eCtx.drawImage(hillImg, 0, height - 200, width, 200);
        
        // Draw Characters Snug together
        const containerWidth = width < 768 ? 160 : 190;
        const charSize = width < 768 ? 100 : 120;
        const containerLeft = (width - containerWidth) / 2;
        const containerTop = height - charSize - (width < 768 ? 25 : 35);
        
        // Draw Koala
        eCtx.drawImage(koalaImg, containerLeft, containerTop, charSize, charSize);
        
        // Draw Turtle
        const turtleLeftOffset = containerWidth - charSize; // 70px on desktop, 60px on mobile
        eCtx.drawImage(turtleImg, containerLeft + turtleLeftOffset, containerTop, charSize, charSize);
        
        // 8. Draw Love Spark heart
        const heartX = containerLeft + (containerWidth / 2);
        const heartY = containerTop + charSize - (width < 768 ? 18 : 22);
        eCtx.font = `${width < 768 ? 16 : 22}px Arial`;
        eCtx.textAlign = 'center';
        eCtx.textBaseline = 'middle';
        eCtx.fillText('❤️', heartX, heartY);
        
        // 9. Generate download trigger link
        const dataURL = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'Bajo_Las_Estrellas.png';
        link.href = dataURL;
        link.click();
        
    } catch (err) {
        console.error("Error generating download image:", err);
        alert("No se pudo generar el archivo de imagen.");
    } finally {
        downloadBtn.innerHTML = originalText;
        downloadBtn.style.pointerEvents = 'auto';
    }
}

// Download Button Click Listener
const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', downloadPostcard);

// Collapsible Control Panel Handlers
const controlPanel = document.getElementById('controlPanel');
const panelToggleBtn = document.getElementById('panelToggleBtn');
const panelOpenBtn = document.getElementById('panelOpenBtn');

panelToggleBtn.addEventListener('click', () => {
    controlPanel.classList.add('collapsed');
    panelOpenBtn.classList.add('show');
    playChirpSound(500, 0.05, 0.1); // soft feedback sound
});

panelOpenBtn.addEventListener('click', () => {
    controlPanel.classList.remove('collapsed');
    panelOpenBtn.classList.remove('show');
    playChirpSound(700, 0.05, 0.1); // soft feedback sound
});

// Setup page load timeout to trigger celebration after 5 seconds
window.addEventListener('load', () => {
    setTimeout(() => {
        // Change theme to romantic sunset
        document.body.className = '';
        document.body.classList.add('theme-sunset');
        
        // Sync theme selection buttons in the control panel
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme') === 'sunset') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Launch meteor shower that forms the constellation!
        startCelebration();
    }, 5000);
});
