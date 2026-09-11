/**
 * Scoring rules for a Quizzey match — the single source of truth.
 *
 * A match has 10 questions, 4 answers each, 10 seconds per question.
 * The first 9 questions award 1 point each; the last (10th) awards 2 points.
 * Maximum score is therefore 9 * 1 + 2 = 11.
 */

export const QUESTIONS_PER_MATCH = 10;
export const SECONDS_PER_QUESTION = 10;
export const ANSWERS_PER_QUESTION = 4;

/** Points a correctly-answered question is worth, by its 0-based position. */
export function pointsForQuestion(
  index: number,
  total: number = QUESTIONS_PER_MATCH,
): number {
  return index === total - 1 ? 2 : 1;
}

/** Highest score achievable in a full match (all correct). */
export const MAX_SCORE = (QUESTIONS_PER_MATCH - 1) * 1 + 2; // 11

export interface AnsweredQuestion {
  /** 0-based position of the question within the match. */
  index: number;
  /** Whether the player's selected answer was correct. */
  correct: boolean;
}

/** Total score for a list of answered questions. Timeouts/wrong answers score 0. */
export function scoreForAnswers(
  answers: AnsweredQuestion[],
  total: number = QUESTIONS_PER_MATCH,
): number {
  return answers.reduce(
    (sum, a) => sum + (a.correct ? pointsForQuestion(a.index, total) : 0),
    0,
  );
}

export type MatchOutcome = "a" | "b" | "tie";

/** Decide the winner of a head-to-head match from the two final scores. */
export function outcome(scoreA: number, scoreB: number): MatchOutcome {
  if (scoreA > scoreB) return "a";
  if (scoreB > scoreA) return "b";
  return "tie";
}
