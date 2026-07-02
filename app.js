const APP_NAME = "Nattero";
const STORAGE_NAMESPACE = "nattero";

const PLAN_KEY = `${STORAGE_NAMESPACE}.sleepPlan.v1`;
const CHECKLIST_KEY = `${STORAGE_NAMESPACE}.eveningChecklist.v1`;
const LEGACY_DIARY_KEY = `${STORAGE_NAMESPACE}.diary.v1`;
const STREAK_KEY = `${STORAGE_NAMESPACE}.streak.v1`;

const DIARY_DB_NAME = STORAGE_NAMESPACE;
const DIARY_DB_VERSION = 1;
const DIARY_STORE = "diaryEntries";

let diaryDbPromise = null;
let diaryMigrationPromise = null;
let reminderTimeoutId = null;

// ─── STEPPER DATA ────────────────────────────────────────────────────────────

const steps = [
  {
    "kicker": "Start her",
    "title": "Stop kampen",
    "text": "Når du begynder at presse dig selv til at sove, bliver kroppen ofte mere vågen. Sig stille til dig selv: Jeg behøver ikke løse hele natten. Jeg tager kun næste skridt.",
    "tip": "Tip: Lad være med at tjekke klokken igen og igen. Det gør ofte natten mere anspændt."
  },
  {
    "kicker": "Kroppen først",
    "title": "Læg mærke til underlaget",
    "text": "Mærk hvor kroppen har kontakt med madrassen. Hoved, skuldre, ryg, ben og fødder. Du skal ikke slappe perfekt af. Du skal bare registrere kroppen roligt.",
    "tip": "Prøv: Her er hovedet. Her er skuldrene. Her er madrassen. Gentag langsomt."
  },
  {
    "kicker": "Vejrtrækning",
    "title": "Gør udåndingen lidt længere",
    "text": "Træk vejret naturligt ind. Pust langsomt ud, en smule længere end indåndingen. Lang udånding kan fortælle nervesystemet, at der ikke er akut fare.",
    "tip": "Ingen præstation. Hvis det bliver anstrengende, så vend tilbage til almindelig vejrtrækning."
  },
  {
    "kicker": "Tankemylder",
    "title": "Parkér tankerne",
    "text": "Hvis hovedet planlægger, bekymrer sig eller gennemgår dagen, så giv tankerne en parkeringsplads. Skriv få stikord ned, eller sig: Det her skal ikke løses i nat. Det tager jeg i morgen.",
    "tip": "Du skal ikke arbejde videre med tankerne. Du skal bare have dem ud af hovedet."
  },
  {
    "kicker": "Stimuluskontrol",
    "title": "Styrk koblingen mellem seng og søvn",
    "text": "Hvis du bliver mere vågen, irriteret eller anspændt, så stå roligt op. Hold lyset dæmpet og lav noget stille, kedeligt og trygt. Gå tilbage i seng, når søvnigheden kommer igen.",
    "tip": "Pointen er ikke at give op. Pointen er at undgå, at sengen bliver et sted, hvor du kæmper."
  },
  {
    "kicker": "Kedeligt er godt",
    "title": "Lav noget dæmpet",
    "text": "Læs noget uinteressant, fold tøj, lyt til rolig lyd eller sid stille. Undgå skærm, nyheder, arbejde og alt der får dig op i gear.",
    "tip": "Gå tilbage i seng, når kroppen igen føles søvnig — ikke bare fordi klokken siger det."
  },
  {
    "kicker": "I morgen",
    "title": "Hold fast i morgenen",
    "text": "Efter en dårlig nat er det fristende at sove længe. Men et nogenlunde fast stå-op-tidspunkt hjælper kroppen med at finde rytmen igen.",
    "tip": "Ved flere dårlige nætter i træk: brug din søvnplan og kontakt læge eller behandler ved bekymring."
  }
];

// ─── GUIDES DATA ─────────────────────────────────────────────────────────────

const guideTopics = [
  {
    id: "sleep-now",
    category: "Akut",
    icon: "⚡",
    title: "Jeg ligger vågen",
    teaser: "Når natten er i gang, og du ikke kan sove.",
    actionLabel: "Åbn akut-guide",
    route: "now"
  },
  {
    id: "good-habits",
    category: "Dag",
    icon: "☀️",
    title: "Gode søvnvaner",
    teaser: "Koffein, lys, motion, lure og ting der påvirker natten."
  },
  {
    id: "evening-routine",
    category: "Aften",
    icon: "🌙",
    title: "Aften og soveværelse",
    teaser: "Neddrosling, skærme, tanker, temperatur og ro."
  },
  {
    id: "learn-sleep",
    category: "Info",
    icon: "📚",
    title: "Lær om søvn",
    teaser: "Søvnbehov, søvnkontrol, medicin og hvorfor kamp gør det værre."
  }
];

const guidesData = [
  {
    "id": "morning-light",
    "category": "Morgen",
    "title": "Start rytmen med lys",
    "text": "Stå op på nogenlunde samme tidspunkt og få dagslys tidligt. Det hjælper kroppen med at forstå, hvornår dagen starter."
  },
  {
    "id": "morning-fixed",
    "category": "Morgen",
    "title": "Hold fast i stå-op-tiden",
    "text": "En fast morgen er ofte vigtigere end en perfekt sengetid. Dårlige nætter rettes bedst med en stabil start på dagen."
  },
  {
    "id": "day-movement",
    "category": "Dag",
    "title": "Brug kroppen i dagtimerne",
    "text": "Gåtur, let motion eller anden bevægelse i løbet af dagen kan øge søvnpresset. Undgå hård træning lige før sengetid."
  },
  {
    "id": "day-naps",
    "category": "Dag",
    "title": "Pas på lange lure",
    "text": "En kort lur kan være okay, men lange eller sene lure stjæler ofte søvnpresset fra natten. Hold den kort og tidligt på dagen."
  },
  {
    "id": "caffeine",
    "category": "Dag",
    "title": "Koffein skal stoppe tidligt",
    "text": "Kaffe, cola, energidrik og stærk te kan blive hængende længe i kroppen. Prøv at stoppe senest midt på eftermiddagen — og tidligere, hvis du er følsom."
  },
  {
    "id": "evening-winddown",
    "category": "Aften",
    "title": "Gør aftenen kedelig på den gode måde",
    "text": "Luk dagens vigtige opgaver ned først, og lad aftenen blive roligere trin for trin. Mindre lys, færre krav og lavere tempo gør overgangen til søvn lettere."
  },
  {
    "id": "screens-light",
    "category": "Aften",
    "title": "Dæmp lys og skærme",
    "text": "Den sidste time før sengetid bør være lav på lys og høj på ro. Hvis du bruger skærm, så dæmp lysstyrken og vælg noget udramatisk."
  },
  {
    "id": "bedroom",
    "category": "Aften",
    "title": "Gør soveværelset søvnvenligt",
    "text": "Mørkt, roligt og køligt er det sikre valg. Luft ud, skru ned for varme, brug eventuelt ørepropper og fjern ting der minder om arbejde."
  },
  {
    "id": "food-alcohol",
    "category": "Aften",
    "title": "Undgå at kroppen arbejder på overtid",
    "text": "Gå hverken sulten eller overmæt i seng. Alkohol kan gøre dig døsig, men søvnen bliver ofte mere urolig og afbrudt."
  },
  {
    "id": "thought-parking",
    "category": "Akut",
    "title": "Tøm hovedet uden at løse alt",
    "text": "Skriv de tanker ned, der kører rundt. Ikke lange forklaringer. Bare stikord. Når tanken dukker op igen, kan du minde dig selv om, at den er gemt til i morgen."
  },
  {
    "id": "night",
    "category": "Akut",
    "title": "Jeg vågner om natten",
    "text": "Tjek ikke klokken igen og igen. Hvis du bliver mere vågen, så stå roligt op, hold lyset dæmpet og lav noget kedeligt, indtil søvnigheden vender tilbage."
  },
  {
    "id": "fall-asleep",
    "category": "Akut",
    "title": "Jeg kan ikke falde i søvn",
    "text": "Lad være med at presse søvnen frem. Hvis sengen bliver en kampplads, så brug stimuluskontrol: op, dæmpet lys, kedelig aktivitet og tilbage først ved søvnighed."
  },
  {
    "id": "visual-memory",
    "category": "Akut",
    "title": "Gå langsomt gennem et trygt minde",
    "text": "Vælg en god ferie eller en rolig periode. Gennemgå den i detaljer: hvad du pakkede, hvor du gik hen, hvem der var der. Når tankerne hopper, vender du stille tilbage."
  },
  {
    "id": "countdown",
    "category": "Akut",
    "title": "Tavleøvelsen",
    "text": "Forestil dig en tavle. Skriv 100, visk det ud, skriv 99, og fortsæt langsomt nedad. Det er ikke vigtigt at nå langt. Det vigtige er at vende tilbage, når tankerne flyver."
  },
  {
    "id": "sleep-thoughts",
    "category": "Info",
    "title": "Søvn bliver dårligere af kamp",
    "text": "Negative tanker om søvn holder kroppen vågen. Prøv i stedet: Det er okay, at jeg hviler. Jeg behøver ikke vinde over natten lige nu."
  },
  {
    "id": "sleep-need",
    "category": "Info",
    "title": "Søvnbehov er forskelligt",
    "text": "Mange voksne ligger omkring 7-8 timer, men der er normal variation. Kig efter funktion og mønstre over tid — ikke én enkelt dårlig nat."
  },
  {
    "id": "meds",
    "category": "Info",
    "title": "Medicin og søvn",
    "text": "Noget medicin kan virke opkvikkende, andet kan sløve. Ændr ikke medicin selv. Tal med læge eller behandler, hvis søvnen ændrer sig tydeligt."
  },
  {
    "id": "tracker-clock",
    "category": "Info",
    "title": "Pas på søvnkontrol",
    "text": "Søvntracker og klokketjek kan gøre dig mere optaget af søvnen. Hvis det stresser dig, så læg målingerne væk i en periode."
  }
];

