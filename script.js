/* ======================================================
   MIND LOGIC SOLAR SYSTEM — script.js (FINAL)
====================================================== */

/* ══════ STATE ══════ */
let zoomLevel     = 1;
let soundEnabled  = false;
let paused        = false;
let flyActive     = false;
let speaking      = false;

/* ══════ DOM REFS ══════ */
const solarSystem  = document.getElementById("solarSystem");
const audio        = document.getElementById("spaceAudio");
const muteBtn      = document.getElementById("muteBtn");
const pauseBtn     = document.getElementById("pauseBtn");
const flyOverlay   = document.getElementById("flyOverlay");

/* ══════════════════════════════════════════════════════
   🔊  BACKGROUND MUSIC
   — starts on first user interaction (browser policy)
====================================================== */
function startMusic() {
  if (audio && !soundEnabled) {
    audio.volume = 0.35;
    audio.loop   = true;
    audio.play()
      .then(() => {
        soundEnabled = true;
        if (muteBtn) muteBtn.textContent = "🔊";
      })
      .catch(() => {});
  }
}

/* attach to every possible first-interaction event */
["click","touchstart","keydown","pointerdown"].forEach(ev =>
  document.addEventListener(ev, startMusic, { once: true })
);

function toggleSound() {
  if (!audio) return;
  if (soundEnabled) {
    audio.pause();
    soundEnabled = false;
    if (muteBtn) muteBtn.textContent = "🔇";
  } else {
    audio.play().catch(() => {});
    soundEnabled = true;
    if (muteBtn) muteBtn.textContent = "🔊";
  }
}

/* ══════════════════════════════════════════════════════
   🔭  ZOOM
====================================================== */
function zoomIn() {
  zoomLevel = Math.min(zoomLevel + 0.12, 2.5);
  solarSystem.style.transform = `scale(${zoomLevel})`;
}

function zoomOut() {
  zoomLevel = Math.max(zoomLevel - 0.12, 0.25);
  solarSystem.style.transform = `scale(${zoomLevel})`;
}

document.addEventListener("wheel", e => {
  e.preventDefault();
  e.deltaY < 0 ? zoomIn() : zoomOut();
}, { passive: false });

/* ══════════════════════════════════════════════════════
   ⏸  PAUSE
====================================================== */
function togglePause() {
  paused = !paused;
  document.body.classList.toggle("paused", paused);
  if (pauseBtn) pauseBtn.textContent = paused ? "▶" : "⏸";
}

/* ══════════════════════════════════════════════════════
   🎥  FLY-THROUGH
====================================================== */
function triggerFlyThrough() {
  if (flyActive) return;
  flyActive = true;
  if (flyOverlay) {
    flyOverlay.classList.remove("hidden");
    setTimeout(() => flyOverlay.classList.add("active"), 50);
  }
  let fz = 1;
  const grow = setInterval(() => {
    fz += 0.05;
    solarSystem.style.transform = `scale(${fz})`;
    if (fz >= 3.5) {
      clearInterval(grow);
      setTimeout(() => {
        const shrink = setInterval(() => {
          fz -= 0.04;
          solarSystem.style.transform = `scale(${fz})`;
          if (fz <= 1) {
            fz = 1; zoomLevel = 1;
            solarSystem.style.transform = "scale(1)";
            clearInterval(shrink);
            if (flyOverlay) {
              flyOverlay.classList.remove("active");
              setTimeout(() => { flyOverlay.classList.add("hidden"); flyActive = false; }, 700);
            } else { flyActive = false; }
          }
        }, 30);
      }, 800);
    }
  }, 30);
}

/* ══════════════════════════════════════════════════════
   🗣  CHROME VOICE SPEECH
====================================================== */
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate   = 0.92;
  utt.pitch  = 1.0;
  utt.volume = 1.0;
  /* prefer a natural English voice */
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("UK"))
  ) || voices.find(v => v.lang.startsWith("en")) || null;
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
}

/* voices load async in Chrome — pre-load them */
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

/* ══════════════════════════════════════════════════════
   🪐  PLANET POPUP
====================================================== */

