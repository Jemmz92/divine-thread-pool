// Namespace
window.DivineThreadPool = {
  poolMessageId: null,

  // Initialize the pool (5 Harmony / 5 Discord)
  initPool: async function() {
    if (!game.user.isGM) return;

    const pool = Array(5).fill("Harmony").concat(Array(5).fill("Discord"));
    await game.settings.set("divine-thread-pool", "threadPool", pool);
    await this.showPool();
  },

  // Show the persistent chat message
  showPool: async function() {
    const pool = game.settings.get("divine-thread-pool", "threadPool") || [];
    const harmony = pool.filter(t => t === "Harmony").length;
    const discord = pool.filter(t => t === "Discord").length;

    const resetButton = game.user.isGM
      ? `<button class="divine-thread-reset-btn" style="margin-left:12px;">Reset Pool (5/5)</button>`
      : "";
    const updateButton = game.user.isGM
      ? `<button class="divine-thread-update-btn" style="margin-left:6px;">Update Pool</button>`
      : "";

    const content = `
      <div style="text-align:center; padding:6px; border:1px solid rgba(255,255,255,0.06); border-radius:6px; background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));">
        <h2 style="margin:4px 0;">🌌 Divine Thread Pool</h2>
        <p style="margin:6px 0; font-weight:600;">
          ✨ Harmony Threads: <span style="color:#00008B;">${harmony}</span> | 🔥 Discord Threads: <span style="color:#f39c9c;">${discord}</span>
          ${resetButton} ${updateButton}
        </p>
        <div style="display:flex; gap:8px; justify-content:center; margin-top:6px;">
          <button class="divine-thread-draw-btn">Draw Divine Thread</button>
        </div>
        <div style="margin-top:8px; font-size:0.85em; color:var(--text-muted);">
          Click the button to draw a random Divine Thread from the pool.
        </div>
      </div>
    `;

    if (this.poolMessageId) {
      const msg = game.messages.get(this.poolMessageId);
      if (msg) await msg.update({ content });
      else {
        const chatMsg = await ChatMessage.create({ content });
        this.poolMessageId = chatMsg.id;
      }
    } else {
      const chatMsg = await ChatMessage.create({ content });
      this.poolMessageId = chatMsg.id;
    }
  },

  // Draw a thread
  drawThread: async function() {
    const pool = game.settings.get("divine-thread-pool", "threadPool") || [];
    if (pool.length === 0) {
      ui.notifications.warn("The Divine Thread Pool is empty!");
      return;
    }

    const idx = Math.floor(Math.random() * pool.length);
    const drawn = pool[idx];

    // Replace with a random new thread
    pool[idx] = Math.random() < 0.5 ? "Harmony" : "Discord";
    await game.settings.set("divine-thread-pool", "threadPool", pool);

    const flavor = drawn === "Harmony"
      ? "Good fortune smiles upon you!"
      : "Beware, discord arises!";

    ChatMessage.create({ content: `🎴 You drew a **${drawn} Thread**! ${flavor}` });
    await this.showPool();
  },

  // Reset pool (GM only)
  resetPool: async function() {
    if (!game.user.isGM) return;
    await this.initPool();
    ui.notifications.info("🌌 Divine Thread Pool reset to 5/5.");
  }
};

// Register the game setting
Hooks.once("init", () => {
  game.settings.register("divine-thread-pool", "threadPool", {
    name: "Divine Thread Pool",
    hint: "Tracks the current Harmony and Discord threads.",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

// Attach button click handlers
Hooks.on("renderChatMessage", (msg, html) => {
  html.find(".divine-thread-draw-btn").click(() => window.DivineThreadPool.drawThread());
  html.find(".divine-thread-reset-btn").click(() => window.DivineThreadPool.resetPool());
  html.find(".divine-thread-update-btn").click(() => window.DivineThreadPool.showPool());
});
