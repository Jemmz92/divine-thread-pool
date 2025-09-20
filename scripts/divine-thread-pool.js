// Divine Thread Pool Module Script (Updated)
// Everyone can draw, fully randomized threads, pool starts with 10 threads

const MODULE_ID = "divine-thread-pool";

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

// Initialize pool with N threads (default 10)
async function initPool(size = 10) {
  let pool = [];
  for (let i = 0; i < size; i++) {
    pool.push(Math.random() < 0.5 ? "Harmony" : "Discord");
  }
  await game.settings.set(MODULE_ID, "threadPool", pool);
  ChatMessage.create({ content: `🌌 Divine Thread Pool initialized with ${size} threads.` });
  showPool();
}

// Show pool in chat with a "Draw Thread" button
async function showPool() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  let harmony = pool.filter(p => p === "Harmony").length;
  let discord = pool.filter(p => p === "Discord").length;

  let content = `
    <div style="text-align:center;padding:6px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));">
      <h2 style="margin:4px 0;">🌌 Divine Thread Pool</h2>
      <p style="margin:6px 0;font-weight:600;">✨ Harmony Threads: <span style="color:#9be7a3;">${harmony}</span> | 🔥 Discord Threads: <span style="color:#f39c9c;">${discord}</span></p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:6px;">
        <button data-draw="any" class="divine-thread-btn">Draw Divine Thread</button>
      </div>
      <div style="margin-top:8px;font-size:0.85em;color:var(--text-muted);">Click the button to draw a random Divine Thread from the pool.</div>
    </div>
  `;

  ChatMessage.create({ content });
}

// Draw a thread
async function drawThread() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  if (pool.length === 0) {
    ui.notifications.warn("The Divine Thread Pool is empty!");
    return;
  }

  let idx = Math.floor(Math.random() * pool.length);
  let drawn = pool[idx];

  // Replace drawn thread with new random thread
  pool[idx] = Math.random() < 0.5 ? "Harmony" : "Discord";
  await game.settings.set(MODULE_ID, "threadPool", pool);

  // Show result in chat
  let flavor = drawn === "Harmony" ? randomFlavor("Harmony") : randomFlavor("Discord");
  ChatMessage.create({ content: `🎴 You drew a **${drawn} Thread**! ${flavor}` });

  showPool();
}

// Listen for chat button clicks
Hooks.on("renderChatMessage", (message, html) => {
  html.find("button[data-draw='any']").click(async ev => {
    ev.preventDefault();
    await drawThread();
  });
});

// Register pool setting
Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "threadPool", {
    name: "Divine Thread Pool",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

// Export functions globally for macros
window.DivineThreadPool = {
  initPool,
  showPool,
  drawThread
};
