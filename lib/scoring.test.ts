import { describe, expect, it } from "vitest";
import {
  MAX_SCORE,
  outcome,
  pointsForQuestion,
  scoreForAnswers,
  type AnsweredQuestion,
} from "./scoring";

describe("pointsForQuestion", () => {
  it("gives 1 point for the first 9 questions", () => {
    for (let i = 0; i < 9; i++) {
      expect(pointsForQuestion(i)).toBe(1);
    }
  });

  it("gives 2 points for the last question", () => {
    expect(pointsForQuestion(9)).toBe(2);
  });
});

describe("scoreForAnswers", () => {
  const allCorrect: AnsweredQuestion[] = Array.from({ length: 10 }, (_, i) => ({
    index: i,
    correct: true,
  }));

  it("reaches the max score of 11 when everything is correct", () => {
    expect(scoreForAnswers(allCorrect)).toBe(11);
    expect(MAX_SCORE).toBe(11);
  });

  it("scores 0 when everything is wrong or timed out", () => {
    const allWrong = allCorrect.map((a) => ({ ...a, correct: false }));
    expect(scoreForAnswers(allWrong)).toBe(0);
  });

  it("counts the last question as 2 points", () => {
    const onlyLast: AnsweredQuestion[] = [{ index: 9, correct: true }];
    expect(scoreForAnswers(onlyLast)).toBe(2);
  });

  it("adds regular and bonus questions together", () => {
    const mix: AnsweredQuestion[] = [
      { index: 0, correct: true }, // +1
      { index: 1, correct: false }, // 0
      { index: 9, correct: true }, // +2
    ];
    expect(scoreForAnswers(mix)).toBe(3);
  });
});

describe("outcome", () => {
  it("detects player A winning", () => {
    expect(outcome(11, 5)).toBe("a");
  });

  it("detects player B winning", () => {
    expect(outcome(3, 8)).toBe("b");
  });

  it("detects a tie", () => {
    expect(outcome(7, 7)).toBe("tie");
  });
});
