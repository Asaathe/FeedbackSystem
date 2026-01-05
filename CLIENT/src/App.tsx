import { useState, useEffect, lazy, Suspense } from "react";
import { LoginPage } from "./components/Users_and_others/login-page";
import { SignupPage } from "./components/Users_and_others/signup-page";
import { DashboardLayout } from "./components/Users_and_others/dashboard-layout";
import { Toaster } from "./components/Reusable_components/sonner";

// Lazy load components
const AdminDashboard = lazy(() =>
  import("./components/Dashboards/admin-dashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const FeedbackFormsManagement = lazy(() =>
  import("./components/Forms/feedback-forms-management").then(
    (m) => ({ default: m.FeedbackFormsManagement }),
  ),
);
const FormBuilder = lazy(() =>
  import("./components/Forms/form-builder").then((m) => ({
    default: m.FormBuilder,
  })),
);
const UserManagement = lazy(() =>
  import("./components/Users_and_others/user-management").then((m) => ({
    default: m.UserManagement,
  })),
);
const AnalyticsPage = lazy(() =>
  import("./components/Users_and_others/analytics-page").then((m) => ({
    default: m.AnalyticsPage,
  })),
);
const StudentDashboard = lazy(() =>
  import("./components/Dashboards/student-dashboard").then((m) => ({
    default: m.StudentDashboard,
  })),
);
const AlumniDashboard = lazy(() =>
  import("./components/Dashboards/alumni-dashboard").then((m) => ({
    default: m.AlumniDashboard,
  })),
);
const AlumniFeedback = lazy(() =>
  import("./components/Feedbacks/alumni-feedback").then((m) => ({
    default: m.AlumniFeedback,
  })),
);
const InstructorDashboard = lazy(() =>
  import("./components/Dashboards/instructor-dashboard").then((m) => ({
    default: m.InstructorDashboard,
  })),
);
const InstructorFeedback = lazy(() =>
  import("./components/Feedbacks/instructor-feedback").then((m) => ({
    default: m.InstructorFeedback,
  })),
);




const EmployerDashboard = lazy(() =>
  import("./components/Dashboards/employer-dashboard").then((m) => ({
    default: m.EmployerDashboard,
  })),
);
const EmployeeDirectory = lazy(() =>
  import("./components/Users_and_others/employee-directory").then((m) => ({
    default: m.EmployeeDirectory,
  })),
);
const EmployeePerformance = lazy(() =>
  import("./components/Users_and_others/employee-performance").then((m) => ({
    default: m.EmployeePerformance,
  })),
);
const FeedbackSubmission = lazy(() =>
  import("./components/Feedbacks/feedback-submission").then((m) => ({
    default: m.FeedbackSubmission,
  })),
);


const UserProfile = lazy(() =>
  import("./components/Users_and_others/user-profile").then((m) => ({
    default: m.UserProfile,
  })),
);

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showSignup, setShowSignup] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Check sessionStorage first (more secure)
    const token = sessionStorage.getItem('authToken') || localStorage.getItem('token');
    console.log('Token from storage:', token);
    if (token) {
      fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          console.log('Verify response status:', res.status);
          return res.json();
        })
        .then((data) => {
          console.log('Verify response data:', data);
          if (data.success) {
            setUserRole(data.user.role);
            setIsLoggedIn(true);
          } else {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('tokenExpiration');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        })
        .catch((error) => {
          console.error('Verify error:', error);
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userData');
          sessionStorage.removeItem('tokenExpiration');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        });
    }
  }, []);

  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
    setShowSignup(false);
  };

  const handleLogout = () => {
    // ============================================================
    // TODO: BACKEND - Add logout API call
    // ============================================================
    // Endpoint: POST /api/auth/logout
    // Headers: Authorization: Bearer {token}
    // 
    // Example implementation:
    /*
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
    */
    // ============================================================
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole("");
    setCurrentPage("dashboard");
    setShowSignup(false);
  };

  const handleSignupSuccess = (role: string) => {
    handleLogin(role);
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
                setEditingFormId(formId);
                setCurrentPage("form-builder");
              }}
            />
          );
        case "form-builder":
          return (
            <FormBuilder
              onBack={() => {
                setEditingFormId(undefined);
                setCurrentPage("forms");
              }}
              formId={editingFormId}
            />
          );
        case "users":
          return <UserManagement />;
       
        
        
          
        default:
          return <AdminDashboard />;
      }
    }

    // Employer pages (HR/Management - Employee Performance)
    if (userRole === "employer") {
      switch (currentPage) {
        case "dashboard":
          return (
            <EmployerDashboard onNavigate={setCurrentPage} />
          );
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
              onBack={() =>
                setCurrentPage("employee-directory")
              }
            />
          );
        case "submit-feedback":
          return <FeedbackSubmission />;
        case "analytics":
          return <AnalyticsPage />;
        case "settings":
          return (
            <div className="text-center py-12">
              <h2 className="text-2xl text-gray-400">
                Settings Page
              </h2>
              <p className="text-gray-500 mt-2">
                Configuration options will appear here
              </p>
            </div>
          );
        default:
          return (
            <EmployerDashboard onNavigate={setCurrentPage} />
          );
      }
    }

    // Instructor pages (Individual Teaching Staff)
    if (userRole === "instructor") {
      switch (currentPage) {
        case "dashboard":
          return (
            <InstructorDashboard onNavigate={setCurrentPage} />
          );
        case "my-feedback":
          return <InstructorFeedback />;
        case "submit-feedback":
          return <FeedbackSubmission userRole={userRole} />;
        
        
        case "profile":
          return <UserProfile role={userRole} />;
        default:
          return (
            <InstructorDashboard onNavigate={setCurrentPage} />
          );
      }
    }

    

    // Alumni pages
    if (userRole === "alumni") {
      switch (currentPage) {
        case "dashboard":
          return (
            <AlumniDashboard onNavigate={setCurrentPage} />
          );
        case "submit-feedback":
          return (
            <AlumniFeedback
              onBack={() => setCurrentPage("dashboard")}
            />
          );
        case "my-submissions":
          return (
            <div className="text-center py-12">
              <h2 className="text-2xl text-gray-400">
                My Submissions
              </h2>
              <p className="text-gray-500 mt-2">
                Your feedback history will appear here
              </p>
            </div>
          );
       
        case "profile":
          return <UserProfile role={userRole} />;
        default:
          return (
            <AlumniDashboard onNavigate={setCurrentPage} />
          );
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
            <h2 className="text-2xl text-gray-400">
              My Submissions
            </h2>
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