// ─── BREATHING TECHNIQUES ────────────────────────────────────────────────────

const breathingTechniques = {
  "478": {
    label: "4-7-8",
    phases: [
      { name: "Træk ind", duration: 4 },
      { name: "Hold", duration: 7 },
      { name: "Pust ud", duration: 8 }
    ],
    description: "Klassisk afslapningsteknik. Trækker vejret ind i 4 sek., holder i 7, puster ud i 8. Beroligende for nervesystemet."
  },
  "box": {
    label: "Box breathing",
    phases: [
      { name: "Træk ind", duration: 4 },
      { name: "Hold", duration: 4 },
      { name: "Pust ud", duration: 4 },
      { name: "Hold", duration: 4 }
    ],
    description: "Brugt af bl.a. soldater og atleter til at falde til ro hurtigt. Fire lige lange faser."
  },
  "simple": {
    label: "Simpel rytme",
    phases: [
      { name: "Ind", duration: 4 },
      { name: "Ud", duration: 6 }
    ],
    description: "Enkel og blid. Lidt længere udånding end indånding — det er nok til at skrue ned for alarmberedskabet."
  }
};

const GUIDED_AUDIO_PREROLL = 10;
const guidedAudioTracks = [
  {
    id: "body",
    icon: "🛏️",
    label: "Kroppen mod madrassen",
    duration: "ca. 5 min.",
    file: "assets/audio/kroppen-mod-madrassen.mp3"
  },
  {
    id: "breathing",
    icon: "🌬️",
    label: "Rolig vejrtrækning",
    duration: "ca. 5 min.",
    file: "assets/audio/rolig-vejrtraekning.mp3"
  },
  {
    id: "sleep-fight",
    icon: "🌙",
    label: "Kampen mod søvnen",
    duration: "ca. 4 min.",
    file: "assets/audio/kampen-mod-soevnen.mp3"
  },
  {
    id: "memory",
    icon: "✨",
    label: "Et roligt minde",
    duration: "ca. 5 min.",
    file: "assets/audio/et-minde.mp3"
  }
];

// ─── BACKGROUND SOUNDS ───────────────────────────────────────────────────────

const SOUND_PREROLL = 10;
const backgroundSoundTracks = [
  {
    id: "white",
    icon: "〰️",
    label: "Hvid støj",
    description: "En jævn lyd, der kan dæmpe forstyrrende lyde omkring dig.",
    file: "assets/audio/hvid-stoej.mp3"
  },
  {
    id: "rain",
    icon: "🌧️",
    label: "Regn",
    description: "Rolig regn uden pludselige eller kraftige lyde.",
    file: "assets/audio/regn.mp3"
  },
  {
    id: "forest",
    icon: "🌲",
    label: "Skov",
    description: "Et roligt skovmiljø med vind, blade og afdæmpede naturlyde.",
    file: "assets/audio/skov.mp3"
  }
];

let audioCtx = null;
let soundNodes = [];
let generatedSoundToken = 0;
let backgroundAudioEl = null;
let activeSoundId = null;
let soundCountdownTimer = null;
let soundCountdownPoll = null;
let soundCountdownUntil = 0;
let soundUiPoll = null;
let soundFallbackPlaying = false;
let soundFallbackPaused = false;
let soundFallbackStartedAt = 0;
let soundFallbackElapsed = 0;
let soundNotice = "";
let guidedAudioEl = null;
let activeGuidedAudioId = null;
let guidedAudioPoll = null;
let guidedAudioError = "";

function findBackgroundSound(trackId) {
  return backgroundSoundTracks.find(track => track.id === trackId) || null;
}

function getBackgroundAudioElement() {
  if (backgroundAudioEl) return backgroundAudioEl;

  backgroundAudioEl = new Audio();
  backgroundAudioEl.preload = "metadata";
  backgroundAudioEl.loop = true;
  backgroundAudioEl.volume = 0.85;

  ["loadedmetadata", "durationchange", "timeupdate", "play", "pause"].forEach(eventName => {
    backgroundAudioEl.addEventListener(eventName, syncSoundUI);
  });

  return backgroundAudioEl;
}

async function getReadyAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio API understøttes ikke af denne browser.");

  if (!audioCtx || audioCtx.state === "closed") audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  if (audioCtx.state !== "running") {
    throw new Error(`Lyd kunne ikke startes (status: ${audioCtx.state}).`);
  }

  return audioCtx;
}

function clearSoundCountdown() {
  if (soundCountdownTimer) clearTimeout(soundCountdownTimer);
  if (soundCountdownPoll) clearInterval(soundCountdownPoll);
  soundCountdownTimer = null;
  soundCountdownPoll = null;
  soundCountdownUntil = 0;
}

function ensureSoundUiPoll() {
  if (soundUiPoll) return;
  soundUiPoll = setInterval(syncSoundUI, 500);
}

function clearSoundUiPoll() {
  if (soundUiPoll) clearInterval(soundUiPoll);
  soundUiPoll = null;
}

function stopGeneratedSound() {
  generatedSoundToken++;
  soundNodes.forEach(node => {
    try { node.stop(); } catch (_) {}
    try { node.disconnect(); } catch (_) {}
  });
  soundNodes = [];
  soundFallbackPlaying = false;
}

function makeWhiteNoise(ctx) {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;

  const gain = ctx.createGain();
  gain.gain.value = 0.18;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return [source, filter, gain];
}

function makeRain(ctx) {
  const nodes = [];
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 600;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.value = 0.22;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  nodes.push(source, filter, gain);

  const rumble = ctx.createOscillator();
  rumble.type = "sine";
  rumble.frequency.value = 55;

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.035;

  rumble.connect(rumbleGain);
  rumbleGain.connect(ctx.destination);
  rumble.start();
  nodes.push(rumble, rumbleGain);

  return nodes;
}

function makeForest(ctx, token) {
  const nodes = [];
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;

  const gain = ctx.createGain();
  gain.gain.value = 0.10;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  nodes.push(source, filter, gain);

  const scheduleChirp = () => {
    if (token !== generatedSoundToken || activeSoundId !== "forest" || !soundFallbackPlaying) return;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    const baseFreq = 1800 + Math.random() * 1200;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.15, ctx.currentTime + 0.06);
    osc.frequency.linearRampToValueAtTime(baseFreq, ctx.currentTime + 0.12);

    const chirpGain = ctx.createGain();
    chirpGain.gain.setValueAtTime(0, ctx.currentTime);
    chirpGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.03);
    chirpGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.14);

    osc.connect(chirpGain);
    chirpGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    setTimeout(scheduleChirp, 1800 + Math.random() * 3000);
  };

  setTimeout(scheduleChirp, 800);
  return nodes;
}

async function startGeneratedSound(id) {
  const ctx = await getReadyAudioContext();
  stopGeneratedSound();
  const token = generatedSoundToken;

  if (id === "white") soundNodes = makeWhiteNoise(ctx);
  else if (id === "rain") soundNodes = makeRain(ctx);
  else if (id === "forest") soundNodes = makeForest(ctx, token);
  else throw new Error("Ukendt lydvalg.");

  soundFallbackPlaying = true;
  soundFallbackPaused = false;
  soundFallbackStartedAt = Date.now() - soundFallbackElapsed * 1000;
}

function stopSound(resetSelection = true) {
  clearSoundCountdown();
  clearSoundUiPoll();

  const audio = backgroundAudioEl;
  if (audio) {
    audio.pause();
    try { audio.currentTime = 0; } catch (_) {}
    if (resetSelection) {
      audio.removeAttribute("src");
      audio.load();
    }
  }

  stopGeneratedSound();
  soundFallbackPaused = false;
  soundFallbackElapsed = 0;
  soundFallbackStartedAt = 0;
  soundNotice = "";

  if (resetSelection) activeSoundId = null;
  syncSoundUI();
}

async function beginSoundPlayback(restart = true) {
  const track = findBackgroundSound(activeSoundId);
  if (!track) return;

  stopGuidedAudio(true);
  clearSoundCountdown();
  soundNotice = "";
  soundFallbackElapsed = restart ? 0 : soundFallbackElapsed;

  const audio = getBackgroundAudioElement();
  stopGeneratedSound();
  audio.pause();

  try {
    const currentSource = audio.getAttribute("src") || "";
    if (currentSource !== track.file) {
      audio.src = track.file;
      audio.load();
      await waitForAudioMetadata(audio);
    }

    if (restart || audio.ended) audio.currentTime = 0;
    audio.loop = true;
    await audio.play();
    soundFallbackPaused = false;
  } catch (error) {
    console.warn(`${APP_NAME} kunne ikke indlæse ${track.file}; bruger midlertidig lyd:`, error);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    try {
      await startGeneratedSound(track.id);
      soundNotice = "MP3-filen er ikke lagt ind endnu. Der afspilles en midlertidig lyd.";
    } catch (fallbackError) {
      console.warn(`${APP_NAME} kunne ikke starte baggrundslyd:`, fallbackError);
      soundNotice = "Lyden kunne ikke startes. Tjek telefonens lydindstillinger og prøv igen.";
    }
  }

  ensureSoundUiPoll();
  syncSoundUI();
}