/* Build popup once, reuse it */
const popup = document.createElement("div");
popup.id = "planetPopup";
popup.innerHTML = `
  <div class="popup-inner">
    <button class="popup-close" id="popupClose">✕</button>
    <div class="popup-icon" id="popupIcon">🌍</div>
    <h2 class="popup-title" id="popupTitle">Planet</h2>
    <p class="popup-desc" id="popupDesc">Description</p>
    <div class="popup-stats" id="popupStats"></div>
    <div class="popup-actions">
      <button class="popup-btn" id="popupSpeak">🔊 Read Aloud</button>
      <button class="popup-btn" id="popupStop">⏹ Stop</button>
    </div>
  </div>
`;
document.body.appendChild(popup);

/* Inject popup styles */
const popupStyle = document.createElement("style");
popupStyle.textContent = `
  #planetPopup {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,10,0.78);
    backdrop-filter: blur(6px);
    justify-content: center;
    align-items: center;
  }
  #planetPopup.open { display: flex; }

  .popup-inner {
    position: relative;
    background: linear-gradient(145deg, rgba(5,10,40,0.97), rgba(10,5,30,0.97));
    border: 1px solid rgba(0,229,255,0.35);
    border-radius: 22px;
    padding: 36px 32px 28px;
    max-width: 380px;
    width: 88vw;
    text-align: center;
    box-shadow: 0 0 60px rgba(0,229,255,0.18), 0 0 120px rgba(80,0,160,0.12);
    animation: popupIn 0.4s cubic-bezier(0.23,1,0.32,1);
  }

  @keyframes popupIn {
    from { opacity:0; transform: scale(0.7) translateY(30px); }
    to   { opacity:1; transform: scale(1) translateY(0); }
  }

  .popup-close {
    position: absolute;
    top: 14px; right: 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    font-size: 1rem;
    width: 32px; height: 32px;
    border-radius: 50%;
    cursor: pointer;
    line-height: 1;
    transition: background 0.2s;
  }
  .popup-close:hover { background: rgba(255,60,60,0.35); }

  .popup-icon {
    font-size: 3.2rem;
    margin-bottom: 10px;
    filter: drop-shadow(0 0 12px rgba(255,220,100,0.5));
    animation: popupIconFloat 3s ease-in-out infinite;
  }
  @keyframes popupIconFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }

  .popup-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: linear-gradient(90deg,#ffd700,#00e5ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
  }

  .popup-desc {
    font-family: 'Exo 2', sans-serif;
    font-size: 0.88rem;
    color: rgba(255,255,255,0.80);
    line-height: 1.65;
    margin-bottom: 16px;
  }

  .popup-stats {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 20px;
  }

  .popup-stat {
    background: rgba(0,229,255,0.07);
    border-left: 3px solid #00e5ff;
    border-radius: 6px;
    padding: 7px 12px;
    font-family: 'Exo 2', sans-serif;
    font-size: 0.78rem;
    color: #00e5ff;
    text-align: left;
    letter-spacing: 0.04em;
  }

  .popup-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .popup-btn {
    background: rgba(0,229,255,0.12);
    border: 1px solid rgba(0,229,255,0.4);
    color: #fff;
    font-family: 'Exo 2', sans-serif;
    font-size: 0.8rem;
    padding: 9px 18px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.03em;
  }
  .popup-btn:hover {
    background: rgba(0,229,255,0.28);
    box-shadow: 0 0 16px rgba(0,229,255,0.3);
  }
`;
document.head.appendChild(popupStyle);

/* Close button */
document.getElementById("popupClose").addEventListener("click", closePopup);
popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });

/* Speak / Stop buttons */
document.getElementById("popupSpeak").addEventListener("click", () => {
  const name = document.getElementById("popupTitle").textContent;
  const desc = document.getElementById("popupDesc").textContent;
  const stats = [...document.querySelectorAll(".popup-stat")].map(s => s.textContent).join(". ");
  speakText(`${name}. ${desc}. ${stats}`);
});
document.getElementById("popupStop").addEventListener("click", () => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
});

function openPopup(name, icon, desc, stat1, stat2, stat3) {
  document.getElementById("popupIcon").textContent  = icon;
  document.getElementById("popupTitle").textContent = name;
  document.getElementById("popupDesc").textContent  = desc;

  const statsEl = document.getElementById("popupStats");
  statsEl.innerHTML = [stat1, stat2, stat3]
    .filter(Boolean)
    .map(s => `<div class="popup-stat">${s}</div>`)
    .join("");

  popup.classList.add("open");

  /* auto-speak on open */
  setTimeout(() => {
    speakText(`${name}. ${desc}. ${stat1}. ${stat2}. ${stat3}`);
  }, 300);
}

