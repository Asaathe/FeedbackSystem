import { useState, useEffect, lazy, Suspense } from "react";
import { autoRefreshToken } from "./utils/auth";
import { LoginPage } from "./components/auth/login-page";
import { SignupPage } from "./components/auth/signup-page";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import { Toaster } from "./components/ui/sonner";

// Lazy load components
const AdminDashboard = lazy(() =>
  import("./components/Admin/admin-dashboard").then((m) => ({
    default: m.AdminDashboard,
  }))
);
const FeedbackFormsManagement = lazy(() =>
  import("./components/Forms/feedback-forms-management").then((m) => ({
    default: m.FeedbackFormsManagement,
  }))
);
const FormBuilder = lazy(() =>
  import("./components/Forms/form-builder").then((m) => ({
    default: m.FormBuilder,
  }))
);
const FormResponsesViewer = lazy(() =>
  import("./components/Forms/form-responses-viewer").then((m) => ({
    default: m.FormResponsesViewer,
  }))
);
const UserManagement = lazy(() =>
  import("./components/Admin/user-management").then((m) => ({
    default: m.UserManagement,
  }))
);
const CourseManagement = lazy(() =>
  import("./components/Admin/course-management").then((m) => ({
    default: m.CourseManagement,
  }))
);

const StudentPromotion = lazy(() =>
  import("./components/Admin/student-promotion").then((m) => ({
    default: m.default,
  }))
);

const StudentDashboard = lazy(() =>
  import("./components/Dashboards/student-dashboard").then((m) => ({
    default: m.StudentDashboard,
  }))
);
const AlumniDashboard = lazy(() =>
  import("./components/Dashboards/alumni-dashboard").then((m) => ({
    default: m.AlumniDashboard,
  }))
);
const AlumniEmployment = lazy(() =>
  import("./components/Dashboards/alumni-employment").then((m) => ({
    default: m.AlumniEmployment,
  }))
);
const AlumniFeedback = lazy(() =>
  import("./components/feedback/alumni-feedback").then((m) => ({
    default: m.AlumniFeedback,
  }))
);
const InstructorDashboard = lazy(() =>
  import("./components/Dashboards/instructor-dashboard").then((m) => ({
    default: m.InstructorDashboard,
  }))
);
const InstructorFeedback = lazy(() =>
  import("./components/feedback/instructor-feedback").then((m) => ({
    default: m.InstructorFeedback,
  }))
);

const EmployerDashboard = lazy(() =>
  import("./components/Dashboards/employer-dashboard").then((m) => ({
    default: m.EmployerDashboard,
  }))
);

const FeedbackSubmission = lazy(() =>
  import("./components/feedback/feedback-submission").then((m) => ({
    default: m.FeedbackSubmission,
  }))
);

const UserProfile = lazy(() =>
  import("./components/users/user-profile").then((m) => ({
    default: m.UserProfile,
  }))
);

const MySubmissions = lazy(() =>
  import("./components/feedback/my-submissions").then((m) => ({
    default: m.MySubmissions,
  }))
);

const ChangePassword = lazy(() =>
  import("./components/auth/change-password").then((m) => ({
    default: m.ChangePassword,
  }))
);

const SubjectEvaluation = lazy(() =>
  import("./components/Admin/subject-evaluation").then((m) => ({
    default: m.SubjectEvaluation,
  }))
);

const SubjectAssignment = lazy(() =>
  import("./components/Admin/subject-assignment").then((m) => ({
    default: m.SubjectAssignment,
  }))
);

const SubjectOfferings = lazy(() =>
  import("./components/Admin/subject-offerings").then((m) => ({
    default: m.SubjectOfferings,
  }))
);

const SubjectManagement = lazy(() =>
  import("./components/Admin/subject-management").then((m) => ({
    default: m.SubjectManagement,
  }))
);


const SystemSettings = lazy(() =>
  import("./components/Admin/system-settings").then((m) => ({
    default: m.SystemSettings,
  }))
);

const StudentSubjectEvaluation = lazy(() =>
  import("./components/Dashboards/student-subject-evaluation").then((m) => ({
    default: m.StudentSubjectEvaluation,
  }))
);

