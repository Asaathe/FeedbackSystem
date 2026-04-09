import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Search, UserPlus, Filter, MoreVertical, Trash2, CheckCircle, XCircle, Edit, ChevronLeft, ChevronRight, X, Upload, Info } from "lucide-react";
import { formatImageUrl } from "../../utils/imageUtils";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui/tabs";
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
  // Program-related fields (from students table + course_management join)
  program_id?: number;
  program_name?: string;
  program_code?: string;
  year_level?: number;
  section?: string;
  courseYrSection?: string;
  display_label?: string;
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
  schoolRole?: string;
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
  
  // Programs list for dropdown
  const [programs, setPrograms] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  // Fetch programs from API
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoadingPrograms(true);
      try {
        const response = await fetch('/api/programs');
        const data = await response.json();
        
        if (data.success && data.programs) {
          const options = data.programs.map((program: any) => ({
            value: String(program.id),
            label: program.course_section,
          }));
          setPrograms(options);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, []);
  
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
    program_id: '',
    employeeId: '',
    companyName: '',
    graduationYear: '',
    schoolRole: ''
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
    program_id: '',
    employeeId: '',
    companyName: '',
    graduationYear: '',
    schoolRole: ''
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

  // Active tab state for role-based filtering
  type UserRoleTab = 'all' | 'student' | 'instructor' | 'alumni';
  const [activeTab, setActiveTab] = useState<UserRoleTab>('all');

  // Memoized tab counts for performance
  const tabCounts = useMemo(() => ({
    all: users.length,
    student: users.filter(u => u.role?.toLowerCase() === 'student').length,
    instructor: users.filter(u => u.role?.toLowerCase() === 'instructor').length,
    alumni: users.filter(u => u.role?.toLowerCase() === 'alumni').length,
  }), [users]);

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

      const response = await fetch(`/api/users?${params}`, {
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

  
  // Helper function to extract surname from full name (ignoring suffixes like Jr., Sr., II, III, IV)
  const getSurname = (fullName: string | undefined): string => {
    if (!fullName) return '';
    
    // List of suffixes to remove for proper alphabetical sorting
    const suffixes = ['jr.', 'jr', 'sr.', 'sr', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
    
    // First, normalize the name to lowercase for comparison
    let nameToProcess = fullName.toLowerCase().trim();
    
    // Handle "Lastname, Firstname" format
    if (nameToProcess.includes(',')) {
      const parts = nameToProcess.split(',');
      let surname = parts[0].trim();
      
      // Remove any suffix from the surname
      const surnameParts = surname.split(/\s+/);
      const cleanParts = surnameParts.filter(part => !suffixes.includes(part));
      return cleanParts.join(' ');
    }
    
    // Handle "Firstname Lastname" format - extract last word as surname, ignoring suffixes
    const parts = nameToProcess.split(/\s+/);
    
    // Filter out suffixes from the entire name first
    const cleanParts = parts.filter(part => !suffixes.includes(part));
    
    // Now get the last word (surname) from the cleaned parts
    return cleanParts[cleanParts.length - 1] || '';
  };

  const filteredUsers = users
    .filter(user => {
      // Filter by active tab (role)
      const matchesTab = activeTab === 'all' || (user.role?.toLowerCase() || '') === activeTab.toLowerCase();
      const matchesSearch = (user.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || (user.role?.toLowerCase() || '') === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || (user.status?.toLowerCase() || '') === statusFilter.toLowerCase();
      return matchesTab && matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => getSurname(a.fullName).localeCompare(getSurname(b.fullName)));

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = users.filter(u => u.status === 'pending').length;

  // Pending users pagination
  const pendingUsers = users
    .filter(u => u.status === 'pending')
    .sort((a, b) => getSurname(a.fullName).localeCompare(getSurname(b.fullName)));
  const totalPendingPages = Math.ceil(pendingUsers.length / pendingItemsPerPage);
  const paginatedPendingUsers = pendingUsers.slice((pendingPage - 1) * pendingItemsPerPage, pendingPage * pendingItemsPerPage);

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'instructor': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      case 'alumni': return 'bg-lime-100 text-lime-700';
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
      // Use the department from course_management join
      return user.department || 'Not Assigned';
    } else if (user.role?.toLowerCase() === 'instructor') {
      return user.department || 'Not Assigned';
    } else {
      return user.department || 'N/A';
    }
  };

  const getPendingInfo = (user: any) => {
    const role = user.role?.toLowerCase();
    if (role === 'student') {
      // Use course_section from course_management join
      return user.courseYrSection || 'Not Assigned';
    } else if (role === 'instructor') {
      return user.department || 'Not Assigned';
    } else if (role === 'alumni') {
      return user.degree || 'N/A';
    } else {
      return user.department || 'N/A';
    }
  };

  const getPendingLabel = (user: any) => {
    const role = user.role?.toLowerCase();
    if (role === 'student') {
      return 'Course and Section';
    } else if (role === 'instructor') {
      return 'Department';
    } else if (role === 'alumni') {
      return 'Degree';
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
      if (!newUser.program_id) {
        toast.error('Please select a program');
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
    } else if (newUser.role.toLowerCase() === 'alumni') {
      if (!newUser.graduationYear) {
        toast.error('Please fill in the graduation year');
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
          program_id: newUser.program_id ? parseInt(newUser.program_id) : null
        }),
        ...(newUser.role.toLowerCase() === 'instructor' && {
          employeeId: newUser.employeeId,
          schoolRole: newUser.schoolRole || undefined
        }),
        ...(newUser.role.toLowerCase() === 'staff' && {
          employeeId: newUser.employeeId
        }),
        ...(newUser.role.toLowerCase() === 'alumni' && {
          graduationYear: newUser.graduationYear
        })
      };

      const response = await fetch('/api/users/create', {
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
      setIsAddUserOpen(false);

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
        program_id: '',
        employeeId: '',
        companyName: '',
        graduationYear: '',
        schoolRole: ''
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
      const response = await fetch(`/api/users/${userId}/approve`, {
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
      const response = await fetch(`/api/users/${userId}/reject`, {
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
      program_id: user.program_id ? String(user.program_id) : (user.program_id === 0 ? '0' : ''),
      employeeId: user.employeeId || '',
      companyName: user.companyName || '',
      graduationYear: user.graduationYear || '',
      schoolRole: user.schoolRole || ''
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
      program_id: user.program_id ? String(user.program_id) : (user.program_id === 0 ? '0' : ''),
      employeeId: user.employeeId || '',
      companyName: user.companyName || '',
      graduationYear: user.graduationYear || '',
      schoolRole: user.schoolRole || ''
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
          program_id: editUser.program_id ? parseInt(editUser.program_id) : null
        }),
        ...(editUser.role.toLowerCase() === 'instructor' && {
          instructorId: editUser.employeeId,
          schoolRole: editUser.schoolRole || undefined
        }),
        ...(editUser.role.toLowerCase() === 'staff' && {
          employeeId: editUser.employeeId
        }),
        ...(editUser.role.toLowerCase() === 'alumni' && {
          graduationYear: editUser.graduationYear
        })
      };

      const response = await fetch(`/api/users/${editingUserId}`, {
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
      setIsViewDetailsOpen(false);
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
        program_id: selectedUser.program_id ? String(selectedUser.program_id) : '',
        employeeId: selectedUser.employeeId || '',
        companyName: selectedUser.companyName || '',
        graduationYear: selectedUser.graduationYear || '',
        schoolRole: selectedUser.schoolRole || ''
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
      
      const response = await fetch(`/api/users/${userToRemove}`, {
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
            <div className="grid gap-1.5">
              <Label htmlFor="studentId" className="text-xs font-medium text-gray-600">Student ID <span className="text-red-500">*</span></Label>
              <Input
                id="studentId"
                placeholder="Student ID"
                value={newUser.studentId}
                onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="course_year_section" className="text-xs font-medium text-gray-600">Program <span className="text-red-500">*</span></Label>
              <Select 
                value={newUser.program_id} 
                onValueChange={(value) => setNewUser({ ...newUser, program_id: value })}
              >
                <SelectTrigger id="course_year_section" className="h-10 border-gray-200 focus:border-green-500">
                  <SelectValue placeholder={isLoadingPrograms ? "Loading..." : "Select program"} />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="department" className="text-xs font-medium text-gray-600">Department <span className="text-red-500">*</span></Label>
              <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                <SelectTrigger id="department" className="h-10 border-gray-200 focus:border-green-500">
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
            <div className="grid gap-1.5">
              <Label htmlFor="employeeId" className="text-xs font-medium text-gray-600">Employee ID <span className="text-red-500">*</span></Label>
              <Input
                id="employeeId"
                placeholder="Employee ID"
                value={newUser.employeeId}
                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="department" className="text-xs font-medium text-gray-600">Department <span className="text-red-500">*</span></Label>
              <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                <SelectTrigger id="department" className="h-10 border-gray-200 focus:border-green-500">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senior High">Senior High</SelectItem>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="schoolRole" className="text-xs font-medium text-gray-600">School Role</Label>
              <Input
                id="schoolRole"
                placeholder="e.g., IT Instructor"
                value={newUser.schoolRole}
                onChange={(e) => setNewUser({ ...newUser, schoolRole: e.target.value })}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </>
        );
      case 'Alumni':
        return (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="graduationYear" className="text-xs font-medium text-gray-600">Graduation Year <span className="text-red-500">*</span></Label>
            <Input
              id="graduationYear"
              type="number"
              placeholder="Year"
              value={newUser.graduationYear}
              onChange={(e) => setNewUser({ ...newUser, graduationYear: e.target.value })}
              className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderEditRoleSpecificFields = () => {
    // Convert role to lowercase for comparison since API returns lowercase roles
    const role = editUser.role?.toLowerCase() || '';
    switch (role) {
      case 'student':
        return (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="studentId" className="text-xs font-medium text-gray-600">Student ID <span className="text-red-500">*</span></Label>
              <Input
                id="studentId"
                placeholder="Student ID"
                value={editUser.studentId}
                onChange={(e) => setEditUser({ ...editUser, studentId: e.target.value })}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="course_year_section" className="text-xs font-medium text-gray-600">Program <span className="text-red-500">*</span></Label>
              <Select 
                value={editUser.program_id} 
                onValueChange={(value) => setEditUser({ ...editUser, program_id: value })}
              >
                <SelectTrigger id="course_year_section" className="h-10 border-gray-200 focus:border-green-500">
                  <SelectValue placeholder={isLoadingPrograms ? "Loading..." : "Select program"} />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="department" className="text-xs font-medium text-gray-600">Department <span className="text-red-500">*</span></Label>
              <Select value={editUser.department} onValueChange={(value) => setEditUser({ ...editUser, department: value })}>
                <SelectTrigger id="department" className="h-10 border-gray-200 focus:border-green-500">
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
      case 'instructor':
        return (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="employeeId" className="text-xs font-medium text-gray-600">Employee ID <span className="text-red-500">*</span></Label>
              <Input
                id="employeeId"
                placeholder="e.g., INS-001"
                value={editUser.employeeId}
                onChange={(e) => setEditUser({ ...editUser, employeeId: e.target.value })}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="department" className="text-xs font-medium text-gray-600">Department <span className="text-red-500">*</span></Label>
              <Select value={editUser.department} onValueChange={(value) => setEditUser({ ...editUser, department: value })}>
                <SelectTrigger id="department" className="h-10 border-gray-200 focus:border-green-500">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Senior High">Senior High</SelectItem>
                  <SelectItem value="College">College</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="schoolRole" className="text-xs font-medium text-gray-600">School Role</Label>
              <Input
                id="schoolRole"
                placeholder="e.g., IT Instructor, DEAN, Program Head"
                value={editUser.schoolRole}
                onChange={(e) => setEditUser({ ...editUser, schoolRole: e.target.value })}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </>
        );
      case 'alumni':
        return (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="graduationYear" className="text-xs font-medium text-gray-600">Graduation Year <span className="text-red-500">*</span></Label>
            <Input
              id="graduationYear"
              placeholder="Year"
              type="number"
              value={editUser.graduationYear}
              onChange={(e) => setEditUser({ ...editUser, graduationYear: e.target.value })}
              className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
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
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl">User Management</h2>
            <p className="text-gray-600 mt-1">Manage system users and permissions</p>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-ghost">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                Add New User
              </DialogTitle>
              <DialogDescription>
                Create a new user account. The account will be pending until approved by admin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-green-50/50 to-lime-50/50 rounded-xl border border-green-100">
                <div className="relative group flex-shrink-0">
                  <Avatar className="w-20 h-20 border-4 border-green-200 shadow-md">
                    {newUser.profilePicture ? (
                      <img
                        src={formatImageUrl(newUser.profilePicture)}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-green-100 to-lime-100 text-green-600 text-xl font-semibold">
                        {newUser.fullName ? newUser.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {newUser.profilePicture && (
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, profilePicture: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('Image size must be less than 2MB');
                          return;
                        }
                        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
                          toast.error('Only JPG, PNG, and WebP images are allowed');
                          return;
                        }
                        try {
                          const token = sessionStorage.getItem('authToken');
                          const formData = new FormData();
                          formData.append('image', file);
                          const roleParam = `?role=${encodeURIComponent(newUser.role || 'profiles')}`;
                          const response = await fetch(`/api/users/upload-profile-image${roleParam}`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData,
                          });
                          const result = await response.json();
                          if (result.success) {
                            setNewUser({ ...newUser, profilePicture: result.imageUrl });
                            toast.success('Profile photo uploaded');
                          } else {
                            toast.error(result.message || 'Failed to upload image');
                          }
                        } catch (error) {
                          console.error('Error uploading image:', error);
                          toast.error('Failed to upload image');
                        }
                      }
                    }}
                  />
                  <Label htmlFor="profilePicture" className="cursor-pointer inline-flex">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </div>
                  </Label>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    JPG, PNG, WebP - Max 2MB
                  </p>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">Personal Information</h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 pl-10">
                  <div className="grid gap-1.5">
                    <Label htmlFor="fullName" className="text-xs font-medium text-gray-600">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="fullName"
                      placeholder="Full name"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@address.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5 sm:grid-cols-2 pl-10">
                  <div className="grid gap-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-gray-600">Password <span className="text-red-500">*</span></Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="phoneNumber" className="text-xs font-medium text-gray-600">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+63"
                      value={newUser.phoneNumber}
                      onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                      className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5 pl-10">
                  <Label htmlFor="address" className="text-xs font-medium text-gray-600">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Address"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    rows={2}
                    className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                  />
                </div>
              </div>

              {/* Role Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">User Role <span className="text-red-500">*</span></h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pl-10">
                  {[
                    { value: 'Student', label: 'Student', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z', desc: 'Current students' },
                    { value: 'Instructor', label: 'Instructor', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', desc: 'Faculty and staff members' },
                    { value: 'Alumni', label: 'Alumni', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', desc: 'Graduated students' }
                  ].map((role) => (
                    <label
                      key={role.value}
                      className={`relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        newUser.role === role.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={newUser.role === role.value}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="sr-only"
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        newUser.role === role.value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={role.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          newUser.role === role.value ? 'text-green-700' : 'text-gray-700'
                        }`}>{role.label}</p>
                        <p className="text-xs text-gray-500 truncate">{role.desc}</p>
                      </div>
                      {newUser.role === role.value && (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Role-specific fields */}
              {newUser.role && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">{newUser.role} Details</h4>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 pl-10">
                    {renderRoleSpecificFields()}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)} className="border-gray-300 hover:bg-gray-50">
                Cancel
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 px-6" onClick={handleAddUser}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', count: users.length, color: 'text-green-600' },
          { label: 'Pending', count: pendingCount, color: 'text-yellow-600' },
          { label: 'Students', count: users.filter(u => u.role?.toLowerCase() === 'student').length, color: 'text-green-600' },
          { label: 'Instructors', count: users.filter(u => u.role?.toLowerCase() === 'instructor').length, color: 'text-blue-600' },
          { label: 'Alumni', count: users.filter(u => u.role?.toLowerCase() === 'alumni').length, color: 'text-lime-600' },
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
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row gap-3">
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
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Pending Approvals</CardTitle>
                  <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                    {pendingCount} user{pendingCount !== 1 ? 's' : ''} waiting for approval
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowPendingSection(!showPendingSection)}>
                    {showPendingSection ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Info className="mr-2 h-4 w-4" />
                        Show Details
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          {showPendingSection && (
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {paginatedPendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 transition-all"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        {user.profilePicture ? (
                          <img
                            src={formatImageUrl(user.profilePicture)}
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
                        <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{user.fullName || user.name}</p>
                          <Badge variant="secondary" className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{getPendingInfo(user)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 h-8 sm:h-9 px-2 sm:px-3 min-h-[32px] sm:min-h-[36px] flex-1 sm:flex-none"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline ml-1">View</span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 h-8 sm:h-9 px-2 sm:px-3 min-h-[32px] sm:min-h-[36px] flex-1 sm:flex-none"
                        onClick={() => handleApproveClick(user)}
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline ml-1">Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-8 sm:h-9 px-2 sm:px-3 min-h-[32px] sm:min-h-[36px] flex-1 sm:flex-none"
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

      {/* Tab Bar and Table wrapped in Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRoleTab)} className="w-full">
        {/* Tab Bar - Separated from Table */}
        <div className="mb-4">
              <TabsList className="flex w-full bg-gray-100/80 p-1 gap-1 border-2 border-green-100 rounded-md">
                <TabsTrigger 
                  value="all" 
                  className="flex-1 hover:bg-green-50 hover:text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="student" 
                  className="flex-1 hover:bg-green-50 hover:text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Students
                </TabsTrigger>
                <TabsTrigger 
                  value="instructor" 
                  className="flex-1 hover:bg-green-50 hover:text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Instructors
                </TabsTrigger>
                <TabsTrigger 
                  value="alumni" 
                  className="flex-1 hover:bg-green-50 hover:text-green-700 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 rounded-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  Alumni
                </TabsTrigger>
                
            </TabsList>
        </div>

        {/* Users Table */}
        <Card className="border-green-100">
          <CardContent className="p-4">
              <div className="mt-0">
              <div className="overflow-x-auto scrollbar-modern">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Role</TableHead>
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
                              src={formatImageUrl(user.profilePicture)}
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
                        <DropdownMenuContent align="end" className="w-48">
                          {user.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                onClick={() => handleApproveClick(user)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Account
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleRejectClick(user)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Account
                              </DropdownMenuItem>
                              <div className="h-px bg-border my-1" />
                            </>
                          )}
                          
                          <DropdownMenuItem className="focus:bg-gray-50" onClick={() => handleViewDetails(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            View/Edit Details
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleRemoveUser(user.id)}>
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
              </div>
            </CardContent>
      </Card>
      </Tabs>

      {/* View/Edit User Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={(open) => {
        setIsViewDetailsOpen(open);
        if (!open) setIsEditMode(false); // Reset edit mode when closing
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-ghost">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? (
                <Edit className="w-5 h-5 text-green-600" />
              ) : (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              )}
              {isEditMode ? 'Edit User' : 'User Details'}
            </DialogTitle>
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
                    <Avatar className="w-20 h-20 border-4 border-green-100 shadow-md">
                      {isEditMode ? (
                        editUser.profilePicture ? (
                          <img
                            src={formatImageUrl(editUser.profilePicture)}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-green-50 to-lime-50 text-green-600 text-xl font-semibold">
                            {editUser.fullName ? editUser.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?'}
                          </AvatarFallback>
                        )
                      ) : (
                        selectedUser.profilePicture ? (
                          <img
                            src={formatImageUrl(selectedUser.profilePicture)}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-green-50 to-lime-50 text-green-600 text-xl font-semibold">
                            {selectedUser.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '?'}
                          </AvatarFallback>
                        )
                      )}
                    </Avatar>
                    {isEditMode && (
                      <>
                        <Label htmlFor="editProfilePicture" className="absolute -bottom-1 -right-1 cursor-pointer bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-lg transition-colors">
                          <Upload className="w-4 h-4" />
                        </Label>
                        {editUser.profilePicture && (
                          <button
                            type="button"
                            onClick={() => setEditUser({ ...editUser, profilePicture: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                    <input
                      id="editProfilePicture"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file size (max 2MB)
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error('Image size must be less than 2MB');
                            return;
                          }
                          // Validate file type
                          if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
                            toast.error('Only JPG, PNG, and WebP images are allowed');
                            return;
                          }
                          
                          // Upload file to server
                          try {
                            const token = sessionStorage.getItem('authToken');
                            const formData = new FormData();
                            formData.append('image', file);
                            
                            // Send role as query parameter for proper folder routing
                            const roleParam = `?role=${encodeURIComponent(editUser.role || 'profiles')}`;
                            
                            const response = await fetch(`/api/users/upload-profile-image${roleParam}`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                              body: formData,
                            });
                            
                            const result = await response.json();
                            
                            if (result.success) {
                              setEditUser({ ...editUser, profilePicture: result.imageUrl });
                              toast.success('Profile photo uploaded successfully');
                            } else {
                              toast.error(result.message || 'Failed to upload image');
                            }
                          } catch (error) {
                            console.error('Error uploading image:', error);
                            toast.error('Failed to upload image');
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{isEditMode ? editUser.fullName : selectedUser.name}</h3>
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
                  
                  {/* Role-specific fields for Students */}
                  {selectedUser.role?.toLowerCase() === 'student' && (
                    <>
                      {selectedUser.studentId && (
                        <div>
                          <p className="text-sm text-gray-600">Student ID</p>
                          <p className="font-medium">{selectedUser.studentId}</p>
                        </div>
                      )}
                      {(selectedUser.program_name || selectedUser.courseYrSection) && (
                        <div>
                          <p className="text-sm text-gray-600">Program / Course</p>
                          <p className="font-medium">{selectedUser.program_name || selectedUser.courseYrSection}</p>
                        </div>
                      )}
                      {selectedUser.department && (
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium">{selectedUser.department}</p>
                        </div>
                      )}
                      {selectedUser.year_level && (
                        <div>
                          <p className="text-sm text-gray-600">Year Level</p>
                          <p className="font-medium">{selectedUser.year_level}</p>
                        </div>
                      )}
                      {selectedUser.section && (
                        <div>
                          <p className="text-sm text-gray-600">Section</p>
                          <p className="font-medium">{selectedUser.section}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Role-specific fields for Instructors */}
                  {selectedUser.role?.toLowerCase() === 'instructor' && (
                    <>
                      {selectedUser.employeeId && (
                        <div>
                          <p className="text-sm text-gray-600">Employee ID</p>
                          <p className="font-medium">{selectedUser.employeeId}</p>
                        </div>
                      )}
                      {selectedUser.department && (
                        <div>
                          <p className="text-sm text-gray-600">Department</p>
                          <p className="font-medium">{selectedUser.department}</p>
                        </div>
                      )}
                      {selectedUser.schoolRole && (
                        <div>
                          <p className="text-sm text-gray-600">School Role</p>
                          <p className="font-medium">{selectedUser.schoolRole}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Role-specific fields for Alumni */}
                  {selectedUser.role?.toLowerCase() === 'alumni' && (
                    <>
                      {selectedUser.graduationYear && (
                        <div>
                          <p className="text-sm text-gray-600">Graduation Year</p>
                          <p className="font-medium">{selectedUser.graduationYear}</p>
                        </div>
                      )}
                      {selectedUser.degree && (
                        <div>
                          <p className="text-sm text-gray-600">Degree</p>
                          <p className="font-medium">{selectedUser.degree}</p>
                        </div>
                      )}
                      {selectedUser.companyName && (
                        <div>
                          <p className="text-sm text-gray-600">Current Company</p>
                          <p className="font-medium">{selectedUser.companyName}</p>
                        </div>
                      )}
                      {selectedUser.industry && (
                        <div>
                          <p className="text-sm text-gray-600">Industry</p>
                          <p className="font-medium">{selectedUser.industry}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Common fields */}
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
                  {selectedUser.createdAt && (
                    <div>
                      <p className="text-sm text-gray-600">Account Created</p>
                      <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode */}
              {isEditMode && (
                <div className="space-y-6 py-4">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800">Personal Information</h4>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 pl-10">
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-fullName" className="text-xs font-medium text-gray-600">Full Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-fullName"
                          placeholder="John Doe"
                          value={editUser.fullName}
                          onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                          className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-email" className="text-xs font-medium text-gray-600">Email Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="edit-email"
                          type="email"
                          placeholder="john.doe@university.edu"
                          value={editUser.email}
                          onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                          className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800">Role & Access</h4>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pl-10">
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-role" className="text-xs font-medium text-gray-600">User Role <span className="text-red-500">*</span></Label>
                        <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                          <SelectTrigger id="edit-role" className="h-10 border-gray-200 focus:border-green-500">
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Instructor">Instructor</SelectItem>
                            <SelectItem value="Alumni">Alumni</SelectItem>
                            <SelectItem value="Employer">Employer</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-status" className="text-xs font-medium text-gray-600">Status <span className="text-red-500">*</span></Label>
                        <Select value={editUser.status} onValueChange={(value) => setEditUser({ ...editUser, status: value })}>
                          <SelectTrigger id="edit-status" className="h-10 border-gray-200 focus:border-green-500">
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
                  </div>

                  {/* Role-specific fields */}
                  {editUser.role && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-800">{editUser.role} Details</h4>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 pl-10">
                        {renderEditRoleSpecificFields()}
                      </div>
                    </div>
                  )}

                  {/* Optional Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800">Optional Information</h4>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 pl-10">
                      <div className="grid gap-1.5">
                        <Label htmlFor="edit-phoneNumber" className="text-xs font-medium text-gray-600">Phone Number</Label>
                        <Input
                          id="edit-phoneNumber"
                          placeholder="+63 912 345 6789"
                          value={editUser.phoneNumber}
                          onChange={(e) => setEditUser({ ...editUser, phoneNumber: e.target.value })}
                          className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5 pl-10">
                      <Label htmlFor="edit-address" className="text-xs font-medium text-gray-600">Address</Label>
                      <Textarea
                        id="edit-address"
                        placeholder="Enter address"
                        value={editUser.address}
                        onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                        rows={2}
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                      />
                    </div>
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
