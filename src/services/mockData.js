// src/services/mockData.js

// --- Mock datasets -------------------------------------------------
const colleges = [
  {
    id: "col-1",
    name: "Creative Arts Institute",
    code: "CAI-001",
    logo: "https://picsum.photos/seed/cai/200/200",
    status: "active",
    address: "12 Museum Road, Bengaluru",
    phone: "+91 98765 43210",
    email: "admin@cai.edu",
    website: "https://cai.edu",
    establishedYear: 2004,
    totalStudents: 420,
    totalInstructors: 18,
    totalCourses: 12,
  },
  {
    id: "col-2",
    name: "Tech University",
    code: "TU-314",
    logo: "https://picsum.photos/seed/tu/200/200",
    status: "active",
    address: "88 Tech Park, Pune",
    phone: "+91 99888 77665",
    email: "contact@tu.edu",
    website: "https://tu.edu",
    establishedYear: 1998,
    totalStudents: 980,
    totalInstructors: 42,
    totalCourses: 28,
  },
];

const users = [
  // Super Admin
  {
    id: "0",
    name: "Super Administrator",
    email: "superadmin@edusphere.com",
    avatar: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "superadmin",
    isActive: true,
    isVerified: true,
    joinedDate: "2023-01-01",
    lastLogin: "2024-01-15",
    assignedCourses: [],
    students: [],
    permissions: {
      canCreateCourses: true,
      canCreateTests: true,
      canManageTests: true,
      canManageStudents: true,
      canViewAnalytics: true,
      canManageUsers: true,
      canManageColleges: true
    }
  },
  // Admin
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "admin@demo.com",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    collegeId: "col-1",
    role: "admin",
    isActive: true,
    isVerified: true,
    joinedDate: "2023-02-01",
    lastLogin: "2024-01-14",
    assignedCourses: [],
    students: ["3"],
    permissions: {
      canCreateCourses: true,
      canCreateTests: true,
      canManageTests: true,
      canManageStudents: true,
      canViewAnalytics: true
    }
  },
  // Instructor
  {
    id: "2",
    name: "Sarah Instructor",
    email: "instructor@demo.com",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    collegeId: "col-1",
    role: "instructor",
    isActive: true,
    isVerified: true,
    joinedDate: "2023-03-01",
    lastLogin: "2024-01-13",
    assignedCourses: ["course-1", "course-2"],
    students: ["3"],
    permissions: {
      canCreateCourses: true,
      canCreateTests: true,
      canManageTests: true,
      canManageStudents: true,
      canViewAnalytics: true
    }
  },
  // Student
  {
    id: "3",
    name: "John Student",
    email: "student@demo.com",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    collegeId: "col-1",
    role: "student",
    isActive: true,
    isVerified: true,
    joinedDate: "2023-04-01",
    lastLogin: "2024-01-15",
    assignedCourses: ["course-1", "course-2", "course-3"],
    progress: {
      "course-1": {
        overallProgress: 75,
        completedChapters: ["ch-1", "ch-2", "ch-3"],
        completedModules: ["mod-1"],
        moduleTestResults: {
          "mod-1": { passed: true, score: 85, attemptedAt: "2024-01-10" }
        },
        courseTestResult: { passed: true, score: 88, attemptedAt: "2024-01-12" },
        aiInterviewResult: { 
          overallScore: 82, 
          completedAt: "2024-01-14",
          certificateEligible: true
        }
      },
      "course-2": {
        overallProgress: 45,
        completedChapters: ["ch-1", "ch-2"],
        completedModules: [],
        moduleTestResults: {},
        courseTestResult: null,
        aiInterviewResult: null
      },
      "course-3": {
        overallProgress: 20,
        completedChapters: ["ch-1"],
        completedModules: [],
        moduleTestResults: {},
        courseTestResult: null,
        aiInterviewResult: null
      }
    }
  }
];

