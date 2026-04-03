import { defineWidget } from "@dashtop/widget-sdk";

interface LearnConfig {
  level: "beginner" | "intermediate" | "expert";
  style: "eli5" | "textbook" | "analogy";
}

export default defineWidget<LearnConfig>((root, { config, isEditing, onConfigChange }) => {
  let currentTopic = "";
  let isLoading = false;

  function render() {
    root.innerHTML = `
      <div style="display:flex; flex-direction:column; height:100%; font-family:system-ui,sans-serif; color:#1a1a2e;">

        <!-- Search -->
        <div style="padding:12px; border-bottom:1px solid #eee;">
          <div style="display:flex; gap:8px;">
            <input
              id="topic-input"
              type="text"
              placeholder="What do you want to learn?"
              value="${currentTopic}"
              style="flex:1; padding:8px 12px; border:1px solid #ddd; border-radius:8px; font-size:14px; outline:none;"
            />
            <button id="learn-btn" style="padding:8px 16px; background:#7c3aed; color:white; border:none; border-radius:8px; font-size:13px; cursor:pointer;">
              ${isLoading ? "Thinking..." : "Explain"}
            </button>
          </div>
          <div style="display:flex; gap:4px; margin-top:8px;">
            ${["Quantum Physics", "Neural Networks", "Blockchain", "DNA", "Black Holes"].map(t =>
              `<button class="quick-topic" data-topic="${t}" style="padding:3px 8px; font-size:11px; border:1px solid #ddd; border-radius:12px; background:white; cursor:pointer; color:#666;">${t}</button>`
            ).join("")}
          </div>
        </div>

        <!-- Level badge -->
        <div style="padding:8px 12px; display:flex; gap:6px; align-items:center;">
          <span style="font-size:10px; padding:2px 8px; border-radius:8px; background:${
            config.level === "beginner" ? "#dcfce7" : config.level === "intermediate" ? "#fef3c7" : "#ede9fe"
          }; color:${
            config.level === "beginner" ? "#166534" : config.level === "intermediate" ? "#92400e" : "#5b21b6"
          };">${config.level}</span>
          <span style="font-size:10px; padding:2px 8px; border-radius:8px; background:#f0f0f0; color:#666;">${config.style}</span>
        </div>

        <!-- Content -->
        <div id="content" style="flex:1; overflow:auto; padding:12px;">
          <div style="text-align:center; padding:40px 20px; color:#999;">
            <div style="font-size:32px; margin-bottom:8px;">🎓</div>
            <div style="font-size:14px;">Type any concept above</div>
            <div style="font-size:12px; margin-top:4px;">I'll explain it at your level</div>
          </div>
        </div>

        <!-- Quick actions -->
        <div style="padding:8px 12px; border-top:1px solid #eee; display:flex; gap:6px;">
          <button id="deeper-btn" style="padding:5px 10px; font-size:11px; border:1px solid #ddd; border-radius:6px; background:white; cursor:pointer;">🔍 Go deeper</button>
          <button id="analogy-btn" style="padding:5px 10px; font-size:11px; border:1px solid #ddd; border-radius:6px; background:white; cursor:pointer;">💡 Analogy</button>
          <button id="quiz-btn" style="padding:5px 10px; font-size:11px; border:1px solid #ddd; border-radius:6px; background:white; cursor:pointer;">❓ Quiz me</button>
        </div>
      </div>
    `;

    // Attach handlers
    const input = root.querySelector("#topic-input") as HTMLInputElement;
    const btn = root.querySelector("#learn-btn") as HTMLButtonElement;
    const content = root.querySelector("#content") as HTMLDivElement;

    const explain = async (topic: string) => {
      if (!topic) return;
      currentTopic = topic;
      isLoading = true;
      render();

      const content = root.querySelector("#content") as HTMLDivElement;
      content.innerHTML = `<div style="text-align:center; padding:40px; color:#999;">
        <div style="font-size:24px; animation: spin 1s linear infinite;">⏳</div>
        <div style="font-size:13px; margin-top:8px;">Thinking about ${topic}...</div>
      </div>`;

      // Mock response — in production this calls the Dashtop chat API
      setTimeout(() => {
        isLoading = false;
        const explanations: Record<string, Record<string, string>> = {
          eli5: {
            default: `<b>${topic}</b><br><br>Imagine you have a box of crayons. Each crayon is a different idea about ${topic.toLowerCase()}. When you put them all together, they make a beautiful picture that helps us understand the world better!<br><br>The key thing to remember is that ${topic.toLowerCase()} is all about how things connect and work together. Scientists and thinkers have been studying this for a long time, and they keep finding new and exciting things.`
          },
          textbook: {
            default: `<b>${topic}</b><br><br><b>Definition:</b> ${topic} is a fundamental concept that describes the relationship between interconnected systems and their emergent properties.<br><br><b>Key Principles:</b><br>1. Foundation — The basic building blocks and core ideas<br>2. Mechanisms — How the underlying processes work<br>3. Applications — Real-world uses and implications<br><br><b>Further Reading:</b> For a deeper understanding, explore related concepts and their mathematical foundations.`
          },
          analogy: {
            default: `<b>${topic}</b><br><br>Think of ${topic.toLowerCase()} like a city's transportation system:<br><br>🚌 <b>The Buses</b> are like the basic units — they follow set routes (rules) and carry passengers (information).<br><br>🗺️ <b>The Map</b> represents the structure — how everything connects and flows together.<br><br>🚦 <b>Traffic Lights</b> are the control mechanisms — they regulate timing and prevent collisions.<br><br>Just like a city works best when all these parts work in harmony, ${topic.toLowerCase()} operates through the coordination of its fundamental components.`
          }
        };

        const text = explanations[config.style]?.default || explanations.eli5.default;
        const contentEl = root.querySelector("#content") as HTMLDivElement;
        if (contentEl) {
          contentEl.innerHTML = `<div style="font-size:13px; line-height:1.7; color:#333;">${text}</div>`;
        }
      }, 1200);
    };

    btn?.addEventListener("click", () => explain(input?.value || ""));
    input?.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") explain(input.value);
    });

    root.querySelectorAll(".quick-topic").forEach((el) => {
      el.addEventListener("click", () => {
        const topic = (el as HTMLElement).dataset.topic || "";
        if (input) input.value = topic;
        explain(topic);
      });
    });

    root.querySelector("#deeper-btn")?.addEventListener("click", () => {
      if (currentTopic) explain(`${currentTopic} — explain in more detail`);
    });
    root.querySelector("#analogy-btn")?.addEventListener("click", () => {
      onConfigChange({ style: "analogy" });
    });
    root.querySelector("#quiz-btn")?.addEventListener("click", () => {
      if (currentTopic) explain(`Quiz question about ${currentTopic}`);
    });
  }

  render();
  return () => { root.innerHTML = ""; };
});