function selectSoundTrack(trackId) {
  const track = findBackgroundSound(trackId);
  if (!track) return;

  stopSound(true);
  activeSoundId = track.id;
  soundNotice = "";
  syncSoundUI();
  scrollModalToElement($("#soundPlayer"));
}

function startSound(mode = "now") {
  if (!findBackgroundSound(activeSoundId)) return;

  if (mode === "delay") {
    stopSound(false);
    soundCountdownUntil = Date.now() + SOUND_PREROLL * 1000;
    soundCountdownTimer = setTimeout(() => beginSoundPlayback(true), SOUND_PREROLL * 1000);
    soundCountdownPoll = setInterval(syncSoundUI, 200);
    syncSoundUI();
    return;
  }

  beginSoundPlayback(true);
}

async function toggleSoundPlayback() {
  if (!findBackgroundSound(activeSoundId)) return;

  if (soundCountdownUntil) {
    clearSoundCountdown();
    syncSoundUI();
    return;
  }

  if (soundFallbackPlaying) {
    soundFallbackElapsed = Math.max(0, (Date.now() - soundFallbackStartedAt) / 1000);
    stopGeneratedSound();
    soundFallbackPaused = true;
    syncSoundUI();
    return;
  }

  if (soundFallbackPaused) {
    try {
      await startGeneratedSound(activeSoundId);
      ensureSoundUiPoll();
    } catch (error) {
      soundNotice = "Lyden kunne ikke fortsætte på denne enhed.";
    }
    syncSoundUI();
    return;
  }

  const audio = getBackgroundAudioElement();
  if (!audio.getAttribute("src")) {
    await beginSoundPlayback(false);
    return;
  }

  try {
    if (audio.paused) await audio.play();
    else audio.pause();
  } catch (error) {
    soundNotice = "Lyden kunne ikke fortsætte. Tryk på Start nu og prøv igen.";
  }
  syncSoundUI();
}

async function restartSound() {
  if (!findBackgroundSound(activeSoundId)) return;

  clearSoundCountdown();
  soundFallbackElapsed = 0;
  soundFallbackStartedAt = Date.now();

  if (soundFallbackPlaying || soundFallbackPaused) {
    try {
      await startGeneratedSound(activeSoundId);
      ensureSoundUiPoll();
    } catch (error) {
      soundNotice = "Lyden kunne ikke startes forfra på denne enhed.";
    }
    syncSoundUI();
    return;
  }

  const audio = getBackgroundAudioElement();
  if (!audio.getAttribute("src")) {
    await beginSoundPlayback(true);
    return;
  }

  try {
    audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    soundNotice = "Lyden kunne ikke startes forfra på denne enhed.";
  }
  syncSoundUI();
}

function stopSoundPlayback() {
  stopSound(false);
  soundNotice = "Lyden er stoppet. Vælg Start nu eller Start om 10 sekunder for at begynde igen.";
  syncSoundUI();
}

function syncSoundUI() {
  const track = findBackgroundSound(activeSoundId);
  const audio = backgroundAudioEl;
  const player = $("#soundPlayer");
  const icon = $("#soundPlayerIcon");
  const title = $("#soundPlayerTitle");
  const meta = $("#soundPlayerMeta");
  const status = $("#soundStatus");
  const progress = $("#soundProgress");
  const current = $("#soundCurrent");
  const total = $("#soundTotal");
  const startNowBtn = $("#soundStartNowBtn");
  const startDelayedBtn = $("#soundStartDelayedBtn");
  const playPauseBtn = $("#soundPlayPauseBtn");
  const restartBtn = $("#soundRestartBtn");
  const stopBtn = $("#soundStopBtn");
  const countdownWrap = $("#soundCountdown");
  const countdownNumber = $("#soundCountdownNumber");
  const countdownCircle = $("#soundCountdownCircle");

  $$("[data-sound]").forEach(button => {
    button.classList.toggle("sound-active", button.dataset.sound === activeSoundId);
  });

  if (!player) return;

  if (!track) {
    if (icon) icon.textContent = "🎧";
    if (title) title.textContent = "Vælg en baggrundslyd";
    if (meta) meta.textContent = "Vælg hvid støj, regn eller skov.";
    if (status) status.textContent = "Ingen lyd valgt endnu.";
    if (progress) progress.style.width = "0%";
    if (current) current.textContent = "0:00";
    if (total) total.textContent = "0:00";
    if (startNowBtn) startNowBtn.disabled = true;
    if (startDelayedBtn) startDelayedBtn.disabled = true;
    if (playPauseBtn) { playPauseBtn.disabled = true; playPauseBtn.textContent = "Pause"; }
    if (restartBtn) restartBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (countdownWrap) countdownWrap.hidden = true;
    return;
  }

  const countdownActive = soundCountdownUntil > Date.now();
  const fileHasSource = Boolean(audio?.getAttribute("src"));
  const filePlaying = Boolean(fileHasSource && audio && !audio.paused);
  const filePaused = Boolean(fileHasSource && audio?.paused);
  const fallbackActive = soundFallbackPlaying || soundFallbackPaused;
  const isPlaying = filePlaying || soundFallbackPlaying;
  const canControl = fileHasSource || fallbackActive;

  if (icon) icon.textContent = track.icon;
  if (title) title.textContent = track.label;
  if (meta) meta.textContent = `${track.description} Lyden gentages, indtil du stopper den.`;

  if (startNowBtn) startNowBtn.disabled = countdownActive;
  if (startDelayedBtn) startDelayedBtn.disabled = countdownActive;
  if (playPauseBtn) {
    playPauseBtn.disabled = !canControl && !countdownActive;
    playPauseBtn.textContent = countdownActive ? "Annuller" : isPlaying ? "Pause" : "Fortsæt";
  }
  if (restartBtn) restartBtn.disabled = !canControl;
  if (stopBtn) stopBtn.disabled = !canControl && !countdownActive;

  if (countdownWrap) countdownWrap.hidden = !countdownActive;
  if (countdownActive) {
    const remainingMs = Math.max(0, soundCountdownUntil - Date.now());
    const remaining = Math.max(1, Math.ceil(remainingMs / 1000));
    const elapsedPct = Math.min(100, Math.max(0, ((SOUND_PREROLL * 1000 - remainingMs) / (SOUND_PREROLL * 1000)) * 100));
    if (countdownNumber) countdownNumber.textContent = String(remaining);
    if (countdownCircle) countdownCircle.style.setProperty("--progress", String(elapsedPct));
  }

  if (fileHasSource && audio && Number.isFinite(audio.duration) && audio.duration > 0) {
    const pct = Math.min(100, (audio.currentTime / audio.duration) * 100);
    if (progress) progress.style.width = `${pct}%`;
    if (current) current.textContent = formatMediaTime(audio.currentTime);
    if (total) total.textContent = formatMediaTime(audio.duration);
  } else if (fallbackActive) {
    const elapsed = soundFallbackPlaying
      ? Math.max(0, (Date.now() - soundFallbackStartedAt) / 1000)
      : soundFallbackElapsed;
    if (progress) progress.style.width = "0%";
    if (current) current.textContent = formatMediaTime(elapsed);
    if (total) total.textContent = "Løkke";
  } else {
    if (progress) progress.style.width = "0%";
    if (current) current.textContent = "0:00";
    if (total) total.textContent = "0:00";
  }

  if (status) {
    if (soundNotice) status.textContent = soundNotice;
    else if (countdownActive) status.textContent = "Du kan lægge telefonen fra dig nu. Lyden starter om et øjeblik.";
    else if (isPlaying) status.textContent = `${track.label} spiller i en rolig løkke…`;
    else if (filePaused || soundFallbackPaused) status.textContent = "Lyden er sat på pause.";
    else status.textContent = "Klar. Vælg Start nu eller Start om 10 sekunder.";
  }
}

// ─── STATE ────────────────────────────────────────────────────────────────────

let currentStep = 0;
let deferredInstallPrompt = null;
let selectedQuality = 0;
let breathTimer = null;
let breathPhaseIndex = 0;
let breathCycleCount = 0;
let currentTechnique = null;
let modalOpener = null;
let drawerOpener = null;
let overlayScrollY = 0;
let overlayScrollLocked = false;

// ─── UTILITIES ───────────────────────────────────────────────────────────────

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function focusFirstElement(container) {
  requestAnimationFrame(() => {
    const first = container?.querySelector(FOCUSABLE_SELECTOR);
    first?.focus();
  });
}

function getFocusReturnTarget(element) {
  return element instanceof HTMLElement && document.contains(element) ? element : null;
}

function restoreFocus(element) {
  const target = getFocusReturnTarget(element);
  if (target) requestAnimationFrame(() => target.focus());
}

function lockPageScroll() {
  if (overlayScrollLocked) return;
  overlayScrollY = window.scrollY || window.pageYOffset || 0;
  document.documentElement.classList.add("overlay-open");
  document.body.classList.add("overlay-open");
  document.body.style.top = `-${overlayScrollY}px`;
  overlayScrollLocked = true;
}

function unlockPageScroll() {
  if (!overlayScrollLocked) return;
  if ($(".modal.open, .drawer.open")) return;

  document.documentElement.classList.remove("overlay-open");
  document.body.classList.remove("overlay-open");
  document.body.style.top = "";
  overlayScrollLocked = false;
  window.scrollTo({ top: overlayScrollY, left: 0, behavior: "auto" });
}

function scrollModalToElement(element) {
  if (!(element instanceof HTMLElement)) return;

  requestAnimationFrame(() => {
    const card = element.closest(".modal-card");
    if (!(card instanceof HTMLElement)) return;

    const cardRect = card.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const targetTop = Math.max(0, card.scrollTop + elementRect.top - cardRect.top - 12);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    card.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" });
  });
}