function closePopup() {
  popup.classList.remove("open");
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/* Global function called by onclick in HTML */
function showInfo(name, icon, desc, stat1, stat2, stat3) {
  openPopup(name, icon, desc, stat1, stat2, stat3);
}

/* ══════════════════════════════════════════════════════
   ★  STARFIELD CANVAS
====================================================== */
const starCanvas = document.getElementById("starCanvas");
const starCtx    = starCanvas.getContext("2d");
const stars      = [];

function resizeStarCanvas() {
  starCanvas.width  = window.innerWidth;
  starCanvas.height = window.innerHeight;
}
resizeStarCanvas();
window.addEventListener("resize", resizeStarCanvas);

for (let i = 0; i < 400; i++) {
  stars.push({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    r:     Math.random() * 1.8 + 0.2,
    alpha: Math.random(),
    dir:   Math.random() > 0.5 ? 1 : -1,
    speed: Math.random() * 0.008 + 0.003,
  });
}

function animateStars() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  stars.forEach(s => {
    s.alpha += s.speed * s.dir;
    if (s.alpha >= 1) { s.alpha = 1; s.dir = -1; }
    if (s.alpha <= 0) { s.alpha = 0; s.dir =  1; }

    /* glow */
    const g = starCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
    g.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
    starCtx.fillStyle = g;
    starCtx.fill();

    /* core */
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    starCtx.fill();

    /* cross sparkle for brighter stars */
    if (s.r > 1.2 && s.alpha > 0.7) {
      starCtx.save();
      starCtx.globalAlpha = s.alpha * 0.5;
      starCtx.strokeStyle = "#ffffff";
      starCtx.lineWidth   = 0.5;
      const len = s.r * 5;
      starCtx.beginPath();
      starCtx.moveTo(s.x - len, s.y); starCtx.lineTo(s.x + len, s.y);
      starCtx.moveTo(s.x, s.y - len); starCtx.lineTo(s.x, s.y + len);
      starCtx.stroke();
      starCtx.restore();
    }
  });
  requestAnimationFrame(animateStars);
}
animateStars();

/* ══════════════════════════════════════════════════════
   ☄️  SHOOTING STARS
====================================================== */
const shootCanvas = document.getElementById("shootingCanvas");
const shootCtx    = shootCanvas.getContext("2d");
shootCanvas.width  = window.innerWidth;
shootCanvas.height = window.innerHeight;
window.addEventListener("resize", () => {
  shootCanvas.width  = window.innerWidth;
  shootCanvas.height = window.innerHeight;
});

let shootingStars = [];

function spawnShootingStar() {
  shootingStars.push({
    x:      Math.random() * window.innerWidth,
    y:      Math.random() * window.innerHeight * 0.4,
    len:    120 + Math.random() * 140,
    speed:  8 + Math.random() * 9,
    angle:  (25 + Math.random() * 30) * Math.PI / 180,
    alpha:  1,
    width:  0.8 + Math.random() * 1.4,
  });
}
setInterval(spawnShootingStar, 2800);

function animateShootingStars() {
  shootCtx.clearRect(0, 0, shootCanvas.width, shootCanvas.height);
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s  = shootingStars[i];
    const tx = s.x + Math.cos(s.angle) * s.len;
    const ty = s.y + Math.sin(s.angle) * s.len;

    const grad = shootCtx.createLinearGradient(s.x, s.y, tx, ty);
    grad.addColorStop(0,   `rgba(255,255,255,0)`);
    grad.addColorStop(0.7, `rgba(200,230,255,${s.alpha * 0.6})`);
    grad.addColorStop(1,   `rgba(255,255,255,${s.alpha})`);

    shootCtx.beginPath();
    shootCtx.moveTo(s.x, s.y);
    shootCtx.lineTo(tx, ty);
    shootCtx.strokeStyle = grad;
    shootCtx.lineWidth   = s.width;
    shootCtx.stroke();

    /* head glow */
    const hg = shootCtx.createRadialGradient(tx, ty, 0, tx, ty, 5);
    hg.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
    hg.addColorStop(1, "rgba(0,0,0,0)");
    shootCtx.beginPath();
    shootCtx.arc(tx, ty, 5, 0, Math.PI * 2);
    shootCtx.fillStyle = hg;
    shootCtx.fill();

    s.x    += Math.cos(s.angle) * s.speed;
    s.y    += Math.sin(s.angle) * s.speed;
    s.alpha -= 0.015;
    if (s.alpha <= 0 || s.x > shootCanvas.width || s.y > shootCanvas.height) {
      shootingStars.splice(i, 1);
    }
  }
  requestAnimationFrame(animateShootingStars);
}
animateShootingStars();

