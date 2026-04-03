import { DashtopApp } from "@dashtop/widget-sdk";

/**
 * Learn Any Concept
 *
 * AI tutoring app. Type any concept, get a clear explanation.
 * Extends DashtopApp for the standard layout (header, chat, pill actions).
 */

interface LearnConfig {
  level: "beginner" | "intermediate" | "expert";
  style: "eli5" | "textbook" | "analogy";
}

const QUICK_TOPICS = [
  "Quantum Physics", "Neural Networks", "Blockchain", "DNA",
  "Black Holes", "Game Theory", "CRISPR", "Relativity",
];

class LearnApp extends DashtopApp<LearnConfig> {
  name = "Learn Any Concept";
  icon = "🎓";
  color = "#7c3aed";
  placeholder = "What do you want to learn?";

  private currentExplanation = "";
  private currentTopic = "";

  renderContent(container: HTMLElement) {
    const level = this.config.level || "beginner";
    const style = this.config.style || "eli5";

    container.innerHTML = `
      <div style="padding:12px;">
        <div style="display:flex;gap:6px;margin-bottom:12px;">
          <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:${
            level === "beginner" ? "#dcfce7" : level === "intermediate" ? "#fef3c7" : "#ede9fe"
          };color:${
            level === "beginner" ? "#166534" : level === "intermediate" ? "#92400e" : "#5b21b6"
          };">${level}</span>
          <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#f0f0f0;color:#666;">${style}</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;">
          ${QUICK_TOPICS.map(t =>
            `<button class="qt" data-t="${t}" style="padding:3px 8px;font-size:11px;border:1px solid #ddd;border-radius:12px;background:${this.currentTopic===t?this.color:"white"};color:${this.currentTopic===t?"white":"#666"};cursor:pointer;">${t}</button>`
          ).join("")}
        </div>
        ${this.currentExplanation
          ? `<div style="font-size:13px;line-height:1.7;color:#333;">${this.currentExplanation}</div>
             <div style="display:flex;gap:6px;margin-top:16px;border-top:1px solid #eee;padding-top:12px;">
               <button id="btn-d" style="padding:5px 10px;font-size:11px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">🔍 Deeper</button>
               <button id="btn-a" style="padding:5px 10px;font-size:11px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">💡 Analogy</button>
               <button id="btn-q" style="padding:5px 10px;font-size:11px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">❓ Quiz</button>
             </div>`
          : `<div style="text-align:center;padding:32px;color:#999;">
               <div style="font-size:40px;margin-bottom:8px;">🎓</div>
               <div style="font-size:14px;">What do you want to learn?</div>
               <div style="font-size:12px;margin-top:4px;">Click a topic or type below</div>
             </div>`
        }
      </div>
    `;

    container.querySelectorAll(".qt").forEach(el => {
      el.addEventListener("click", () => this.explain((el as HTMLElement).dataset.t || ""));
    });
    container.querySelector("#btn-d")?.addEventListener("click", () => this.explain(this.currentTopic + " — more detail"));
    container.querySelector("#btn-a")?.addEventListener("click", () => this.explain(this.currentTopic + " — as analogy"));
    container.querySelector("#btn-q")?.addEventListener("click", () => this.explain("Quiz: " + this.currentTopic));
  }

  async onChat(message: string): Promise<string> {
    this.explain(message);
    return `Explaining "${message}"...`;
  }

  private explain(topic: string) {
    this.currentTopic = topic.replace(/ — .+$/, "");
    this.currentExplanation = "Loading...";
    this.rerender();

    setTimeout(() => {
      const s = this.config.style || "eli5";
      const t = this.currentTopic;
      this.currentExplanation = s === "analogy"
        ? `<b>${t}</b><br><br>Think of it like a city's transport system:<br>🚌 Buses = basic units following rules<br>🗺️ Map = the structure connecting everything<br>🚦 Lights = control mechanisms<br><br>All parts work in harmony — that's <b>${t.toLowerCase()}</b>.`
        : s === "textbook"
        ? `<b>${t}</b><br><br><b>Definition:</b> The study of ${t.toLowerCase()} and its interactions.<br><br>1. <b>Foundations</b> — Core building blocks<br>2. <b>Mechanisms</b> — How processes interact<br>3. <b>Applications</b> — Real-world implications`
        : `<b>${t}</b><br><br>Imagine LEGO bricks 🧱 — each one is a piece of <b>${t.toLowerCase()}</b>. Connect them just right and something amazing emerges!<br><br>🧱 Bricks = building blocks<br>🔗 Connections = interactions<br>🏗️ Creation = what we observe`;
      this.rerender();
    }, 600);
  }

  private rerender() {
    if (!this.root) return;
    const c = this.root.querySelector("#da-content") as HTMLElement;
    if (c) this.renderContent(c);
  }
}

export default new LearnApp().asWidget();
