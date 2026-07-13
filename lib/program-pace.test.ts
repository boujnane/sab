import { describe, expect, it } from "vitest";
import {
  currentProgramWeek,
  expectedProgramProgress,
  programPace,
} from "./program-pace";

const OB = [
  { status: "non_vu", weight: 2, programWeek: 1 },
  { status: "non_vu", weight: 3, programWeek: 2 },
  { status: "non_vu", weight: 3, programWeek: 3 },
  { status: "non_vu", weight: 4, programWeek: 4 },
] as const;

describe("currentProgramWeek", () => {
  it("identifie la semaine 3 le 13 juillet", () => {
    expect(currentProgramWeek("2026-07-13")).toBe(3);
  });
  it("sort du programme après la semaine 7", () => {
    expect(currentProgramWeek("2026-08-20")).toBeNull();
  });
});

describe("expectedProgramProgress", () => {
  it("n'attend rien avant la fin de la semaine 1", () => {
    expect(expectedProgramProgress([...OB], "2026-06-30", "2026-09-02")).toBe(0);
  });
  it("attend la semaine 1 lue dès le 5 juillet au soir", () => {
    // semaine 1 finit le 2026-07-05 ; poids 2/12 × 0.3 = 0.05
    expect(
      expectedProgramProgress([...OB], "2026-07-05", "2026-09-02"),
    ).toBeCloseTo(0.05);
  });
  it("atteint coverage×0.3 en fin de programme puis monte vers 1", () => {
    const end = expectedProgramProgress([...OB], "2026-08-16", "2026-09-02");
    expect(end).toBeCloseTo(0.3);
    const later = expectedProgramProgress([...OB], "2026-08-21", "2026-09-02");
    expect(later).toBeGreaterThan(end);
    expect(
      expectedProgramProgress([...OB], "2026-08-26", "2026-09-02"),
    ).toBeCloseTo(1);
  });
});

describe("programPace", () => {
  it("est dans les temps si les semaines passées sont lues", () => {
    const chapters = [
      { status: "lu", weight: 2, programWeek: 1 },
      { status: "lu", weight: 3, programWeek: 2 },
      { status: "non_vu", weight: 3, programWeek: 3 },
      { status: "non_vu", weight: 4, programWeek: 4 },
    ] as const;
    const p = programPace([...chapters], "2026-07-13", "2026-09-02");
    // réel 0.125 = attendu de fin S2 ; prochain dépassement : fin S3 (19/07)
    expect(p.kind === "on_track" || p.kind === "ahead").toBe(true);
  });
  it("signale le retard si rien n'est lu en semaine 3", () => {
    const p = programPace([...OB], "2026-07-13", "2026-09-02");
    expect(p).toEqual({ kind: "behind", days: 8 });
  });
});
