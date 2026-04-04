import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "../ui/alert-dialog";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  UserPlus,
  UserMinus,
  Loader2,
  GraduationCap,
  User,
  UsersRound,
  Check,
  X,
  School,
  Clock,
  Mail,
  BookA,
  Eye,
  MoreHorizontal
} from "lucide-react";
import {
  getSubjects,
  getPrograms,
  getSubjectOfferings,
  createSubjectOffering,
  updateSubjectOffering,
  deleteSubjectOffering,
  getSubjectOfferingStudents,
  getAvailableInstructors,
  SubjectOffering,
} from "../../services/subjectService";

const API_BASE_URL = "/api";

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  status?: string;
}

interface Program {
  id: number;
  program_code: string;
  program_name: string;
  year_level: number;
  section: string;
  department: string;
}

interface CourseSection {
  value: string;
  program_id: number;
  department: string;
  program_code: string;
  year_level: number;
  section: string;
}

interface SystemSettings {
  current_semester: string;
  current_academic_year: string;
  current_period_id: number | null;
  department: string;
}

// Separate settings for College and Senior High
interface AcademicPeriodSettings {
  college: SystemSettings;
  seniorHigh: SystemSettings;
}

interface OfferingStudent {
  user_id: number;
  full_name: string;
  email: string;
  studentID: string;
  year_level: number;
  program_code: string;
  program_name: string;
}