function navigate(route) {
  const target = document.querySelector(`[data-screen="${route}"]`);
  if (!target) return;
  $$(".screen").forEach(s => s.classList.toggle("active", s.dataset.screen === route));
  $$("[data-route]").forEach(b => b.classList.toggle("active", b.dataset.route === route));
  closeDrawer();
  closeModal();
  history.replaceState(null, "", `#${route}`);
  $("#mainContent")?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (route === "diary") void renderDiary();
}

// ─── STEPPER ─────────────────────────────────────────────────────────────────

function renderStep() {
  const step = steps[currentStep];
  if (!step) return;

  const stepCount = $("#stepCount");
  const progressFill = $("#progressFill");
  const prevStep = $("#prevStep");
  const nextStep = $("#nextStep");

  if (stepCount) stepCount.textContent = `Trin ${currentStep + 1} af ${steps.length}`;
  if (progressFill) progressFill.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
  if ($("#stepKicker")) $("#stepKicker").textContent = step.kicker;
  if ($("#stepTitle")) $("#stepTitle").textContent = step.title;
  if ($("#stepText")) $("#stepText").textContent = step.text;
  if ($("#stepTip")) $("#stepTip").textContent = step.tip;
  if (prevStep) {
    prevStep.disabled = currentStep === 0;
    prevStep.style.opacity = currentStep === 0 ? ".45" : "1";
  }
  if (nextStep) nextStep.textContent = currentStep === steps.length - 1 ? "Start forfra" : "Næste";
}

// ─── GUIDES ───────────────────────────────────────────────────────────────────

function getGuideTagClass(category) {
  return { "Morgen": "tag-morning", "Dag": "tag-day", "Aften": "tag-evening", "Akut": "tag-acute", "Info": "tag-info" }[category] || "tag-info";
}

function getTopicItems(topicId) {
  const groups = {
    "sleep-now": ["thought-parking", "night", "fall-asleep", "visual-memory", "countdown"],
    "good-habits": ["morning-light", "morning-fixed", "day-movement", "day-naps", "caffeine"],
    "evening-routine": ["evening-winddown", "screens-light", "bedroom", "food-alcohol"],
    "learn-sleep": ["sleep-thoughts", "sleep-need", "meds", "tracker-clock"]
  };
  const ids = groups[topicId] || [];
  return ids.map(id => guidesData.find(g => g.id === id)).filter(Boolean);
}

function renderGuides() {
  const grid = $("#topicGrid");
  if (!grid) return;
  grid.innerHTML = guideTopics.map(topic => `
    <button class="topic-card ${getGuideTagClass(topic.category)}-card" data-topic="${topic.id}" type="button">
      <span class="topic-icon" aria-hidden="true">${topic.icon}</span>
      <span class="guide-tag ${getGuideTagClass(topic.category)}">${topic.category}</span>
      <strong>${topic.title}</strong>
      <small>${topic.teaser}</small>
    </button>
  `).join("");
}

function openGuideTopic(topicId, opener = document.activeElement) {
  const topic = guideTopics.find(t => t.id === topicId);
  if (!topic) return;
  const items = getTopicItems(topicId);
  const action = topic.route ? `<button class="primary-button modal-action" data-route="${topic.route}" type="button">${topic.actionLabel || "Åbn"}</button>` : "";
  openModal(`
    <div class="topic-modal-head">
      <span class="topic-icon large" aria-hidden="true">${topic.icon}</span>
      <p class="eyebrow">${topic.category}</p>
      <h2 id="modalTitle">${topic.title}</h2>
      <p>${topic.teaser}</p>
    </div>
    <div class="topic-modal-list">
      ${items.map(g => `
        <article class="topic-modal-item">
          <h3>${g.title}</h3>
          <p>${g.text}</p>
        </article>
      `).join("")}
    </div>
    ${action}
  `, opener);
}

// ─── CHECKLIST & STREAK ──────────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || "{}"); }
  catch { return {}; }
}

function saveStreak(data) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function getStreakCount(streakData) {
  let count = 0;
  const today = getTodayKey();
  let d = new Date(today);
  const maxDays = 3650;
  while (count < maxDays) {
    const key = d.toISOString().slice(0, 10);
    if (!streakData[key]) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function updateStreakDisplay() {
  const el = $("#streakDisplay");
  if (!el) return;
  const data = loadStreak();
  const count = getStreakCount(data);
  if (count === 0) { el.textContent = ""; return; }
  const flames = count >= 7 ? "🔥🔥🔥" : count >= 3 ? "🔥🔥" : "🔥";
  el.textContent = `${flames} ${count} aften${count !== 1 ? "er" : ""} i træk`;
}

function checkAllChecked() {
  const items = $$('[data-checklist-item]');
  const allChecked = items.length > 0 && items.every(i => i.checked);
  if (allChecked) {
    const streakData = loadStreak();
    streakData[getTodayKey()] = true;
    saveStreak(streakData);
    updateStreakDisplay();
  }
}

function setupChecklist() {
  const items = $$('[data-checklist-item]');
  if (!items.length) return;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "{}"); } catch { localStorage.removeItem(CHECKLIST_KEY); }
  items.forEach(item => {
    item.checked = Boolean(saved[item.dataset.checklistItem]);
    item.addEventListener("change", () => {
      const state = Object.fromEntries(items.map(i => [i.dataset.checklistItem, i.checked]));
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
      checkAllChecked();
    });
  });
  updateStreakDisplay();
}

// ─── SLEEP PLAN ───────────────────────────────────────────────────────────────

function loadPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}");
    const form = $("#sleepPlan");
    if (!form) return;
    Object.entries(saved).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
  } catch { localStorage.removeItem(PLAN_KEY); }
}

function savePlan(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  localStorage.setItem(PLAN_KEY, JSON.stringify(data));
  const s = $("#saveStatus");
  if (s) {
    s.textContent = "Planen er gemt på denne enhed.";
    setTimeout(() => { if (s.isConnected) s.textContent = ""; }, 3200);
  }
}

function clearPlan() {
  localStorage.removeItem(PLAN_KEY);
  $("#sleepPlan")?.reset();
  const status = $("#saveStatus");
  if (status) status.textContent = "Planen er ryddet.";
}

// ─── REMINDER ─────────────────────────────────────────────────────────────────

function setupReminder() {
  $("#setReminder")?.addEventListener("click", async () => {
    clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;

    const timeVal = $("#reminderTime")?.value;
    const status = $("#reminderStatus");
    if (!status) return;
    if (!timeVal) { status.textContent = "Vælg et tidspunkt først."; return; }

    if (!("Notification" in window)) {
      status.textContent = "Din browser understøtter ikke påmindelser."; return;
    }
    let permission;
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      console.warn(`${APP_NAME} kunne ikke anmode om påmindelsestilladelse:`, error);
      status.textContent = "Påmindelser kunne ikke aktiveres i denne browser.";
      return;
    }
    if (permission !== "granted") {
      status.textContent = "Påmindelser er ikke tilladt. Tjek din browsers indstillinger."; return;
    }

    const [hh, mm] = timeVal.split(":").map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const msUntil = target - now;

    reminderTimeoutId = setTimeout(() => {
      reminderTimeoutId = null;
      try {
        new Notification(`${APP_NAME} – Sengetid 🌙`, {
          body: "Det er snart tid til at finde ro og gøre klar til at sove.",
          icon: "assets/icon-192.png"
        });
      } catch (error) {
        console.warn(`${APP_NAME} kunne ikke vise påmindelsen:`, error);
      }
    }, msUntil);

    const hhmm = target.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
    status.textContent = `✓ Påmindelse sat til kl. ${hhmm}. Husk: Den virker kun, mens appen eller fanen forbliver åben i baggrunden.`;
  });
}

// ─── DIARY ────────────────────────────────────────────────────────────────────

function openDiaryDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB understøttes ikke af denne browser."));
  }

  if (!diaryDbPromise) {
    diaryDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DIARY_DB_NAME, DIARY_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DIARY_STORE)) {
          db.createObjectStore(DIARY_STORE, { keyPath: "date" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };

      request.onerror = () => reject(request.error || new Error("Søvndagbogen kunne ikke åbnes."));
      request.onblocked = () => console.warn("Søvndagbogens database er blokeret af en anden åben fane.");
    }).catch(error => {
      diaryDbPromise = null;
      throw error;
    });
  }

  return diaryDbPromise;
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("Databasehandlingen mislykkedes."));
    transaction.onabort = () => reject(transaction.error || new Error("Databasehandlingen blev afbrudt."));
  });
}

async function migrateDiaryFromLocalStorage(db) {
  if (diaryMigrationPromise) return diaryMigrationPromise;

  diaryMigrationPromise = (async () => {
    let rawEntries;
    try {
      rawEntries = localStorage.getItem(LEGACY_DIARY_KEY);
    } catch (error) {
      console.warn("Den gamle localStorage-dagbog kunne ikke tilgås:", error);
      return;
    }
    if (!rawEntries) return;

    let entries;
    try {
      entries = JSON.parse(rawEntries);
    } catch {
      console.warn("Den gamle søvndagbog kunne ikke læses og blev ikke migreret.");
      return;
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      try { localStorage.removeItem(LEGACY_DIARY_KEY); } catch (_) {}
      return;
    }

    const transaction = db.transaction(DIARY_STORE, "readwrite");
    const store = transaction.objectStore(DIARY_STORE);
    entries.filter(entry => entry?.date).forEach(entry => store.put(entry));
    await waitForTransaction(transaction);
    try { localStorage.removeItem(LEGACY_DIARY_KEY); } catch (_) {}
  })().catch(error => {
    diaryMigrationPromise = null;
    throw error;
  });

  return diaryMigrationPromise;
}

