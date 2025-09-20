// Show pool in a single persistent chat message
async function showPool() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  let harmony = pool.filter(p => p === "Harmony").length;
  let discord = pool.filter(p => p === "Discord").length;

  let dmResetButton = game.user.isGM
    ? `<button data-reset="true" class="divine-thread-reset-btn" style="margin-left:12px;">Reset Pool (5/5)</button>`
    : "";

  let dmUpdateButton = game.user.isGM
    ? `<button data-update="true" class="divine-thread-update-btn" style="margin-left:6px;">Update Pool</button>`
    : "";

  let content = `
    <div style="text-align:center;padding:6px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));">
      <h2 style="margin:4px 0;">🌌 Divine Thread Pool</h2>
      <p style="margin:6px 0;font-weight:600;">✨ Harmony Threads: <span style="color:#00008B;">${harmony}</span> | 🔥 Discord Threads: <span style="color:#f39c9c;">${discord}</span> ${dmResetButton} ${dmUpdateButton}</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:6px;">
        <button data-draw="any" class="divine-thread-btn">Draw Divine Thread</button>
      </div>
      <div style="margin-top:8px;font-size:0.85em;color:var(--text-muted);">Click the button to draw a random Divine Thread from the pool.</div>
    </div>
  `;

  if (poolMessageId) {
    let msg = game.messages.get(poolMessageId);
    if (msg) {
      await msg.update({ content });
    } else {
      let chatMsg = await ChatMessage.create({ content });
      poolMessageId = chatMsg.id;
    }
  } else {
    let chatMsg = await ChatMessage.create({ content });
    poolMessageId = chatMsg.id;
  }
}

// GM handles actual draw
async function drawThreadGM() {
  let pool = game.settings.get(MODULE_ID, "threadPool") || [];
  if (pool.length === 0) {
    ui.notifications.warn("The Divine Thread Pool is empty!");
    return;
  }

  // Pick a random thread
  let idx = Math.floor(Math.random() * pool.length);
  let drawn = pool[idx];

  // Replace drawn thread with a new random one
  pool[idx] = Math.random() < 0.5 ? "Harmony" : "Discord";

  // Save updated pool to settings
  await game.settings.set(MODULE_ID, "threadPool", pool);

  // Broadcast to all players (force them to update display)
  game.socket.emit(`module.${MODULE_ID}`, { type: "updatePool" });

  // Show flavor message
  let flavor = drawn === "Harmony" ? randomFlavor("Harmony") : randomFlavor("Discord");
  ChatMessage.create({ content: `🎴 You drew a **${drawn} Thread**! ${flavor}` });

  // Update persistent pool message
  showPool();
}

// Socket listener to sync pool for everyone
Hooks.once("ready", () => {
  game.socket.on(`module.${MODULE_ID}`, async data => {
    if (data.type === "draw" && game.user.isGM) {
      await drawThreadGM();
    }
    if (data.type === "updatePool") {
      showPool();
    }
  });
});

// Players request draw
function drawThread() {
  if (!game.user.isGM) {
    game.socket.emit(`module.${MODULE_ID}`, { type: "draw" });
  } else {
    drawThreadGM();
  }
}

// Update Pool button (GM only)
function updatePool() {
  if (!game.user.isGM) return;
  showPool();
}
