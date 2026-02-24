import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { formatImageUrl } from "../../utils/imageUtils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  Camera,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UserProfileProps {}

interface UserData {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
  profilePicture?: string;
  // Student fields
  studentId?: string;
  courseYrSection?: string;
  contactNumber?: string;
  // Instructor fields
  instructorId?: string;
  department?: string;
  specialization?: string;
  // Alumni fields
  gradYear?: number;
  degree?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  location?: string;
  graduationDate?: string;
  // Employer fields
  companyName?: string;
  position?: string;
  employerContactNumber?: string;
}

// Field mapping from API snake_case to component camelCase
const mapApiToUserData = (apiUser: Record<string, any>): UserData => {
  return {
    id: apiUser.id,
    email: apiUser.email,
    fullName: apiUser.full_name || apiUser.fullName,
    role: apiUser.role,
    status: apiUser.status,
    profilePicture: apiUser.profilePicture || apiUser.image || null,
    // Student fields
    studentId: apiUser.studentID || apiUser.studentId,
    courseYrSection: apiUser.course_yr_section || apiUser.courseYrSection,
    contactNumber: apiUser.contact_number || apiUser.contactNumber,
    // Instructor fields
    instructorId: apiUser.instructor_id || apiUser.instructorId,
    department: apiUser.department,
    specialization: apiUser.subject_taught || apiUser.specialization,
    // Alumni fields
    gradYear: apiUser.grad_year || apiUser.gradYear,
    degree: apiUser.degree,
    jobTitle: apiUser.jobtitle || apiUser.jobTitle,
    company: apiUser.company || apiUser.company,
    industry: apiUser.industry,
    location: apiUser.location,
    graduationDate: apiUser.graduation_date || apiUser.graduationDate,
    // Employer fields
    companyName: apiUser.companyname || apiUser.companyName,
    position: apiUser.position,
    employerContactNumber: apiUser.employer_contact_number || apiUser.employerContactNumber,
  };
};

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.user) {
          const mappedUser = mapApiToUserData(data.user);
          setUserData(mappedUser);
          setFormData(mappedUser);
        } else {
          toast.error('Failed to load profile data');
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // For now, we'll just update basic user info
      // Use snake_case field names to match backend expectations
      const updateData = {
        full_name: formData.fullName,
        // Add other updatable fields as needed
      };

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setUserData(prev => prev ? { ...prev, fullName: formData.fullName! } : null);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load profile data</p>
      </div>
    );
  }

  const roleDisplay = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
  const roleInitials = roleDisplay.substring(0, 2).toUpperCase();


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">My Profile</h2>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            <Button
              variant={isEditing ? "default" : "outline"}
              className={isEditing ? "bg-green-500 hover:bg-green-600" : "border-green-200 hover:bg-green-50"}
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-green-100 shadow-md">
                  {userData.profilePicture ? (
                    <img
                      src={formatImageUrl(userData.profilePicture)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                      {roleInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div>
                <h3 className="text-xl">{userData.fullName}</h3>
                <Badge variant="secondary" className="bg-lime-100 text-lime-700 mt-2">
                  {roleDisplay}
                </Badge>
                {userData.studentId && (
                  <p className="text-sm text-gray-600 mt-2">Student ID: {userData.studentId}</p>
                )}
                {userData.instructorId && (
                  <p className="text-sm text-gray-600 mt-2">Instructor ID: {userData.instructorId}</p>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  defaultValue={userData.fullName}
                  disabled={!isEditing}
                  className={isEditing ? "border-green-200" : "bg-gray-50"}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={userData.email}
                  disabled={!isEditing}
                  className={isEditing ? "border-green-200" : "bg-gray-50"}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Account Status
                </Label>
                <Input
                  value={userData.status}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Information */}
      {userData.role === 'student' && (
        <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  Student ID
                </Label>
                <Input
                  value={userData.studentId || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Course Year & Section</Label>
                <Input
                  value={userData.courseYrSection || 'Not provided'}
                  disabled={!isEditing}
                  className={isEditing ? "border-blue-200" : "bg-white"}
                  onChange={(e) => handleInputChange('courseYrSection', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Contact Number
                </Label>
                <Input
                  value={userData.contactNumber || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userData.role === 'instructor' && (
        <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Instructor ID</Label>
                <Input
                  value={userData.instructorId || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={userData.department || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Specialization</Label>
                <Input
                  value={userData.specialization || 'Not provided'}
                  disabled={!isEditing}
                  className={isEditing ? "border-purple-200" : "bg-white"}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                />
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {userData.role === 'alumni' && (
        <Card className="border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-600" />
              Career Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  Degree
                </Label>
                <Input
                  value={userData.degree || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Input
                  value={userData.gradYear || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Current Company</Label>
                <Input
                  value={userData.company || 'Not provided'}
                  disabled={!isEditing}
                  className={isEditing ? "border-orange-200" : "bg-white"}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={userData.jobTitle || 'Not provided'}
                  disabled={!isEditing}
                  className={isEditing ? "border-orange-200" : "bg-white"}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={userData.industry || 'Not provided'}
                  disabled={!isEditing}
                  className={isEditing ? "border-orange-200" : "bg-white"}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={userData.location || 'Not provided'}
                  disabled={!isEditing}
                  className={isEditing ? "border-orange-200" : "bg-white"}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userData.role === 'employer' && (
        <Card className="border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={userData.companyName || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Your Position</Label>
                <Input
                  value={userData.position || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={userData.industry || 'Not provided'}
                  disabled
                  className="bg-white"
                />
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Settings */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Account Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div>
                <p>Email Notifications</p>
                <p className="text-sm text-gray-600">Receive email updates about feedback responses</p>
              </div>
              <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50">
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div>
                <p>Privacy Settings</p>
                <p className="text-sm text-gray-600">Control who can see your profile information</p>
              </div>
              <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50">
                Configure
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div>
                <p>Change Password</p>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
              <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-50">
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
