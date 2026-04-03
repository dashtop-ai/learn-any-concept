/**
 * Spaced Repetition wrapper around ts-fsrs.
 *
 * Manages a list of learned concepts, each backed by an FSRS card.
 * All state lives in memory — the widget persists it via DashtopApp's setState/getState.
 */

import { createEmptyCard, fsrs, type Card, type Grade, Rating } from "ts-fsrs";

export { Rating };

export interface ConceptCard {
  topic: string;
  card: Card;
  /** The explanation text cached for review */
  explanation: string;
}

export interface ReviewSnapshot {
  topic: string;
  explanation: string;
  due: Date;
  state: number;       // 0=New, 1=Learning, 2=Review, 3=Relearning
  reps: number;
  lapses: number;
  stability: number;
  difficulty: number;
}

const f = fsrs();

// ── Public API ───────────────────────────────────

let concepts: ConceptCard[] = [];

/** Replace the full concept list (used to restore from persisted state). */
export function loadConcepts(saved: ConceptCard[]): void {
  // Rehydrate Date objects that were serialised as strings
  concepts = saved.map(c => ({
    ...c,
    card: {
      ...c.card,
      due: new Date(c.card.due),
      last_review: c.card.last_review ? new Date(c.card.last_review) : undefined,
    } as Card,
  }));
}

/** Get raw list for persistence. */
export function dumpConcepts(): ConceptCard[] {
  return concepts;
}

/** Create a new FSRS card for a topic. No-op if it already exists. */
export function addConcept(topic: string, explanation: string): void {
  const key = topic.toLowerCase().trim();
  if (concepts.some(c => c.topic.toLowerCase().trim() === key)) return;
  concepts.push({ topic, explanation, card: createEmptyCard() });
}

/** Return the concept most overdue for review, or null if nothing is due. */
export function getNextReview(): ConceptCard | null {
  const now = new Date();
  const due = concepts
    .filter(c => new Date(c.card.due) <= now)
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime());
  return due.length > 0 ? due[0] : null;
}

/** Submit a review rating for a concept. 1=Again 2=Hard 3=Good 4=Easy */
export function reviewConcept(topic: string, rating: Grade): void {
  const key = topic.toLowerCase().trim();
  const entry = concepts.find(c => c.topic.toLowerCase().trim() === key);
  if (!entry) return;

  const now = new Date();
  const scheduling = f.repeat(entry.card, now);
  const result = scheduling[rating];
  entry.card = result.card;
}

/** How many concepts are currently due for review. */
export function getDueCount(): number {
  const now = new Date();
  return concepts.filter(c => new Date(c.card.due) <= now).length;
}

/** All concepts with review metadata. */
export function getAllConcepts(): ReviewSnapshot[] {
  return concepts.map(c => ({
    topic: c.topic,
    explanation: c.explanation,
    due: new Date(c.card.due),
    state: c.card.state,
    reps: c.card.reps,
    lapses: c.card.lapses,
    stability: c.card.stability,
    difficulty: c.card.difficulty,
  }));
}

/** Mastery percentage: fraction of cards in Review state (state === 2). */
export function getMasteryPercent(): number {
  if (concepts.length === 0) return 0;
  const mastered = concepts.filter(c => c.card.state === 2).length;
  return Math.round((mastered / concepts.length) * 100);
}
