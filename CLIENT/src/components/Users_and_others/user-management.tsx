import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Search, UserPlus, Filter, MoreVertical, Mail, Shield, Trash2, CheckCircle, XCircle, Edit } from "lucide-react";
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
}

// ============================================================
// TODO: BACKEND - Fetch users from database
// ============================================================
// Endpoint: GET /api/users?search={query}&role={role}&status={status}&page={page}&limit={limit}
// Headers: Authorization: Bearer {token}
// Response: { users: [], pagination: { total, page, limit, totalPages } }
//
// Example implementation:
/*
const fetchUsers = async (search = '', role = 'all', status = 'all', page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('token');
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
    
    if (!response.ok) throw new Error('Failed to fetch users');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
*/
// ============================================================

// ============================================================
// TODO: BACKEND - Create New User (Admin Manual Addition)
// ============================================================
// Endpoint: POST /api/users/create
// Headers: Authorization: Bearer {token}, Content-Type: application/json
// Request Body: {
//   email: string,
//   password: string,
//   fullName: string,
//   role: 'Student' | 'Instructor' | 'Staff' | 'Alumni' | 'Employer',
//   department: string,
//   // Role-specific fields:
//   studentId?: string,        // For Students
//   year?: string,             // For Students
//   employeeId?: string,       // For Instructors/Staff
//   companyName?: string,      // For Employers
//   graduationYear?: string,   // For Alumni
//   phoneNumber?: string,
//   address?: string
// }
// Response: { 
//   success: true, 
//   user: { id, email, fullName, role, status: 'pending', ... },
//   message: 'User created successfully. Account is pending approval.'
// }
// ============================================================

// ============================================================
// TODO: BACKEND - Approve User Account
// ============================================================
// Endpoint: PATCH /api/users/:id/approve
// Headers: Authorization: Bearer {token}
// Response: { success: true, user: {...}, message: 'User account approved' }
// Notes: 
// - Changes user status from 'pending' to 'active'
// - Sends email notification to user
// - User can now log in to the system
// ============================================================

// ============================================================
// TODO: BACKEND - Reject User Account
// ============================================================
// Endpoint: PATCH /api/users/:id/reject
// Headers: Authorization: Bearer {token}
// Request Body: { reason?: string }
// Response: { success: true, message: 'User account rejected' }
// Notes:
// - Changes user status to 'rejected' or deletes the user
// - Optionally sends email notification with rejection reason
// ============================================================

// ============================================================
// TODO: BACKEND - Update User Information
// ============================================================
// Endpoint: PATCH /api/users/:id
// Headers: Authorization: Bearer {token}, Content-Type: application/json
// Request Body: {
//   fullName?: string,
//   email?: string,
//   role?: 'Student' | 'Instructor' | 'Staff' | 'Alumni' | 'Employer',
//   department?: string,
//   status?: 'active' | 'pending' | 'inactive',
//   // Role-specific fields:
//   studentId?: string,
//   year?: string,
//   employeeId?: string,
//   companyName?: string,
//   graduationYear?: string,
//   phoneNumber?: string,
//   address?: string
// }
// Response: { 
//   success: true, 
//   user: { id, email, fullName, role, status, ... },
//   message: 'User updated successfully.'
// }
// ============================================================