const courses = [
  {
    id: "course-1",
    title: "Digital Art Mastery",
    description: "Learn the fundamentals of digital art creation using industry-standard tools and techniques. Master composition, color theory, and digital painting.",
    thumbnail: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=400",
    collegeId: "col-1",
    instructor: {
      id: "2",
      name: "Sarah Instructor",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    assignedInstructors: ["2"],
    status: "published",
    level: "beginner",
    category: "Design",
    price: 99,
    rating: 4.8,
    reviewCount: 124,
    enrolledStudents: ["3"],
    totalModules: 4,
    totalChapters: 12,
    estimatedDuration: "8 weeks",
    createdAt: "2023-06-01",
    updatedAt: "2024-01-10"
  },
  {
    id: "course-2",
    title: "Introduction to Data Structures",
    description: "Master fundamental data structures and algorithms. Learn arrays, linked lists, stacks, queues, trees, and graphs with practical implementations.",
    thumbnail: "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400",
    collegeId: "col-2",
    instructor: {
      id: "2",
      name: "Sarah Instructor",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    assignedInstructors: ["2"],
    status: "published",
    level: "intermediate",
    category: "Programming",
    price: 149,
    rating: 4.9,
    reviewCount: 89,
    enrolledStudents: ["3"],
    totalModules: 6,
    totalChapters: 18,
    estimatedDuration: "12 weeks",
    createdAt: "2023-07-01",
    updatedAt: "2024-01-08"
  },
  {
    id: "course-3",
    title: "Web Development Fundamentals",
    description: "Build modern web applications from scratch. Learn HTML, CSS, JavaScript, and popular frameworks to create responsive, interactive websites.",
    thumbnail: "https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400",
    collegeId: "col-2",
    instructor: {
      id: "2",
      name: "Sarah Instructor",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    assignedInstructors: ["2"],
    status: "published",
    level: "beginner",
    category: "Programming",
    price: 129,
    rating: 4.7,
    reviewCount: 156,
    enrolledStudents: ["3"],
    totalModules: 5,
    totalChapters: 15,
    estimatedDuration: "10 weeks",
    createdAt: "2023-08-01",
    updatedAt: "2024-01-05"
  }
];

const modules = [
  // Course 1 modules
  {
    id: "mod-1",
    courseId: "course-1",
    title: "Digital Art Basics",
    description: "Introduction to digital art tools and techniques",
    totalChapters: 3,
    estimatedDuration: "2 weeks",
    order: 1
  },
  {
    id: "mod-2",
    courseId: "course-1",
    title: "Color Theory & Composition",
    description: "Understanding color relationships and visual composition",
    totalChapters: 3,
    estimatedDuration: "2 weeks",
    order: 2
  },
  // Course 2 modules
  {
    id: "mod-3",
    courseId: "course-2",
    title: "Arrays and Linked Lists",
    description: "Linear data structures and their implementations",
    totalChapters: 3,
    estimatedDuration: "2 weeks",
    order: 1
  },
  {
    id: "mod-4",
    courseId: "course-2",
    title: "Stacks and Queues",
    description: "LIFO and FIFO data structures",
    totalChapters: 3,
    estimatedDuration: "2 weeks",
    order: 2
  }
];

const testResults = [
  {
    id: "test-1",
    studentId: "3",
    courseId: "course-1",
    moduleId: "mod-1",
    testType: "module",
    score: 85,
    passed: true,
    submittedAt: "2024-01-10"
  },
  {
    id: "test-2",
    studentId: "3",
    courseId: "course-1",
    testType: "course",
    score: 88,
    passed: true,
    submittedAt: "2024-01-12"
  }
];

const systemAnalytics = {
  overview: {
    totalColleges: colleges.length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
    totalInstructors: users.filter(u => u.role === 'instructor').length,
    totalStudents: users.filter(u => u.role === 'student').length,
    totalCourses: courses.length,
    totalModules: modules.length,
    systemUptime: "99.9%",
    activeUsers: users.filter(u => u.isActive).length,
    avgCourseCompletion: 72,
    totalRevenue: 184200,
  },
  collegeBreakdown: {
    "col-1": { 
      students: 420, 
      instructors: 18, 
      revenue: 56200, 
      courses: courses.filter(c => c.collegeId === "col-1").length 
    },
    "col-2": { 
      students: 980, 
      instructors: 42, 
      revenue: 128000, 
      courses: courses.filter(c => c.collegeId === "col-2").length 
    },
  },
  performanceMetrics: {
    cpuUsage: 43,
    memoryUsage: 67,
    diskUsage: 58,
    networkLatency: 45,
    responseTime: 180,
    errorRate: 2,
  },
};

// Bundle raw data you access directly in the UI
export const mockData = {
  colleges,
  users,
  courses,
  modules,
  testResults,
  systemAnalytics,
};

// --- Mock API ------------------------------------------------------
const delay = (ms = 300) => new Promise(res => setTimeout(res, ms));

export const mockAPI = {
  delay,

  // College APIs
  async getAllColleges() {
    await delay(); 
    return [...colleges];
  },

  async createCollege(collegeData) {
    await delay();
    const newCollege = {
      id: `col-${Date.now()}`,
      ...collegeData,
      status: 'active',
      totalStudents: 0,
      totalInstructors: 0,
      totalCourses: 0
    };
    colleges.push(newCollege);
    return newCollege;
  },

  async updateCollege(collegeId, updates) {
    await delay();
    const college = colleges.find(c => c.id === collegeId);
    if (college) {
      Object.assign(college, updates);
      return college;
    }
    throw new Error("College not found");
  },

  async deleteCollege(collegeId) {
    await delay();
    const idx = colleges.findIndex(c => c.id === collegeId);
    if (idx >= 0) {
      colleges.splice(idx, 1);
      return { ok: true };
    }
    throw new Error("College not found");
  },

  // User APIs
  async getAllAdmins() {
    await delay(); 
    return users.filter(u => u.role === 'admin');
  },

  async getAllInstructors() {
    await delay(); 
    return users.filter(u => u.role === 'instructor');
  },

  async getAllStudents() {
    await delay(); 
    return users.filter(u => u.role === 'student');
  },

  async bulkUpdateUsers(userIds, patch) {
    await delay();
    users.forEach(u => {
      if (userIds.includes(u.id)) {
        Object.assign(u, patch);
      }
    });
    return { ok: true };
  },

  async deleteUser(userId) {
    await delay();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users.splice(idx, 1);
      return { ok: true };
    }
    throw new Error("User not found");
  },

  async updateUserPermissions(userId, newPerms) {
    await delay();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.permissions = { ...user.permissions, ...newPerms };
      return { ok: true };
    }
    throw new Error("User not found");
  },

  // Course APIs
  async getCoursesByInstructor(instructorId) {
    await delay();
    return courses.filter(course => 
      course.assignedInstructors.includes(instructorId)
    );
  },

  async getCourseModules(courseId) {
    await delay();
    return modules.filter(module => module.courseId === courseId);
  },

  // Student Progress APIs
  async getStudentProgress(studentId, courseId) {
    await delay();
    const student = users.find(u => u.id === studentId);
    return student?.progress?.[courseId] || {
      overallProgress: 0,
      completedChapters: [],
      completedModules: [],
      moduleTestResults: {},
      courseTestResult: null,
      aiInterviewResult: null
    };
  },

  async updateChapterProgress(studentId, courseId, moduleId, chapterId) {
    await delay();
    const student = users.find(u => u.id === studentId);
    if (student) {
      if (!student.progress) student.progress = {};
      if (!student.progress[courseId]) {
        student.progress[courseId] = {
          overallProgress: 0,
          completedChapters: [],
          completedModules: [],
          moduleTestResults: {},
          courseTestResult: null,
          aiInterviewResult: null
        };
      }
      
      const progress = student.progress[courseId];
      if (!progress.completedChapters.includes(chapterId)) {
        progress.completedChapters.push(chapterId);
        // Update overall progress
        const course = courses.find(c => c.id === courseId);
        if (course) {
          progress.overallProgress = Math.round(
            (progress.completedChapters.length / course.totalChapters) * 100
          );
        }
      }
      return progress;
    }
    throw new Error("Student not found");
  },

  // Test APIs
  async checkModuleTestEligibility(studentId, moduleId) {
    await delay();
    // Mock logic: eligible if student has completed at least 2 chapters in the module
    return Math.random() > 0.3; // 70% chance of being eligible
  },

  async checkCourseTestEligibility(studentId, courseId) {
    await delay();
    const student = users.find(u => u.id === studentId);
    const progress = student?.progress?.[courseId];
    // Eligible if completed at least 80% of chapters
    return progress?.overallProgress >= 80;
  },

  async getModuleTest(moduleId) {
    await delay();
    return {
      id: `test-${moduleId}`,
      moduleId,
      title: `Module Test - ${modules.find(m => m.id === moduleId)?.title}`,
      questions: 10,
      duration: 30,
      passingScore: 70,
      maxAttempts: 3
    };
  },

  async getCourseTest(courseId) {
    await delay();
    return {
      id: `test-${courseId}`,
      courseId,
      title: `Final Test - ${courses.find(c => c.id === courseId)?.title}`,
      questions: 25,
      duration: 60,
      passingScore: 75,
      maxAttempts: 2
    };
  },

  async submitModuleTest(studentId, testId, answers) {
    await delay();
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    const passed = score >= 70;
    const result = {
      score,
      passed,
      attemptedAt: new Date().toISOString()
    };
    
    // Update student progress
    const student = users.find(u => u.id === studentId);
    if (student && student.progress) {
      // Find which course this test belongs to
      const moduleId = testId.replace('test-', '');
      const module = modules.find(m => m.id === moduleId);
      if (module && student.progress[module.courseId]) {
        student.progress[module.courseId].moduleTestResults[moduleId] = result;
      }
    }
    
    return result;
  },

  async submitCourseTest(studentId, testId, answers) {
    await delay();
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    const passed = score >= 75;
    const result = {
      score,
      passed,
      attemptedAt: new Date().toISOString()
    };
    
    // Update student progress
    const student = users.find(u => u.id === studentId);
    if (student && student.progress) {
      const courseId = testId.replace('test-', '');
      if (student.progress[courseId]) {
        student.progress[courseId].courseTestResult = result;
      }
    }
    
    return result;
  },

  // AI Interview APIs
  async checkAIInterviewEligibility(studentId, courseId) {
    await delay();
    const student = users.find(u => u.id === studentId);
    const progress = student?.progress?.[courseId];
    return progress?.courseTestResult?.passed === true;
  },

  async startAIInterview(studentId, courseId) {
    await delay();
    return {
      sessionId: `ai-${Date.now()}`,
      courseId,
      studentId,
      startedAt: new Date().toISOString()
    };
  },

  async completeAIInterview(sessionId, responses) {
    await delay();
    const overallScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const certificateEligible = overallScore >= 80;
    
    const result = {
      overallScore,
      certificateEligible,
      completedAt: new Date().toISOString(),
      sessionId
    };
    
    return result;
  },

  // System APIs
  async getSystemAnalytics() {
    await delay(); 
    return { ...systemAnalytics };
  },
};

// Optional default (not required by your current imports)
export default { mockAPI, mockData };