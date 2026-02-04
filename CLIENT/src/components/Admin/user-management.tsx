import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Search, UserPlus, Filter, MoreVertical, Trash2, CheckCircle, XCircle, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

interface User {
  id: number;
  name?: string;
  fullName?: string;
  email: string;
  role: string;
  department: string;
  status: string;
  createdAt?: string;
  studentId?: string;
  courseYrSection?: string;
  instructorId?: string;
  degree?: string;
  alumniCompany?: string;
  companyName?: string;
  industry?: string;
  phoneNumber?: string;
  address?: string;
  year?: string;
  employeeId?: string;
  graduationYear?: string;
  profilePicture?: string;
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Form state for adding new user
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: '',
    department: '',
    phoneNumber: '',
    address: '',
    profilePicture: '',
    // Role-specific fields
    studentId: '',
    course_year_section: '',
    employeeId: '',
    companyName: '',
    graduationYear: ''
  });

  // Form state for editing existing user
  const [editUser, setEditUser] = useState({
    fullName: '',
    email: '',
    role: '',
    department: '',
    status: '',
    phoneNumber: '',
    address: '',
    profilePicture: '',
    // Role-specific fields
    studentId: '',
    course_year_section: '',
    employeeId: '',
    companyName: '',
    graduationYear: ''
  });
  
  // Add a state for showing pending users section
  const [showPendingSection, setShowPendingSection] = useState(true);

  // State for remove user confirmation dialog
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<number | null>(null);

  // State for approve user confirmation dialog
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [userToApprove, setUserToApprove] = useState<any>(null);

  // State for reject user confirmation dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination state for pending approvals
  const [pendingPage, setPendingPage] = useState(1);
  const pendingItemsPerPage = 3; // Show fewer in pending section

  // Fetch users from API
  const fetchUsers = async (search = '', role = 'all', status = 'all', page = 1, limit = 1000) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('authToken');

      if (!token) {
        console.warn('No auth token found, skipping user fetch');
        setUsers([]);
        return;
      }

      const params = new URLSearchParams({
        ...(search && { search }),
        ...(role !== 'all' && { role }),
        ...(status !== 'all' && { status }),
        page: String(page),
        limit: String(limit)
      });

      const response = await fetch(`http://localhost:5000/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Fetch failed with status:', response.status, response.statusText);
        if (response.status === 401) {
          console.warn('Unauthorized access, clearing token');
          sessionStorage.removeItem('authToken');
          setUsers([]);
          toast.error('Session expired. Please log in again.');
          return;
        }
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers(searchQuery, roleFilter, statusFilter);
  }, [searchQuery, roleFilter, statusFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPendingPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || (user.role?.toLowerCase() || '') === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || (user.status?.toLowerCase() || '') === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = users.filter(u => u.status === 'pending').length;

  // Pending users pagination
  const pendingUsers = users.filter(u => u.status === 'pending');
  const totalPendingPages = Math.ceil(pendingUsers.length / pendingItemsPerPage);
  const paginatedPendingUsers = pendingUsers.slice((pendingPage - 1) * pendingItemsPerPage, pendingPage * pendingItemsPerPage);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'instructor': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
     
      case 'alumni': return 'bg-lime-100 text-lime-700';
      case 'employer': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDisplayDepartment = (user: any) => {
    if (user.role?.toLowerCase() === 'student') {
      // Check if courseYrSection indicates senior high or college
      const courseYrSection = user.courseYrSection || user.year || '';
      
      // Check for Senior High strands (ABM, HUMSS, STEM, ICT) with grade levels
      const seniorHighStrands = ['ABM', 'HUMSS', 'STEM', 'ICT'];
      const isSeniorHigh = seniorHighStrands.some(strand =>
        courseYrSection.includes(strand) &&
        (courseYrSection.includes('11') || courseYrSection.includes('12'))
      );
      
      // Check for College courses (BSIT, BSBA, BSCS, BSEN, BSOA, BSAIS, BTVTEd)
      const collegeCourses = ['BSIT', 'BSBA', 'BSCS', 'BSEN', 'BSOA', 'BSAIS', 'BTVTEd'];
      const isCollege = collegeCourses.some(course =>
        courseYrSection.includes(course)
      );

      if (isSeniorHigh) {
        return 'Senior High';
      } else if (isCollege) {
        return 'College';
      } else {
        return user.department || 'N/A';
      }
    } else if (user.role?.toLowerCase() === 'instructor') {
      return user.department || 'Not Assigned';
    } else {
      return user.department || 'N/A';
    }
  };

  const getPendingInfo = (user: any) => {
    const role = user.role?.toLowerCase();
    if (role === 'student') {
      return user.courseYrSection || user.year || 'N/A';
    } else if (role === 'instructor') {
      return user.department || 'Not Assigned';
    } else if (role === 'alumni') {
      return user.degree || 'N/A';
    } else if (role === 'employer') {
      return `${user.companyName || 'N/A'} ${user.employeeId || 'N/A'}`;
    } else {
      return user.department || 'N/A';
    }
  };

  const getPendingLabel = (user: any) => {
    const role = user.role?.toLowerCase();
    if (role === 'student') {
      return 'Course Year and Section';
    } else if (role === 'instructor') {
      return 'Department';
    } else if (role === 'alumni') {
      return 'Degree';
    } else if (role === 'employer') {
      return 'Company and Employee';
    } else {
      return 'Department';
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUser.fullName || !newUser.email || !newUser.password || !newUser.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate role-specific fields
    if (newUser.role.toLowerCase() === 'student') {
      if (!newUser.course_year_section) {
        toast.error('Please select a course year and section');
        return;
      }
      if (!newUser.department) {
        toast.error('Please select a department');
        return;
      }
    } else if (newUser.role.toLowerCase() === 'instructor') {
      if (!newUser.employeeId) {
        toast.error('Please fill in the employee ID');
        return;
      }
      if (!newUser.department) {
        toast.error('Please select a department');
        return;
      }
    }

    try {
      const token = sessionStorage.getItem('authToken');
      const userData = {
        fullName: newUser.fullName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role.toLowerCase(),
        department: newUser.department,
        phoneNumber: newUser.phoneNumber || undefined,
        address: newUser.address || undefined,
        profilePicture: newUser.profilePicture || undefined,
        // Role-specific fields
        ...(newUser.role.toLowerCase() === 'student' && {
          studentId: newUser.studentId,
          course_year_section: newUser.course_year_section
        }),
        ...(newUser.role.toLowerCase() === 'instructor' && {
          employeeId: newUser.employeeId
        }),
        ...(newUser.role.toLowerCase() === 'staff' && {
          employeeId: newUser.employeeId
        }),
        ...(newUser.role.toLowerCase() === 'employer' && {
          companyName: newUser.companyName
        }),
        ...(newUser.role.toLowerCase() === 'alumni' && {
          graduationYear: newUser.graduationYear
        })
      };

      const response = await fetch('http://localhost:5000/api/users/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const data = await response.json();
      // Re-fetch users to update the list
      await fetchUsers(searchQuery, roleFilter, statusFilter);
      toast.success('User added successfully. Account is pending approval.');

      // Reset form
      setNewUser({
        fullName: '',
        email: '',
        password: '',
        role: '',
        department: '',
        phoneNumber: '',
        address: '',
        profilePicture: '',
        studentId: '',
        course_year_section: '',
        employeeId: '',
        companyName: '',
        graduationYear: ''
      });
      setIsAddUserOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error((error as Error).message || 'Failed to add user');
    }
  };

  const handleApproveUser = async (userId: number) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to approve user');

      const data = await response.json();
      // Re-fetch users to update counts and pagination
      await fetchUsers(searchQuery, roleFilter, statusFilter);
      toast.success('User account approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    }
  };

  const handleApproveClick = (user: any) => {
    setUserToApprove(user);
    setIsApproveDialogOpen(true);
  };

  const confirmApproveUser = async () => {
    if (userToApprove) {
      await handleApproveUser(userToApprove.id);
      setIsApproveDialogOpen(false);
      setUserToApprove(null);
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/users/${userId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject user');
      }

      // Re-fetch users to update the list
      await fetchUsers(searchQuery, roleFilter, statusFilter);
      toast.success('User account rejected and removed');
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error((error as Error).message || 'Failed to reject user');
    }
  };

  const handleRejectClick = (user: any) => {
    setUserToReject(user);
    setIsRejectDialogOpen(true);
  };

  const confirmRejectUser = async () => {
    if (userToReject) {
      await handleRejectUser(userToReject.id);
      setIsRejectDialogOpen(false);
      setUserToReject(null);
    }
  };


  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setEditingUserId(user.id);
    // Pre-populate edit form with user data
    setEditUser({
      fullName: user.fullName || user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      profilePicture: user.profilePicture || '',
      studentId: user.studentId || '',
      course_year_section: user.courseYrSection || '',
      employeeId: user.employeeId || '',
      companyName: user.companyName || '',
      graduationYear: user.graduationYear || ''
    });
    setIsEditMode(false);
    setIsViewDetailsOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditingUserId(user.id);
    setEditUser({
      fullName: user.fullName || user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      profilePicture: user.profilePicture || '',
      studentId: user.studentId || '',
      course_year_section: user.courseYrSection || '',
      employeeId: user.employeeId || '',
      companyName: user.companyName || '',
      graduationYear: user.graduationYear || ''
    });
    setIsEditUserOpen(true);
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editUser.fullName || !editUser.email || !editUser.role || !editUser.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      const updateData = {
        fullName: editUser.fullName,
        email: editUser.email,
        role: editUser.role.toLowerCase(),
        department: editUser.department,
        status: editUser.status,
        phoneNumber: editUser.phoneNumber || undefined,
        address: editUser.address || undefined,
        profilePicture: editUser.profilePicture || undefined,
        // Role-specific fields
        ...(editUser.role.toLowerCase() === 'student' && {
          studentId: editUser.studentId,
          course_year_section: editUser.course_year_section
        }),
        ...(editUser.role.toLowerCase() === 'instructor' && {
          instructorId: editUser.employeeId
        }),
        ...(editUser.role.toLowerCase() === 'staff' && {
          employeeId: editUser.employeeId
        }),
        ...(editUser.role.toLowerCase() === 'employer' && {
          companyName: editUser.companyName
        }),
        ...(editUser.role.toLowerCase() === 'alumni' && {
          degree: editUser.graduationYear // Note: API expects 'degree' but we're using graduationYear
        })
      };

      const response = await fetch(`http://localhost:5000/api/users/${editingUserId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      // Re-fetch users to update the list
      await fetchUsers(searchQuery, roleFilter, statusFilter);
      toast.success('User updated successfully');
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error((error as Error).message || 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    // Reset to original user data
    if (selectedUser) {
      setEditUser({
        fullName: selectedUser.fullName || selectedUser.name || '',
        email: selectedUser.email,
        role: selectedUser.role,
        department: selectedUser.department,
        status: selectedUser.status,
        phoneNumber: selectedUser.phoneNumber || '',
        address: selectedUser.address || '',
        profilePicture: selectedUser.profilePicture || '',
        studentId: selectedUser.studentId || '',
        course_year_section: selectedUser.courseYrSection || '',
        employeeId: selectedUser.employeeId || '',
        companyName: selectedUser.companyName || '',
        graduationYear: selectedUser.graduationYear || ''
      });
    }
    setIsEditMode(false);
  };

  const handleRemoveUser = (userId: number) => {
    setUserToRemove(userId);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`http://localhost:5000/api/users/${userToRemove}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Server response:', response.status, response.statusText, errorData);
        throw new Error(errorData.message || 'Failed to remove user');
      }

      await fetchUsers(searchQuery, roleFilter, statusFilter);
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error((error as Error).message || 'Failed to remove user');
    } finally {
      setIsRemoveDialogOpen(false);
      setUserToRemove(null);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (newUser.role) {
      case 'Student':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                value={newUser.studentId}
                onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course_year_section">Course-Year and Section *</Label>
              <Select value={newUser.course_year_section} onValueChange={(value) => setNewUser({ ...newUser, course_year_section: value })}>
                <SelectTrigger id="course_year_section">
                  <SelectValue placeholder="Select course-year and section" />
                </SelectTrigger>
                <SelectContent>
                  {/* Grade 11 */}
                  <SelectItem value="ABM11-LOVE">ABM11-LOVE</SelectItem>
                  <SelectItem value="ABM11-HOPE">ABM11-HOPE</SelectItem>
                  <SelectItem value="ABM11-FAITH">ABM11-FAITH</SelectItem>
                  <SelectItem value="HUMSS11-LOVE">HUMSS11-LOVE</SelectItem>
                  <SelectItem value="HUMSS11-HOPE">HUMSS11-HOPE</SelectItem>
                  <SelectItem value="HUMSS11-FAITH">HUMSS11-FAITH</SelectItem>
                  <SelectItem value="HUMSS11-JOY">HUMSS11-JOY</SelectItem>
                  <SelectItem value="HUMSS11-GENEROSITY">HUMSS11-GENEROSITY</SelectItem>
                  <SelectItem value="HUMSS11-HUMILITY">HUMSS11-HUMILITY</SelectItem>
                  <SelectItem value="HUMSS11-INTEGRITY">HUMSS11-INTEGRITY</SelectItem>
                  <SelectItem value="HUMSS11-WISDOM">HUMSS11-WISDOM</SelectItem>
                  <SelectItem value="STEM11-HOPE">STEM11-HOPE</SelectItem>
                  <SelectItem value="STEM11-FAITH">STEM11-FAITH</SelectItem>
                  <SelectItem value="STEM11-JOY">STEM11-JOY</SelectItem>
                  <SelectItem value="STEM11-GENEROSITY">STEM11-GENEROSITY</SelectItem>
                  <SelectItem value="ICT11-LOVE">ICT11-LOVE</SelectItem>
                  <SelectItem value="ICT11-HOPE">ICT11-HOPE</SelectItem>
                  {/* Grade 12 */}
                  <SelectItem value="ABM12-LOVE">ABM12-LOVE</SelectItem>
                  <SelectItem value="ABM12-HOPE">ABM12-HOPE</SelectItem>
                  <SelectItem value="ABM12-FAITH">ABM12-FAITH</SelectItem>
                  <SelectItem value="HUMSS12-LOVE">HUMSS12-LOVE</SelectItem>
                  <SelectItem value="HUMSS12-HOPE">HUMSS12-HOPE</SelectItem>
                  <SelectItem value="HUMSS12-FAITH">HUMSS12-FAITH</SelectItem>
                  <SelectItem value="HUMSS12-JOY">HUMSS12-JOY</SelectItem>
                  <SelectItem value="HUMSS12-GENEROSITY">HUMSS12-GENEROSITY</SelectItem>
                  <SelectItem value="HUMSS12-HUMILITY">HUMSS12-HUMILITY</SelectItem>
                  <SelectItem value="STEM12-LOVE">STEM12-LOVE</SelectItem>
                  <SelectItem value="STEM12-HOPE">STEM12-HOPE</SelectItem>
                  <SelectItem value="STEM12-FAITH">STEM12-FAITH</SelectItem>
                  <SelectItem value="STEM12-JOY">STEM12-JOY</SelectItem>
                  <SelectItem value="STEM12-GENEROSITY">STEM12-GENEROSITY</SelectItem>
                  <SelectItem value="ICT12-LOVE">ICT12-LOVE</SelectItem>
                  <SelectItem value="ICT12-HOPE">ICT12-HOPE</SelectItem>
                  {/* College - BSIT */}
                  <SelectItem value="BSIT-1A">BSIT-1A</SelectItem>
                  <SelectItem value="BSIT-1B">BSIT-1B</SelectItem>
                  <SelectItem value="BSIT-1C">BSIT-1C</SelectItem>
                  <SelectItem value="BSIT-2A">BSIT-2A</SelectItem>
                  <SelectItem value="BSIT-2B">BSIT-2B</SelectItem>
                  <SelectItem value="BSIT-2C">BSIT-2C</SelectItem>
                  <SelectItem value="BSIT-3A">BSIT-3A</SelectItem>
                  <SelectItem value="BSIT-3B">BSIT-3B</SelectItem>
                  <SelectItem value="BSIT-3C">BSIT-3C</SelectItem>
                  <SelectItem value="BSIT-4A">BSIT-4A</SelectItem>
                  <SelectItem value="BSIT-4B">BSIT-4B</SelectItem>
                  <SelectItem value="BSIT-4C">BSIT-4C</SelectItem>
                  {/* College - BSBA */}
                  <SelectItem value="BSBA-1A">BSBA-1A</SelectItem>
                  <SelectItem value="BSBA-2A">BSBA-2A</SelectItem>
                  <SelectItem value="BSBA-3A">BSBA-3A</SelectItem>
                  <SelectItem value="BSBA-4A">BSBA-4A</SelectItem>
                  {/* College - BSCS */}
                  <SelectItem value="BSCS-1A">BSCS-1A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="Senior High">Senior High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'Instructor':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={newUser.employeeId}
                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Business Administration">Business Administration</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Arts and Sciences">Arts and Sciences</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'Employer':
        return (
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={newUser.companyName}
              onChange={(e) => setNewUser({ ...newUser, companyName: e.target.value })}
            />
          </div>
        );
      case 'Alumni':
        return (
          <div className="grid gap-2">
            <Label htmlFor="graduationYear">Graduation Year *</Label>
            <Input
              id="graduationYear"
              type="number"
              value={newUser.graduationYear}
              onChange={(e) => setNewUser({ ...newUser, graduationYear: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderEditRoleSpecificFields = () => {
    switch (editUser.role) {
      case 'Student':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                placeholder="e.g., 2024-0001"
                value={editUser.studentId}
                onChange={(e) => setEditUser({ ...editUser, studentId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course_year_section">Course-Year and Section *</Label>
              <Select value={editUser.course_year_section} onValueChange={(value) => setEditUser({ ...editUser, course_year_section: value })}>
                <SelectTrigger id="course_year_section">
                  <SelectValue placeholder="Select course-year and section" />
                </SelectTrigger>
                <SelectContent>
                  {/* Grade 11 */}
                  <SelectItem value="ABM11-LOVE">ABM11-LOVE</SelectItem>
                  <SelectItem value="ABM11-HOPE">ABM11-HOPE</SelectItem>
                  <SelectItem value="ABM11-FAITH">ABM11-FAITH</SelectItem>
                  <SelectItem value="HUMSS11-LOVE">HUMSS11-LOVE</SelectItem>
                  <SelectItem value="HUMSS11-HOPE">HUMSS11-HOPE</SelectItem>
                  <SelectItem value="HUMSS11-FAITH">HUMSS11-FAITH</SelectItem>
                  <SelectItem value="HUMSS11-JOY">HUMSS11-JOY</SelectItem>
                  <SelectItem value="HUMSS11-GENEROSITY">HUMSS11-GENEROSITY</SelectItem>
                  <SelectItem value="HUMSS11-HUMILITY">HUMSS11-HUMILITY</SelectItem>
                  <SelectItem value="HUMSS11-INTEGRITY">HUMSS11-INTEGRITY</SelectItem>
                  <SelectItem value="HUMSS11-WISDOM">HUMSS11-WISDOM</SelectItem>
                  <SelectItem value="STEM11-HOPE">STEM11-HOPE</SelectItem>
                  <SelectItem value="STEM11-FAITH">STEM11-FAITH</SelectItem>
                  <SelectItem value="STEM11-JOY">STEM11-JOY</SelectItem>
                  <SelectItem value="STEM11-GENEROSITY">STEM11-GENEROSITY</SelectItem>
                  <SelectItem value="ICT11-LOVE">ICT11-LOVE</SelectItem>
                  <SelectItem value="ICT11-HOPE">ICT11-HOPE</SelectItem>
                  {/* Grade 12 */}
                  <SelectItem value="ABM12-LOVE">ABM12-LOVE</SelectItem>
                  <SelectItem value="ABM12-HOPE">ABM12-HOPE</SelectItem>
                  <SelectItem value="ABM12-FAITH">ABM12-FAITH</SelectItem>
                  <SelectItem value="HUMSS12-LOVE">HUMSS12-LOVE</SelectItem>
                  <SelectItem value="HUMSS12-HOPE">HUMSS12-HOPE</SelectItem>
                  <SelectItem value="HUMSS12-FAITH">HUMSS12-FAITH</SelectItem>
                  <SelectItem value="HUMSS12-JOY">HUMSS12-JOY</SelectItem>
                  <SelectItem value="HUMSS12-GENEROSITY">HUMSS12-GENEROSITY</SelectItem>
                  <SelectItem value="HUMSS12-HUMILITY">HUMSS12-HUMILITY</SelectItem>
                  <SelectItem value="STEM12-LOVE">STEM12-LOVE</SelectItem>
                  <SelectItem value="STEM12-HOPE">STEM12-HOPE</SelectItem>
                  <SelectItem value="STEM12-FAITH">STEM12-FAITH</SelectItem>
                  <SelectItem value="STEM12-JOY">STEM12-JOY</SelectItem>
                  <SelectItem value="STEM12-GENEROSITY">STEM12-GENEROSITY</SelectItem>
                  <SelectItem value="ICT12-LOVE">ICT12-LOVE</SelectItem>
                  <SelectItem value="ICT12-HOPE">ICT12-HOPE</SelectItem>
                  {/* College - BSIT */}
                  <SelectItem value="BSIT-1A">BSIT-1A</SelectItem>
                  <SelectItem value="BSIT-1B">BSIT-1B</SelectItem>
                  <SelectItem value="BSIT-1C">BSIT-1C</SelectItem>
                  <SelectItem value="BSIT-2A">BSIT-2A</SelectItem>
                  <SelectItem value="BSIT-2B">BSIT-2B</SelectItem>
                  <SelectItem value="BSIT-2C">BSIT-2C</SelectItem>
                  <SelectItem value="BSIT-3A">BSIT-3A</SelectItem>
                  <SelectItem value="BSIT-3B">BSIT-3B</SelectItem>
                  <SelectItem value="BSIT-3C">BSIT-3C</SelectItem>
                  <SelectItem value="BSIT-4A">BSIT-4A</SelectItem>
                  <SelectItem value="BSIT-4B">BSIT-4B</SelectItem>
                  <SelectItem value="BSIT-4C">BSIT-4C</SelectItem>
                  {/* College - BSBA */}
                  <SelectItem value="BSBA-1A">BSBA-1A</SelectItem>
                  <SelectItem value="BSBA-2A">BSBA-2A</SelectItem>
                  <SelectItem value="BSBA-3A">BSBA-3A</SelectItem>
                  <SelectItem value="BSBA-4A">BSBA-4A</SelectItem>
                  {/* College - BSCS */}
                  <SelectItem value="BSCS-1A">BSCS-1A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={editUser.department} onValueChange={(value) => setEditUser({ ...editUser, department: value })}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="Senior High">Senior High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'Instructor':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                placeholder="e.g., INS-001"
                value={editUser.employeeId}
                onChange={(e) => setEditUser({ ...editUser, employeeId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={editUser.department} onValueChange={(value) => setEditUser({ ...editUser, department: value })}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Business Administration">Business Administration</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Arts and Sciences">Arts and Sciences</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'Employer':
        return (
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="e.g., Tech Corp Inc."
              value={editUser.companyName}
              onChange={(e) => setEditUser({ ...editUser, companyName: e.target.value })}
            />
          </div>
        );
      case 'Alumni':
        return (
          <div className="grid gap-2">
            <Label htmlFor="graduationYear">Graduation Year *</Label>
            <Input
              id="graduationYear"
              placeholder="e.g., 2020"
              type="number"
              value={editUser.graduationYear}
              onChange={(e) => setEditUser({ ...editUser, graduationYear: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl">User Management</h2>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. The account will be pending until approved by admin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-4 bg-green-500 rounded-full" />
                  <h4 className="text-sm text-gray-700">Basic Information</h4>
                </div>

                {/* Profile Picture Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-gray-200">
                      {newUser.profilePicture ? (
                        <img
                          src={newUser.profilePicture}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gray-100 text-gray-500 text-xl">
                          {newUser.fullName ? newUser.fullName.split(' ').map((n: string) => n[0]).join('') : '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="profilePicture" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span className="text-sm font-medium">Upload Photo</span>
                      </div>
                    </Label>
                    <input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewUser({ ...newUser, profilePicture: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 2x2 inch photo (JPG, PNG)</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-4 bg-green-500 rounded-full" />
                  <h4 className="text-sm text-gray-700">Role & Access</h4>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="role">User Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Instructor">Instructor</SelectItem>
                      <SelectItem value="Alumni">Alumni</SelectItem>
                      <SelectItem value="Employer">Employer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Role-specific fields */}
              {newUser.role && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className="w-1 h-4 bg-green-500 rounded-full" />
                    <h4 className="text-sm text-gray-700">{newUser.role} Details</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {renderRoleSpecificFields()}
                  </div>
                </div>
              )}

              {/* Optional Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-4 bg-gray-300 rounded-full" />
                  <h4 className="text-sm text-gray-700">Optional Information</h4>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+63 912 345 6789"
                      value={newUser.phoneNumber}
                      onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-green-500 hover:bg-green-600" onClick={handleAddUser}>
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Users', count: users.length, color: 'text-green-600' },
          { label: 'Pending', count: pendingCount, color: 'text-yellow-600' },
          { label: 'Students', count: users.filter(u => u.role?.toLowerCase() === 'student').length, color: 'text-green-600' },
          { label: 'Instructors', count: users.filter(u => u.role?.toLowerCase() === 'instructor').length, color: 'text-blue-600' },
          { label: 'Alumni', count: users.filter(u => u.role?.toLowerCase() === 'alumni').length, color: 'text-lime-600' },
          { label: 'Employers', count: users.filter(u => u.role?.toLowerCase() === 'employer').length, color: 'text-cyan-600' },
        ].map((stat, index) => (
          <Card key={index} className="border-green-100">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl mt-1 ${stat.color}`}>{stat.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="instructor">Instructors</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="employer">Employers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <UserPlus className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle>Pending Approvals</CardTitle>
                  <p className="text-sm text-yellow-700 mt-1">
                    {pendingCount} user{pendingCount !== 1 ? 's' : ''} waiting for approval
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-yellow-300 hover:bg-yellow-100"
                onClick={() => setShowPendingSection(!showPendingSection)}
              >
                {showPendingSection ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showPendingSection && (
            <CardContent>
              <div className="grid gap-3">
                {paginatedPendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 transition-all"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullName || user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-yellow-100 text-yellow-700 text-xs sm:text-sm">
                            {(user.fullName || user.name)?.split(' ').map((n: string) => n[0]).join('') || ''}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{user.fullName || user.name}</p>
                          <Badge variant="secondary" className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{getPendingInfo(user)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8 sm:h-9 px-2 sm:px-3 min-h-[32px] sm:min-h-[36px]"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline ml-1">View</span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 h-8 sm:h-9 px-2 sm:px-3 min-h-[32px] sm:min-h-[36px]"
                        onClick={() => handleApproveClick(user)}
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline ml-1">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3 min-h-[32px] sm:min-h-[36px]"
                        onClick={() => handleRejectClick(user)}
                      >
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline ml-1">Reject</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for pending approvals */}
              {totalPendingPages > 1 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingPage(prev => Math.max(prev - 1, 1))}
                      disabled={pendingPage === 1}
                      className="text-gray-600 hover:text-gray-800 h-9 min-h-[36px] px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {pendingPage} of {totalPendingPages}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingPage(prev => Math.min(prev + 1, totalPendingPages))}
                      disabled={pendingPage === totalPendingPages}
                      className="text-gray-600 hover:text-gray-800 h-9 min-h-[36px] px-3"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto scrollbar-modern">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Role</TableHead>
                  <TableHead className="min-w-[120px]">Department</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.fullName || user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {(user.fullName || user.name)?.split(' ').map((n: string) => n[0]).join('') || ''}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{user.fullName || user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDisplayDepartment(user)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={getStatusBadgeColor(user.status)}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* ============================================================ */}
                          {/* TODO: BACKEND - User Actions */}
                          {/* ============================================================ */}
                          {/* View Details: Show full user information */}
                          {/* Approve/Reject: Only shown for pending users */}
                          {/* Send Email: Optional - trigger email notification */}
                          {/* Change Role: PATCH /api/users/:id { role: 'new_role' } */}
                          {/* Remove User: DELETE /api/users/:id */}
                          {/* ============================================================ */}
                          
                          {user.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleApproveClick(user)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Account
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleRejectClick(user)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Account
                              </DropdownMenuItem>
                              <div className="h-px bg-border my-1" />
                            </>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            View/Edit Details
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveUser(user.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const start = Math.max(1, currentPage - 2);
                    const end = Math.min(totalPages, currentPage + 2);
                    return page >= start && page <= end;
                  })
                  .map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {page}
                    </Button>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit User Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={(open) => {
        setIsViewDetailsOpen(open);
        if (!open) setIsEditMode(false); // Reset edit mode when closing
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit User' : 'User Details'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update user account information' : 'View and manage user account details'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              {/* User Header - Always Visible */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      {isEditMode ? (
                        editUser.profilePicture ? (
                          <img
                            src={editUser.profilePicture}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-green-100 text-green-700 text-xl">
                            {editUser.fullName ? editUser.fullName.split(' ').map((n: string) => n[0]).join('') : '?'}
                          </AvatarFallback>
                        )
                      ) : (
                        selectedUser.profilePicture ? (
                          <img
                            src={selectedUser.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-green-100 text-green-700 text-xl">
                            {selectedUser.name?.split(' ').map((n: string) => n[0]).join('') || ''}
                          </AvatarFallback>
                        )
                      )}
                    </Avatar>
                    {isEditMode && (
                      <Label htmlFor="editProfilePicture" className="absolute -bottom-1 -right-1 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </Label>
                    )}
                    <input
                      id="editProfilePicture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditUser({ ...editUser, profilePicture: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl">{isEditMode ? editUser.fullName : selectedUser.name}</h3>
                    <p className="text-gray-600">{isEditMode ? editUser.email : selectedUser.email}</p>
                  </div>
                </div>
                {!isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              
              {/* View Mode */}
              {!isEditMode && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <Badge variant="secondary" className={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant="secondary" className={getStatusBadgeColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{getPendingLabel(selectedUser)}</p>
                    <p>{getPendingInfo(selectedUser)}</p>
                  </div>
                  {selectedUser.phoneNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p>{selectedUser.phoneNumber}</p>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Address</p>
                      <p>{selectedUser.address}</p>
                    </div>
                  )}
                  {selectedUser.studentId && (
                    <div>
                      <p className="text-sm text-gray-600">Student ID</p>
                      <p>{selectedUser.studentId}</p>
                    </div>
                  )}
                  {selectedUser.year && (
                    <div>
                      <p className="text-sm text-gray-600">Course-Year and Section</p>
                      <p>{selectedUser.courseYrSection}</p>
                    </div>
                  )}
                  {selectedUser.employeeId && (
                    <div>
                      <p className="text-sm text-gray-600">Employee ID</p>
                      <p>{selectedUser.employeeId}</p>
                    </div>
                  )}
                  {selectedUser.companyName && (
                    <div>
                      <p className="text-sm text-gray-600">Company Name</p>
                      <p>{selectedUser.companyName}</p>
                    </div>
                  )}
                  {selectedUser.graduationYear && (
                    <div>
                      <p className="text-sm text-gray-600">Graduation Year</p>
                      <p>{selectedUser.graduationYear}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode */}
              {isEditMode && (
                <div className="grid gap-4">
                  {/* Basic Information */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-fullName">Full Name *</Label>
                      <Input
                        id="edit-fullName"
                        placeholder="John Doe"
                        value={editUser.fullName}
                        onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        placeholder="john.doe@university.edu"
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-role">Role *</Label>
                      <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                        <SelectTrigger id="edit-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Instructor">Instructor</SelectItem>
                          <SelectItem value="Alumni">Alumni</SelectItem>
                          <SelectItem value="Employer">Employer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(editUser.role.toLowerCase() === 'student' || editUser.role.toLowerCase() === 'instructor') && (
                      <div className="grid gap-2">
                        <Label htmlFor="edit-department">Department *</Label>
                        <Select value={editUser.department} onValueChange={(value) => setEditUser({ ...editUser, department: value })}>
                          <SelectTrigger id="edit-department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {editUser.role.toLowerCase() === 'student' ? (
                              <>
                                <SelectItem value="College">College</SelectItem>
                                <SelectItem value="Senior High">Senior High</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="Information Technology">Information Technology</SelectItem>
                                <SelectItem value="Business Administration">Business Administration</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Arts and Sciences">Arts and Sciences</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-status">Status *</Label>
                      <Select value={editUser.status} onValueChange={(value) => setEditUser({ ...editUser, status: value })}>
                        <SelectTrigger id="edit-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Role-specific fields */}
                  {renderEditRoleSpecificFields()}

                  {/* Optional fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                      <Input
                        id="edit-phoneNumber"
                        placeholder="+1 234 567 8900"
                        value={editUser.phoneNumber}
                        onChange={(e) => setEditUser({ ...editUser, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      placeholder="Enter address"
                      value={editUser.address}
                      onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {!isEditMode ? (
              <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button className="bg-green-500 hover:bg-green-600" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveUser} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve User Confirmation Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this user account? The user will be able to log in to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproveUser} className="bg-green-500 hover:bg-green-600">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject User Confirmation Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this user account? The account will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejectUser} className="bg-red-500 hover:bg-red-600">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}