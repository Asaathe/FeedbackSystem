import { useState, useEffect, lazy, Suspense } from "react";
import { autoRefreshToken } from "./utils/auth";
import { LoginPage } from "./components/Users_and_others/login-page";
import { SignupPage } from "./components/Users_and_others/signup-page";
import { DashboardLayout } from "./components/Users_and_others/dashboard-layout";
import { Toaster } from "./components/Reusable_components/sonner";

// Lazy load components
const AdminDashboard = lazy(() =>
  import("./components/Dashboards/admin-dashboard").then((m) => ({
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
const UserManagement = lazy(() =>
  import("./components/Users_and_others/user-management").then((m) => ({
    default: m.UserManagement,
  }))
);
const AnalyticsPage = lazy(() =>
  import("./components/Users_and_others/analytics-page").then((m) => ({
    default: m.AnalyticsPage,
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
const AlumniFeedback = lazy(() =>
  import("./components/Feedbacks/alumni-feedback").then((m) => ({
    default: m.AlumniFeedback,
  }))
);
const InstructorDashboard = lazy(() =>
  import("./components/Dashboards/instructor-dashboard").then((m) => ({
    default: m.InstructorDashboard,
  }))
);
const InstructorFeedback = lazy(() =>
  import("./components/Feedbacks/instructor-feedback").then((m) => ({
    default: m.InstructorFeedback,
  }))
);

const EmployerDashboard = lazy(() =>
  import("./components/Dashboards/employer-dashboard").then((m) => ({
    default: m.EmployerDashboard,
  }))
);
const EmployeeDirectory = lazy(() =>
  import("./components/Users_and_others/employee-directory").then((m) => ({
    default: m.EmployeeDirectory,
  }))
);
const EmployeePerformance = lazy(() =>
  import("./components/Users_and_others/employee-performance").then((m) => ({
    default: m.EmployeePerformance,
  }))
);
const FeedbackSubmission = lazy(() =>
  import("./components/Feedbacks/feedback-submission").then((m) => ({
    default: m.FeedbackSubmission,
  }))
);

const UserProfile = lazy(() =>
  import("./components/Users_and_others/user-profile").then((m) => ({
    default: m.UserProfile,
  }))
);

// Add loading state for dynamic data
const DynamicDataLoader = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This is a placeholder - in reality, FormBuilder fetches its own data
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form builder...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSignup, setShowSignup] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | undefined>(
    undefined
  );
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  useEffect(() => {
    // Check sessionStorage for token (standardized storage)
    const token = sessionStorage.getItem("authToken");
    console.log("Token from storage:", token ? `${token.substring(0, 20)}...` : 'null');
    
    if (token) {
      // Verify token with server using proper headers
      fetch("http://localhost:5000/api/auth/verify", {
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
  const handleNavigateToFormBuilder = (formId?: string, isTemplate: boolean = false) => {
    console.log('🔄 Navigating to form builder with:', { formId, isTemplate });
    setEditingFormId(formId);
    setIsEditingTemplate(isTemplate);
    setCurrentPage("form-builder");
  };

  // Navigate back from form builder
  const handleBackFromFormBuilder = () => {
    setEditingFormId(undefined);
    setIsEditingTemplate(false);
    setCurrentPage("forms");
  };

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
    // Admin pages
    if (userRole === "admin") {
      switch (currentPage) {
        case "dashboard":
          return <AdminDashboard onNavigate={setCurrentPage} />;
        case "forms":
          return (
            <FeedbackFormsManagement
              onNavigateToBuilder={(formId) => {
                handleNavigateToFormBuilder(formId, false);
              }}
            />
          );
        case "form-builder":
          return (
            <DynamicDataLoader>
              <FormBuilder
                onBack={handleBackFromFormBuilder}
                formId={editingFormId}
                isCustomFormTab={!isEditingTemplate}
              />
            </DynamicDataLoader>
          );
        case "users":
          return <UserManagement />;
        case "analytics":
          return <AnalyticsPage />;
        default:
          return <AdminDashboard onNavigate={setCurrentPage} />;
      }
    }

    // Employer pages (HR/Management - Employee Performance)
    if (userRole === "employer") {
      switch (currentPage) {
        case "dashboard":
          return <EmployerDashboard onNavigate={setCurrentPage} />;
        case "employee-directory":
          return (
            <EmployeeDirectory
              onViewEmployee={(id: string) =>
                setCurrentPage("employee-performance")
              }
            />
          );
        case "employee-performance":
          return (
            <EmployeePerformance
              onBack={() => setCurrentPage("employee-directory")}
            />
          );
        case "submit-feedback":
          return <FeedbackSubmission />;
        case "analytics":
          return <AnalyticsPage />;
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
          return <InstructorDashboard onNavigate={setCurrentPage} />;
        case "my-feedback":
          return <InstructorFeedback />;
        case "submit-feedback":
          return <FeedbackSubmission userRole={userRole} />;
        case "profile":
          return <UserProfile role={userRole} />;
        default:
          return <InstructorDashboard onNavigate={setCurrentPage} />;
      }
    }

    // Alumni pages
    if (userRole === "alumni") {
      switch (currentPage) {
        case "dashboard":
          return <AlumniDashboard onNavigate={setCurrentPage} />;
        case "submit-feedback":
          return <AlumniFeedback onBack={() => setCurrentPage("dashboard")} />;
        case "my-submissions":
          return (
            <div className="text-center py-12">
              <h2 className="text-2xl text-gray-400">My Submissions</h2>
              <p className="text-gray-500 mt-2">
                Your feedback history will appear here
              </p>
            </div>
          );
        case "profile":
          return <UserProfile role={userRole} />;
        default:
          return <AlumniDashboard onNavigate={setCurrentPage} />;
      }
    }

    // Student pages
    switch (currentPage) {
      case "dashboard":
        return <StudentDashboard onNavigate={setCurrentPage} />;
      case "submit-feedback":
        return <FeedbackSubmission />;
      case "my-submissions":
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl text-gray-400">My Submissions</h2>
            <p className="text-gray-500 mt-2">
              Your feedback history will appear here
            </p>
          </div>
        );
      case "profile":
        return <UserProfile role={userRole} />;
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