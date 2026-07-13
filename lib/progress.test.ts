import { describe, expect, it } from "vitest";
import {
  daysUntil,
  expectedProgress,
  pace,
  paceLabel,
  subjectProgress,
} from "./progress";

describe("subjectProgress", () => {
  it("vaut 0 quand tout est non vu", () => {
    expect(
      subjectProgress([
        { status: "non_vu", weight: 5 },
        { status: "non_vu", weight: 2 },
      ]),
    ).toBe(0);
  });

  it("pondère par le poids des chapitres", () => {
    // maitrise(4) + non_vu(1) → 4/5
    expect(
      subjectProgress([
        { status: "maitrise", weight: 4 },
        { status: "non_vu", weight: 1 },
      ]),
    ).toBeCloseTo(0.8);
  });

  it("applique les poids de statut", () => {
    expect(subjectProgress([{ status: "fiche", weight: 3 }])).toBeCloseTo(0.55);
  });
});

describe("expectedProgress", () => {
  // Obligations : examen 2026-09-02, cible 100 % le 2026-08-26 (44 jours de plan)
  it("vaut 0 au départ et 1 à J−7", () => {
    expect(expectedProgress("2026-07-13", "2026-09-02")).toBe(0);
    expect(expectedProgress("2026-08-26", "2026-09-02")).toBe(1);
  });

  it("est linéaire entre les deux", () => {
    expect(expectedProgress("2026-08-04", "2026-09-02")).toBeCloseTo(22 / 44);
  });

  it("est borné après la cible", () => {
    expect(expectedProgress("2026-09-01", "2026-09-02")).toBe(1);
  });
});

describe("pace", () => {
  it("détecte l'avance en jours", () => {
    // à mi-plan (22/44), réel 0.6 → +0.1 × 44j ≈ +4.4 j
    const p = pace(0.6, "2026-08-04", "2026-09-02");
    expect(p).toEqual({ kind: "ahead", days: 4 });
    expect(paceLabel(p)).toBe("J+4 d'avance");
  });

  it("détecte le retard", () => {
    const p = pace(0.3, "2026-08-04", "2026-09-02");
    expect(p).toEqual({ kind: "behind", days: 9 });
  });

  it("tolère ±0,5 jour", () => {
    expect(pace(0.505, "2026-08-04", "2026-09-02")).toEqual({
      kind: "on_track",
    });
  });

  it("signale terminé à 100 %", () => {
    expect(pace(1, "2026-08-04", "2026-09-02")).toEqual({ kind: "done" });
  });
});

describe("daysUntil", () => {
  it("compte les jours restants", () => {
    expect(daysUntil("2026-07-13", "2026-09-01")).toBe(50);
  });
});
