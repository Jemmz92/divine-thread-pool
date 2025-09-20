// Divine Thread Pool Module Script for Foundry VTT
// Version 1.2 (module build compatible with Foundry v12 build 343)
// Author: ChatGPT
// 
// Adds a Divine Thread Pool: Harmony and Discord threads, draw/replace behavior,
// clickable chat buttons, and randomized Averis god flavor text.
//
// Usage (after enabling module in a world):
// - Run initPool(N) to initialize the pool (recommended: players + DM + 2).
// - Run showPool() to post the pool and display draw buttons.
// - Players click "Draw Harmony (Player)" and DM clicks "Draw Discord (DM)".
//
// The pool is stored in game.settings under the module namespace.

const MODULE_ID = "divine-thread-pool";

// --- GOD FLAVOR TEXTS ---
const harmonyFlavors = [
  "✨ Luminael’s light shields you with warmth and clarity.",
  "🌿 Verdalis blesses the moment with nature’s strength.",
  "🎶 Amaryth inspires you with beauty and joy.",
  "⚔️ Kaelthar grants you valor to face the challenge.",
  "💫 Selaryon’s starlight guides your path.",
  "🔧 Eryndra’s spark fuels invention and ingenuity."
];

const discordFlavors = [
  "🔥 Dravok’s fury cracks the earth and rends the skies.",
  "💀 Noctyra whispers of inevitable debts and endings.",
  "🎲 Zerithia gambles your fate in shadowed markets.",
  "⚔️ Kaelthar’s discipline twists into ruthless ambition.",
  "🌌 Selaryon turns away, stars obscured by chaos."
];

function randomFlavor(type) {
  if (type === "Harmony") return harmonyFlavors[Math.floor(Math.random() * harmonyFlavors.length)];
  if (type === "Discord") return discordFlavors[Math.floor(Math.random() * discordFlavors.length)];
  return "🌗 The cosmos stirs in silence.";
}

// --- POOL LOGIC ---

// Initialize pool with N tokens (split randomly)
async function initPool(size = 6) {
  let pool = [];
  for (let i = 0; i < size; i++) {
    pool.push(Math.random() < 0.5 ? "Harmony" : "Discord");
  }
  await game.settings.set(MODULE_ID, "threadPool", pool);
  ChatMessage.create({ content: `🌌 Divine Thread Pool initialized with ${size} tokens.` });
  showPool();
}

// Show current pool state (with buttons)
async function showPool() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  let harmony = pool.filter(p => p === "Harmony").length;
  let discord = pool.filter(p => p === "Discord").length;

  let content = `
    <div style="text-align:center;padding:6px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));">
      <h2 style="margin:4px 0;">🌌 Divine Thread Pool</h2>
      <p style="margin:6px 0;font-weight:600;">✨ Harmony Threads: <span style="color:#9be7a3;">${harmony}</span> | 🔥 Discord Threads: <span style="color:#f39c9c;">${discord}</span></p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:6px;">
        <button data-draw="player" class="divine-thread-btn">Draw Harmony (Player)</button>
        <button data-draw="dm" class="divine-thread-btn">Draw Discord (DM)</button>
      </div>
      <div style="margin-top:8px;font-size:0.85em;color:var(--text-muted);">Click the buttons to draw from the pool. Drawn threads are spent and replaced by the opposite type.</div>
    </div>
  `;

  // Post publicly so all users see the pool; you can change whisper if you prefer DM-only
  ChatMessage.create({ content });
}

// Draw a thread
async function drawThread(who = "player") {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  if (pool.length === 0) {
    ui.notifications.warn("The Divine Thread Pool is empty!");
    return;
  }

  let idx = Math.floor(Math.random() * pool.length);
  let drawn = pool[idx];
  pool.splice(idx, 1);
  let opposite = drawn === "Harmony" ? "Discord" : "Harmony";
  pool.push(opposite);

  await game.settings.set(MODULE_ID, "threadPool", pool);

  if (drawn === "Harmony" && who === "player") {
    ChatMessage.create({ content: `✨ A Harmony Thread is drawn! ${randomFlavor("Harmony")}` });
  } else if (drawn === "Discord" && who === "dm") {
    ChatMessage.create({ content: `🔥 A Discord Thread is drawn! ${randomFlavor("Discord")}` });
  } else {
    ChatMessage.create({ content: `🌗 A ${drawn} Thread was drawn, but it cannot be used by ${who}.` });
  }

  showPool();
}

// Listen for chat button clicks
Hooks.on("renderChatMessage", (message, html) => {
  html.find("button[data-draw]").click(async ev => {
    ev.preventDefault();
    const who = ev.currentTarget.dataset.draw;
    // Optional: simple permissions check—only allow DM to draw 'dm' button
    if (who === "dm" && !game.user.isGM) {
      ui.notifications.warn("Only the GM can draw Discord threads.");
      return;
    }
    await drawThread(who);
  });
});

// Register settings if not already
Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "threadPool", {
    name: "Divine Thread Pool",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

// Export functions to global so GMs can call them from the console/macros
window.DivineThreadPool = {
  initPool,
  showPool,
  drawThread
};