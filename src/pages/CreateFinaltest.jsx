import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/ui/Button";

// A helper function to create a new blank question
const createNewQuestion = () => ({
  id: crypto.randomUUID(),
  type: "single",
  text: "",
  options: [
    { id: crypto.randomUUID(), text: "", correct: false },
    { id: crypto.randomUUID(), text: "", correct: false },
  ],
  pairs: [],
  correctText: "",
  sampleAnswer: "",
});

/**
 * A self-contained component for creating and editing a quiz.
 * It manages its own state and handlers.
 * @param {{ initialLesson: object }} props
 */
export default function CreateFinaltest({ initialLesson }) {
  const [lesson, setLesson] = useState(initialLesson);

  // Effect to update state if the initial prop changes from the parent
  useEffect(() => {
    setLesson(initialLesson);
  }, [initialLesson]);


  // --- Handler Functions Defined Inside The Component ---

  const updateLesson = (field, value) => {
    setLesson((prev) => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    setLesson((prev) => ({
      ...prev,
      questions: [...prev.questions, createNewQuestion()],
    }));
  };

  const removeQuestion = (questionId) => {
    setLesson((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setLesson((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addOption = (questionId) => {
    setLesson((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [
                ...q.options,
                { id: crypto.randomUUID(), text: "", correct: false },
              ],
            }
          : q
      ),
    }));
  };

  const removeOption = (questionId, optionId) => {
    setLesson((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
          : q
      ),
    }));
  };

  const updateOption = (questionId, optionId, field, value) => {
    setLesson((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, [field]: value } : o
              ),
            }
          : q
      ),
    }));
  };

  // --- JSX (User Interface) ---

  if (!lesson) {
    return <div>Loading quiz data...</div>;
  }
  
  return (
    <div className="mt-4 space-y-6 p-6 bg-white rounded-lg shadow-md">
      {/* Quiz Title and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Title
          </label>
          <input
            type="text"
            value={lesson.quizTitle}
            onChange={(e) => updateLesson("quizTitle", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Chapter 1 Quiz"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={lesson.quizDurationMinutes}
            onChange={(e) => updateLesson("quizDurationMinutes", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="30"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {lesson.questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Question {qIdx + 1}</h4>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addQuestion} title="Add question below">
                  <Plus size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeQuestion(q.id)}
                  disabled={lesson.questions.length === 1}
                  title="Remove this question"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="single">Single Correct Option</option>
                  <option value="multiple">Multiple Correct Options</option>
                  <option value="numerical">Numerical/Fill in the Blank</option>
                  <option value="match">Match the Column</option>
                  <option value="subjective">Subjective</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter question"
                />
              </div>
            </div>

            {/* Conditional Answer Fields based on Question Type */}
            {q.type === "single" || q.type === "multiple" ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Options (mark correct)</label>
                  <Button type="button" variant="outline" onClick={() => addOption(q.id)}>
                    <Plus size={14} className="mr-1" /> Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {q.options.map((o) => (
                    <div key={o.id} className="grid grid-cols-[24px_1fr_32px] gap-3 items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={o.correct}
                        onChange={(e) => updateOption(q.id, o.id, "correct", e.target.checked)}
                      />
                      <input
                        type="text"
                        value={o.text}
                        onChange={(e) => updateOption(q.id, o.id, "text", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Option text"
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeOption(q.id, o.id)}
                        title="Remove option"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : q.type === "numerical" ? (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <input
                  type="text"
                  value={q.correctText || ""}
                  onChange={(e) => updateQuestion(q.id, "correctText", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 42"
                />
              </div>
            ) : q.type === "match" ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Match Pairs</label>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateQuestion(q.id, "pairs", [...(q.pairs || []), { id: crypto.randomUUID(), left: "", right: "" }])}
                    >
                        <Plus size={14} className="mr-1" /> Add Pair
                    </Button>
                </div>
                {(q.pairs || []).map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                        <input
                            type="text"
                            value={p.left}
                            onChange={(e) => updateQuestion(q.id, "pairs", (q.pairs || []).map(x => x.id === p.id ? { ...x, left: e.target.value } : x))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Left"
                        />
                        <input
                            type="text"
                            value={p.right}
                            onChange={(e) => updateQuestion(q.id, "pairs", (q.pairs || []).map(x => x.id === p.id ? { ...x, right: e.target.value } : x))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Right"
                        />
                        <button
                            type="button"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => updateQuestion(q.id, "pairs", (q.pairs || []).filter(x => x.id !== p.id))}
                            title="Remove pair"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            ) : (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Answer</label>
                <textarea
                  rows={3}
                  value={q.sampleAnswer || ""}
                  onChange={(e) => updateQuestion(q.id, "sampleAnswer", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Provide guidance for graders"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}