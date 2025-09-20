// Divine Thread Pool Module Script (All players can draw, GM-only reset, pool sync via socket)
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

// Initialize pool with 5 Harmony and 5 Discord threads
async function initPool() {
  let pool = Array(5).fill("Harmony").concat(Array(5).fill("Discord"));
  await game.settings.set(MODULE_ID, "threadPool", pool);
  showPool();
}

// Show pool in a single persistent chat message
let poolMessageId = null;
async function showPool() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  let harmony = pool.filter(p => p === "Harmony").length;
  let discord = pool.filter(p => p === "Discord").length;

  let dmResetButton = game.user.isGM
    ? `<button data-reset="true" class="divine-thread-reset-btn" style="margin-left:12px;">Reset Pool (5/5)</button>`
    : "";

  let content = `
    <div style="text-align:center;padding:6px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));">
      <h2 style="margin:4px 0;">🌌 Divine Thread Pool</h2>
      <p style="margin:6px 0;font-weight:600;">✨ Harmony Threads: <span style="color:#00008B;">${harmony}</span> | 🔥 Discord Threads: <span style="color:#f39c9c;">${discord}</span>${dmResetButton}</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:6px;">
        <button data-draw="any" class="divine-thread-btn">Draw Divine Thread</button>
        ${game.user.isGM ? '<button data-update="true" class="divine-thread-update-btn">Update Pool</button>' : ''}
      </div>
      <div style="margin-top:8px;font-size:0.85em;color:var(--text-muted);">Click the button to draw a random Divine Thread from the pool.</div>
    </div>
  `;

  if (poolMessageId) {
    let msg = game.messages.get(poolMessageId);
    if (msg) msg.update({ content });
    else {
      let chatMsg = await ChatMessage.create({ content });
      poolMessageId = chatMsg.id;
    }
  } else {
    let chatMsg = await ChatMessage.create({ content });
    poolMessageId = chatMsg.id;
  }
}

// GM handles actual draw and broadcasts result
async function drawThreadGM() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  if (pool.length === 0) {
    ui.notifications.warn("The Divine Thread Pool is empty!");
    return;
  }

  let idx = Math.floor(Math.random() * pool.length);
  let drawn = pool[idx];

  // Replace drawn thread with a new random one
  pool[idx] = Math.random() < 0.5 ? "Harmony" : "Discord";
  await game.settings.set(MODULE_ID, "threadPool", pool);

  let flavor = drawn === "Harmony" ? randomFlavor("Harmony") : randomFlavor("Discord");

  ChatMessage.create({ content: `🎴 You drew a **${drawn} Thread**! ${flavor}` });
  showPool();
}

// Request GM to handle draw
function drawThread() {
  if (!game.user.isGM) {
    game.socket.emit(`module.${MODULE_ID}`, { type: "draw" });
  } else {
    drawThreadGM();
  }
}

// GM resets the pool
async function resetPool() {
  if (!game.user.isGM) return;
  await initPool();
  ChatMessage.create({ content: "♻️ The Divine Thread Pool has been reset to 5 Harmony / 5 Discord threads by the GM." });
}

// Force update of pool display (GM only)
function updatePool() {
  if (!game.user.isGM) return;
  showPool();
}

// Socket listener for player draws
Hooks.once("ready", () => {
  game.socket.on(`module.${MODULE_ID}`, async data => {
    if (!game.user.isGM) return;
    if (data.type === "draw") await drawThreadGM();
  });
});

// Listen for chat button clicks
Hooks.on("renderChatMessage", (message, html) => {
  html.find("button[data-draw='any']").click(ev => { ev.preventDefault(); drawThread(); });
  html.find("button[data-reset='true']").click(ev => { ev.preventDefault(); resetPool(); });
  html.find("button[data-update='true']").click(ev => { ev.preventDefault(); updatePool(); });
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

// Export globally
window.DivineThreadPool = {
  initPool,
  showPool,
  drawThread,
  resetPool,
  updatePool
};