async function getDiaryDatabase() {
  const db = await openDiaryDatabase();
  await migrateDiaryFromLocalStorage(db);
  return db;
}

async function loadDiaryEntries() {
  const db = await getDiaryDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DIARY_STORE, "readonly");
    const request = transaction.objectStore(DIARY_STORE).getAll();
    request.onsuccess = () => {
      const entries = Array.isArray(request.result) ? request.result : [];
      resolve(entries.sort((a, b) => b.date.localeCompare(a.date)));
    };
    request.onerror = () => reject(request.error || new Error("Søvndagbogen kunne ikke hentes."));
  });
}

async function saveDiaryEntry(entry) {
  const db = await getDiaryDatabase();
  const transaction = db.transaction(DIARY_STORE, "readwrite");
  transaction.objectStore(DIARY_STORE).put(entry);
  await waitForTransaction(transaction);
}

async function clearDiaryEntries() {
  const db = await getDiaryDatabase();
  const transaction = db.transaction(DIARY_STORE, "readwrite");
  transaction.objectStore(DIARY_STORE).clear();
  await waitForTransaction(transaction);
  try { localStorage.removeItem(LEGACY_DIARY_KEY); } catch (_) {}
}

function calcSleepHours(bedTime, wakeTime) {
  if (!bedTime || !wakeTime) return null;
  const [bh, bm] = bedTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return Math.round(mins / 6) / 10; // one decimal
}

function qualityEmoji(q) {
  return ["", "😣", "😕", "😐", "🙂", "😊"][q] || "";
}

function qualityLabel(q) {
  return ["Ikke angivet", "Meget dårlig", "Dårlig", "Okay", "God", "Meget god"][q] || "Ikke angivet";
}

function setupDiary() {
  const dateInput = $("#diaryDate");
  if (dateInput) dateInput.value = getTodayKey();

  $$(".q-btn").forEach(btn => {
    btn?.addEventListener("click", () => {
      selectedQuality = Number.parseInt(btn.dataset.q, 10) || 0;
      $$(".q-btn").forEach(button => {
        const isSelected = Number(button.dataset.q) === selectedQuality;
        button.classList.toggle("q-active", isSelected);
        button.setAttribute("aria-checked", String(isSelected));
      });
    });
  });

  $("#saveDiaryEntry")?.addEventListener("click", async () => {
    const date = $("#diaryDate")?.value || "";
    const bedTime = $("#diaryBedTime")?.value || "";
    const wakeTime = $("#diaryWakeTime")?.value || "";
    const note = $("#diaryNote")?.value.trim() || "";
    const status = $("#diaryStatus");

    if (!date) {
      if (status) status.textContent = "Vælg en dato.";
      return;
    }

    try {
      await saveDiaryEntry({ date, bedTime, wakeTime, quality: selectedQuality, note });

      if (status) {
        status.textContent = "Natten er gemt ✓";
        setTimeout(() => { if (status.isConnected) status.textContent = ""; }, 2500);
      }

      const bedInput = $("#diaryBedTime");
      const wakeInput = $("#diaryWakeTime");
      const noteInput = $("#diaryNote");
      if (bedInput) bedInput.value = "";
      if (wakeInput) wakeInput.value = "";
      if (noteInput) noteInput.value = "";

      selectedQuality = 0;
      $$(".q-btn").forEach(button => {
        button.classList.remove("q-active");
        button.setAttribute("aria-checked", "false");
      });

      await renderDiary();
    } catch (error) {
      console.error("Søvndagbogen kunne ikke gemmes:", error);
      if (status) status.textContent = "Dagbogen kunne ikke gemmes på denne enhed.";
    }
  });

  $("#clearDiary")?.addEventListener("click", async () => {
    if (!confirm("Slet alle dagbogsnotater?")) return;
    const status = $("#diaryStatus");
    try {
      await clearDiaryEntries();
      await renderDiary();
      if (status) status.textContent = "Dagbogen er ryddet.";
    } catch (error) {
      console.error("Søvndagbogen kunne ikke ryddes:", error);
      if (status) status.textContent = "Dagbogen kunne ikke ryddes.";
    }
  });
}

async function renderDiary() {
  try {
    const entries = (await loadDiaryEntries()).slice(0, 7);
    renderDiaryChart(entries);
    renderDiaryList(entries);
  } catch (error) {
    console.error("Søvndagbogen kunne ikke vises:", error);
    const chart = $("#diaryChart");
    if (chart) chart.innerHTML = `<p class="diary-empty">Søvndagbogen kunne ikke indlæses.</p>`;
  }
}

