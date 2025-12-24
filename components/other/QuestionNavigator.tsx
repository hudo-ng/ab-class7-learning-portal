import clsx from "clsx";

interface Props {
  currentIndex: number;
  answers: { questionId: string; choiceId: string }[];
  questions: { questionId: string }[];
  submitted: boolean;
  onJump: (index: number) => void;
}

export default function QuestionNavigator({
  currentIndex,
  answers,
  questions,
  submitted,
  onJump,
}: Props) {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Questions ({answers.length} answered)
        </h3>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-50 overflow-y-auto p-2 border rounded-lg bg-gray-50">
          {questions.map((q, idx) => {
            const isAnswered = answers.some(
              (a) => a.questionId === q.questionId
            );
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.questionId}
                type="button"
                onClick={() => onJump(idx)}
                disabled={submitted}
                className={clsx(
                  "w-10 h-10 rounded-full text-sm font-medium transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isCurrent && "ring-2 ring-blue-600 ring-offset-2",
                  isAnswered
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100",
                  submitted && "opacity-60 cursor-not-allowed"
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
