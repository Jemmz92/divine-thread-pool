// Namespace
window.DivineThreadPool = {
  // Initialize the pool
  initPool: async function() {
    if (!game.user.isGM) return;

    // Start with 5 Harmony and 5 Discord (total 10)
    const pool = { Harmony: 5, Discord: 5 };
    await game.settings.set("divine-thread-pool", "threadPoolCounts", pool);
    await this.showPool();
    ui.notifications.info("🌌 Divine Thread Pool initialized! Players can now draw threads.");
  },

  // Show persistent chat
  showPool: async function() {
    const pool = game.settings.get("divine-thread-pool", "threadPoolCounts") || { Harmony: 5, Discord: 5 };
    
    const content = `
      <div style="text-align:center; padding:6px; border:1px solid rgba(255,255,255,0.06); border-radius:6px; background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));">
        <h2 style="margin:4px 0;">🌌 Divine Thread Pool</h2>
        <p style="margin:6px 0; font-weight:600;">
          ✨ Harmony Threads: <span style="color:#00008B;">${pool.Harmony}</span>
          ${game.user.isGM ? `<button class="h-minus">-</button> <button class="h-plus">+</button>` : ""}
          | 🔥 Discord Threads: <span style="color:#f39c9c;">${pool.Discord}</span>
          ${game.user.isGM ? `<button class="d-minus">-</button> <button class="d-plus">+</button>` : ""}
        </p>
        <div style="display:flex; gap:8px; justify-content:center; margin-top:6px;">
          <button class="divine-thread-draw-btn">Draw Divine Thread</button>
        </div>
        <div style="margin-top:8px; font-size:0.85em; color:var(--text-muted);">
          Players click the button to draw a random Divine Thread.
          GM can adjust counts manually using + and - (total always 10).
        </div>
      </div>
    `;

    let msg = window.DivineThreadPool.poolMessageId ? game.messages.get(window.DivineThreadPool.poolMessageId) : null;
    if (!msg || !msg.isAuthor) {
      msg = await ChatMessage.create({ content, speaker: { alias: "Divine Thread Pool" } });
      window.DivineThreadPool.poolMessageId = msg.id;
    } else {
      await msg.update({ content });
    }
  },

  // Draw a thread (any player)
  drawThread: async function() {
    const pool = game.settings.get("divine-thread-pool", "threadPoolCounts") || { Harmony: 5, Discord: 5 };
    const totalThreads = pool.Harmony + pool.Discord;
    if (totalThreads <= 0) {
      ui.notifications.warn("The Divine Thread Pool is empty!");
      return;
    }

    // Randomly choose Harmony or Discord based on current counts
    const r = Math.random() * totalThreads;
    const drawnType = r < pool.Harmony ? "Harmony" : "Discord";

    // Decrease the drawn count
    pool[drawnType] = Math.max(0, pool[drawnType] - 1);

    // Ensure total stays at 10 by increasing the other type if needed
    const otherType = drawnType === "Harmony" ? "Discord" : "Harmony";
    const total = pool.Harmony + pool.Discord;
    if (total < 10) {
      pool[otherType] += 10 - total;
    }

    await game.settings.set("divine-thread-pool", "threadPoolCounts", pool);

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

    const flavor = drawnType === "Harmony"
      ? harmonyMessages[Math.floor(Math.random() * harmonyMessages.length)]
      : discordMessages[Math.floor(Math.random() * discordMessages.length)];

    await ChatMessage.create({
      content: `🎴 You drew a **${drawnType} Thread**! ${flavor}`,
      speaker: { alias: "Divine Thread Pool" }
    });

    await this.showPool();
  },

  // GM adjusts the pool manually, keeping total 10
  adjustThread: async function(type, delta) {
    if (!game.user.isGM) return;
    const pool = game.settings.get("divine-thread-pool", "threadPoolCounts") || { Harmony: 5, Discord: 5 };
    const otherType = type === "Harmony" ? "Discord" : "Harmony";

    // Apply delta
    pool[type] = Math.max(0, pool[type] + delta);

    // Enforce total of 10
    const total = pool.Harmony + pool.Discord;
    if (total < 10) {
      pool[otherType] += 10 - total;
    } else if (total > 10) {
      pool[otherType] = Math.max(0, pool[otherType] - (total - 10));
    }

    await game.settings.set("divine-thread-pool", "threadPoolCounts", pool);
    await this.showPool();
  }
};

// Register game setting
Hooks.once("init", () => {
  game.settings.register("divine-thread-pool", "threadPoolCounts", {
    name: "Divine Thread Pool Counts",
    hint: "Tracks the current Harmony and Discord threads.",
    scope: "world",
    config: false,
    type: Object,
    default: { Harmony: 5, Discord: 5 }
  });
});

// Button click handlers
Hooks.on("renderChatMessage", (msg, html) => {
  html.find(".divine-thread-draw-btn").click(() => window.DivineThreadPool.drawThread());
  html.find(".h-plus").click(() => window.DivineThreadPool.adjustThread("Harmony", 1));
  html.find(".h-minus").click(() => window.DivineThreadPool.adjustThread("Harmony", -1));
  html.find(".d-plus").click(() => window.DivineThreadPool.adjustThread("Discord", 1));
  html.find(".d-minus").click(() => window.DivineThreadPool.adjustThread("Discord", -1));
});
