import { DashtopApp } from "@dashtop/widget-sdk";
import {
  addConcept,
  getAllConcepts,
  getDueCount,
  getMasteryPercent,
  getNextReview,
  loadConcepts,
  dumpConcepts,
  reviewConcept,
  Rating,
} from "./review";

/**
 * Learn Any Concept
 *
 * AI tutoring app. Type any concept, get a clear explanation.
 * Three tabs: Learn | Review | Progress
 *
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
  icon = "\u{1F393}";
  color = "#7c3aed";
  placeholder = "What do you want to learn?";
  tabs = ["Learn", "Review", "Progress"];

  private currentExplanation = "";
  private currentTopic = "";
  /** Review tab: whether we revealed the answer */
  private reviewRevealed = false;
  /** Track whether we restored persisted state */
  private restored = false;

  // ── Quick actions (dynamically updated) ─────

  private updateQuickActions(): void {
    const due = getDueCount();
    this.quickActions = [
      {
        label: `Review${due > 0 ? ` (${due} due)` : ""}`,
        icon: "\u{1F4DA}",
        active: due > 0,
        onClick: () => {
          this.activeTab = 1;
          this.reviewRevealed = false;
          this.fullRender();
        },
      },
    ];
  }

  // ── Persistence helpers ────────────────────

  private persist(): void {
    this.setState("concepts", dumpConcepts());
  }

  private restoreOnce(): void {
    if (this.restored) return;
    this.restored = true;
    const saved = this.getState<ReturnType<typeof dumpConcepts>>("concepts");
    if (saved && Array.isArray(saved)) {
      loadConcepts(saved);
    }
  }

  // ── Rendering ──────────────────────────────

  renderContent(container: HTMLElement): void {
    this.restoreOnce();
    this.updateQuickActions();

    switch (this.activeTab) {
      case 0:
        this.renderLearnTab(container);
        break;
      case 1:
        this.renderReviewTab(container);
        break;
      case 2:
        this.renderProgressTab(container);
        break;
    }
  }

  // ── Learn Tab ──────────────────────────────

  private renderLearnTab(container: HTMLElement): void {
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
               <button id="btn-d" style="padding:5px 10px;font-size:11px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">\u{1F50D} Deeper</button>
               <button id="btn-a" style="padding:5px 10px;font-size:11px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">\u{1F4A1} Analogy</button>
               <button id="btn-q" style="padding:5px 10px;font-size:11px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;">\u2753 Quiz</button>
             </div>`
          : `<div style="text-align:center;padding:32px;color:#999;">
               <div style="font-size:40px;margin-bottom:8px;">\u{1F393}</div>
               <div style="font-size:14px;">What do you want to learn?</div>
               <div style="font-size:12px;margin-top:4px;">Click a topic or type below</div>
             </div>`
        }
      </div>
    `;

    container.querySelectorAll(".qt").forEach(el => {
      el.addEventListener("click", () => this.explain((el as HTMLElement).dataset.t || ""));
    });
    container.querySelector("#btn-d")?.addEventListener("click", () => this.explain(this.currentTopic + " \u2014 more detail"));
    container.querySelector("#btn-a")?.addEventListener("click", () => this.explain(this.currentTopic + " \u2014 as analogy"));
    container.querySelector("#btn-q")?.addEventListener("click", () => this.explain("Quiz: " + this.currentTopic));
  }

  // ── Review Tab ─────────────────────────────

  private renderReviewTab(container: HTMLElement): void {
    const next = getNextReview();
    if (!next) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 12px;color:#999;">
          <div style="font-size:40px;margin-bottom:8px;">\u2705</div>
          <div style="font-size:14px;font-weight:500;color:#333;">All caught up!</div>
          <div style="font-size:12px;margin-top:4px;">No concepts due for review right now.</div>
          <div style="font-size:11px;margin-top:12px;color:#aaa;">${getAllConcepts().length === 0 ? "Learn some concepts first to start reviewing." : "Come back later when cards are due."}</div>
        </div>`;
      return;
    }

    const revealed = this.reviewRevealed;

    container.innerHTML = `
      <div style="padding:12px;">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#ede9fe;color:#5b21b6;">Review</span>
          <span style="font-size:10px;padding:2px 8px;border-radius:8px;background:#fef3c7;color:#92400e;margin-left:4px;">${getDueCount()} due</span>
        </div>
        <div style="background:#fafafa;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee;">
          <div style="font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px;">${next.topic}</div>
          ${revealed
            ? `<div style="font-size:13px;line-height:1.7;color:#333;text-align:left;margin-top:12px;">${next.explanation}</div>`
            : `<button id="btn-reveal" style="margin-top:8px;padding:8px 20px;font-size:12px;border:1px solid ${this.color};border-radius:8px;background:white;color:${this.color};cursor:pointer;font-weight:500;">Show Answer</button>`
          }
        </div>
        ${revealed ? `
        <div style="margin-top:16px;text-align:center;">
          <div style="font-size:11px;color:#888;margin-bottom:8px;">How well did you remember?</div>
          <div style="display:flex;gap:6px;justify-content:center;">
            <button class="rate-btn" data-r="1" style="padding:6px 12px;font-size:11px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#dc2626;cursor:pointer;">Again</button>
            <button class="rate-btn" data-r="2" style="padding:6px 12px;font-size:11px;border:1px solid #fed7aa;border-radius:8px;background:#fff7ed;color:#ea580c;cursor:pointer;">Hard</button>
            <button class="rate-btn" data-r="3" style="padding:6px 12px;font-size:11px;border:1px solid #bbf7d0;border-radius:8px;background:#f0fdf4;color:#16a34a;cursor:pointer;">Good</button>
            <button class="rate-btn" data-r="4" style="padding:6px 12px;font-size:11px;border:1px solid #c4b5fd;border-radius:8px;background:#f5f3ff;color:#7c3aed;cursor:pointer;">Easy</button>
          </div>
        </div>` : ""}
      </div>
    `;

    container.querySelector("#btn-reveal")?.addEventListener("click", () => {
      this.reviewRevealed = true;
      this.refresh();
    });

    container.querySelectorAll(".rate-btn").forEach(el => {
      el.addEventListener("click", () => {
        const rating = parseInt((el as HTMLElement).dataset.r || "3") as 1 | 2 | 3 | 4;
        const gradeMap: Record<number, typeof Rating.Again | typeof Rating.Hard | typeof Rating.Good | typeof Rating.Easy> = {
          1: Rating.Again,
          2: Rating.Hard,
          3: Rating.Good,
          4: Rating.Easy,
        };
        reviewConcept(next.topic, gradeMap[rating]);
        this.persist();
        this.reviewRevealed = false;
        this.fullRender();
      });
    });
  }

  // ── Progress Tab ───────────────────────────

  private renderProgressTab(container: HTMLElement): void {
    const all = getAllConcepts();
    const mastery = getMasteryPercent();
    const due = getDueCount();

    container.innerHTML = `
      <div style="padding:12px;">
        <!-- Stats row -->
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <div style="flex:1;background:#f5f3ff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:${this.color};">${all.length}</div>
            <div style="font-size:10px;color:#888;">Concepts</div>
          </div>
          <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:#16a34a;">${mastery}%</div>
            <div style="font-size:10px;color:#888;">Mastery</div>
          </div>
          <div style="flex:1;background:#fff7ed;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:#ea580c;">${due}</div>
            <div style="font-size:10px;color:#888;">Due</div>
          </div>
        </div>
        ${all.length === 0
          ? `<div style="text-align:center;padding:24px;color:#999;font-size:12px;">No concepts learned yet. Go to the Learn tab to get started!</div>`
          : `<div style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
              <div style="padding:6px 12px;background:#fafafa;border-bottom:1px solid #eee;font-size:11px;font-weight:600;color:#888;">All Concepts</div>
              ${all.map(c => {
                const now = new Date();
                const isDue = c.due <= now;
                const stateLabels = ["New", "Learning", "Review", "Relearning"];
                const stateColors = ["#6366f1", "#f59e0b", "#22c55e", "#ef4444"];
                const timeStr = this.formatRelativeDate(c.due);
                return `
                  <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #f4f4f5;">
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:12px;font-weight:500;">${c.topic}</div>
                      <div style="font-size:10px;color:#888;">${isDue ? "\u{1F534} Due now" : "\u{1F551} " + timeStr}</div>
                    </div>
                    <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${stateColors[c.state]}22;color:${stateColors[c.state]};font-weight:500;">${stateLabels[c.state]}</span>
                  </div>`;
              }).join("")}
            </div>`
        }
      </div>
    `;
  }

  // ── Chat handler ───────────────────────────

  async onChat(message: string): Promise<string> {
    this.explain(message);
    return `Explaining "${message}"...`;
  }

  // ── Tab change handler ─────────────────────

  onTabChange(index: number): void {
    if (index === 1) {
      this.reviewRevealed = false;
    }
  }

  // ── Internal helpers ───────────────────────

  private explain(topic: string): void {
    const baseTopic = topic.replace(/ \u2014 .+$/, "");
    this.currentTopic = baseTopic;
    this.currentExplanation = "Loading...";
    this.activeTab = 0;
    this.refresh();

    setTimeout(() => {
      const s = this.config.style || "eli5";
      const t = this.currentTopic;
      this.currentExplanation = s === "analogy"
        ? `<b>${t}</b><br><br>Think of it like a city's transport system:<br>\u{1F68C} Buses = basic units following rules<br>\u{1F5FA}\uFE0F Map = the structure connecting everything<br>\u{1F6A6} Lights = control mechanisms<br><br>All parts work in harmony \u2014 that's <b>${t.toLowerCase()}</b>.`
        : s === "textbook"
        ? `<b>${t}</b><br><br><b>Definition:</b> The study of ${t.toLowerCase()} and its interactions.<br><br>1. <b>Foundations</b> \u2014 Core building blocks<br>2. <b>Mechanisms</b> \u2014 How processes interact<br>3. <b>Applications</b> \u2014 Real-world implications`
        : `<b>${t}</b><br><br>Imagine LEGO bricks \u{1F9F1} \u2014 each one is a piece of <b>${t.toLowerCase()}</b>. Connect them just right and something amazing emerges!<br><br>\u{1F9F1} Bricks = building blocks<br>\u{1F517} Connections = interactions<br>\u{1F3D7}\uFE0F Creation = what we observe`;

      // Auto-add concept to the review system
      addConcept(t, this.currentExplanation);
      this.persist();

      this.fullRender();
    }, 600);
  }

  /** Full re-render (includes quick actions, tabs, etc.) */
  private fullRender(): void {
    if (!this.root) return;
    // Force the base class to do a full render by calling asWidget's internal render
    // We use refresh() which only re-renders content, but we also need quick actions updated.
    // The base class re-renders everything when render() is called via tab changes.
    // For quick action updates we need a full render — trigger via the parent mechanism.
    this.updateQuickActions();
    this.refresh();
  }

  private formatRelativeDate(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return "now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
  }
}

export default new LearnApp().asWidget();