function renderDiaryChart(entries) {
  const chart = $("#diaryChart");
  if (!chart) return;
  if (!entries.length) {
    chart.innerHTML = `<p class="diary-empty">Ingen nætter logget endnu.</p>`;
    return;
  }

  const last7 = [...entries].reverse().slice(-7);

  chart.innerHTML = `
    <div class="chart-bars">
      ${last7.map(entry => {
        const hours = calcSleepHours(entry.bedTime, entry.wakeTime);
        const pct = hours ? Math.min(100, (hours / 10) * 100) : 0;
        const dateLabel = entry.date.slice(5).replace("-", "/");
        const readableDate = new Date(`${entry.date}T00:00:00`).toLocaleDateString("da-DK", {
          day: "numeric",
          month: "long"
        });
        const quality = Number(entry.quality) || 0;
        const barColor = quality >= 4 ? "var(--green)" : quality === 3 ? "var(--blue)" : quality > 0 ? "var(--danger)" : "var(--muted)";
        const sleepText = hours ? `${hours} timer` : "søvntid ikke angivet";
        const ariaLabel = `Dato: ${readableDate}, kvalitet: ${qualityLabel(quality)}, søvn: ${sleepText}`;
        return `
          <div class="chart-col">
            <div class="chart-bar-wrap">
              <div class="chart-bar" role="img" aria-label="${ariaLabel}" style="height:${pct}%;background:${barColor}" title="${sleepText}">
                ${quality ? `<span class="chart-q" aria-hidden="true">${qualityEmoji(quality)}</span>` : ""}
              </div>
            </div>
            <span class="chart-label">${dateLabel}</span>
            ${hours ? `<span class="chart-hours">${hours}t</span>` : ""}
          </div>
        `;
      }).join("")}
    </div>
    <div class="chart-legend" aria-hidden="true">
      <span style="color:var(--green)">■</span> God &nbsp;
      <span style="color:var(--blue)">■</span> Okay &nbsp;
      <span style="color:var(--danger)">■</span> Dårlig
    </div>
  `;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderDiaryList(entries) {
  const list = $("#diaryList");
  if (!list) return;
  if (!entries.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = entries.map(entry => {
    const hours = calcSleepHours(entry.bedTime, entry.wakeTime);
    const safeBedTime = escapeHtml(entry.bedTime);
    const safeWakeTime = escapeHtml(entry.wakeTime);
    const safeNote = escapeHtml(entry.note);
    const dateStr = new Date(`${entry.date}T00:00:00`).toLocaleDateString("da-DK", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
    return `
      <article class="diary-entry">
        <div class="diary-entry-head">
          <strong>${dateStr}</strong>
          <span class="diary-meta">
            ${entry.bedTime ? `Lagde mig ${safeBedTime}` : ""}
            ${entry.bedTime && entry.wakeTime ? " · " : ""}
            ${entry.wakeTime ? `Stod op ${safeWakeTime}` : ""}
            ${hours ? ` · ${hours} timer` : ""}
          </span>
        </div>
        ${entry.quality ? `<div class="diary-quality">${qualityEmoji(entry.quality)} ${qualityLabel(entry.quality)}</div>` : ""}
        ${entry.note ? `<p class="diary-note">${safeNote}</p>` : ""}
      </article>
    `;
  }).join("");
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

function openModal(content, opener = document.activeElement) {
  const modalBody = $("#modalBody");
  const modal = $("#toolModal");
  if (!modalBody || !modal) return;
  modalBody.innerHTML = content;
  if (!modal.classList.contains("open")) modalOpener = getFocusReturnTarget(opener);
  lockPageScroll();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  focusFirstElement(modal);
}

function closeModal() {
  stopBreathing();
  stopSound();
  stopGuidedAudio(true);
  document.removeEventListener("click", handleBreathTechniqueClick);
  const modal = $("#toolModal");
  if (!modal) return;
  const wasOpen = modal.classList.contains("open");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  unlockPageScroll();
  if (wasOpen) restoreFocus(modalOpener);
  modalOpener = null;
}

// ─── BREATHING ────────────────────────────────────────────────────────────────

function stopBreathing() {
  if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; }
}

function startBreathing(techniqueKey) {
  stopBreathing();
  currentTechnique = breathingTechniques[techniqueKey];
  breathPhaseIndex = 0;
  breathCycleCount = 0;
  runBreathPhase();
}

function runBreathPhase() {
  const t = currentTechnique;
  if (!t) return;
  const phase = t.phases[breathPhaseIndex];
  const circle = $("#breathCircle");
  const label = $("#breathLabel");
  const counter = $("#breathCounter");
  const progress = $("#breathProgress");
  if (!circle || !label || !counter) return;

  label.textContent = phase.name;

  // Animate circle
  circle.style.transition = `transform ${phase.duration}s ease-in-out`;
  if (phase.name.toLowerCase().includes("ind")) {
    circle.style.transform = "scale(1.18)";
  } else if (phase.name.toLowerCase().includes("hold")) {
    // no change
  } else {
    circle.style.transform = "scale(0.82)";
  }

  // Countdown
  let remaining = phase.duration;
  counter.textContent = remaining;
  if (progress) progress.style.width = "100%";

  const tick = () => {
    remaining--;
    counter.textContent = remaining;
    if (progress) progress.style.width = `${(remaining / phase.duration) * 100}%`;
    if (remaining > 0) {
      breathTimer = setTimeout(tick, 1000);
    } else {
      breathPhaseIndex++;
      if (breathPhaseIndex >= t.phases.length) {
        breathPhaseIndex = 0;
        breathCycleCount++;
        if (counter) counter.textContent = "";
      }
      breathTimer = setTimeout(runBreathPhase, 300);
    }
  };
  breathTimer = setTimeout(tick, 1000);
}

function openBreathing() {
  openModal(`
    <p class="eyebrow">Vejrtrækning</p>
    <h2 id="modalTitle">Vælg teknik</h2>
    <div class="breath-technique-grid">
      ${Object.entries(breathingTechniques).map(([key, t]) => `
        <button class="breath-technique-btn" data-technique="${key}" type="button">
          <strong>${t.label}</strong>
          <small>${t.description}</small>
        </button>
      `).join("")}
    </div>
    <div id="breathingArea" class="breathing-area" hidden>
      <div class="breath-circle" id="breathCircle">
        <span id="breathLabel">Gør klar</span>
        <span id="breathCounter"></span>
      </div>
      <div class="breath-progress-track"><div id="breathProgress" class="breath-progress-fill"></div></div>
      <p class="breath-cycles" id="breathCycleDisplay"></p>
      <button class="secondary-button" id="stopBreathBtn" type="button" style="margin-top:14px">Stop</button>
    </div>
  `);

  document.addEventListener("click", handleBreathTechniqueClick);

  $("#stopBreathBtn")?.addEventListener("click", () => {
    stopBreathing();
    const breathingArea = $("#breathingArea");
    const techniqueGrid = $(".breath-technique-grid");
    if (breathingArea) breathingArea.hidden = true;
    if (techniqueGrid) techniqueGrid.hidden = false;
    currentTechnique = null;
  });
}

function handleBreathTechniqueClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  const btn = target?.closest("[data-technique]");
  if (!btn) return;
  const key = btn.dataset.technique;
  if (!breathingTechniques[key]) return;
  const techniqueGrid = $(".breath-technique-grid");
  const breathingArea = $("#breathingArea");
  if (techniqueGrid) techniqueGrid.hidden = true;
  if (breathingArea) breathingArea.hidden = false;
  startBreathing(key);
  document.removeEventListener("click", handleBreathTechniqueClick);
}

// ─── SOUND MODAL ─────────────────────────────────────────────────────────────

function openSoundModal(preselectedTrackId = null) {
  const directTrack = findBackgroundSound(preselectedTrackId);
  const showTrackPicker = !directTrack;

  openModal(`
    <p class="eyebrow">Baggrundslyd</p>
    <h2 id="modalTitle">${directTrack ? directTrack.label : "Læg telefonen fra dig og lyt"}</h2>
    <p>${directTrack
      ? "Start med det samme, eller giv dig selv 10 sekunder til at lægge telefonen fra dig. Lyden fortsætter, indtil du stopper den."
      : "Vælg et lydmiljø. Start med det samme, eller giv dig selv 10 sekunder til at lægge telefonen fra dig."}</p>
    ${showTrackPicker ? `
      <div class="sound-grid" aria-label="Baggrundslyde">
        ${backgroundSoundTracks.map(track => `
          <button class="sound-btn" data-sound="${track.id}" type="button" aria-label="${track.label}">
            <span class="sound-icon" aria-hidden="true">${track.icon}</span>
            <strong>${track.label}</strong>
            <small>${track.description}</small>
          </button>
        `).join("")}
      </div>
    ` : ""}
    <section class="guided-player ${directTrack ? "guided-player-direct" : ""}" id="soundPlayer" aria-live="polite">
      <div class="guided-countdown" id="soundCountdown" hidden>
        <div class="guided-countdown-circle" id="soundCountdownCircle">
          <div class="guided-countdown-inner">
            <strong id="soundCountdownNumber">10</strong>
            <span>starter om</span>
          </div>
        </div>
        <p class="guided-countdown-note">Du kan lægge telefonen fra dig nu.</p>
      </div>
      <div class="guided-player-head">
        <div class="guided-player-title-wrap">
          <span id="soundPlayerIcon" class="guided-player-icon" aria-hidden="true">${directTrack?.icon || "🎧"}</span>
          <div>
            <p class="guided-player-kicker">${directTrack ? "Baggrundslyd" : "Valgt baggrundslyd"}</p>
            <h3 id="soundPlayerTitle">${directTrack?.label || "Vælg en baggrundslyd"}</h3>
          </div>
        </div>
        <p id="soundPlayerMeta" class="guided-audio-meta">${directTrack
          ? `${directTrack.description} Lyden gentages automatisk.`
          : "Vælg hvid støj, regn eller skov."}</p>
      </div>
      <div class="guided-progress-track"><div class="guided-progress-fill" id="soundProgress"></div></div>
      <div class="guided-time-row">
        <span id="soundCurrent">0:00</span>
        <span id="soundTotal">0:00</span>
      </div>
      <div class="guided-start-row">
        <button class="primary-button" id="soundStartNowBtn" type="button" disabled>Start nu</button>
        <button class="secondary-button" id="soundStartDelayedBtn" type="button" disabled>Start om 10 sek.</button>
      </div>
      <div class="guided-controls">
        <button class="secondary-button" id="soundPlayPauseBtn" type="button" disabled>Pause</button>
        <button class="secondary-button" id="soundRestartBtn" type="button" disabled>Start forfra</button>
        <button class="ghost-button" id="soundStopBtn" type="button" disabled>Stop</button>
      </div>
      <p id="soundStatus" class="guided-player-status">${directTrack ? "Klar til afspilning." : "Ingen lyd valgt endnu."}</p>
    </section>
  `);

  $$('[data-sound]').forEach(button => {
    button.addEventListener('click', () => selectSoundTrack(button.dataset.sound));
  });
  $('#soundStartNowBtn')?.addEventListener('click', () => startSound('now'));
  $('#soundStartDelayedBtn')?.addEventListener('click', () => startSound('delay'));
  $('#soundPlayPauseBtn')?.addEventListener('click', toggleSoundPlayback);
  $('#soundRestartBtn')?.addEventListener('click', restartSound);
  $('#soundStopBtn')?.addEventListener('click', stopSoundPlayback);

  if (directTrack) {
    selectSoundTrack(directTrack.id);
  } else {
    syncSoundUI();
  }
}

// ─── GUIDED AUDIO ────────────────────────────────────────────────────────────

function findGuidedAudioTrack(trackId) {
  return guidedAudioTracks.find(track => track.id === trackId) || null;
}

function formatMediaTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60).toString();
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function clearGuidedAudioPoll() {
  if (guidedAudioPoll) {
    clearInterval(guidedAudioPoll);
    guidedAudioPoll = null;
  }
}

function startGuidedAudioPoll() {
  clearGuidedAudioPoll();
  guidedAudioPoll = setInterval(syncGuidedAudioUI, 200);
}

function waitForAudioMetadata(audio) {
  if (!audio) return Promise.reject(new Error("Ingen lydafspiller tilgængelig."));
  if (audio.readyState >= 1) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
    };
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(audio.error || new Error("Lydfilen kunne ikke indlæses."));
    };
    audio.addEventListener("loadedmetadata", onLoaded, { once: true });
    audio.addEventListener("error", onError, { once: true });
  });
}

function getGuidedAudioElement() {
  if (!guidedAudioEl) {
    guidedAudioEl = new Audio();
    guidedAudioEl.preload = "auto";

    guidedAudioEl.addEventListener("play", () => {
      guidedAudioError = "";
      startGuidedAudioPoll();
      syncGuidedAudioUI();
    });

    guidedAudioEl.addEventListener("pause", () => {
      clearGuidedAudioPoll();
      syncGuidedAudioUI();
    });

    guidedAudioEl.addEventListener("ended", () => {
      clearGuidedAudioPoll();
      syncGuidedAudioUI();
    });

    guidedAudioEl.addEventListener("timeupdate", syncGuidedAudioUI);
    guidedAudioEl.addEventListener("loadedmetadata", syncGuidedAudioUI);
    guidedAudioEl.addEventListener("error", () => {
      clearGuidedAudioPoll();
      guidedAudioError = "Lydfilen kunne ikke afspilles på denne enhed.";
      syncGuidedAudioUI();
    });
  }

  return guidedAudioEl;
}

function selectGuidedAudioTrack(trackId) {
  const track = findGuidedAudioTrack(trackId);
  if (!track) return;

  activeGuidedAudioId = track.id;
  guidedAudioError = "";

  if (guidedAudioEl) {
    guidedAudioEl.pause();
    try { guidedAudioEl.currentTime = 0; } catch (_) {}
    guidedAudioEl.removeAttribute("src");
    guidedAudioEl.load();
  }

  clearGuidedAudioPoll();
  syncGuidedAudioUI();
  scrollModalToElement($("#guidedAudioPlayer"));
}

