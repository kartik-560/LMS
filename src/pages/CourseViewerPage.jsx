import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, BookOpen, Clock, FileText, Lock } from "lucide-react";
import { toast } from "react-hot-toast";

// =========================================================================
// MOCK API AND UI COMPONENTS - CONSOLIDATED FOR SINGLE-FILE EXECUTION
// =========================================================================

// Mock components to fix the import errors
const Button = ({ children, onClick, variant = "default", size = "md", disabled = false }) => {
  let baseClasses = "font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  let variantClasses = "";
  switch (variant) {
    case "outline":
      variantClasses = "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400";
      break;
    case "ghost":
      variantClasses = "bg-transparent text-gray-700 hover:bg-gray-100";
      break;
    default:
      variantClasses = "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
  }
  let sizeClasses = "";
  switch (size) {
    case "sm":
      sizeClasses = "px-3 py-1.5 text-sm";
      break;
    case "md":
      sizeClasses = "px-4 py-2 text-sm";
      break;
    default:
      sizeClasses = "px-4 py-2 text-sm";
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
};

const Progress = ({ value }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};

const Badge = ({ children, variant = "default", size = "md" }) => {
  let baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full font-medium";
  let variantClasses = "";
  switch (variant) {
    case "info":
      variantClasses = "bg-blue-100 text-blue-800";
      break;
    default:
      variantClasses = "bg-gray-100 text-gray-800";
  }
  let sizeClasses = "";
  switch (size) {
    case "sm":
      sizeClasses = "text-xs";
      break;
    default:
      sizeClasses = "text-sm";
  }
  return (
    <span className={`${baseClasses} ${variantClasses} ${sizeClasses}`}>
      {children}
    </span>
  );
};

// Mock API services to fix import errors
const FALLBACK_THUMB = "https://placehold.co/600x400/1e293b/ffffff?text=Course+Thumbnail";

const mockData = {
  courses: {
    "course-1": {
      id: "course-1",
      title: "Introduction to React.js",
      instructorNames: ["John Doe"],
      thumbnail: FALLBACK_THUMB,
      status: "published",
    },
  },
  chapters: {
    "chapter-1": { id: "chapter-1", title: "Chapter 1: Getting Started", order: 1, content: "This is the content for the first chapter. It covers the basic setup and concepts of React.js.", settings: { estimatedMinutes: 10 }, assessments: [] },
    "chapter-2": { id: "chapter-2", title: "Chapter 2: Components and Props", order: 2, content: "Learn how to build reusable components and pass data between them using props.", settings: { estimatedMinutes: 15 }, assessments: [] },
    "chapter-3": { id: "chapter-3", title: "Chapter 3: State and Hooks", order: 3, content: "Explore how to manage component state and use popular hooks like useState and useEffect.", settings: { estimatedMinutes: 20 }, assessments: [{ id: "quiz-1" }] },
    "chapter-4": { id: "chapter-4", title: "Chapter 4: Advanced Concepts", order: 4, content: "Dive into the React ecosystem with topics like Context API and custom hooks.", settings: { estimatedMinutes: 25 }, assessments: [] },
  },
  assessments: {
    "quiz-1": {
      id: "quiz-1",
      title: "React Fundamentals Quiz",
      questions: [
        { id: "q1", prompt: "What is React.js primarily used for?", options: ["Building mobile apps", "Server-side scripting", "Building user interfaces", "Database management"], correctOptionIndex: 2, type: "single-choice" },
        { id: "q2", prompt: "Which of the following are valid React Hooks?", options: ["useState", "useEffect", "useContext", "useReducer"], correctOptionIndexes: [0, 1, 2, 3], type: "multi-choice" },
      ]
    }
  },
};

const coursesAPI = {
  get: (id) => new Promise(resolve => setTimeout(() => resolve(mockData.courses[id]), 500)),
};
const chaptersAPI = {
  listByCourse: (courseId) => new Promise(resolve => setTimeout(() => resolve(Object.values(mockData.chapters)), 500)),
  getChapterDetails: (chapterId) => new Promise(resolve => setTimeout(() => resolve(mockData.chapters[chapterId]), 500)),
};
const progressAPI = {
  completedChapters: (courseId) => new Promise(resolve => setTimeout(() => resolve({ data: ["chapter-1", "chapter-2"] }), 500)),
  completeChapter: (chapterId) => new Promise(resolve => setTimeout(() => resolve({ success: true }), 500)),
};
const assessmentsAPI = {
  listByChapter: (chapterId) => new Promise(resolve => setTimeout(() => {
    const chapter = mockData.chapters[chapterId];
    resolve(chapter?.assessments || []);
  }, 500)),
  get: (assessmentId) => new Promise(resolve => setTimeout(() => resolve(mockData.assessments[assessmentId]), 500)),
};

// =========================================================================
// ORIGINAL COMPONENT CODE
// =========================================================================
const CourseViewerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedChapterIds, setCompletedChapterIds] = useState([]);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Reference to the main scroll area to auto-scroll on chapter change
  const mainPanelRef = useRef(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Prefer location.state, fall back to ?start=query param
  const startChapterIdFromState = location.state?.startChapterId ?? null;
  const startChapterIdFromQuery = searchParams.get("start");
  const preferredStartChapterId = startChapterIdFromState ?? startChapterIdFromQuery ?? null;

  // Map of chapterId -> index for quick next/prev lookup
  const chapterIndexMap = useMemo(() => {
    const map = new Map();
    chapters.forEach((c, i) => map.set(c.id, i));
    return map;
  }, [chapters]);

  // Initial data fetching on component mount
  useEffect(() => {
    fetchData();
  }, [courseId]);

  // Trigger quiz load when the current chapter changes, and it has a quiz
  useEffect(() => {
    const resetQuizState = () => {
      setQuiz(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    };

    if (!currentChapter?.hasQuiz || !isQuizUnlocked(currentChapter)) {
      resetQuizState();
      return;
    }

    loadQuizForChapter(currentChapter.id);
  }, [currentChapter?.id, currentChapter?.hasQuiz, completedChapterIds.join("|")]);

  const isQuizUnlocked = (chapter) => {
    if (!chapter?.hasQuiz) return false;
    const prior = chapters.filter((c) => (c.order || 0) < (chapter.order || 0));
    return prior.every((c) => completedChapterIds.includes(c.id));
  };

  async function fetchData() {
    setLoading(true);
    try {
      const c = await coursesAPI.get(courseId);
      setCourse({
        id: c.id,
        title: c.title,
        level: "beginner",
        instructorName: (Array.isArray(c.instructorNames) && c.instructorNames[0]) || "Instructor",
        thumbnail: c.thumbnail || FALLBACK_THUMB,
        status: c.status,
      });

      const listRaw = await chaptersAPI.listByCourse(courseId);
      const list = Array.isArray(listRaw) ? listRaw : [];
      const mapped = list
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((ch) => ({
          id: ch.id,
          title: ch.title,
          duration: ch?.settings?.estimatedMinutes ? `${ch.settings.estimatedMinutes} min` : "—",
          type: Array.isArray(ch.assessments) && ch.assessments.length > 0 ? "quiz" : "text",
          content: ch.content || ch.description || "",
          attachments: ch.attachments || [],
          order: ch.order || 0,
          hasQuiz: Array.isArray(ch.assessments) && ch.assessments.length > 0,
        }));
      setChapters(mapped);

      const completed = await progressAPI.completedChapters(courseId);
      const ids = completed?.data ?? completed;
      setCompletedChapterIds(Array.isArray(ids) ? ids : []);

      if (mapped.length) {
        let initial = mapped[0];
        if (preferredStartChapterId) {
          const found = mapped.find((ch) => String(ch.id) === String(preferredStartChapterId));
          if (found) {
            initial = found;
          }
        }
        setCurrentChapter(initial);
        hydrateChapter(initial.id);
      }
    } catch (err) {
      console.error("Course load failed:", err);
      toast.error("Failed to load course");
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuizForChapter(chapterId) {
    setQuizLoading(true);
    setQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const list = await assessmentsAPI.listByChapter(chapterId);
      const assessments = Array.isArray(list) ? list : [];
      if (!assessments.length) {
        setQuiz(null);
        return;
      }
      const first = assessments[0];
      let full = first;
      if (!first.questions) {
        full = await assessmentsAPI.get(first.id);
      }
      const questions = (full.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setQuiz({
        id: full.id,
        title: full.title || "Quiz",
        questions: questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: String(q.type || "").toLowerCase(),
          options: Array.isArray(q.options) ? q.options : [],
          correctOptionIndex: typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : null,
          correctOptionIndexes: Array.isArray(q.correctOptionIndexes) ? q.correctOptionIndexes : null,
          points: q.points ?? 1,
          order: q.order ?? 1,
        })),
      });
    } catch (e) {
      console.error("Load quiz failed:", e);
      toast.error("Failed to load quiz");
      setQuiz(null);
    } finally {
      setQuizLoading(false);
    }
  }

  async function hydrateChapter(chapterId) {
    try {
      const full = await chaptersAPI.getChapterDetails(chapterId);
      const enriched = {
        id: full.id,
        title: full.title,
        duration: full?.settings?.estimatedMinutes ? `${full.settings.estimatedMinutes} min` : "—",
        type: Array.isArray(full.assessments) && full.assessments.length > 0 ? "quiz" : "text",
        content: full.content || full.description || "",
        attachments: full.attachments || [],
        order: full.order || 0,
        hasQuiz: Array.isArray(full.assessments) && full.assessments.length > 0,
      };

      // update list and current chapter
      setChapters(prev => prev.map(ch => (ch.id === chapterId ? { ...ch, ...enriched } : ch)));
      setCurrentChapter(prev => prev && prev.id === chapterId ? { ...prev, ...enriched } : prev);
    } catch (e) {
      console.error("Failed to hydrate chapter:", e);
      toast.error("Failed to load chapter content");
    }
  }

  const getCourseProgress = () => {
    if (!chapters.length) return 0;
    const completed = chapters.filter((ch) => completedChapterIds.includes(ch.id)).length;
    return Math.round((completed / chapters.length) * 100);
  };

  const isChapterCompleted = (id) => completedChapterIds.includes(id);

  // Helper to advance to the next chapter
  const goToNextChapter = () => {
    if (!currentChapter) return;
    const idx = chapterIndexMap.get(currentChapter.id);
    if (idx == null || idx >= chapters.length - 1) {
      toast.success("🎉 You have completed all chapters!");
      return;
    }
    const next = chapters[idx + 1];
    setCurrentChapter(next);
    // scroll main panel to top for the new chapter
    try {
      mainPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { /* ignore if no ref */ }
  };

  // Mark chapter as complete and optionally advance to the next
  const markChapterComplete = async ({ advance = true } = {}) => {
    if (!currentChapter || isChapterCompleted(currentChapter.id)) {
      if (advance) goToNextChapter();
      return;
    }
    try {
      await progressAPI.completeChapter(currentChapter.id);
      setCompletedChapterIds((prev) => [...prev, currentChapter.id]);
      toast.success("Chapter completed!");
      if (advance) {
        goToNextChapter();
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save progress");
    }
  };

  const handleAnswerChange = (qid, value) => {
    setQuizAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  function scoreLocally(quiz, answers) {
    let score = 0;
    let max = 0;
    for (const q of quiz.questions) {
      const pts = q.points ?? 1;
      max += pts;
      const ans = answers[q.id];

      if (typeof q.correctOptionIndex === "number") {
        if (Number(ans) === q.correctOptionIndex) score += pts;
        continue;
      }
      if (Array.isArray(q.correctOptionIndexes)) {
        const normalized = Array.isArray(ans) ? ans.map(Number).sort() : [];
        const correct = [...q.correctOptionIndexes].sort();
        if (normalized.length === correct.length && normalized.every((v, i) => v === correct[i])) {
          score += pts;
        }
        continue;
      }
    }
    return { score, max };
  }

  const submitQuiz = async () => {
    if (!quiz) return;
    try {
      setQuizSubmitted(true);
      const { score, max } = scoreLocally(quiz, quizAnswers);
      setQuizScore({ score, max });
      toast.success("Quiz submitted!");
      // After quiz submission, mark complete and advance by default
      markChapterComplete({ advance: true });
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit quiz");
      setQuizSubmitted(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Course not found
          </h3>
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Nav Bar (always visible, static) */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        {!sidebarOpen && (
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <BookOpen size={16} className="mr-2" />
            Course Content
          </Button>
        )}
        {currentChapter && (
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-gray-900">{currentChapter.title}</h2>
            <p className="text-sm text-gray-600">{course.title}</p>
          </div>
        )}
        <div className="w-16" />
      </div>

      {/* Content Area (fills the rest of screen) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-y-auto`}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Courses
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>×</Button>
            </div>
            <div className="mb-4">
              <h1 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <span>by {course.instructorName}</span>
                <Badge variant="info" size="sm">{course.level}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{getCourseProgress()}%</span>
                </div>
                <Progress value={getCourseProgress()} size="sm" />
                <div className="text-xs text-gray-500">
                  {completedChapterIds.length} of {chapters.length} chapters completed
                </div>
              </div>
            </div>
          </div>

          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setCurrentChapter(chapter);
                    if (!chapter.content) hydrateChapter(chapter.id);
                  }}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${currentChapter?.id === chapter.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                    }`}
                >
                  <div className="flex-shrink-0">
                    {isChapterCompleted(chapter.id) ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {chapter.title} {chapter.hasQuiz ? "(Quiz)" : ""}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{chapter.duration}</span>
                      <span>•</span>
                      <span>{chapter.type}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 overflow-y-auto bg-white" ref={mainPanelRef}>
          {!currentChapter ? (
            <EmptyPrompt />
          ) : currentChapter.hasQuiz ? (
            isQuizUnlocked(currentChapter) ? (
              <QuizView
                quiz={quiz}
                quizLoading={quizLoading}
                quizSubmitted={quizSubmitted}
                quizScore={quizScore}
                quizAnswers={quizAnswers}
                onAnswerChange={handleAnswerChange}
                onSubmit={submitQuiz}
                completed={isChapterCompleted(currentChapter.id)}
                onMarkComplete={() => markChapterComplete({ advance: false })}
              />
            ) : (
              <LockedQuizNote />
            )
          ) : (
            <TextChapterView
              chapter={currentChapter}
              completed={isChapterCompleted(currentChapter.id)}
              onMarkComplete={() => markChapterComplete({ advance: false })}
              onNextChapter={goToNextChapter}
              isLast={chapters.findIndex((c) => c.id === currentChapter.id) === chapters.length - 1}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function EmptyPrompt() {
  return (
    <div className="h-full flex items-center justify-center text-gray-600">
      <div className="text-center">
        <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">
          Select a chapter to begin
        </h3>
        <p className="text-gray-500">
          Choose a chapter from the sidebar to start learning
        </p>
      </div>
    </div>
  );
}

function LockedQuizNote() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="border rounded-lg p-6 bg-gray-50 text-center">
        <Lock size={28} className="mx-auto mb-3 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Quiz locked
        </h3>
        <p className="text-sm text-gray-600">
          Complete the required previous chapter(s) to unlock this quiz.
        </p>
      </div>
    </div>
  );
}

/** TextChapterView: always shows both buttons.
 * - onMarkComplete: call to mark the current chapter complete
 * - onNextChapter: navigate to next chapter
 * - isLast: boolean, disables the Next button when true
 */
function TextChapterView({ chapter, completed, onMarkComplete, onNextChapter, isLast }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h3 className="text-2xl font-bold mb-4">{chapter.title}</h3>
      <div className="prose max-w-none">
        <p className="whitespace-pre-line">
          {chapter.content || "Chapter content goes here."}
        </p>
      </div>
      {chapter.attachments && chapter.attachments.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-lg font-semibold mb-3">Attachments</h4>
          <div className="space-y-3">
            {chapter.attachments.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText size={16} className="mr-2" />
                View PDF Attachment{" "}
                {chapter.attachments.length > 1 ? index + 1 : ""}
              </a>
            ))}
          </div>
        </div>
      )}
      {/* Buttons Section - both always visible */}
      <div className="mt-8 flex gap-4">
        <Button onClick={onMarkComplete} disabled={!!completed}>
          <CheckCircle size={16} className="mr-2" />
          {completed ? "Completed" : "Mark as Complete"}
        </Button>
        {/* Next Chapter: disabled if this is the last chapter */}
        <Button onClick={onNextChapter} disabled={isLast}>
          Next Chapter →
        </Button>
      </div>
    </div>
  );
}

function QuizView({
  quiz,
  quizLoading,
  quizSubmitted,
  quizScore,
  quizAnswers,
  onAnswerChange,
  onSubmit,
  onMarkComplete,
}) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h3 className="text-2xl font-bold mb-4">Quiz</h3>
      {quizLoading && <p className="text-gray-600">Loading quiz…</p>}
      {!quizLoading && !quiz && (
        <p className="text-gray-600">No quiz available for this chapter.</p>
      )}
      {!quizLoading && quiz && (
        <>
          <p className="text-gray-700 mb-4">{quiz.title}</p>
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <QuestionBlock
                key={q.id}
                index={idx}
                q={q}
                value={quizAnswers[q.id]}
                onChange={(val) => onAnswerChange(q.id, val)}
                disabled={quizSubmitted}
              />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            {!quizSubmitted ? (
              <Button onClick={onSubmit}>Submit Quiz</Button>
            ) : (
              <div className="text-green-700 font-medium">
                Submitted
                {quizScore ? ` • Score: ${quizScore.score}/${quizScore.max}` : ""}
              </div>
            )}
            <Button variant="outline" onClick={onMarkComplete}>
              <CheckCircle size={16} className="mr-2" />
              Mark Chapter Complete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionBlock({ index, q, value, onChange, disabled }) {
  const isMulti = Array.isArray(q.correctOptionIndexes) && q.correctOptionIndexes.length > 0;
  const isSingle = typeof q.correctOptionIndex === "number" && q.options?.length;

  if (isSingle) {
    return (
      <div className="border rounded-lg p-4">
        <div className="font-medium mb-3">
          Q{index + 1}. {q.prompt}
        </div>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <label key={i} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`q_${q.id}`}
                disabled={disabled}
                checked={Number(value) === i}
                onChange={() => onChange(i)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (isMulti) {
    const arr = Array.isArray(value) ? value.map(Number) : [];
    const toggle = (i) => {
      if (arr.includes(i)) onChange(arr.filter((x) => x !== i));
      else onChange([...arr, i]);
    };
    return (
      <div className="border rounded-lg p-4">
        <div className="font-medium mb-3">
          Q{index + 1}. {q.prompt}{" "}
          <span className="text-xs text-gray-500">(Select all that apply)</span>
        </div>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <label key={i} className="flex items-center space-x-2">
              <input
                type="checkbox"
                disabled={disabled}
                checked={arr.includes(i)}
                onChange={() => toggle(i)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // subjective / other
  return (
    <div className="border rounded-lg p-4">
      <div className="font-medium mb-3">
        Q{index + 1}. {q.prompt}
      </div>
      <textarea
        rows={4}
        className="w-full border rounded-lg p-2"
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer…"
      />
    </div>
  );
}

export default CourseViewerPage;
