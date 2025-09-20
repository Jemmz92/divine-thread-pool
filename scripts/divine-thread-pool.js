// Namespace
window.DivineThreadPool = {
  poolMessageId: null,

  // Initialize the pool (GM only)
  initPool: async function() {
    if (!game.user.isGM) return;
    const pool = Array(5).fill("Harmony").concat(Array(5).fill("Discord"));
    await game.settings.set("divine-thread-pool", "threadPool", pool);
    await this.showPool();
    ui.notifications.info("🌌 Divine Thread Pool initialized! Players can now draw threads.");
  },

  // Show persistent chat
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

    // Always fetch the latest message or create a new one
    let msg = this.poolMessageId ? game.messages.get(this.poolMessageId) : null;
    if (!msg) {
      msg = await ChatMessage.create({ content });
      this.poolMessageId = msg.id;
    } else {
      await msg.update({ content });
    }
  },

  // Draw a thread (any player)
  drawThread: async function() {
    const pool = game.settings.get("divine-thread-pool", "threadPool") || [];
    if (pool.length === 0) {
      ui.notifications.warn("The Divine Thread Pool is empty!");
      return;
    }

    const idx = Math.floor(Math.random() * pool.length);
    const drawn = pool[idx];

    // Replace with random new thread
    pool[idx] = Math.random() < 0.5 ? "Harmony" : "Discord";
    await game.settings.set("divine-thread-pool", "threadPool", pool);

    // Flavor messages
    const harmonyMessages = [
      "Luminael smiles upon you, granting life and light.",
      "Verdalis blesses your journey through the wilds.",
      "Amaryth inspires joy and beauty around you.",
      "Zerithia favors your ventures with good fortune.",
      "Eryndra sparks innovation and progress in your path."
    ];
    const discordMessages = [
      "Dravok's fury shakes the land around you.",
      "Noctyra reminds you that all debts must be paid.",
      "A sudden calamity shakes your surroundings.",
      "Chance turns against you under Zerithia's watchful eye.",
      "The shadows stir, and a misfortune approaches."
    ];

    const flavor = drawn === "Harmony"
      ? harmonyMessages[Math.floor(Math.random() * harmonyMessages.length)]
      : discordMessages[Math.floor(Math.random() * discordMessages.length)];

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

// Button click handlers
Hooks.on("renderChatMessage", (msg, html) => {
  html.find(".divine-thread-draw-btn").click(() => window.DivineThreadPool.drawThread());
  html.find(".divine-thread-reset-btn").click(() => window.DivineThreadPool.resetPool());
  html.find(".divine-thread-update-btn").click(() => window.DivineThreadPool.showPool());
});
