import { ReactNode, useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Lightbulb,
  UserCircle,
  ChevronDown,
  Lock,
  HelpCircle,
  Shield,
  BookOpen,
  Book
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatImageUrl } from "../../utils/imageUtils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  role: string;
}

export function DashboardLayout({ children, currentPage, onNavigate, onLogout, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string>("");

  useEffect(() => {
    const fetchUserName = async () => {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success && data.user) {
            // Handle both snake_case and camelCase field names
            setUserName(data.user.full_name || data.user.fullName || '');
            // Set profile picture if available
            const pic = data.user.profilePicture || data.user.image || '';
            if (pic) {
              setProfilePicture(pic);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user name:', error);
        }
      }
    };
    fetchUserName();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout(); // Call the parent's logout handler to update state
  };

  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const roleInitials = roleDisplay.substring(0, 2).toUpperCase();
  
  // User display name based on role
  const getUserName = () => {
    if (userName) return userName;
    // Fallback to role-based names if not loaded
    switch(role) {
      case 'admin': return 'System Administrator';
      case 'instructor': return 'Dr. Sarah Johnson';
      case 'student': return 'Student User';
      case 'alumni': return 'Alumni User';
      case 'employer': return 'Employer User';

      default: return 'Demo User';
    }
  };

  const menuItems = role === 'admin'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'forms', label: 'Feedback Forms', icon: FileText },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'courses', label: 'Course Management', icon: BookOpen },
        { id: 'student-promotion', label: 'Student Promotion', icon: GraduationCap },
        { id: 'subjecteval', label: 'Subject Evaluation', icon: Book },
        { id: 'subjectassign', label: 'Subject Assignment', icon: Book },
        { id: 'settings', label: 'System Settings', icon: Settings },

      ]
    : role === 'employer'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'submit-feedback', label: 'Feedback Forms', icon: FileText },
        { id: 'my-submissions', label: 'My Submissions', icon: BarChart3 },
      ]
    : role === 'instructor'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my-feedback', label: 'My Feedback', icon: FileText },
        { id: 'submit-feedback', label: 'Submit Feedback', icon: FileText },
        { id: 'my-submissions', label: 'My Submissions', icon: BarChart3 },
      ]
    : role === 'staff'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'service-feedback', label: 'Service Feedback', icon: FileText },
        { id: 'service-analytics', label: 'Service Analytics', icon: BarChart3 },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    : role === 'alumni'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'submit-feedback', label: 'Alumni Feedback', icon: FileText },
        { id: 'my-submissions', label: 'My Submissions', icon: BarChart3 },
      ]
    : role === 'student'
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'subjecteval', label: 'Subject Evaluation', icon: Book },
        { id: 'submit-feedback', label: 'Submit Feedback', icon: FileText },
        { id: 'my-submissions', label: 'My Submissions', icon: BarChart3 },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'submit-feedback', label: 'Submit Feedback', icon: FileText },
        { id: 'my-submissions', label: 'My Submissions', icon: BarChart3 },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200">
            <img
              src="/actslogo.png"
              alt="ACTS Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold">FeedbACTS System</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start ${
                  currentPage === item.id 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'hover:bg-green-50 text-gray-700'
                }`}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Button>
            ))}
          </nav>


        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-green-50">
                  <Avatar className="w-8 h-8">
                    {profilePicture ? (
                      <img
                        src={formatImageUrl(profilePicture)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        {roleInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm">{getUserName()}</span>
                    <span className="text-xs text-gray-500">{roleDisplay}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('profile')}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('change-password')}>
                  <Lock className="w-4 h-4 mr-2" />
                  Change password
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}