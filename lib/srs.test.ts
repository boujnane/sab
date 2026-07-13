import { describe, expect, it } from "vitest";
import { newCard, retrievability, review, type SrsCard } from "./srs";

const NOW = "2026-07-13T10:00:00.000Z";
const EXAM = "2026-09-02"; // obligations

function daysFromNow(dueAt: string, nowIso: string = NOW): number {
  return (new Date(dueAt).getTime() - new Date(nowIso).getTime()) / 86_400_000;
}

describe("newCard", () => {
  it("part sans échéance ni historique", () => {
    const card = newCard();
    expect(card.state).toBe("new");
    expect(card.reps).toBe(0);
    expect(card.lastReviewedAt).toBeNull();
  });
});

describe("review - première réponse", () => {
  it("raté : re-proposée dans les minutes qui suivent", () => {
    const { card, dueAt } = review(newCard(), 1, NOW, EXAM);
    expect(card.state).toBe("learning");
    expect(card.lapses).toBe(1);
    expect(daysFromNow(dueAt)).toBeLessThan(0.05);
  });

  it("ok : revient dans quelques jours", () => {
    const { card, dueAt } = review(newCard(), 3, NOW, EXAM);
    expect(card.state).toBe("review");
    const days = daysFromNow(dueAt);
    expect(days).toBeGreaterThanOrEqual(2);
    expect(days).toBeLessThanOrEqual(6);
  });

  it("facile : s'espace plus que ok", () => {
    const ok = review(newCard(), 3, NOW, EXAM);
    const facile = review(newCard(), 4, NOW, EXAM);
    expect(daysFromNow(facile.dueAt)).toBeGreaterThan(daysFromNow(ok.dueAt));
  });

  it("difficile : revient plus vite que ok", () => {
    const ok = review(newCard(), 3, NOW, EXAM);
    const difficile = review(newCard(), 2, NOW, EXAM);
    expect(daysFromNow(difficile.dueAt)).toBeLessThan(daysFromNow(ok.dueAt));
  });
});

describe("review - cartes connues", () => {
  it("les réussites successives espacent les intervalles", () => {
    const card = review(newCard(), 3, NOW, EXAM).card;
    const second = review(card, 3, "2026-07-17T10:00:00.000Z", EXAM);
    const firstInterval = 4;
    const secondInterval = daysFromNow(
      second.dueAt,
      "2026-07-17T10:00:00.000Z",
    );
    expect(secondInterval).toBeGreaterThan(firstInterval);
  });

  it("un raté fait chuter la stabilité et compte un lapse", () => {
    const before = review(newCard(), 4, NOW, EXAM).card;
    const after = review(before, 1, "2026-07-20T10:00:00.000Z", EXAM);
    expect(after.card.state).toBe("relearning");
    expect(after.card.lapses).toBe(1);
    expect(after.card.stability).toBeLessThan(before.stability);
    expect(daysFromNow(after.dueAt, "2026-07-20T10:00:00.000Z")).toBeLessThan(
      0.05,
    );
  });

  it("la difficulté augmente quand on rate, baisse quand c'est facile", () => {
    const base = review(newCard(), 3, NOW, EXAM).card;
    const rate = review(base, 1, "2026-07-17T10:00:00.000Z", EXAM).card;
    const facile = review(base, 4, "2026-07-17T10:00:00.000Z", EXAM).card;
    expect(rate.difficulty).toBeGreaterThan(base.difficulty);
    expect(facile.difficulty).toBeLessThan(base.difficulty);
  });
});

describe("plafond examen", () => {
  it("aucune échéance après examen − 3 jours", () => {
    // Carte très stable notée facile près de l'examen
    const stable: SrsCard = {
      state: "review",
      stability: 60,
      difficulty: 3,
      reps: 8,
      lapses: 0,
      lastReviewedAt: "2026-08-10T10:00:00.000Z",
    };
    const { dueAt } = review(stable, 4, "2026-08-25T10:00:00.000Z", EXAM);
    expect(new Date(dueAt).getTime()).toBeLessThanOrEqual(
      Date.UTC(2026, 7, 30),
    );
  });

  it("le plafond ne planifie jamais dans le passé", () => {
    const { dueAt } = review(newCard(), 3, "2026-09-01T10:00:00.000Z", EXAM);
    expect(new Date(dueAt).getTime()).toBeGreaterThanOrEqual(
      new Date("2026-09-01T10:00:00.000Z").getTime(),
    );
  });
});

describe("retrievability", () => {
  it("vaut 1 immédiatement et décroît avec le temps", () => {
    expect(retrievability(0, 5)).toBe(1);
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 1);
    expect(retrievability(30, 5)).toBeLessThan(retrievability(5, 5));
  });
});