/* ══════════════════════════════════════════════════════
   ✨  SPARKLES (DOM)
====================================================== */
function createSparkle() {
  const el   = document.createElement("div");
  el.className = "sparkle";
  const size = 3 + Math.random() * 6;
  el.style.cssText = `
    width:  ${size}px;
    height: ${size}px;
    left:   ${Math.random() * 100}vw;
    top:    ${Math.random() * 100}vh;
    animation-duration: ${2 + Math.random() * 3}s;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}
setInterval(createSparkle, 180);

/* ══════════════════════════════════════════════════════
   🪨  ASTEROIDS (DOM)
====================================================== */
function createAsteroid() {
  const el   = document.createElement("div");
  el.className = "asteroid";
  const size = 2 + Math.random() * 4;
  el.style.cssText = `
    width:  ${size}px;
    height: ${size}px;
    left:   ${Math.random() * 100}vw;
    top:    ${Math.random() * 60 + 20}vh;
    --ax:   ${(Math.random() - 0.5) * 500}px;
    --ay:   ${Math.random() * 500 + 100}px;
    animation-duration: ${12 + Math.random() * 16}s;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 28000);
}
setInterval(createAsteroid, 1200);

/* ══════════════════════════════════════════════════════
   🖱  MOUSE PARALLAX
====================================================== */
document.addEventListener("mousemove", e => {
  const x = (e.clientX / window.innerWidth  - 0.5) * 18;
  const y = (e.clientY / window.innerHeight - 0.5) * 18;
  solarSystem.style.filter =
    `drop-shadow(${x}px ${y}px 22px rgba(0,229,255,0.28))`;
});

/* ══════════════════════════════════════════════════════
   📱  PINCH-TO-ZOOM
====================================================== */
let lastPinch = null;
document.addEventListener("touchmove", e => {
  if (e.touches.length === 2) {
    const dx   = e.touches[0].clientX - e.touches[1].clientX;
    const dy   = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (lastPinch !== null) {
      const delta = dist - lastPinch;
      zoomLevel = Math.min(Math.max(zoomLevel + delta * 0.005, 0.25), 2.5);
      solarSystem.style.transform = `scale(${zoomLevel})`;
    }
    lastPinch = dist;
  }
}, { passive: true });
document.addEventListener("touchend", () => { lastPinch = null; });

/* ══════════════════════════════════════════════════════
   ⌨️  KEYBOARD SHORTCUTS
====================================================== */
document.addEventListener("keydown", e => {
  switch (e.key) {
    case "+": case "=":  zoomIn();           break;
    case "-": case "_":  zoomOut();          break;
    case "m": case "M":  toggleSound();      break;
    case "p": case "P":  togglePause();      break;
    case "f": case "F":  triggerFlyThrough(); break;
    case "Escape":
      closePopup();
      zoomLevel = 1;
      solarSystem.style.transform = "scale(1)";
      break;
  }
});

/* ══════════════════════════════════════════════════════
   🚀  INITIAL INFO CARD (sidebar — kept for compatibility)
====================================================== */
(function initSidebar() {
  const infoTitle = document.getElementById("infoTitle");
  const infoDesc  = document.getElementById("infoDesc");
  const infoStats = document.getElementById("infoStats");
  const icon      = document.getElementById("infoPlanetIcon");
  if (infoTitle) infoTitle.textContent = "Solar System";
  if (infoDesc)  infoDesc.textContent  = "Click any planet to explore it.";
  if (icon)      icon.textContent      = "🌌";
  if (infoStats) infoStats.innerHTML   = `
    <div class="stat-row">Planets: 8</div>
    <div class="stat-row">Star: 1 (Sun)</div>
    <div class="stat-row">Age: 4.6 Billion years</div>
  `;
})();
