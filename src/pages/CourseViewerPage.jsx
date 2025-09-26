<<<<<<< HEAD
import React, { useState, useEffect, useRef } from "react";
=======
import React, { useState, useEffect, useMemo } from "react";
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  Lock,
} from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import Button from "../components/ui/Button";
import Progress from "../components/ui/Progress";
import Badge from "../components/ui/Badge";
<<<<<<< HEAD
import { coursesAPI, chaptersAPI, FALLBACK_THUMB, progressAPI } from "../services/api";
=======
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15

import {
  coursesAPI,
  chaptersAPI,
  progressAPI,
  assessmentsAPI,
  FALLBACK_THUMB,
} from "../services/api";

const CourseViewerPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [completedChapterIds, setCompletedChapterIds] = useState([]);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

<<<<<<< HEAD
  // ref to the main scroll area so we can scroll to top on next chapter
  const mainPanelRef = useRef(null);
=======
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Prefer location.state, fall back to ?start=query param
  const startChapterIdFromState = location.state?.startChapterId ?? null;
  const startChapterIdFromQuery = searchParams.get("start");
  const preferredStartChapterId =
    startChapterIdFromState ?? startChapterIdFromQuery ?? null;

  // map of chapterId -> index for quick next/prev
  const chapterIndexMap = useMemo(() => {
    const map = new Map();
    chapters.forEach((c, i) => map.set(c.id, i));
    return map;
  }, [chapters]);
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15

  useEffect(() => {
    fetchData();
  }, [courseId]);

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
        instructorName:
          (Array.isArray(c.instructorNames) && c.instructorNames[0]) ||
          "Instructor",
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
          duration: ch?.settings?.estimatedMinutes
            ? `${ch.settings.estimatedMinutes} min`
            : "—",
          type:
            Array.isArray(ch.assessments) && ch.assessments.length > 0
              ? "quiz"
              : "text",
          content: ch.content || ch.description || "",
          attachments: ch.attachments || [],
          order: ch.order || 0,
          hasQuiz: Array.isArray(ch.assessments) && ch.assessments.length > 0,
        }));

      setChapters(mapped);

<<<<<<< HEAD
      const ids = (await progressAPI.completedChapters(courseId)).data?.data ?? [];
      setCompletedChapterIds(ids);
=======
      if (mapped.length) {
        let initial = mapped[0];
        if (preferredStartChapterId) {
          const found = mapped.find(
            (ch) => String(ch.id) === String(preferredStartChapterId)
          );
          if (found) {
            initial = found;
          } else {
            // Optional: inform if the requested chapter isn't found
            // toast.error("Requested chapter not found, showing first chapter");
          }
        }
        setCurrentChapter(initial);
        hydrateChapter(initial.id);
      }

      const completed = await progressAPI.completedChapters(courseId);
      const ids = completed?.data ?? completed;
      setCompletedChapterIds(Array.isArray(ids) ? ids : []);
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
    } catch (err) {
      console.error("Course load failed:", err);
      toast.error("Failed to load course");
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  }

<<<<<<< HEAD
  // Load quiz only when chapter has quiz AND is unlocked
=======
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
  useEffect(() => {
    const resetQuizState = () => {
      setQuiz(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    };

    if (!currentChapter?.hasQuiz) {
      resetQuizState();
      return;
    }

    if (!isQuizUnlocked(currentChapter)) {
      resetQuizState();
      return;
    }
<<<<<<< HEAD

    loadQuizForChapter(currentChapter.id);
  }, [currentChapter?.id, currentChapter?.hasQuiz, completedChapterIds.join("|")]);
=======

    loadQuizForChapter(currentChapter.id);
  }, [
    currentChapter?.id,
    currentChapter?.hasQuiz,
    completedChapterIds.join("|"),
  ]);

  useEffect(() => {
    if (!chapters.length) return;
    if (!preferredStartChapterId) return;

    const found = chapters.find(
      (ch) => String(ch.id) === String(preferredStartChapterId)
    );
    if (found && currentChapter?.id !== found.id) {
      setCurrentChapter(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredStartChapterId, chapters.map((c) => c.id).join("|")]);
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15

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

<<<<<<< HEAD
      const questions = (full.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0));
=======
      const questions = (full.questions || []).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );

>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
      setQuiz({
        id: full.id,
        title: full.title || "Quiz",
        questions: questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: String(q.type || "").toLowerCase(),
          options: Array.isArray(q.options) ? q.options : [],
          correctOptionIndex:
            typeof q.correctOptionIndex === "number"
              ? q.correctOptionIndex
              : null,
          correctOptionIndexes: Array.isArray(q.correctOptionIndexes)
            ? q.correctOptionIndexes
            : null,
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

  const getCourseProgress = () => {
    if (!chapters.length) return 0;
    const completed = chapters.filter((ch) =>
      completedChapterIds.includes(ch.id)
    ).length;
    return Math.round((completed / chapters.length) * 100);
  };

  const isChapterCompleted = (id) => completedChapterIds.includes(id);

<<<<<<< HEAD
  // --- NEW: goToNextChapter helper ---
  const goToNextChapter = () => {
    if (!currentChapter) return;
    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex === -1) return;

    if (currentIndex < chapters.length - 1) {
      const next = chapters[currentIndex + 1];
      setCurrentChapter(next);

      // scroll main panel to top for the new chapter
      try {
        mainPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        /* ignore if no ref */
      }
    } else {
      toast.success("🎉 You have completed all chapters!");
    }
  };

  // UPDATED: markChapterComplete accepts advance option (default false)
  const markChapterComplete = async ({ advance = false } = {}) => {
    if (!currentChapter || isChapterCompleted(currentChapter.id)) {
      // if already completed and user asked to advance
      if (advance) goToNextChapter();
      return;
    }
=======
  const goToNextChapter = () => {
    if (!currentChapter) return;
    const idx = chapterIndexMap.get(currentChapter.id);
    if (idx == null) return;
    const next = chapters[idx + 1];
    if (next) setCurrentChapter(next);
  };

  const markChapterComplete = async ({ advance = true } = {}) => {
    if (!currentChapter || isChapterCompleted(currentChapter.id)) return;
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
    try {
      await progressAPI.completeChapter(currentChapter.id);
      setCompletedChapterIds((prev) => [...prev, currentChapter.id]);
      toast.success("Chapter completed!");
<<<<<<< HEAD
=======

>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
      if (advance) {
        goToNextChapter();
      }
    } catch (e) {
<<<<<<< HEAD
      toast.error("Failed to save progress");
    }
  };
=======
      console.error(e);
      toast.error("Failed to save progress");
    }
  };


  async function hydrateChapter(chapterId) {
    try {
      const full = await chaptersAPI.getChapterDetails(chapterId);
      const enriched = {
        id: full.id,
        title: full.title,
        duration: full?.settings?.estimatedMinutes
          ? `${full.settings.estimatedMinutes} min`
          : "—",
        type:
          Array.isArray(full.assessments) && full.assessments.length > 0
            ? "quiz"
            : "text",
        content: full.content || full.description || "",
        attachments: full.attachments || [],
        order: full.order || 0,
        hasQuiz: Array.isArray(full.assessments) && full.assessments.length > 0,
      };

      // update list and current chapter
      setChapters(prev =>
        prev.map(ch => (ch.id === chapterId ? { ...ch, ...enriched } : ch))
      );
      setCurrentChapter(prev =>
        prev && prev.id === chapterId ? { ...prev, ...enriched } : prev
      );
    } catch (e) {
      console.error("Failed to hydrate chapter:", e);
      toast.error("Failed to load chapter content");
    }
  }

>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15

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
<<<<<<< HEAD
      // After quiz submission we keep the default behavior: mark complete and advance
      // this intentionally advances to next chapter