const MySubjects = lazy(() =>
  import("./components/Dashboards/my-subjects").then((m) => ({
    default: m.MySubjects,
  }))
);

const StudentFeedback = lazy(() =>
  import("./components/Dashboards/student-feedback").then((m) => ({
    default: m.StudentFeedback,
  }))
);

const FeedbackTemplate = lazy(() =>
  import("./components/Admin/feedback-template").then((m) => ({
    default: m.FeedbackTemplate,
  }))
);

const AlumniEmploymentTracker = lazy(() =>
  import("./components/Admin/alumni-employment-tracker").then((m) => ({
    default: m.AlumniEmploymentTracker,
  }))
);


export default function App() {
  console.log("🚀 APP COMPONENT RENDERING");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSignup, setShowSignup] = useState(false);
  
  // External feedback form ID (for public feedback links)
  const [externalFeedbackFormId, setExternalFeedbackFormId] = useState<string | null>(null);
  const [externalFeedbackToken, setExternalFeedbackToken] = useState<string | null>(null);
  const [editingFormId, setEditingFormId] = useState<string | undefined>(
    undefined
  );
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [formType, setFormType] = useState<'custom' | 'evaluation'>('custom');
  const [viewingResponsesFormId, setViewingResponsesFormId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    // Check sessionStorage for token (standardized storage)
    const token = sessionStorage.getItem("authToken");
    console.log("Token from storage:", token ? `${token.substring(0, 20)}...` : 'null');
    
    if (token) {
      // Verify token with server using proper headers
      fetch("/api/auth/verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })
        .then((res) => {
          console.log("Verify response status:", res.status);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Verify response data:", data);
          if (data.success && data.user) {
            setUserRole(data.user.role);
            setIsLoggedIn(true);
            // Store user data if not already stored
            if (!sessionStorage.getItem("userData")) {
              sessionStorage.setItem("userData", JSON.stringify(data.user));
            }
          } else {
            // Token verification failed, clear storage
            clearAuthData();
          }
        })
        .catch((error) => {
          console.error("Verify error:", error);
          // Network error or server error, clear storage
          clearAuthData();
        });
    }
  }, []);

  // Check for external feedback link in URL on page load
  useEffect(() => {
    const path = window.location.pathname;
    const fullUrl = window.location.href;

    console.log("🔍 CHECKING URL FOR EXTERNAL FEEDBACK");
    console.log("Full URL:", fullUrl);
    console.log("Path:", path);
    console.log("Current external states - FormId:", externalFeedbackFormId, "Token:", externalFeedbackToken);
    console.log("useEffect is running!");

    // Check if URL is like /feedback/123 (legacy format)
    const feedbackMatch = path.match(/^\/feedback\/(\d+)$/);
    if (feedbackMatch && feedbackMatch[1]) {
      console.log("Detected legacy feedback URL with form ID:", feedbackMatch[1]);
      setExternalFeedbackFormId(feedbackMatch[1]);
      setExternalFeedbackToken(null); // Clear token for legacy format
    }

    // Check if URL is like /feedback/t/abc123 (new secure format - 32 char token)
    const tokenMatch = path.match(/^\/feedback\/t\/([a-f0-9]{32})$/);
    if (tokenMatch && tokenMatch[1]) {
      console.log("✅ DETECTED TOKEN-BASED FEEDBACK URL with token:", tokenMatch[1]);
      setExternalFeedbackToken(tokenMatch[1]);
      setExternalFeedbackFormId(null); // Clear formId for token format
    } else if (path.includes('/feedback/t/')) {
      console.log("⚠️ URL contains /feedback/t/ but doesn't match 32-char hex token format. Path:", path);
      // Try fallback regex for any alphanumeric token
      const fallbackMatch = path.match(/^\/feedback\/t\/([a-zA-Z0-9]+)$/);
      if (fallbackMatch && fallbackMatch[1]) {
        console.log("🔄 USING FALLBACK TOKEN DETECTION:", fallbackMatch[1]);
        setExternalFeedbackToken(fallbackMatch[1]);
        setExternalFeedbackFormId(null);
      } else {
        console.log("❌ NO TOKEN FOUND IN URL");
      }
    } else {
      console.log("ℹ️ URL does not contain feedback path");
    }
  }, []);

  // Auto-refresh token periodically
  useEffect(() => {
    if (!isLoggedIn) return;

    const refreshInterval = setInterval(async () => {
      try {
        const refreshed = await autoRefreshToken();
        if (!refreshed) {
          // Token refresh failed, log out user
          setIsLoggedIn(false);
          setUserRole("");
          setCurrentPage("dashboard");
          setShowSignup(false);
        }
      } catch (error) {
        console.error("Auto-refresh error:", error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [isLoggedIn]);

  // Helper function to clear auth data consistently
  const clearAuthData = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("tokenExpiration");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
    setShowSignup(false);
  };

  const handleLogout = () => {
    // Clear all auth data consistently
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("tokenExpiration");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    setIsLoggedIn(false);
    setUserRole("");
    setCurrentPage("dashboard");
    setShowSignup(false);
  };

  const handleSignupSuccess = (role: string) => {
    handleLogin(role);
  };

  // Navigate to form builder with form ID
  const handleNavigateToFormBuilder = (formId?: string, isTemplate: boolean = false, formTypeParam?: 'custom' | 'evaluation') => {
    console.log('Navigating to form builder with:', { formId, isTemplate, formType: formTypeParam });
    setEditingFormId(formId);
    setIsEditingTemplate(isTemplate);
    setFormType(formTypeParam || 'custom');
    setCurrentPage("form-builder");
  };

  // Navigate back from form builder
  const handleBackFromFormBuilder = () => {
    setEditingFormId(undefined);
    setIsEditingTemplate(false);
    setFormType('custom');
    setCurrentPage("forms");
  };

  // Navigate to responses viewer
  const handleNavigateToResponsesViewer = (formId: string) => {
    setViewingResponsesFormId(formId);
    setCurrentPage("form-responses");
  };

  // Navigate back from responses viewer
  const handleBackFromResponsesViewer = () => {
    setViewingResponsesFormId(undefined);
    setCurrentPage("forms");
  };

  // EXTERNAL FEEDBACK - Check BEFORE authentication (public access)
  console.log("🔍 APP RENDER: externalFeedbackFormId =", externalFeedbackFormId, "externalFeedbackToken =", externalFeedbackToken);
  console.log("Current location:", window.location.href);
  console.log("Current pathname:", window.location.pathname);

  if (externalFeedbackFormId || externalFeedbackToken) {
    console.log("🎯 EXTERNAL FEEDBACK DETECTED - BYPASSING LOGIN");
    alert("External feedback detected! If you see this, the URL detection is working.");
    console.log("🎯 RENDERING EXTERNAL FEEDBACK FORM");
    console.log("externalFeedbackFormId:", externalFeedbackFormId);
    console.log("externalFeedbackToken:", externalFeedbackToken);
    return (
      <div className="min-h-screen bg-gray-100">
        <FeedbackSubmission
          externalFormId={externalFeedbackFormId}
          externalToken={externalFeedbackToken}
          onBackToLogin={() => {
            setExternalFeedbackFormId(null);
            setExternalFeedbackToken(null);
          }}
        />
      </div>
    );
  }

  // If not logged in AND not accessing external feedback, show login/signup pages
  if (!isLoggedIn) {
    if (showSignup) {
      return (
        <SignupPage
          onSignupSuccess={handleSignupSuccess}
          onBackToLogin={() => setShowSignup(false)}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateToSignup={() => setShowSignup(true)}
      />
    );
  }

  const renderPage = () => {
    // Shared pages available to all roles
    if (currentPage === "change-password") {
      return <ChangePassword onBack={() => setCurrentPage("dashboard")} />;
    }

    // Admin pages
    if (userRole === "admin") {
      switch (currentPage) {
        case "dashboard":
          return <AdminDashboard onNavigate={setCurrentPage} />;
        case "forms":
          return (
            <FeedbackFormsManagement
              onNavigateToBuilder={(formId, formType) => {
                handleNavigateToFormBuilder(formId, false, formType);
              }}
              onNavigateToResponses={handleNavigateToResponsesViewer}
            />
          );
        case "form-builder":
          return (
            <FormBuilder
              onBack={handleBackFromFormBuilder}
              formId={editingFormId}
              isCustomFormTab={!isEditingTemplate}
              formType={formType}
            />
          );
        case "form-responses":
          return (
            <FormResponsesViewer
              formId={viewingResponsesFormId!}
              onBack={handleBackFromResponsesViewer}
            />
          );
        case "users":
          return <UserManagement />;
        case "courses":
          return <CourseManagement />;
        case "student-promotion":
          return <StudentPromotion />;
        case "subjecteval":
          return <SubjectEvaluation onNavigate={setCurrentPage} />;
        case "subjectassign":
          return <SubjectAssignment onNavigate={setCurrentPage} />;
        case "subject-offerings":
          return <SubjectOfferings />;
        case "subjects":
          return <SubjectManagement />;
        case "settings":
          return <SystemSettings onNavigate={setCurrentPage} />;
        case "feedback-template":
          return <FeedbackTemplate />;
        case "employment-tracker":
          return <AlumniEmploymentTracker onNavigate={setCurrentPage} />;
       
        default:
          return <AdminDashboard onNavigate={setCurrentPage} />;
      }
    }

    // Employer pages (HR/Management - Employee Performance)
    if (userRole === "employer") {
      switch (currentPage) {
        case "dashboard":
          return <EmployerDashboard onNavigate={setCurrentPage} />;
        case "submit-feedback":
          return <FeedbackSubmission />;
        case "my-submissions":
          return <MySubmissions userRole={userRole} />;
        case "settings":
          return (
            <div className="text-center py-12">
              <h2 className="text-2xl text-gray-400">Settings Page</h2>
              <p className="text-gray-500 mt-2">
                Configuration options will appear here
              </p>
            </div>
          );
        default:
          return <EmployerDashboard onNavigate={setCurrentPage} />;
      }
    }

    // Instructor pages (Individual Teaching Staff)
    if (userRole === "instructor") {
      switch (currentPage) {
        case "dashboard":
          return <InstructorDashboard onNavigate={setCurrentPage} showSubjectsOnly={false} />;
        case "my-subjects":
          return <InstructorDashboard onNavigate={setCurrentPage} showSubjectsOnly={true} />;
        case "my-feedback":
          return <InstructorFeedback />;
        case "submit-feedback":
          return <FeedbackSubmission userRole={userRole} />;
        case "profile":
          return <UserProfile onNavigate={setCurrentPage} />;
      }
    }

    // Alumni pages (Graduated Students)
    if (userRole === "alumni") {
      switch (currentPage) {
        case "dashboard":
          return <AlumniDashboard onNavigate={setCurrentPage} />;
        case "employment":
          return <AlumniEmployment onNavigate={setCurrentPage} />;
        case "submit-feedback":
          return <FeedbackSubmission userRole={userRole} />;
        case "my-submissions":
          return <MySubmissions userRole={userRole} />;
        case "profile":
          return <UserProfile onNavigate={setCurrentPage} />;
        default:
          return <AlumniDashboard onNavigate={setCurrentPage} />;
      }
    }

    // Student pages
    switch (currentPage) {
      case "dashboard":
        return <StudentDashboard onNavigate={setCurrentPage} />;
      case "my-subjects":
        return <MySubjects onNavigate={setCurrentPage} />;
      case "student-feedback":
        return <StudentFeedback onNavigate={setCurrentPage} />;
      case "submit-feedback":
        return <FeedbackSubmission userRole={userRole} />;
      case "my-submissions":
        return <MySubmissions userRole={userRole} />;
      case "profile":
        return <UserProfile onNavigate={setCurrentPage} />;
      default:
        return <StudentDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      <DashboardLayout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        role={userRole}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          {renderPage()}
        </Suspense>
      </DashboardLayout>
      <Toaster position="top-right" />
    </>
  );
}