function syncGuidedAudioUI() {
  const audio = guidedAudioEl;
  const track = findGuidedAudioTrack(activeGuidedAudioId);
  const player = $("#guidedAudioPlayer");
  const icon = $("#guidedAudioIcon");
  const title = $("#guidedAudioTitle");
  const meta = $("#guidedAudioMeta");
  const status = $("#guidedAudioStatus");
  const progress = $("#guidedAudioProgress");
  const current = $("#guidedAudioCurrent");
  const total = $("#guidedAudioTotal");
  const startNowBtn = $("#guidedStartNowBtn");
  const startDelayedBtn = $("#guidedStartDelayedBtn");
  const playPauseBtn = $("#guidedPlayPauseBtn");
  const restartBtn = $("#guidedRestartBtn");
  const stopBtn = $("#guidedStopBtn");
  const countdownWrap = $("#guidedCountdown");
  const countdownNumber = $("#guidedCountdownNumber");
  const countdownCircle = $("#guidedCountdownCircle");

  $$("[data-guided-audio]").forEach(button => {
    button.classList.toggle("active", button.dataset.guidedAudio === activeGuidedAudioId);
  });

  if (!player) return;

  if (!track) {
    player.hidden = false;
    if (icon) icon.textContent = "🎧";
    if (title) title.textContent = "Vælg en lydøvelse";
    if (meta) meta.textContent = "Vælg en øvelse og tryk enten Start nu eller Start om 10 sekunder.";
    if (status) status.textContent = "Ingen lyd valgt endnu.";
    if (progress) progress.style.width = "0%";
    if (current) current.textContent = "0:00";
    if (total) total.textContent = "0:00";
    if (startNowBtn) startNowBtn.disabled = true;
    if (startDelayedBtn) startDelayedBtn.disabled = true;
    if (playPauseBtn) {
      playPauseBtn.textContent = "Pause";
      playPauseBtn.disabled = true;
    }
    if (restartBtn) restartBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (countdownWrap) countdownWrap.hidden = true;
    return;
  }

  const rawCurrent = audio ? Number(audio.currentTime) || 0 : 0;
  const rawDuration = audio && Number.isFinite(audio.duration) ? Number(audio.duration) : 0;
  const adjustedCurrent = Math.max(0, rawCurrent - GUIDED_AUDIO_PREROLL);
  const adjustedDuration = Math.max(0, rawDuration - GUIDED_AUDIO_PREROLL);
  const pct = adjustedDuration > 0 ? Math.min(100, (adjustedCurrent / adjustedDuration) * 100) : 0;
  const isPlaying = Boolean(audio && !audio.paused && !audio.ended);
  const inCountdown = Boolean(audio && isPlaying && rawCurrent < GUIDED_AUDIO_PREROLL);
  const hasStartedSpeech = rawCurrent >= GUIDED_AUDIO_PREROLL;

  player.hidden = false;
  if (icon) icon.textContent = track.icon;
  if (title) title.textContent = track.label;
  if (meta) meta.textContent = `${track.duration} · Start med det samme eller giv dig selv 10 sekunder til at lægge telefonen fra dig.`;
  if (progress) progress.style.width = `${pct}%`;
  if (current) current.textContent = formatMediaTime(adjustedCurrent);
  if (total) total.textContent = formatMediaTime(adjustedDuration || 0);

  if (startNowBtn) startNowBtn.disabled = false;
  if (startDelayedBtn) startDelayedBtn.disabled = false;
  if (playPauseBtn) {
    playPauseBtn.disabled = !audio || (!rawCurrent && !audio.src);
    playPauseBtn.textContent = isPlaying ? "Pause" : rawCurrent > 0 ? "Fortsæt" : "Pause";
  }
  if (restartBtn) restartBtn.disabled = !audio || (!rawCurrent && !audio.src);
  if (stopBtn) stopBtn.disabled = !audio || (!rawCurrent && !audio.src);

  if (countdownWrap) countdownWrap.hidden = !inCountdown;
  if (inCountdown) {
    const remaining = Math.max(1, Math.ceil(GUIDED_AUDIO_PREROLL - rawCurrent));
    const progressPct = Math.max(0, Math.min(100, (rawCurrent / GUIDED_AUDIO_PREROLL) * 100));
    if (countdownNumber) countdownNumber.textContent = String(remaining);
    if (countdownCircle) countdownCircle.style.setProperty("--progress", String(progressPct));
  }

  if (status) {
    if (guidedAudioError) {
      status.textContent = guidedAudioError;
    } else if (!audio || !audio.src) {
      status.textContent = "Klar. Vælg Start nu eller Start om 10 sekunder.";
    } else if (inCountdown) {
      status.textContent = "Du kan lægge telefonen fra dig nu. Stemmen starter om et øjeblik.";
    } else if (isPlaying && hasStartedSpeech) {
      status.textContent = "Øvelsen læses op…";
    } else if (audio.ended) {
      status.textContent = "Øvelsen er færdig.";
    } else if (audio.paused && rawCurrent > 0) {
      status.textContent = "Øvelsen er sat på pause.";
    } else {
      status.textContent = "Klar. Vælg Start nu eller Start om 10 sekunder.";
    }
  }
}

async function startGuidedAudio(mode = "now") {
  const track = findGuidedAudioTrack(activeGuidedAudioId);
  if (!track) return;

  stopSound();
  guidedAudioError = "";

  const audio = getGuidedAudioElement();
  if (!audio) return;

  try {
    if (!audio.src || !audio.src.endsWith(track.file)) {
      audio.src = track.file;
      audio.load();
      await waitForAudioMetadata(audio);
    }

    const startAt = mode === "delay" ? 0 : GUIDED_AUDIO_PREROLL;
    audio.currentTime = startAt;
    await audio.play();
  } catch (error) {
    console.warn(`${APP_NAME} kunne ikke starte lydøvelsen:`, error);
    guidedAudioError = "Lydøvelsen kunne ikke startes. Tryk igen, eller tjek telefonens lydindstillinger.";
    syncGuidedAudioUI();
    return;
  }

  syncGuidedAudioUI();
}

async function toggleGuidedAudioPlayback() {
  const audio = getGuidedAudioElement();
  if (!audio || !activeGuidedAudioId || !audio.src) return;

  try {
    if (audio.paused || audio.ended) {
      guidedAudioError = "";
      if (audio.ended) audio.currentTime = GUIDED_AUDIO_PREROLL;
      await audio.play();
    } else {
      audio.pause();
    }
  } catch (error) {
    console.warn(`${APP_NAME} kunne ikke fortsætte lydøvelsen:`, error);
    guidedAudioError = "Lydøvelsen kunne ikke fortsætte. Tryk igen, eller prøv at skrue op for lyden.";
    syncGuidedAudioUI();
  }
}

async function restartGuidedAudio() {
  const audio = getGuidedAudioElement();
  if (!audio || !activeGuidedAudioId) return;

  try {
    guidedAudioError = "";
    audio.currentTime = GUIDED_AUDIO_PREROLL;
    await audio.play();
  } catch (error) {
    console.warn(`${APP_NAME} kunne ikke starte lydøvelsen forfra:`, error);
    guidedAudioError = "Lydøvelsen kunne ikke startes forfra på denne enhed.";
    syncGuidedAudioUI();
  }
}

function stopGuidedAudio(resetSelection = false) {
  const audio = guidedAudioEl;
  clearGuidedAudioPoll();

  if (audio) {
    audio.pause();
    try { audio.currentTime = 0; } catch (_) {}
    if (resetSelection) {
      audio.removeAttribute("src");
      audio.load();
    }
  }

  if (resetSelection) {
    activeGuidedAudioId = null;
    guidedAudioError = "";
  }

  syncGuidedAudioUI();
}

function openGuidedAudioModal(preselectedTrackId = null) {
  const directTrack = findGuidedAudioTrack(preselectedTrackId);
  const showTrackPicker = !directTrack;

  openModal(`
    <p class="eyebrow">Lydøvelse</p>
    <h2 id="modalTitle">${directTrack ? directTrack.label : "Læg telefonen fra dig og lyt"}</h2>
    <p>${directTrack
      ? "Start med det samme, eller giv dig selv 10 sekunder til at lægge telefonen fra dig, før stemmen går i gang."
      : "Vælg en øvelse. Start med det samme, eller giv dig selv 10 sekunder til at finde ro, før stemmen går i gang."}</p>
    ${showTrackPicker ? `
      <div class="guided-audio-grid">
        ${guidedAudioTracks.map(track => `
          <button class="guided-audio-btn" data-guided-audio="${track.id}" type="button" aria-label="${track.label}, ${track.duration}">
            <span class="guided-audio-icon" aria-hidden="true">${track.icon}</span>
            <strong>${track.label}</strong>
            <span class="guided-audio-meta">${track.duration}</span>
          </button>
        `).join("")}
      </div>
    ` : ""}
    <section class="guided-player ${directTrack ? "guided-player-direct" : ""}" id="guidedAudioPlayer" aria-live="polite">
      <div class="guided-countdown" id="guidedCountdown" hidden>
        <div class="guided-countdown-circle" id="guidedCountdownCircle">
          <div class="guided-countdown-inner">
            <strong id="guidedCountdownNumber">10</strong>
            <span>starter om</span>
          </div>
        </div>
        <p class="guided-countdown-note">Du kan lægge telefonen fra dig nu.</p>
      </div>
      <div class="guided-player-head">
        <div class="guided-player-title-wrap">
          <span id="guidedAudioIcon" class="guided-player-icon" aria-hidden="true">${directTrack?.icon || "🎧"}</span>
          <div>
            <p class="guided-player-kicker">${directTrack ? "Lydøvelse" : "Valgt lydøvelse"}</p>
            <h3 id="guidedAudioTitle">${directTrack?.label || "Vælg en lydøvelse"}</h3>
          </div>
        </div>
        <p id="guidedAudioMeta" class="guided-audio-meta">${directTrack
          ? `${directTrack.duration} · Start nu eller om 10 sekunder.`
          : "Vælg en øvelse og tryk enten Start nu eller Start om 10 sekunder."}</p>
      </div>
      <div class="guided-progress-track"><div class="guided-progress-fill" id="guidedAudioProgress"></div></div>
      <div class="guided-time-row">
        <span id="guidedAudioCurrent">0:00</span>
        <span id="guidedAudioTotal">0:00</span>
      </div>
      <div class="guided-start-row">
        <button class="primary-button" id="guidedStartNowBtn" type="button" disabled>Start nu</button>
        <button class="secondary-button" id="guidedStartDelayedBtn" type="button" disabled>Start om 10 sek.</button>
      </div>
      <div class="guided-controls">
        <button class="secondary-button" id="guidedPlayPauseBtn" type="button" disabled>Pause</button>
        <button class="secondary-button" id="guidedRestartBtn" type="button" disabled>Start forfra</button>
        <button class="ghost-button" id="guidedStopBtn" type="button" disabled>Stop</button>
      </div>
      <p id="guidedAudioStatus" class="guided-player-status">${directTrack ? "Klar til afspilning." : "Ingen lyd valgt endnu."}</p>
    </section>
  `);

  $$("[data-guided-audio]").forEach(button => {
    button.addEventListener("click", () => selectGuidedAudioTrack(button.dataset.guidedAudio));
  });
  $("#guidedStartNowBtn")?.addEventListener("click", () => startGuidedAudio("now"));
  $("#guidedStartDelayedBtn")?.addEventListener("click", () => startGuidedAudio("delay"));
  $("#guidedPlayPauseBtn")?.addEventListener("click", toggleGuidedAudioPlayback);
  $("#guidedRestartBtn")?.addEventListener("click", restartGuidedAudio);
  $("#guidedStopBtn")?.addEventListener("click", () => stopGuidedAudio(true));

  if (directTrack) {
    selectGuidedAudioTrack(directTrack.id);
  } else {
    syncGuidedAudioUI();
  }
}