=======
      // After quiz submission: mark chapter complete and advance
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
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
<<<<<<< HEAD
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
        {/* Sidebar (independent scroll) */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-0"} 
                    transition-all duration-300 
                    bg-white border-r border-gray-200 
                    flex flex-col overflow-y-auto`}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Courses
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>×</Button>
=======
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/courses")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Courses
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </Button>
          </div>
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              {course.title}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <span>by {course.instructorName}</span>
              <Badge variant="info" size="sm">
                {course.level}
              </Badge>
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
            </div>
            <div className="mb-4">
              <h1 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <span>by {course.instructorName}</span>
                <Badge variant="info" size="sm">{course.level}</Badge>
              </div>
<<<<<<< HEAD
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{getCourseProgress()}%</span>
                </div>
                <Progress value={getCourseProgress()} size="sm" />
                <div className="text-xs text-gray-500">
                  {completedChapterIds.length} of {chapters.length} chapters completed
                </div>
=======
              <Progress value={getCourseProgress()} size="sm" />
              <div className="text-xs text-gray-500">
                {completedChapterIds.length} of {chapters.length} chapters
                completed
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
              </div>
            </div>
          </div>

          {/* Sidebar scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {/* Chapters List */}
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setCurrentChapter(chapter)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                    currentChapter?.id === chapter.id ? "bg-primary-50 border-r-2 border-primary-500" : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isChapterCompleted(chapter.id) ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
<<<<<<< HEAD
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
=======
                </div>
                {expanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
              {expanded && (
                <div className="border-t border-gray-200">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        setCurrentChapter(chapter);
                        if (!chapter.content) hydrateChapter(chapter.id);
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${currentChapter?.id === chapter.id
                          ? "bg-primary-50 border-r-2 border-primary-500"
                          : ""
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
              )}
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
            </div>
          </div>
        </div>

        {/* Main panel (independent scroll) */}
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
                // manual mark doesn't advance by default
                onMarkComplete={() => markChapterComplete({ advance: false })}
              />
            ) : (
              <LockedQuizNote />
            )
          ) : (
            // pass onNextChapter and isLast
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
<<<<<<< HEAD
=======

      {/* Main panel */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          {!sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <BookOpen size={16} className="mr-2" />
              Course Content
            </Button>
          )}
          {currentChapter && (
            <div className="flex-1 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentChapter.title}
              </h2>
              <p className="text-sm text-gray-600">{course.title}</p>
            </div>
          )}
          <div className="w-16" />
        </div>

        <div className="flex-1 bg-white">
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
                onMarkComplete={() => markChapterComplete()}
              />
            ) : (
              <LockedQuizNote />
            )
          ) : (
            <TextChapterView
              chapter={currentChapter}
              completed={isChapterCompleted(currentChapter.id)}
              onMarkComplete={() => markChapterComplete()}
            />
          )}
        </div>
      </div>
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
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

<<<<<<< HEAD
/** TextChapterView: always shows both buttons.
 *  - onMarkComplete: call to mark the current chapter complete
 *  - onNextChapter: navigate to next chapter
 *  - isLast: boolean, disables the Next button when true
 */
function TextChapterView({ chapter, completed, onMarkComplete, onNextChapter, isLast }) {
=======
function TextChapterView({ chapter, completed, onMarkComplete }) {
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
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
                {quizScore
                  ? ` • Score: ${quizScore.score}/${quizScore.max}`
                  : ""}
              </div>
            )}
<<<<<<< HEAD
            {/* manual mark (doesn't auto-advance) */}
=======
>>>>>>> 4b8a91d531e57e6ab5942895b563310e29ad5f15
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
  const isMulti =
    Array.isArray(q.correctOptionIndexes) && q.correctOptionIndexes.length > 0;
  const isSingle =
    typeof q.correctOptionIndex === "number" && q.options?.length;

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