export function SubjectOfferings() {
  const [offerings, setOfferings] = useState<SubjectOffering[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [systemSettings, setSystemSettings] = useState<AcademicPeriodSettings>({
    college: {
      current_semester: "1st",
      current_academic_year: "2025-2026",
      current_period_id: null,
      department: "College",
    },
    seniorHigh: {
      current_semester: "1st",
      current_academic_year: "2025-2026",
      current_period_id: null,
      department: "Senior High",
    },
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAcademicYear, setFilterAcademicYear] = useState("2025-2026");
  const [filterSemester, setFilterSemester] = useState("1st");
    
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewStudentsDialogOpen, setViewStudentsDialogOpen] = useState(false);
  
  // Selected items
  const [selectedOffering, setSelectedOffering] = useState<SubjectOffering | null>(null);
  const [offeringStudents, setOfferingStudents] = useState<OfferingStudent[]>([]);
  
  // Available instructors
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
    
  // Form states
  const [formData, setFormData] = useState({
    subject_id: "",
    program_id: "",
    course_section: "",
    academic_year: "",
    semester: "",
    instructor_id: "",
  });
  
  // Track selected department for settings
  const [selectedDepartment, setSelectedDepartment] = useState<string>("College");
  // Active tab for filtering offerings
  const [activeTab, setActiveTab] = useState<string>("college");
    
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (viewStudentsDialogOpen && selectedOffering) {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const result = await getSubjectOfferingStudents(selectedOffering.id.toString());
          if (result.success) {
            setOfferingStudents(result.students || []);
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          console.error("Error loading students:", error);
          toast.error("Failed to load students");
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [viewStudentsDialogOpen, selectedOffering?.id]);

  useEffect(() => {
    // Load system settings first, then load data
    // Only run on mount - department changes are handled by the separate useEffect
    loadSystemSettings().then((settings) => {
      loadData();
    }).catch(() => {
      loadData();
    });
  }, []); // Empty dependency array - only run once on mount

  // Fetch period ID when department changes and reload data
  useEffect(() => {
    const fetchPeriodForDepartment = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await fetch(`${API_BASE_URL}/settings/semester-status?department=${selectedDepartment}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        
        let newSettings;
        if (result.success && result.current_period) {
          // Create the new settings object
          const key = selectedDepartment === "College" ? "college" : "seniorHigh";
          newSettings = {
            ...systemSettings,
            [key]: {
              ...systemSettings[key],
              current_period_id: result.current_period.id
            }
          };
          setSystemSettings(newSettings);
        }
        
        // Use new settings if available, otherwise use current state
        const deptKey = selectedDepartment === "College" ? "college" : "seniorHigh";
        const deptSettings = newSettings ? newSettings[deptKey] : systemSettings[deptKey];
        
        // Reload data with the correct settings
        loadData(deptSettings);
      } catch (error) {
        console.error("Error fetching period for department:", error);
        // Still reload data even if period fetch fails
        loadData();
      }
    };
    
    fetchPeriodForDepartment();
  }, [selectedDepartment]);

  const loadData = async (deptSettingsOverride?: typeof systemSettings.college) => {
    setLoading(true);
    try {
      // Use override if provided (for race condition fix), otherwise use state
      const deptSettings = deptSettingsOverride || (
        selectedDepartment === "College" 
          ? systemSettings.college 
          : systemSettings.seniorHigh
      );
      
      // If we have a current_period_id, use it; otherwise load all (for backward compatibility)
      const params = deptSettings?.current_period_id 
        ? { academic_period_id: deptSettings.current_period_id.toString() }
        : {};
      
      const [offeringsResult, subjectsResult, programsResult] = await Promise.all([
        getSubjectOfferings(params),
        getSubjects(),
        getPrograms()
      ]);
        
      if (offeringsResult.success) {
        setOfferings(offeringsResult.offerings || []);
      }
      if (subjectsResult.success) {
        setSubjects(subjectsResult.subjects || []);
      }
      if (programsResult.success) {
        setPrograms(programsResult.programs || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      const result = await getAvailableInstructors();
      if (result.success) {
        setAvailableInstructors(result.instructors || []);
      }
    } catch (error) {
      console.error("Error loading instructors:", error);
    }
  };

  const loadCourseSections = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/programs/sections`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setCourseSections(result.courses || []);
      }
    } catch (error) {
      console.error("Error loading course sections:", error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      
      // First get the current period (includes academic_period_id)
      const periodResponse = await fetch(`${API_BASE_URL}/settings/semester-status?department=College`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const periodResult = await periodResponse.json();
      
      // Also get the basic semester settings
      const response = await fetch(`${API_BASE_URL}/settings/current-semester`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      
      const newSettings: AcademicPeriodSettings = {
        college: {
          current_semester: result.data?.college?.semester || "1st",
          current_academic_year: result.data?.college?.academic_year || "2025-2026",
          current_period_id: periodResult.success ? periodResult.current_period?.id : null,
          department: "College",
        },
        seniorHigh: {
          current_semester: result.data?.seniorHigh?.semester || "1st",
          current_academic_year: result.data?.seniorHigh?.academic_year || "2025-2026",
          current_period_id: null, // Will be fetched when SHS is selected
          department: "Senior High",
        },
      };
      
      setSystemSettings(newSettings);
      setFilterAcademicYear(newSettings.college.current_academic_year);
      setFilterSemester(newSettings.college.current_semester);
      return newSettings;
    } catch (error) {
      console.error("Error loading system settings:", error);
      return null;
    }
  };

  const handleOpenCreateDialog = async (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setFormData({
        subject_id: "",
        program_id: "",
        course_section: "",
        academic_year: systemSettings.college.current_academic_year,
        semester: systemSettings.college.current_semester,
        instructor_id: "",
      });
    }
    
    // If opening, check for active academic period first
    if (open) {
      // Load settings to check for active period
      const token = sessionStorage.getItem("authToken");
      const periodResponse = await fetch(`${API_BASE_URL}/settings/semester-status?department=${selectedDepartment}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const periodResult = await periodResponse.json();
      
      // Check if there's an active period
      if (!periodResult.success || !periodResult.current_period) {
        toast.error(`No active academic period found for ${selectedDepartment}. Please go to System Settings to create or activate a period first.`);
        // Don't open the dialog
        return;
      }
      
      // Also load instructors and course sections
      await Promise.all([loadInstructors(), loadCourseSections()]);
      
      // Get settings based on selected department
      const deptSettings = selectedDepartment === "College" 
        ? systemSettings.college
        : systemSettings.seniorHigh;
      
      setFormData({
        subject_id: "",
        program_id: "",
        course_section: "",
        academic_year: periodResult.current_period?.academic_year || deptSettings.current_academic_year,
        semester: periodResult.current_period?.period_number 
          ? (periodResult.current_period.period_number === 1 ? "1st" : periodResult.current_period.period_number === 2 ? "2nd" : "Summer")
          : deptSettings.current_semester,
        instructor_id: "",
      });
      
      // Now open the dialog
      setCreateDialogOpen(true);
    } else {
      setCreateDialogOpen(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleCreateOffering = async () => {
    if (!formData.subject_id || !formData.program_id || !formData.course_section) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate academic year and semester are set
    if (!formData.academic_year || !formData.semester) {
      toast.error("Academic year and semester are required. Please ensure system settings are configured.");
      return;
    }

    setSaving(true);
    try {
      // Find the selected course section to get year_level and section
      const selectedCourse = courseSections.find(c => c.value === formData.course_section);
      
      // Get current period ID
      const deptSettings = selectedDepartment === "College" 
        ? systemSettings.college 
        : systemSettings.seniorHigh;
      
      const result = await createSubjectOffering({
        subject_id: parseInt(formData.subject_id),
        program_id: selectedCourse?.program_id || (formData.program_id ? parseInt(formData.program_id) : undefined),
        year_level: selectedCourse?.year_level || 1,
        section: selectedCourse?.section || "A",
        academic_year: formData.academic_year,
        semester: formData.semester,
        instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : undefined,
        academic_period_id: deptSettings.current_period_id,
      });
        
      if (result.success) {
        toast.success("Subject offering created successfully");
        setCreateDialogOpen(false);
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error creating offering:", error);
      toast.error("Failed to create subject offering");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOffering = async () => {
    if (!selectedOffering) return;

    setSaving(true);
    try {
      const result = await updateSubjectOffering(selectedOffering.id.toString(), {
        instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : undefined,
        status: "active",
      });
        
      if (result.success) {
        toast.success("Subject offering updated successfully");
        setEditDialogOpen(false);
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating offering:", error);
      toast.error("Failed to update subject offering");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffering = async () => {
    if (!selectedOffering) return;

    // Store values before any state changes
    const currentDepartment = selectedDepartment;
    const offeringId = selectedOffering.id;
    
    setSaving(true);
    try {
      const result = await deleteSubjectOffering(offeringId.toString());
      if (result.success) {
        toast.success("Subject offering deleted successfully");
        // AlertDialog handles closing automatically, just clear selection
        setSelectedOffering(null);
        
        // Load fresh data after a small delay to allow dialog to close
        setTimeout(async () => {
          try {
            const token = sessionStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/settings/semester-status?department=${currentDepartment}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const periodResult = await response.json();
            
            if (periodResult.success && periodResult.current_period) {
              const key = currentDepartment === "College" ? "college" : "seniorHigh";
              const newSettings = {
                ...systemSettings,
                [key]: {
                  ...systemSettings[key],
                  current_period_id: periodResult.current_period.id
                }
              };
              setSystemSettings(newSettings);
              setTimeout(() => loadData(newSettings[key]), 0);
            } else {
              setTimeout(() => loadData(), 0);
            }
          } catch (periodError) {
            console.warn("Failed to fetch period:", periodError);
            setTimeout(() => loadData(), 0);
          }
        }, 150);
      } else {
        toast.error(result.message || "Failed to delete subject offering");
        // On error, we need to manually close
        setDeleteDialogOpen(false);
        setSelectedOffering(null);
      }
    } catch (error) {
      console.error("Error deleting offering:", error);
      toast.error("Failed to delete subject offering");
      setDeleteDialogOpen(false);
      setSelectedOffering(null);
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = async (offering: SubjectOffering) => {
    setSelectedOffering(offering);
    await Promise.all([loadInstructors(), loadCourseSections()]);
    // Create course_section from year_level and section
    const courseSectionValue = `${offering.year_level}-${offering.section}`;
    setFormData({
      subject_id: offering.subject_id.toString(),
      program_id: offering.program_id.toString(),
      course_section: courseSectionValue,
      academic_year: offering.academic_year,
      semester: offering.semester,
      instructor_id: offering.instructor_id?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (offering: SubjectOffering) => {
    setSelectedOffering(offering);
    setDeleteDialogOpen(true);
  };

  const openViewStudentsDialog = (offering: SubjectOffering) => {
    setTimeout(() => {
      setSelectedOffering(offering);
      setViewStudentsDialogOpen(true);
    }, 100);
  };

  const filteredOfferings = offerings.filter(offering =>
    (offering.subject_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offering.subject_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (offering.program_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter offerings by selected department (College or Senior High)
  const collegeOfferings = filteredOfferings.filter(offering => 
    offering.program_department === "College" || (!offering.program_department && offering.year_level && offering.year_level >= 1 && offering.year_level <= 4)
  );
  const seniorHighOfferings = filteredOfferings.filter(offering => 
    offering.program_department === "Senior High" || offering.program_department === "SHS"
  );

  // Group unique programs for the dropdown
  const uniquePrograms = programs.reduce((acc: Program[], program) => {
    if (!acc.find(p => p.program_code === program.program_code)) {
      acc.push(program);
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Subject Offerings</h2>
            <p className="text-gray-600 mt-1">Manage class sections - link subjects to programs and assign instructors</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={handleOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Offering
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Subject Offering</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new subject offering for the selected department and semester.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select 
                    value={selectedDepartment} 
                    onValueChange={(value) => {
                      setSelectedDepartment(value);
                      // Update semester/AY based on department
                      const deptSettings = value === "College" 
                        ? systemSettings.college 
                        : systemSettings.seniorHigh;
                      setFormData(prev => ({
                        ...prev,
                        academic_year: deptSettings.current_academic_year,
                        semester: deptSettings.current_semester,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="College">College</SelectItem>
                      <SelectItem value="Senior High">Senior High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.filter(s => s.status === 'active' && s.id && (selectedDepartment === "College" ? s.department === "College" : s.department === "Senior High")).map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.subject_code} - {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  
                <div className="space-y-2">
                  <Label>Program *</Label>
                  <Select 
                    value={formData.program_id} 
                    onValueChange={(value) => setFormData({ ...formData, program_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniquePrograms.filter(p => p.id && (selectedDepartment === "College" ? p.department === "College" : p.department === "Senior High")).map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.program_code} - {program.program_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  
                <div className="space-y-2">
                  <Label>Course Section *</Label>
                  <Select 
                    value={formData.course_section} 
                    onValueChange={(value) => setFormData({ ...formData, course_section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course section" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseSections.filter(cs => cs.value && cs.department === selectedDepartment).map((cs, index) => (
                        <SelectItem key={`${cs.program_code}-${cs.year_level}-${cs.section}-${index}`} value={cs.value}>
                          {cs.program_code} - Year {cs.year_level} - Section {cs.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <div className="p-2 border rounded-md bg-gray-50 text-gray-700">
                      {selectedDepartment === "College" ? systemSettings.college.current_academic_year : systemSettings.seniorHigh.current_academic_year}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{selectedDepartment === "College" ? "Semester" : "Quarter"}</Label>
                    <div className="p-2 border rounded-md bg-gray-50 text-gray-700">
                      {selectedDepartment === "College" ? systemSettings.college.current_semester : systemSettings.seniorHigh.current_semester} {selectedDepartment === "College" ? "Semester" : "Quarter"}
                    </div>
                  </div>
                </div>
                  
                <div className="space-y-2">
                  <Label>Instructor (Optional)</Label>
                  <Select 
                    value={formData.instructor_id} 
                    onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInstructors.filter(i => i.id).map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                {instructor.full_name?.charAt(0) || 'I'}
                              </AvatarFallback>
                            </Avatar>
                            {instructor.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateOffering} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Offering
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search offerings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Offerings Table with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject Offerings
            </CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="college" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  College
                </TabsTrigger>
                <TabsTrigger value="seniorHigh" className="flex items-center gap-2">
                  <School className="w-4 h-4" />
                  Senior High
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="college">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : collegeOfferings.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No college subject offerings found</p>
                    <p className="text-sm text-gray-400 mt-1">Create a new offering to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Subject Code</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Year/Section</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collegeOfferings.map((offering) => (
                      <TableRow key={offering.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{offering.subject_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="bg-blue-50">
                              {offering.subject_code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="bg-green-50">
                              {offering.program_code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50">
                            {offering.year_level} - {offering.section}
                          </Badge>
                        </TableCell>
                        <TableCell>{offering.academic_year}</TableCell>
                        <TableCell>{offering.semester}</TableCell>
                        <TableCell>
                          {offering.instructor_name ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                  {offering.instructor_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{offering.instructor_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={offering.status === 'active' ? 'default' : 'secondary'}>
                            {offering.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewStudentsDialog(offering)}>
                                <Users className="mr-2 h-4 w-4" />
                                View Students
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(offering)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(offering)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="seniorHigh">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : seniorHighOfferings.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No Senior High subject offerings found</p>
                  <p className="text-sm text-gray-400 mt-1">Create a new offering to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Subject Code</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Year/Section</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seniorHighOfferings.map((offering) => (
                      <TableRow key={offering.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{offering.subject_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="bg-blue-50">
                              {offering.subject_code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="bg-green-50">
                              {offering.program_code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50">
                            {offering.year_level} - {offering.section}
                          </Badge>
                        </TableCell>
                        <TableCell>{offering.academic_year}</TableCell>
                        <TableCell>{offering.semester}</TableCell>
                        <TableCell>
                          {offering.instructor_name ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                                  {offering.instructor_name?.charAt(0) || 'I'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{offering.instructor_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={offering.status === 'active' ? 'default' : 'secondary'}>
                            {offering.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openViewStudentsDialog(offering)}>
                                <Users className="mr-2 h-4 w-4" />
                                View Students
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(offering)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(offering)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedOffering(null);
        }
        setEditDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subject Offering</DialogTitle>
            <DialogDescription>
              Update the instructor assignment for this subject offering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="p-2 border rounded-md bg-gray-50">
                {selectedOffering?.subject_code} - {selectedOffering?.subject_name}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <div className="p-2 border rounded-md bg-gray-50">
                {selectedOffering?.program_code} - {selectedOffering?.program_name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year Level</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  Year {selectedOffering?.year_level}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  Section {selectedOffering?.section}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  {selectedOffering?.academic_year}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  {selectedOffering?.semester}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Select 
                value={formData.instructor_id} 
                onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Not Assigned</SelectItem>
                  {availableInstructors.filter(i => i.id).map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                            {instructor.full_name?.charAt(0) || 'I'}
                          </AvatarFallback>
                        </Avatar>
                        {instructor.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateOffering} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog - Using AlertDialog for better focus management */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogOpen(false);
          setSelectedOffering(null);
        }
      }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject Offering</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Students enrolled in this offering will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this subject offering?</p>
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="font-medium text-red-800">
                {selectedOffering?.subject_code} - {selectedOffering?.subject_name}
              </p>
              <p className="text-sm text-red-600 mt-1">
                {selectedOffering?.program_code} - Year {selectedOffering?.year_level} Section {selectedOffering?.section}
              </p>
              <p className="text-sm text-red-600">
                {selectedOffering?.academic_year} - {selectedOffering?.semester}
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedOffering(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOffering} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Students Dialog - Using AlertDialog for better focus management */}
      <AlertDialog open={viewStudentsDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg max-w-[90vw] max-h-[300px] p-3 overflow-hidden">
          <AlertDialogHeader className="pb-2 space-y-1">
            <AlertDialogTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              {selectedOffering?.subject_code} - {selectedOffering?.program_code}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Yr {selectedOffering?.year_level} Sec {selectedOffering?.section} | {selectedOffering?.academic_year} - {selectedOffering?.semester}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="overflow-y-auto" style={{ maxHeight: '160px' }}>
            {loadingStudents ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : offeringStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No students enrolled</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="text-xs py-2">Student ID</TableHead>
                    <TableHead className="text-xs py-2">Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offeringStudents.map((student, index) => (
                    <TableRow key={student.user_id || index} className="h-10">
                      <TableCell className="text-xs py-1 font-medium">{student.studentID}</TableCell>
                      <TableCell className="text-xs py-1">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-[10px]">
                              {student.full_name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[120px]">{student.full_name}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <AlertDialogFooter className="pt-2 pb-0">
            <AlertDialogCancel onClick={() => {
              setViewStudentsDialogOpen(false);
              setSelectedOffering(null);
              setOfferingStudents([]);
            }}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