// ─── SLEEP CALC MODAL ────────────────────────────────────────────────────────

function openSleepCalc() {
  openModal(`
    <p class="eyebrow">Søvnvindue</p>
    <h2 id="modalTitle">Hvornår skal du stå op?</h2>
    <p>En søvncyklus varer ca. 90 min. Skriv hvornår du gerne vil vågne, og få forslag til hvornår du helst skal falde i søvn.</p>
    <div class="sleep-calc-row">
      <label style="flex:1">
        <span style="font-weight:760;display:block;margin-bottom:6px">Ønsket opvågningstid</span>
        <input type="time" id="calcWakeTime" style="width:100%" />
      </label>
      <button class="primary-button" id="calcBtn" type="button" style="margin-top:22px">Beregn</button>
    </div>
    <div id="calcResult" class="calc-result"></div>
    <p style="color:var(--muted);font-size:.88rem;margin-top:14px">Husk at lægge ca. 15 min. til at falde i søvn.</p>
  `);

  $("#calcBtn")?.addEventListener("click", () => {
    const val = $("#calcWakeTime")?.value;
    if (!val) return;
    const [wh, wm] = val.split(":").map(Number);
    const wakeMinutes = wh * 60 + wm;
    const fallAsleepOffset = 15;
    const results = [6, 5, 4].map(cycles => {
      const sleepMinutes = (wakeMinutes - cycles * 90 - fallAsleepOffset + 24 * 60) % (24 * 60);
      const h = Math.floor(sleepMinutes / 60).toString().padStart(2, "0");
      const m = (sleepMinutes % 60).toString().padStart(2, "0");
      return { time: `${h}:${m}`, cycles };
    });
    const calcResult = $("#calcResult");
    if (!calcResult) return;
    calcResult.innerHTML = `
      <p style="margin:14px 0 8px;font-weight:760">Læg dig senest:</p>
      <div class="calc-options">
        ${results.map(r => `
          <div class="calc-option">
            <strong>${r.time}</strong>
            <small>${r.cycles} cyklusser · ca. ${r.cycles * 1.5} timer</small>
          </div>
        `).join("")}
      </div>
    `;
  });
}

// ─── THOUGHT PARKING ─────────────────────────────────────────────────────────

function openThoughtParking() {
  openModal(`
    <p class="eyebrow">Tankemylder</p>
    <h2 id="modalTitle">Parkér tankerne</h2>
    <p>Skriv stikord. Ikke løsninger. Bare en parkeringsplads til i morgen.</p>
    <div class="thought-box">
      <textarea id="thoughtText" placeholder="Fx: Ring til kommunen. Husk medicin. Bekymring om arbejde."></textarea>
      <button class="primary-button" id="clearThoughtText" type="button">Tøm feltet</button>
    </div>
    <p>Når tanken kommer tilbage: "Den er parkeret. Den skal ikke løses i nat."</p>
  `);
  $("#clearThoughtText")?.addEventListener("click", () => {
    const thoughtText = $("#thoughtText");
    if (thoughtText) thoughtText.value = "";
  });
}

// ─── DRAWER ───────────────────────────────────────────────────────────────────

function openDrawer(opener = document.activeElement) {
  const d = $("#drawer");
  if (!d) return;
  if (!d.classList.contains("open")) drawerOpener = getFocusReturnTarget(opener);
  lockPageScroll();
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  focusFirstElement(d);
}

function closeDrawer() {
  const d = $("#drawer");
  if (!d) return;
  const wasOpen = d.classList.contains("open");
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
  unlockPageScroll();
  if (wasOpen) restoreFocus(drawerOpener);
  drawerOpener = null;
}

// ─── INSTALL PROMPT ───────────────────────────────────────────────────────────

function setupInstallPrompt() {
  const button = $("#installButton");
  if (!button) return;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    button.hidden = false;
  });

  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.warn("Installationsdialogen kunne ikke åbnes:", error);
    } finally {
      deferredInstallPrompt = null;
      button.hidden = true;
    }
  });

  window.addEventListener("appinstalled", () => {
    button.hidden = true;
    deferredInstallPrompt = null;
  });
}

// ─── SERVICE WORKER ───────────────────────────────────────────────────────────

function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").then(reg => {
    if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) nw.postMessage({ type: "SKIP_WAITING" });
      });
    });
  }).catch(error => {
    console.warn(`${APP_NAME} kunne ikke registrere service worker:`, error);
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

function setupEvents() {
  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const homeSoundButton = target.closest("[data-home-sound]");
    if (homeSoundButton) {
      openSoundModal(homeSoundButton.dataset.homeSound);
      return;
    }

    const homeAudioButton = target.closest("[data-home-audio]");
    if (homeAudioButton) {
      openGuidedAudioModal(homeAudioButton.dataset.homeAudio);
      return;
    }

    const routeButton = target.closest("[data-route]");
    if (routeButton) {
      navigate(routeButton.dataset.route);
      closeDrawer();
      closeModal();
      return;
    }

    const topicButton = target.closest("[data-topic]");
    if (topicButton) {
      openGuideTopic(topicButton.dataset.topic, topicButton);
      return;
    }

    const guideButton = target.closest("[data-guide]");
    if (guideButton) {
      navigate("guides");
      const guide = guidesData.find(item => item.id === guideButton.dataset.guide);
      const topic = guideTopics.find(item => getTopicItems(item.id).some(guideItem => guideItem.id === guide?.id));
      if (topic) requestAnimationFrame(() => openGuideTopic(topic.id, guideButton));
      return;
    }
  });

  $("#nextStep")?.addEventListener("click", () => {
    currentStep = currentStep === steps.length - 1 ? 0 : currentStep + 1;
    renderStep();
  });

  $("#prevStep")?.addEventListener("click", () => {
    currentStep = Math.max(0, currentStep - 1);
    renderStep();
  });

  $("#sleepPlan")?.addEventListener("submit", savePlan);
  $("#clearPlan")?.addEventListener("click", clearPlan);
  $("#printPlan")?.addEventListener("click", () => window.print());
  $("#breathingButton")?.addEventListener("click", openBreathing);
  $("#soundButton")?.addEventListener("click", () => openSoundModal());
  $("#guidedAudioButton")?.addEventListener("click", () => openGuidedAudioModal());
  $("#thoughtButton")?.addEventListener("click", openThoughtParking);
  $("#sleepCalcButton")?.addEventListener("click", openSleepCalc);
  $("#acuteSymptomBtn")?.addEventListener("click", () => {
    currentStep = 4;
    renderStep();
    navigate("now");
  });
  $("#menuButton")?.addEventListener("click", openDrawer);
  $("#bottomMoreButton")?.addEventListener("click", openDrawer);
  $("#closeDrawer")?.addEventListener("click", closeDrawer);
  $("#drawer")?.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.id === "drawer") closeDrawer();
  });
  $("#closeModal")?.addEventListener("click", () => {
    stopSound();
    closeModal();
  });
  $("#toolModal")?.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.id === "toolModal") closeModal();
  });
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeDrawer();
      closeModal();
    }
  });
}


function setupHomeListenAccordions() {
  const accordions = $$(".home-listen-disclosure");
  accordions.forEach(accordion => {
    accordion.addEventListener("toggle", () => {
      if (!accordion.open) return;
      accordions.forEach(other => {
        if (other !== accordion) other.open = false;
      });
    });
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  renderStep();
  renderGuides();
  loadPlan();
  setupChecklist();
  setupDiary();
  setupReminder();
  setupEvents();
  setupHomeListenAccordions();
  setupInstallPrompt();
  setupServiceWorker();
  const hashRoute = location.hash.replace("#", "");
  if (hashRoute && document.querySelector(`[data-screen="${hashRoute}"]`)) navigate(hashRoute);
}

document.addEventListener("DOMContentLoaded", init);
