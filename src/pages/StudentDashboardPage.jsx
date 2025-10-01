import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Award,
  Play,
  CheckCircle,
  Target,
  FileText,
  AlertCircle,
  Lock,
  Brain,
  Trophy,
  BarChart3,
  PlayCircle,
  BookMarked,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  authAPI,
  coursesAPI,
  chaptersAPI,
  enrollmentsAPI,
  FALLBACK_THUMB,
} from "../services/api";
import useAuthStore from "../store/useAuthStore";
import Progress from "../components/ui/Progress";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { progressAPI } from "../services/api";

const StudentDashboardPage = () => {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const navigate = useNavigate();

  const [assignedCourses, setAssignedCourses] = useState([]);
  const [currentProgress, setCurrentProgress] = useState({});
  const [availableTests, setAvailableTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [aiInterviewStatus, setAiInterviewStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const [showAIInterviewModal, setShowAIInterviewModal] = useState(false);
  const [selectedAIInterview, setSelectedAIInterview] = useState(null);

  const [stats, setStats] = useState({
    totalCourses: 0,
    completedChapters: 0,
    averageTestScore: 0,
    totalTimeSpent: 0,
    certificatesEarned: 0,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchStudentData();
  }, [hasHydrated, isAuthenticated]);

  const fetchStudentData = async () => {
    const abort = new AbortController();

    const resetState = () => {
      setAssignedCourses([]);
      setCurrentProgress({});
      setAvailableTests([]);
      setCompletedTests([]);
      setAiInterviewStatus({});
      setStats({
        totalCourses: 0,
        completedChapters: 0,
        averageTestScore: 0,
        totalTimeSpent: 0,
        certificatesEarned: 0,
      });
    };

    try {
      setLoading(true);

      // Identify user/role
      const meResp = await authAPI.me().catch(() => null);
      const me = (meResp && (meResp.data ?? meResp)) || null;

      const roleRaw =
        (me && (me.role ?? (me.user && me.user.role))) ??
        (user && user.role) ??
        "";
      const role = String(roleRaw).toUpperCase();
      const studentId = String(
        (me && (me.id ?? (me.user && me.user.id))) ?? (user && user.id) ?? ""
      ).trim();

      if (!studentId) {
        toast.error("Could not identify your student account.");
        resetState();
        return () => abort.abort();
      }
      if (!role.includes("STUDENT")) {
        toast.error(
          "This page is for students. Please log in with a student account."
        );
        resetState();
        return () => abort.abort();
      }

      // Enrollments
      const enrollsResp = await enrollmentsAPI.listSelf().catch(() => null);
      const safeEnrolls = Array.isArray(enrollsResp?.data?.data)
        ? enrollsResp.data.data
        : Array.isArray(enrollsResp?.data)
          ? enrollsResp.data
          : Array.isArray(enrollsResp)
            ? enrollsResp
            : [];

      const approvedStatuses = new Set(["APPROVED", "ACCEPTED", "ENROLLED"]);
      const courseIds = Array.from(
        new Set(
          safeEnrolls
            .filter(
              (e) =>
                !e.status ||
                approvedStatuses.has(String(e.status).toUpperCase())
            )
            .map((e) => e.courseId ?? (e.course && e.course.id))
            .filter(Boolean)
        )
      );

      if (courseIds.length === 0) {
        resetState();
        return () => abort.abort();
      }

      // Primary source: getStudentCourses
      let myCourses = [];
      try {
        const resp = await coursesAPI.getStudentCourses(
          user && user.collegeId,
          studentId,
          "", // search
          "all", // status
          "all", // category
          "assigned", // view (adjust if your API differs)
          1, // page
          200 // pageSize
        );
        myCourses =
          resp?.data?.data ?? resp?.data ?? (Array.isArray(resp) ? resp : []);
      } catch (e) {
        console.warn("getStudentCourses failed; will try fallback", e);
      }

      // Fallback by catalog
      const fetchCoursesByIds = async (ids) => {
        const resp = await coursesAPI
          .getCourseCatalog({
            view: "enrolled",
            collegeId: user && user.collegeId,
            page: 1,
            pageSize: 500,
          })
          .catch(() => null);

        const list = Array.isArray(resp?.data?.data)
          ? resp.data.data
          : Array.isArray(resp?.data)
            ? resp.data
            : Array.isArray(resp)
              ? resp
              : [];

        return list.filter((c) => ids.includes(c.id || c.courseId));
      };

      const normalizeCourse = (c) => {
        const cid = c?.id ?? c?.courseId ?? c?.course?.id;
        return { ...c, id: cid }; // force .id to be the real courseId
      };

      if (!Array.isArray(myCourses) || myCourses.length === 0) {
        myCourses = await fetchCoursesByIds(courseIds);
      }

      myCourses = myCourses.map(normalizeCourse);
      if (!Array.isArray(myCourses) || myCourses.length === 0) {
        resetState();
        return () => abort.abort();
      }

      // Fetch per-course data in parallel
      const [chaptersList, summaries] = await Promise.all([
        Promise.all(
          myCourses.map((c) =>
            chaptersAPI
              .listByCourse(c.id, { signal: abort.signal }) // c.id is guaranteed
              .then((r) => r?.data?.data ?? r?.data ?? [])
              .catch(() => [])
          )
        ),
        Promise.all(
          myCourses.map((c) =>
            progressAPI
              .courseSummary(c.id, { signal: abort.signal }) // c.id is guaranteed
              .then((r) => r?.data?.data ?? null)
              .catch(() => null)
          )
        ),
      ]);

      // Build fresh objects (no mutation of myCourses)
      const nextProgressData = {};
      const nextAiStatusData = {};
      const nextCourseWithCounts = [];

      let totalChaptersDone = 0;
      let weightedScoreSum = 0;
      let totalTestsTaken = 0;

      myCourses.forEach((course, i) => {
        const chapters = chaptersList[i] || [];
        const sum = summaries[i] || {
          chapters: { done: 0, total: chapters.length },
          modules: { done: 0, total: 0 },
          tests: { averagePercent: 0, taken: 0 },
        };

        const done = Number((sum.chapters && sum.chapters.done) ?? 0);
        const total = Number(
          (sum.chapters && sum.chapters.total) ?? chapters.length
        );
        const taken = Number((sum.tests && sum.tests.taken) ?? 0);
        const avg = Number((sum.tests && sum.tests.averagePercent) ?? 0);

        nextProgressData[course.id] = {
          completedChapters: Array(done).fill(0),
          courseTestResult: {
            averagePercent: avg,
            taken: taken,
            passed: avg >= 60,
          },
          aiInterviewResult: null,
        };

        nextAiStatusData[course.id] = {
          eligible: avg >= 60,
          completed: false,
          result: null,
        };

        nextCourseWithCounts.push({
          ...course,
          totalChapters: total,
        });

        totalChaptersDone += done;
        weightedScoreSum += avg * taken;
        totalTestsTaken += taken;
      });

      // Single state commit
      setAssignedCourses(nextCourseWithCounts);
      setCurrentProgress(nextProgressData);
      setAiInterviewStatus(nextAiStatusData);
      setCompletedTests([]);
      setAvailableTests([]);
      setStats({
        totalCourses: nextCourseWithCounts.length,
        completedChapters: totalChaptersDone,
        averageTestScore: totalTestsTaken
          ? Math.round(weightedScoreSum / totalTestsTaken)
          : 0,
        totalTimeSpent: 0,
        certificatesEarned: Object.values(nextAiStatusData).filter(
          (x) => x.completed
        ).length,
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error(
        (error &&
          error.response &&
          error.response.data &&
          error.response.data.error) ||
        (error && error.message) ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }

    // return cleanup so callers can use it inside useEffect
    return () => abort.abort();
  };

  const goToCourse = async (courseId) => {
    if (!courseId) {
      toast.error("Missing course id");
      return;
    }
    const id = String(courseId);
    const encodedId = encodeURIComponent(id);
    setShowCourseModal?.(false);
    navigate(`/courses/${encodedId}`);

    try {
      const chapters = await chaptersAPI.listByCourse(id);
      const firstChapter = (chapters ?? [])
        .slice()
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))[0];

      const startId = firstChapter?.id ?? null;
      if (startId) {
        navigate(`/courses/${encodedId}?start=${encodeURIComponent(startId)}`, {
          state: { startChapterId: startId },
          replace: true,
        });
      }
    } catch (e) {
      console.error("Failed to prefetch chapters:", e);
    }
  };

  const startChapter = (_courseId, _moduleId, _chapterId) => {
    toast("Chapter viewer not wired yet");
  };

  const completeChapter = async (_courseId, _moduleId, _chapterId) => {
    try {
      toast("Progress API not wired yet");
      await fetchStudentData();
      toast.success("Chapter completed!");
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const startTest = (test) => {
    setSelectedTest(test);
    setShowTestModal(true);
  };

  const submitTest = async (_answers) => {
    try {
      toast("Test submission API not wired yet");
      setShowTestModal(false);
      setSelectedTest(null);
      await fetchStudentData();
    } catch {
      toast.error("Failed to submit test");
    }
  };

  const startAIInterview = async (_courseId) => {
    try {
      toast("AI Interview API not wired yet");
    } catch {
      toast.error("Failed to start AI interview");
    }
  };

  const completeAIInterview = async (_responses) => {
    try {
      toast("AI Interview completion API not wired yet");
      setShowAIInterviewModal(false);
      setSelectedAIInterview(null);
      await fetchStudentData();
    } catch {
      toast.error("Failed to complete AI interview");
    }
  };

  const getCourseProgress = (courseId) => {
    const progress = currentProgress[courseId];
    if (!progress) return 0;

    const course = assignedCourses.find((c) => c.id === courseId);
    if (!course) return 0;

    // totalSteps = chapters + course test + AI interview
    const totalSteps = (course.totalChapters || 0) + 2;
    if (totalSteps <= 0) return 0;

    const completedSteps =
      (progress.completedChapters?.length || 0) +
      (progress.courseTestResult?.passed ? 1 : 0) +
      (progress.aiInterviewResult ? 1 : 0);

    return Math.round((completedSteps / totalSteps) * 100);
  };

  const getNextAction = (courseId) => {
    const progress = currentProgress[courseId];
    if (!progress) return { type: "start", text: "Start Course" };

    if (
      aiInterviewStatus[courseId]?.eligible &&
      !aiInterviewStatus[courseId]?.completed
    ) {
      return { type: "ai-interview", text: "Take AI Interview" };
    }

    if (!progress.courseTestResult?.passed) {
      return { type: "course-test", text: "Take Final Test" };
    }

    const availableCourseTests = availableTests.filter(
      (t) => t.courseId === courseId
    );
    if (availableCourseTests.length > 0) {
      return { type: "module-test", text: "Take Test" };
    }

    return { type: "continue", text: "Continue Learning" };
  };

  const formatTimeSpent = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading your learning dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap size={24} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, {user?.fullName || user?.name || "Student"}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Continue your learning journey and unlock new opportunities.
              </p>
              {/* <Button
                className="ml-auto"
                onClick={() => navigate("/first-login")}
              >
                Go to First Login
              </Button> */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Assigned Courses
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.totalCourses}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Chapters Done
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.completedChapters}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award size={24} className="text-yellow-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Test Average
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.averageTestScore}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-indigo-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Time Spent
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatTimeSpent(stats.totalTimeSpent)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Trophy size={24} className="text-red-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Certificates
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.certificatesEarned}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <Card.Title>My Learning Path</Card.Title>
              </Card.Header>
              <Card.Content>
                {assignedCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No courses assigned yet
                    </h3>
                    <p className="text-gray-600">
                      Contact your instructor to get assigned to courses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {assignedCourses.map((course) => {
                      const progress = currentProgress[course.id];
                      const courseProgress = getCourseProgress(course.id);
                      const nextAction = getNextAction(course.id);

                      return (
                        <div
                          key={course.id}
                          className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img
                                    src={course.thumbnail || FALLBACK_THUMB}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {course.title}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    by{" "}
                                    {course.instructorNames?.[0] ||
                                      "Instructor"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <Button
                                key={course.id}
                                type="button"
                                className="flex-1"
                                onClick={() =>
                                  goToCourse(course.courseId ?? course.course?.id ?? course.id)
                                }
                              >
                                <PlayCircle size={16} className="mr-2" />
                                Continue Learning
                              </Button>

                              <Button
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                  if (nextAction.type === "ai-interview") {
                                    startAIInterview(course.id);
                                  } else if (
                                    nextAction.type === "course-test" ||
                                    nextAction.type === "module-test"
                                  ) {
                                    const test = availableTests.find(
                                      (t) => t.courseId === course.id
                                    );
                                    if (test) startTest(test);
                                    else toast("No test available yet");
                                  } else {
                                    goToCourse(course.id);
                                  }
                                }}
                                disabled={
                                  nextAction.type === "start" && !progress
                                }
                              >
                                {nextAction.type === "ai-interview" && (
                                  <Brain size={16} className="mr-1" />
                                )}
                                {(nextAction.type === "course-test" ||
                                  nextAction.type === "module-test") && (
                                    <FileText size={16} className="mr-1" />
                                  )}
                                {(nextAction.type === "continue" ||
                                  nextAction.type === "start") && (
                                    <Play size={16} className="mr-1" />
                                  )}
                                {nextAction.text}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">
                                Overall Progress
                              </span>
                              <span className="font-medium text-gray-900">
                                {courseProgress}%
                              </span>
                            </div>
                            <Progress value={courseProgress} size="sm" />

                            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div className="text-center">
                                <div className="font-medium text-gray-900">
                                  {progress?.completedChapters?.length || 0}/
                                  {course.totalChapters}
                                </div>
                                <div className="text-gray-500">Chapters</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-gray-900">
                                  {aiInterviewStatus[course.id]?.completed
                                    ? "1/1"
                                    : "0/1"}
                                </div>
                                <div className="text-gray-500">
                                  AI Interview
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Available Tests */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center">
                  <FileText size={20} className="mr-2 text-blue-500" />
                  Available Tests
                  {availableTests.length > 0 && (
                    <Badge variant="primary" size="sm" className="ml-2">
                      {availableTests.length}
                    </Badge>
                  )}
                </Card.Title>
              </Card.Header>
              <Card.Content>
                {availableTests.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle
                      size={32}
                      className="mx-auto text-green-500 mb-2"
                    />
                    <p className="text-sm text-gray-600">No tests available</p>
                    <p className="text-xs text-gray-500">
                      Complete more chapters to unlock tests
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableTests.map((test) => (
                      <div
                        key={test.id}
                        className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 mb-2">
                          <div>
                            <h4 className="text-sm sm:text-base font-medium text-gray-900">
                              {test.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {test.courseTitle}
                            </p>
                            {test.moduleTitle && (
                              <p className="text-xs text-gray-500">
                                Section: {test.moduleTitle}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="warning"
                            size="sm"
                            className="self-start"
                          >
                            test
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <div className="text-xs text-gray-500 flex-1">
                            {test.questions} questions • {test.duration} min •{" "}
                            {test.passingScore}% to pass
                          </div>
                          <Button
                            size="sm"
                            onClick={() => startTest(test)}
                            className="w-full sm:w-auto"
                          >
                            Start Test
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* AI Interview Status */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center">
                  <Brain size={20} className="mr-2 text-purple-500" />
                  AI Interview Portal
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {Object.entries(aiInterviewStatus).map(
                    ([courseId, status]) => {
                      const course = assignedCourses.find(
                        (c) => c.id === courseId
                      );
                      if (!course) return null;

                      return (
                        <div key={courseId} className="p-3 rounded-lg border">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-2">
                            <h4 className="text-sm font-medium text-gray-900 flex-1">
                              {course.title}
                            </h4>
                            {status.completed ? (
                              <Badge variant="success" size="sm">
                                Completed
                              </Badge>
                            ) : status.eligible ? (
                              <Badge variant="warning" size="sm">
                                Available
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                Locked
                              </Badge>
                            )}
                          </div>

                          {status.completed ? (
                            <div className="text-xs text-gray-600 mt-2">
                              Score: {status.result?.overallScore ?? "--"}% •
                              Completed{" "}
                              {status.result?.completedAt
                                ? new Date(
                                  status.result.completedAt
                                ).toLocaleDateString()
                                : "--"}
                            </div>
                          ) : status.eligible ? (
                            <Button
                              size="sm"
                              className="w-full sm:w-auto mt-2"
                              onClick={() => startAIInterview(courseId)}
                            >
                              <Brain size={14} className="mr-1" />
                              Start Interview
                            </Button>
                          ) : (
                            <div className="flex items-center text-xs text-gray-500 mt-2">
                              <Lock size={12} className="mr-1" />
                              Complete course test to unlock
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* Recent Test Results */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center">
                  <Award size={20} className="mr-2 text-yellow-500" />
                  Recent Test Results
                </Card.Title>
              </Card.Header>
              <Card.Content>
                {completedTests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No tests completed yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {completedTests.slice(0, 5).map((test) => (
                      <div
                        key={test.id}
                        className="p-3 sm:p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 flex-1">
                            {test.title}
                          </h4>
                          <Badge
                            variant={test.result.passed ? "success" : "danger"}
                            size="sm"
                            className="self-start sm:self-center"
                          >
                            {test.result.score}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {test.courseTitle}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(
                              test.result.attemptedAt
                            ).toLocaleDateString()}
                          </span>
                          <span
                            className={`text-xs font-medium ${test.result.passed
                              ? "text-green-600"
                              : "text-red-600"
                              }`}
                          >
                            {test.result.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Learning Goals (kept; no module goal) */}
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center">
                  <Target size={20} className="mr-2 text-green-500" />
                  Learning Goals
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Complete all assigned courses
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {
                          Object.values(aiInterviewStatus).filter(
                            (s) => s.completed
                          ).length
                        }
                        /{assignedCourses.length}
                      </span>
                    </div>
                    <Progress
                      value={
                        assignedCourses.length > 0
                          ? (Object.values(aiInterviewStatus).filter(
                            (s) => s.completed
                          ).length /
                            assignedCourses.length) *
                          100
                          : 0
                      }
                      size="sm"
                      variant="accent"
                    />
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Maintain 80%+ test average
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {stats.averageTestScore}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min((stats.averageTestScore / 80) * 100, 100)}
                      size="sm"
                      variant={
                        stats.averageTestScore >= 80 ? "success" : "warning"
                      }
                    />
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Study 10 hours this week
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {formatTimeSpent(stats.totalTimeSpent % 600)}/10h
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        ((stats.totalTimeSpent % 600) / 600) * 100,
                        100
                      )}
                      size="sm"
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>

      {/* Course Details Modal */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title={selectedCourse?.title}
        size="lg"
      >
        {selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={selectedCourse.thumbnail || FALLBACK_THUMB}
                alt={selectedCourse.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCourse.title}
                </h3>
                <p className="text-gray-600">
                  by {selectedCourse.instructorNames?.[0] || "Instructor"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {selectedCourse.totalChapters}
                </div>
                <div className="text-sm text-green-800">Chapters</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">—</div>
                <div className="text-sm text-purple-800">Duration</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Your Progress</h4>
              <Progress
                value={getCourseProgress(selectedCourse.id)}
                size="md"
              />
              <div className="mt-2 text-sm text-gray-600 text-center">
                {getCourseProgress(selectedCourse.id)}% Complete
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowCourseModal(false);
                  goToCourse(selectedCourse.id);
                }}
              >
                <PlayCircle size={16} className="mr-2" />
                Continue Learning
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCourseModal(false);
                  toast("Progress report coming soon!");
                }}
              >
                <BarChart3 size={16} className="mr-2" />
                View Report
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={selectedTest?.title}
        size="lg"
      >
        {selectedTest && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  Test Instructions
                </span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • You have {selectedTest.duration} minutes to complete this
                  test
                </li>
                <li>• {selectedTest.questions} questions total</li>
                <li>• {selectedTest.passingScore}% score required to pass</li>
                <li>• {selectedTest.maxAttempts} attempts allowed</li>
                <li>• Make sure you have a stable internet connection</li>
              </ul>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to start?
              </h3>
              <p className="text-gray-600 mb-4">
                Once you begin, the timer will start and you cannot pause the
                test.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowTestModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Starting test...");
                    setTimeout(() => {
                      const mockAnswers = [];
                      submitTest(mockAnswers);
                    }, 1500);
                  }}
                >
                  <Play size={16} className="mr-2" />
                  Start Test
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Interview Modal */}
      <Modal
        isOpen={showAIInterviewModal}
        onClose={() => setShowAIInterviewModal(false)}
        title="AI Interview Portal"
        size="lg"
      >
        {selectedAIInterview && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Brain size={16} className="text-purple-600" />
                <span className="font-medium text-purple-800">
                  AI Interview Session
                </span>
              </div>
              <p className="text-sm text-purple-700">
                This AI-powered interview will assess your technical knowledge,
                problem-solving skills, and communication abilities. The session
                will be recorded for evaluation.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">45 min</div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  3 Sections
                </div>
                <div className="text-sm text-gray-600">
                  Technical, Behavioral, Problem-solving
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">70%</div>
                <div className="text-sm text-gray-600">Pass Score</div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready for your interview?
              </h3>
              <p className="text-gray-600 mb-4">
                Make sure you're in a quiet environment with good lighting and
                audio.
              </p>
              <div className="flex space-x-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAIInterviewModal(false)}
                >
                  Not Ready
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Starting AI interview...");
                    setTimeout(() => {
                      const mockResponses = [];
                      completeAIInterview(mockResponses);
                    }, 1500);
                  }}
                >
                  <Brain size={16} className="mr-2" />
                  Start Interview
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentDashboardPage;
