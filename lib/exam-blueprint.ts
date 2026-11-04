// Exam blueprint constants
export const EXAM_BLUEPRINT: Record<string, number> = {
  "road-signs": 6,
  "intersections-and-turns": 4,
  "responsible-driving": 4,
  "traffic-lights-and-signals": 3,
  "highway-driving": 3,
  "share-the-road": 3,
  "emergency-conditions": 3,
  "basics-of-driving": 2,
  "license-information": 2,
};

export const EXAM_QUESTION_COUNT = Object.values(EXAM_BLUEPRINT).reduce(
  (a, b) => a + b,
  0,
);
export const PASS_MARK = 25;

// Practice exam constants

export const MASTERY_WINDOW = 15;
export const MASTERY_CORRECT = 13;
export const PRACTICE_SET_SIZE = 15;
