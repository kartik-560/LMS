import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Star,
  Clock,
  Users,
  BookOpen,
  Play,
  Heart,
  Share2,
  ChevronRight,
  Grid as Grid3X3,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import Button from "../components/ui/Button";
import Progress from "../components/ui/Progress";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";

import { mockData } from "../services/mockData";
import { coursesAPI, FALLBACK_THUMB, enrollmentRequestsAPI } from "../services/api";

const CourseCatalogPage = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedCollege, setSelectedCollege] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(new Set());

  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Track small-screen vs large-screen to render the mobile slide-over
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsMobileScreen(window.innerWidth < 1024); // < lg
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const categories = [
    { id: "all", name: "All Categories", count: 0 },
    { id: "programming", name: "Programming", count: 0 },
    { id: "design", name: "Design", count: 0 },
    { id: "business", name: "Business", count: 0 },
    { id: "marketing", name: "Marketing", count: 0 },
    { id: "data-science", name: "Data Science", count: 0 },
    { id: "language", name: "Language Learning", count: 0 },
    { id: "music", name: "Music", count: 0 },
    { id: "photography", name: "Photography", count: 0 },
  ];

  const levels = [
    { id: "all", name: "All Levels" },
    { id: "beginner", name: "Beginner" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" },
  ];

  const sortOptions = [
    { id: "popular", name: "Most Popular" },
    { id: "newest", name: "Newest First" },
    { id: "rating", name: "Highest Rated" },
    { id: "price-low", name: "Price: Low to High" },
    { id: "price-high", name: "Price: High to Low" },
    { id: "duration", name: "Duration" },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingRequests(new Set());
      return;
    }
    (async () => {
      try {
        const res = await enrollmentRequestsAPI.listMine();
        const ids = new Set(
          (res.data || [])
            .filter((r) => String(r.status).toUpperCase() === "PENDING")
            .map((r) => r.courseId)
        );
        setPendingRequests(ids);
      } catch (e) {
        // ignore
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    filterAndSortCourses();
  }, [
    courses,
    searchTerm,
    selectedCategory,
    selectedLevel,
    selectedCollege,
    priceRange,
    sortBy,
  ]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.list();
      const apiCourses = Array.isArray(res.data) ? res.data : [];

      const mapped = apiCourses.map((c) => {
        const firstInstructor = c.instructorNames?.[0] || "Unknown Instructor";
        return {
          id: c.id,
          title: c.title,
          description: c.description || "",
          thumbnail: c.thumbnail || FALLBACK_THUMB,
          category: (c.category || "general").toLowerCase(),
          level: (c.level || "beginner").toLowerCase(),
          rating: Number(c.rating ?? 0),
          reviewCount: Number(c.reviewCount ?? 0),
          price: Number(c.price ?? 0),
          estimatedDuration: c.estimatedDuration || "—",
          duration: c.estimatedDuration || "—",
          createdAt: c.createdAt || new Date().toISOString(),
          enrolledStudents: Number(c.studentCount ?? 0),
          instructor: {
            name: firstInstructor,
            avatar: `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <rect width="100%" height="100%" fill="#e5e7eb"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                      font-family="Arial" font-size="20" fill="#374151">
                  ${firstInstructor
                    .split(" ")
                    .map((p) => p[0] || "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </text>
              </svg>`
            )}`,
          },
          progress: undefined,
          collegeId: c.collegeId,
          enrollmentStatus: c.enrollmentStatus || "",
        };
      });

      const counts = mapped.reduce((acc, course) => {
        const key = course.category || "general";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      categories.forEach((cat) => {
        if (cat.id === "all") cat.count = mapped.length;
        else cat.count = counts[cat.id] || 0;
      });

      setCourses(mapped);
    } catch (err) {
      console.error("Error fetching courses:", err);
      if (err?.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollRequest = async (course) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { next: `/courses/${course.id}` } });
      return;
    }
    const role = user?.role || user?.userRole;
    if (role && String(role).toLowerCase() !== "student") {
      toast.error("Only students can request enrollment.");
      return;
    }
    if (pendingRequests.has(course.id)) {
      toast("Enrollment already requested. Awaiting instructor approval.");
      return;
    }

    try {
      await enrollmentRequestsAPI.create(course.id);
      setPendingRequests((prev) => new Set(prev).add(course.id));
      toast.success("Request sent to the instructor. You’ll be notified on approval.");
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || "Could not send request.";
      toast.error(msg);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          (course.title || "").toLowerCase().includes(q) ||
          (course.description || "").toLowerCase().includes(q) ||
          (course.instructor?.name || "").toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) => (course.category || "").toLowerCase() === selectedCategory
      );
    }

    if (selectedLevel !== "all") {
      filtered = filtered.filter((course) => (course.level || "") === selectedLevel);
    }

    if (selectedCollege !== "all") {
      filtered = filtered.filter((course) => course.collegeId === selectedCollege);
    }

    filtered = filtered.filter((course) => {
      const price = Number(course.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "duration": {
        const toNum = (val) => {
          if (!val) return 0;
          const n = parseInt(val, 10);
          return Number.isNaN(n) ? 0 : n;
        };
        filtered.sort(
          (a, b) => toNum(a.estimatedDuration) - toNum(b.estimatedDuration)
        );
        break;
      }
      default:
        filtered.sort(
          (a, b) => (b.enrolledStudents || 0) - (a.enrolledStudents || 0)
        );
        break;
    }

    setFilteredCourses(filtered);
  };

  const getCategoryColor = (category) => {
    const colors = {
      programming: "bg-blue-100 text-blue-800",
      design: "bg-purple-100 text-purple-800",
      business: "bg-green-100 text-green-800",
      marketing: "bg-yellow-100 text-yellow-800",
      "data-science": "bg-red-100 text-red-800",
      language: "bg-indigo-100 text-indigo-800",
      music: "bg-pink-100 text-pink-800",
      photography: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800",
    };
    return colors[(category || "general").toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      advanced: "bg-red-100 text-red-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const toggleFavorite = (courseId) => {
    setFavorites((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLevel("all");
    setSelectedCollege("all");
    setPriceRange([0, 500]);
    setSortBy("popular");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Discover Your Next Learning Adventure
            </h1>
            <p className="text-sm sm:text-base text-primary-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Explore courses from expert instructors. Transform your skills and advance your career.
            </p>
            <div className="max-w-2xl mx-auto px-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search for courses, instructors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 sm:py-3 text-gray-900 bg-white rounded-xl shadow-lg focus:ring-4 focus:ring-white/20 focus:outline-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Filters button */}
              <Button
                variant={showFilters ? "primary" : "outline"}
                className="w-full md:w-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filters
              </Button>

              {/* view toggle */}
              <div className="flex items-center justify-between sm:justify-start space-x-2 ml-auto md:ml-0">
                <span className="text-sm text-gray-600 hidden sm:inline">View:</span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-primary-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 md:mt-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 sm:px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
            </div>
          </div>

          {/* Desktop filters card (lg+) */}
          {!isMobileScreen && showFilters && (
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6 mt-4">
              <FilterForm
                categories={categories}
                levels={levels}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                selectedCollege={selectedCollege}
                setSelectedCollege={setSelectedCollege}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                clearFilters={clearFilters}
              />
            </Card>
          )}
        </div>

        {/* Mobile slide-over filters */}
        {isMobileScreen && showFilters && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 max-h-[80%] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Filter Courses</h3>
                <button className="p-2" onClick={() => setShowFilters(false)} aria-label="Close filters">
                  <X size={20} />
                </button>
              </div>
              <FilterForm
                categories={categories}
                levels={levels}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                selectedCollege={selectedCollege}
                setSelectedCollege={setSelectedCollege}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                clearFilters={() => {
                  clearFilters();
                  setShowFilters(false);
                }}
              />
            </div>
          </div>
        )}

        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                : "space-y-4 sm:space-y-6"
            }
          >
            {filteredCourses.map((course) =>
              viewMode === "grid" ? (
                <CourseCard
                  key={course.id}
                  course={course}
                  isFavorite={favorites.includes(course.id)}
                  onToggleFavorite={() => toggleFavorite(course.id)}
                  onEnroll={() => handleEnrollRequest(course)}
                  isPending={
                    pendingRequests.has(course.id) ||
                    String(course.enrollmentStatus).toLowerCase() === "pending"
                  }
                  getCategoryColor={getCategoryColor}
                  getLevelColor={getLevelColor}
                />
              ) : (
                <CourseListItem
                  key={course.id}
                  course={course}
                  isFavorite={favorites.includes(course.id)}
                  onToggleFavorite={() => toggleFavorite(course.id)}
                  onEnroll={() => handleEnrollRequest(course)}
                  isPending={
                    pendingRequests.has(course.id) ||
                    String(course.enrollmentStatus).toLowerCase() === "pending"
                  }
                  getCategoryColor={getCategoryColor}
                  getLevelColor={getLevelColor}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------
   FilterForm component (reusable)
   --------------------------- */
const FilterForm = ({
  categories,
  levels,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  selectedCollege,
  setSelectedCollege,
  priceRange,
  setPriceRange,
  clearFilters,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} {category.count > 0 && `(${category.count})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
        <select
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Institutions</option>
          {mockData.colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="500"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Free</span>
            <span>$500+</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   CourseCard (grid item) - responsive
   --------------------------- */
const CourseCard = ({
  course,
  isFavorite,
  onToggleFavorite,
  onEnroll,
  isPending,
  getCategoryColor,
  getLevelColor,
}) => {
  const { isAuthenticated } = useAuthStore();
  const college = course.collegeId ? mockData.colleges.find((c) => c.id === course.collegeId) : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Mobile: fixed height banner; Desktop (sm+): aspect-video */}
      <div className="relative bg-gradient-to-br from-primary-100 to-primary-200 h-40 sm:aspect-video overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isFavorite ? "bg-red-500 text-white" : "bg-white/80 text-gray-600 hover:bg-white"}`}
            aria-label="Toggle favorite"
          >
            <Heart size={16} className={isFavorite ? "fill-current" : ""} />
          </button>
          <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors">
            <Share2 size={16} />
          </button>
        </div>
        {course.progress !== undefined && (
          <div className="absolute bottom-3 left-3 right-3">
            <Progress value={course.progress} size="sm" className="bg-white/20" />
          </div>
        )}
      </div>

      <Card.Content className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge className={getCategoryColor(course.category)} size="sm">
              {course.category}
            </Badge>
            <Badge className={getLevelColor(course.level)} size="sm">
              {course.level}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-700">{course.rating ?? 0}</span>
            <span className="text-sm text-gray-500">({course.reviewCount ?? 0})</span>
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {course.title}
        </h3>

        {course.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        )}

        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <img
              src={course.instructor?.avatar}
              alt={course.instructor?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate block">{course.instructor?.name}</span>
            {college && <p className="text-xs text-gray-500 truncate">{college.name}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 flex-wrap">
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users size={14} />
            <span>{course.enrolledStudents} students</span>
          </div>
        </div>

        {course.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Your Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} size="sm" />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
          <div className="text-xl font-bold text-gray-900">
            {course.price === 0 ? <span className="text-green-600">Free</span> : <span>${course.price}</span>}
          </div>

          <div className="w-full sm:w-auto">
            {course.progress !== undefined ? (
              <Link to={`/courses/${course.id}`}>
                <Button size="sm" className="w-full sm:w-auto">
                  <Play size={16} className="mr-1" />
                  Continue
                </Button>
              </Link>
            ) : isPending ? (
              <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
                Requested
              </Button>
            ) : (
              <Button size="sm" onClick={onEnroll} className="w-full sm:w-auto">
                Enroll
              </Button>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
};

/* ---------------------------
   CourseListItem (list view) - responsive stacked
   --------------------------- */
const CourseListItem = ({
  course,
  isFavorite,
  onToggleFavorite,
  onEnroll,
  isPending,
  getCategoryColor,
  getLevelColor,
}) => {
  const { isAuthenticated } = useAuthStore();
  const college = course.collegeId ? mockData.colleges.find((c) => c.id === course.collegeId) : null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-48 sm:h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0 overflow-hidden">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2 flex-wrap">
                <Badge className={getCategoryColor(course.category)} size="sm">{course.category}</Badge>
                <Badge className={getLevelColor(course.level)} size="sm">{course.level}</Badge>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-700">{course.rating ?? 0}</span>
                  <span className="text-sm text-gray-500">({course.reviewCount ?? 0})</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2">
                {course.title}
              </h3>

              {course.description && (
                <p className="text-gray-600 mb-3 line-clamp-2">{course.description}</p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>{course.enrolledStudents} students</span>
                </div>
                {college && <span className="text-sm text-gray-500">• {college.name}</span>}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-3 mt-4 sm:mt-0">
              <div className="flex space-x-2">
                <button
                  onClick={onToggleFavorite}
                  className={`p-2 rounded-full transition-colors ${isFavorite ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Heart size={16} className={isFavorite ? "fill-current" : ""} />
                </button>
                <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <Share2 size={16} />
                </button>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {course.price === 0 ? <span className="text-green-600">Free</span> : <span>${course.price}</span>}
                </div>

                <div className="w-full sm:w-auto">
                  {course.progress !== undefined ? (
                    <Link to={`/courses/${course.id}`}>
                      <Button size="sm" className="w-full sm:w-auto">
                        <Play size={16} className="mr-1" />
                        Continue
                      </Button>
                    </Link>
                  ) : isPending ? (
                    <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
                      Requested
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onEnroll} className="w-full sm:w-auto">
                      Enroll
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </Card>
  );
};

export default CourseCatalogPage;