// TEMPORARY: Mock data for development


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
    // Role-specific fields
    studentId: '',
    year: '',
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
    // Role-specific fields
    studentId: '',
    year: '',
    employeeId: '',
    companyName: '',
    graduationYear: ''
  });
  
  // Add a state for showing pending users section
  const [showPendingSection, setShowPendingSection] = useState(true);

  // State for remove user confirmation dialog
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<number | null>(null);

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

  // ============================================================
  // TODO: BACKEND - Replace local filter with API call
  // ============================================================
  // Call fetchUsers() whenever searchQuery, roleFilter, or statusFilter changes
  // Use useEffect hook to trigger API calls
  // Add loading state and error handling
  // ============================================================
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;

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

  const handleAddUser = async () => {
    // Validation
    if (!newUser.fullName || !newUser.email || !newUser.password || !newUser.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate department based on role and year
    if (newUser.role.toLowerCase() === 'student') {
      if (!newUser.year) {
        toast.error('Please select a year level');
        return;
      }
      
      // Auto-set department based on year
      const year = newUser.year;
      
      // Check for Senior High strands (ABM, HUMSS, STEM, ICT) with grade levels
      const seniorHighStrands = ['ABM', 'HUMSS', 'STEM', 'ICT'];
      const isSeniorHigh = seniorHighStrands.some(strand =>
        year.includes(strand) &&
        (year.includes('11') || year.includes('12'))
      );
      
      // Check for College courses (BSIT, BSBA, BSCS, BSEN, BSOA, BSAIS, BTVTEd)
      const collegeCourses = ['BSIT', 'BSBA', 'BSCS', 'BSEN', 'BSOA', 'BSAIS', 'BTVTEd'];
      const isCollege = collegeCourses.some(course =>
        year.includes(course)
      );
      
      if (isSeniorHigh) {
        newUser.department = 'Senior High';
      } else if (isCollege) {
        newUser.department = 'College';
      } else {
        // Default to College if no specific pattern is matched
        newUser.department = 'College';
      }
    } else if (!newUser.department) {
      toast.error('Please fill in the department field');
      return;
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
        // Role-specific fields
        ...(newUser.role.toLowerCase() === 'student' && {
          studentId: newUser.studentId,
          year: newUser.year
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
        studentId: '',
        year: '',
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

  const handleUpdateUser = () => {
    // ============================================================
    // TODO: BACKEND - Call PATCH /api/users/:id endpoint
    // ============================================================
    // Send editUser data to backend with editingUserId
    // On success: Update user in list
    // Show success toast
    // Close dialog
    // ============================================================
    
    // Validation
    if (!editUser.fullName || !editUser.email || !editUser.role || !editUser.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Mock implementation - Update user locally
    setUsers(users.map(user =>
      user.id === editingUserId
        ? {
            ...user,
            name: editUser.fullName,
            email: editUser.email,
            role: editUser.role,
            department: editUser.department,
            status: editUser.status,
            ...(editUser.studentId && { studentId: editUser.studentId }),
            ...(editUser.year && { year: editUser.year }),
            ...(editUser.employeeId && { employeeId: editUser.employeeId }),
            ...(editUser.companyName && { companyName: editUser.companyName }),
            ...(editUser.graduationYear && { graduationYear: editUser.graduationYear }),
          }
        : user
    ));
    
    toast.success('User updated successfully');
    setIsEditUserOpen(false);
    setEditingUserId(null);
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
      studentId: user.studentId || '',
      year: user.year || '',
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
      studentId: user.studentId || '',
      year: user.year || '',
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
        // Role-specific fields
        ...(editUser.role.toLowerCase() === 'student' && {
          studentId: editUser.studentId,
          year: editUser.year
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
        studentId: selectedUser.studentId || '',
        year: selectedUser.year || '',
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
                placeholder="e.g., 2024-0001"
                value={newUser.studentId}
                onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year Level *</Label>
              <Select value={newUser.year} onValueChange={(value) => setNewUser({ ...newUser, year: value })}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'Instructor':
      case 'Staff':
        return (
          <div className="grid gap-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <Input
              id="employeeId"
              placeholder={newUser.role === 'Instructor' ? 'e.g., INS-001' : 'e.g., STF-001'}
              value={newUser.employeeId}
              onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
            />
          </div>
        );
      case 'Employer':
        return (
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              placeholder="e.g., Tech Corp Inc."
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
              placeholder="e.g., 2020"
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
              <Label htmlFor="year">Year Level *</Label>
              <Select value={editUser.year} onValueChange={(value) => setEditUser({ ...editUser, year: value })}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'Instructor':
      case 'Staff':
        return (
          <div className="grid gap-2">
            <Label htmlFor="employeeId">Employee ID *</Label>
            <Input
              id="employeeId"
              placeholder={editUser.role === 'Instructor' ? 'e.g., INS-001' : 'e.g., STF-001'}
              value={editUser.employeeId}
              onChange={(e) => setEditUser({ ...editUser, employeeId: e.target.value })}
            />
          </div>
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
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@university.edu"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      placeholder="e.g., Computer Science"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    />
                  </div>
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
                      <SelectItem value="Staff">Department Staff</SelectItem>
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
                      placeholder="+1 234 567 8900"
                      value={newUser.phoneNumber}
                      onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter address"
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
                {users.filter(u => u.status === 'pending').map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-yellow-200 hover:border-yellow-300 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-yellow-100 text-yellow-700">
                          {user.name?.split(' ').map((n: string) => n[0]).join('') || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p>{user.name}</p>
                          <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{getDisplayDepartment(user)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleRejectUser(user.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {user.name?.split(' ').map((n: string) => n[0]).join('') || ''}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
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
                                onClick={() => handleApproveUser(user.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Account
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleRejectUser(user.id)}
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
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-green-100 text-green-700 text-xl">
                      {selectedUser.name?.split(' ').map((n: string) => n[0]).join('') || ''}
                    </AvatarFallback>
                  </Avatar>
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
                    <p className="text-sm text-gray-600">Department</p>
                    <p>{getDisplayDepartment(selectedUser)}</p>
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
                      <p className="text-sm text-gray-600">Year Level</p>
                      <p>{selectedUser.year}</p>
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
                          <SelectItem value="Staff">Department Staff</SelectItem>
                          <SelectItem value="Alumni">Alumni</SelectItem>
                          <SelectItem value="Employer">Employer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-department">Department *</Label>
                      <Input
                        id="edit-department"
                        placeholder="e.g., Computer Science"
                        value={editUser.department}
                        onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                      />
                    </div>
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
    </div>
  );
}