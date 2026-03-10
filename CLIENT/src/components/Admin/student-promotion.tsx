import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import {
  GraduationCap,
  Users,
  ArrowRight,
  History,
  Search,
  Loader2,
  Award,
  TrendingUp,
  Building2,
  RotateCcw
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
} from "../ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";

interface Student {
  user_id: number;
  email: string;
  full_name: string;
  student_id: number;
  studentID: string;
  program_id: number;
  program_name: string;
  program_code: string;
  year_level: number;
  section: string;
  course_section: string;
  department: string;
  profile_image?: string;
}

interface Program {
  id: number;
  department: string;
  program_name: string;
  program_code: string;
  year_level: number;
  section: string;
  course_section: string;
}

interface PromotionHistory {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  studentID: string;
  promotion_type: string;
  promotion_date: string;
  notes: string;
  old_program_code: string;
  old_year_level: number;
  old_section: string;
  new_program_code: string;
  new_year_level: number;
  new_section: string;
  promoted_by_name: string;
}

interface SemesterInfo {
  semester: string;
  academic_year: string;
}

interface SystemSettings {
  college?: SemesterInfo;
  seniorHigh?: SemesterInfo;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export default function StudentPromotion() {
  const [activeTab, setActiveTab] = useState("promote");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<PromotionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [studentsPage, setStudentsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 15;

  // Filter states
  const [selectedCourseSection, setSelectedCourseSection] = useState<string>("all");
  const [selectedTargetProgram, setSelectedTargetProgram] = useState<string>("select");

  // History filter states
  const [historyFilterType, setHistoryFilterType] = useState<string>("all");
  const [historySearchTerm, setHistorySearchTerm] = useState<string>("");
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<number[]>([]);

  // Promotion notes
  const [promotionNotes, setPromotionNotes] = useState<string>("");

  // Dialog states
  const [graduationDialogOpen, setGraduationDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PromotionHistory | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [graduationData, setGraduationData] = useState({
    graduationYear: new Date().getFullYear(),
    degree: "",
    honors: "",
  });

  const token = sessionStorage.getItem('authToken');

  const fetchSystemSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/settings/current-semester`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setSystemSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  }, [token]);

  // Fetch all course sections for dropdown
  const fetchPrograms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/students/programs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  }, [token]);

  // Fetch students for selected course section
  const fetchStudents = useCallback(async (courseSection: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseSection && courseSection !== 'all') {
        params.append("courseSection", courseSection);
      }

      const response = await fetch(`${API_BASE}/students/eligible?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch promotion history
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/students/promotion-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchPrograms();
    fetchHistory();
    fetchSystemSettings();
  }, [fetchPrograms, fetchHistory, fetchSystemSettings]);

  useEffect(() => {
    fetchStudents(selectedCourseSection);
  }, [selectedCourseSection, fetchStudents]);

  // Handle course section selection
  const handleCourseSectionChange = (value: string) => {
    setSelectedCourseSection(value);
    setSelectedStudents([]);
    setStudentsPage(1);
  };

  // Handle student selection
  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle select all in current view
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.student_id));
    }
  };

  // Handle promote
  const handlePromote = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students to promote");
      return;
    }
    if (!selectedTargetProgram || selectedTargetProgram === 'select') {
      toast.error("Please select target program");
      return;
    }

    setLoading(true);
    try {

      const response = await fetch(`${API_BASE}/students/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          newProgramId: parseInt(selectedTargetProgram),
          notes: promotionNotes,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully promoted ${data.promoted} students`);
        setSelectedStudents([]);
        setSelectedTargetProgram("select");
        setPromotionNotes("");
        fetchStudents(selectedCourseSection);
        fetchHistory();
      } else {
        toast.error(data.message || "Failed to promote students");
      }
    } catch (error) {
      console.error("Error promoting students:", error);
      toast.error("Failed to promote students");
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  // Handle graduate button click - prepare graduation data with program name
  const handleGraduateClick = () => {
    // Get the program name from selected students
    const selectedStudentData = students.filter(s => selectedStudents.includes(s.student_id));
    if (selectedStudentData.length > 0) {
      // Use the first student's program name as the default degree
      const programName = selectedStudentData[0].program_name || '';
      setGraduationData({
        ...graduationData,
        degree: programName
      });
    }
    setGraduationDialogOpen(true);
  };

  // Handle graduate
  const handleGraduate = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students to graduate");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/students/graduate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          graduationYear: graduationData.graduationYear,
          degree: graduationData.degree,
          honors: graduationData.honors,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully graduated ${data.graduated} students`);
        setSelectedStudents([]);
        fetchStudents(selectedCourseSection);
        fetchHistory();
      } else {
        toast.error(data.message || "Failed to graduate students");
      }
    } catch (error) {
      console.error("Error graduating students:", error);
      toast.error("Failed to graduate students");
    } finally {
      setLoading(false);
      setGraduationDialogOpen(false);
      setConfirmDialogOpen(false);
    }
  };

  // Handle preview promotion
  const handlePreviewPromotion = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select students to promote");
      return;
    }
    if (!selectedTargetProgram || selectedTargetProgram === 'select') {
      toast.error("Please select target program");
      return;
    }

    setPreviewLoading(true);
    setPreviewDialogOpen(true);
    try {
      const response = await fetch(`${API_BASE}/students/preview-promotion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          newProgramId: parseInt(selectedTargetProgram),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPreviewData(data);
      } else {
        toast.error(data.message || "Failed to preview promotion");
        setPreviewDialogOpen(false);
      }
    } catch (error) {
      console.error("Error previewing promotion:", error);
      toast.error("Failed to preview promotion");
      setPreviewDialogOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle undo promotion
  const handleUndoPromotion = async () => {
    if (!selectedHistoryItem) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/students/undo-promotion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          historyId: selectedHistoryItem.id,
          studentId: selectedHistoryItem.student_id,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Successfully undone promotion");
        setUndoDialogOpen(false);
        setSelectedHistoryItem(null);
        fetchStudents(selectedCourseSection);
        fetchHistory();
      } else {
        toast.error(data.message || "Failed to undo promotion");
      }
    } catch (error) {
      console.error("Error undoing promotion:", error);
      toast.error("Failed to undo promotion");
    } finally {
      setLoading(false);
    }
  };

  // Handle select/deselect history item
  const handleSelectHistoryItem = (historyId: number) => {
    setSelectedHistoryItems(prev =>
      prev.includes(historyId)
        ? prev.filter(id => id !== historyId)
        : [...prev, historyId]
    );
  };

  // Handle select all history items
  const handleSelectAllHistory = () => {
    // Only select promotions (not graduations)
    const promotionIds = filteredHistory
      .filter(item => item.promotion_type !== 'graduation')
      .map(item => item.id);
    
    if (selectedHistoryItems.length === promotionIds.length) {
      setSelectedHistoryItems([]);
    } else {
      setSelectedHistoryItems(promotionIds);
    }
  };

  // Handle bulk undo
  const handleBulkUndo = async () => {
    if (selectedHistoryItems.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/students/bulk-undo-promotion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          historyIds: selectedHistoryItems,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully undone ${data.undone} promotion(s)`);
        setSelectedHistoryItems([]);
        fetchStudents(selectedCourseSection);
        fetchHistory();
      } else {
        toast.error(data.message || "Failed to undo promotions");
      }
    } catch (error) {
      console.error("Error bulk undoing promotions:", error);
      toast.error("Failed to undo promotions");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        student.full_name.toLowerCase().includes(term) ||
        student.studentID?.toLowerCase().includes(term)
      );
    }
    return true;
  }).sort((a, b) => {
    // Sort alphabetically by surname, ignoring suffixes like Jr., Sr., II, III, IV, etc.
    const getSurname = (name: string) => {
      // Remove suffixes first
      const cleanName = name.replace(/\s+(Jr\.|Sr\.|II|III|IV|V|VI)$/i, '');
      // Get the last word as surname
      const parts = cleanName.trim().split(' ');
      return parts[parts.length - 1].toLowerCase();
    };
    const surnameA = getSurname(a.full_name);
    const surnameB = getSurname(b.full_name);
    return surnameA.localeCompare(surnameB);
  });

  // Reset page when search changes
  useEffect(() => {
    setStudentsPage(1);
  }, [searchTerm]);

  // Paginated students
  const totalStudentPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (studentsPage - 1) * itemsPerPage,
    studentsPage * itemsPerPage
  );

  // Filtered history
  const filteredHistory = history.filter(item => {
    // Filter by type
    if (historyFilterType !== "all") {
      if (historyFilterType === "promotion" && item.promotion_type === "graduation") return false;
      if (historyFilterType === "graduation" && item.promotion_type !== "graduation") return false;
    }
    // Filter by search term
    if (historySearchTerm) {
      const term = historySearchTerm.toLowerCase();
      return (
        item.student_name?.toLowerCase().includes(term) ||
        item.studentID?.toLowerCase().includes(term) ||
        item.old_program_code?.toLowerCase().includes(term) ||
        item.new_program_code?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Reset history page when filters change
  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilterType, historySearchTerm]);

  // Paginated history
  const totalHistoryPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );



  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-white to-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student Promotion</h1>
            <p className="text-sm text-slate-500">Manage student promotions, graduation and track history</p>
          </div>
        </div>
      </div>

      {/* Current Semester Settings Banner */}
      {systemSettings && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-lime-50 rounded-lg p-4 border border-green-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-green-600" />
              <span>College: {systemSettings.college?.semester} Sem, SY {systemSettings.college?.academic_year}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Senior High: {systemSettings.seniorHigh?.semester} Sem, SY {systemSettings.seniorHigh?.academic_year}</span>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Custom Tab Navigation */}
        <div className="mb-6">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab("promote")}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                text-sm font-medium transition-all duration-200 ease-in-out
                ${activeTab === "promote"
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }
              `}
            >
              <TrendingUp className={`h-4 w-4 ${activeTab === "promote" ? "text-blue-600" : "text-slate-500"}`} />
              <span>Promote Students</span>
            </button>
            <button
              onClick={() => setActiveTab("graduate")}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                text-sm font-medium transition-all duration-200 ease-in-out
                ${activeTab === "graduate"
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }
              `}
            >
              <Award className={`h-4 w-4 ${activeTab === "graduate" ? "text-amber-600" : "text-slate-500"}`} />
              <span>Graduate Students</span>
              {selectedStudents.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {selectedStudents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                text-sm font-medium transition-all duration-200 ease-in-out
                ${activeTab === "history"
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }
              `}
            >
              <History className={`h-4 w-4 ${activeTab === "history" ? "text-emerald-600" : "text-slate-500"}`} />
              <span>History</span>
              {history.length > 0 && (
                <span className="ml-1 bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Promote Tab */}
        <TabsContent value="promote" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Students for Promotion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Course Section Filter */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-64">
                  <label className="text-sm font-medium mb-2 block">Select Course & Section</label>
                  <Select value={selectedCourseSection} onValueChange={handleCourseSectionChange}>
                    <SelectTrigger className="bg-green-50 border-green-200 focus:ring-green-400">
                      <SelectValue placeholder="Select course section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Course Sections</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.course_section}>
                          {program.course_section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or student ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {paginatedStudents.length} of {filteredStudents.length} student(s)
                </div>
              </div>

              {/* Students Table */}
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedStudents.length > 0 &&
                            paginatedStudents.every(s => selectedStudents.includes(s.student_id))
                          }
                          onCheckedChange={handleSelectAll}
                          title="Select all on this page"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          {selectedCourseSection === "all"
                            ? "No students found. Try selecting a specific course section."
                            : "No students found in this section."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student) => (
                        <TableRow key={student.student_id} className="hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.student_id)}
                              onCheckedChange={() => handleSelectStudent(student.student_id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.profile_image} alt={student.full_name} />
                                <AvatarFallback className="text-xs">
                                  {student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {student.full_name}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{student.studentID || "N/A"}</TableCell>
                          <TableCell>{student.program_code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.year_level}</Badge>
                          </TableCell>
                          <TableCell>{student.section}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalStudentPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <div className="text-sm text-gray-600">
                    Page {studentsPage} of {totalStudentPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentsPage(p => Math.max(1, p - 1))}
                      disabled={studentsPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentsPage(p => Math.min(totalStudentPages, p + 1))}
                      disabled={studentsPage === totalStudentPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Promotion Options */}
              <div className="mt-4 space-y-4">
                {/* Target Program Selection */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Promote to:</span>
                    <Select value={selectedTargetProgram} onValueChange={setSelectedTargetProgram}>
                      <SelectTrigger className="w-64 bg-green-50 border-green-200 focus:ring-green-400">
                        <SelectValue placeholder="Select target program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select" disabled>Select target</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.course_section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedStudents.length} student(s) selected
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <textarea
                    value={promotionNotes}
                    onChange={(e) => setPromotionNotes(e.target.value)}
                    placeholder="e.g. Back student repeating year, irregular enrollment, etc."
                    rows={2}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <Button
                    onClick={handlePreviewPromotion}
                    disabled={selectedStudents.length === 0 || selectedTargetProgram === "select"}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Promote Selected ({selectedStudents.length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graduate Tab */}
        <TabsContent value="graduate" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Graduate Students to Alumni
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStudents.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">
                    Selected Students ({selectedStudents.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Section</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents
                          .filter(s => selectedStudents.includes(s.student_id))
                          .map(s => (
                            <TableRow key={s.student_id}>
                              <TableCell className="font-medium">{s.full_name}</TableCell>
                              <TableCell>{s.studentID || 'N/A'}</TableCell>
                              <TableCell>{s.program_code}</TableCell>
                              <TableCell>{s.section}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 mb-4">
                  Select students from the Promote tab to graduate them
                </div>
              )}

              <Button
                onClick={handleGraduateClick}
                disabled={selectedStudents.length === 0}
                className="w-full"
              >
                <Award className="h-4 w-4 mr-2" />
                Graduate Selected Students
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Promotion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* History Filters */}
              <div className="flex flex-wrap gap-4 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-48">
                  <label className="text-sm font-medium mb-1 block">Filter by Type</label>
                  <Select value={historyFilterType} onValueChange={setHistoryFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="promotion">Promotions Only</SelectItem>
                      <SelectItem value="graduation">Graduations Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, student ID, program..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 self-end pb-1">
                  Showing {paginatedHistory.length} of {filteredHistory.length} record(s)
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedHistoryItems.length > 0 && (
                <div className="mb-4 flex items-center gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">
                    {selectedHistoryItems.length} record(s) selected
                  </span>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleBulkUndo}
                    disabled={loading}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Undo Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedHistoryItems([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {historyFilterType !== "all" || historySearchTerm ? 
                    "No records match your filters" : 
                    "No promotion history yet"}
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedHistoryItems.length > 0 && 
                                filteredHistory.filter(i => i.promotion_type !== 'graduation').every(i => selectedHistoryItems.includes(i.id))}
                              onCheckedChange={handleSelectAllHistory}
                              title="Select all promotions"
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedHistory.map((item) => (
                          <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell>
                              {item.promotion_type !== 'graduation' && (
                                <Checkbox
                                  checked={selectedHistoryItems.includes(item.id)}
                                  onCheckedChange={() => handleSelectHistoryItem(item.id)}
                                />
                              )}
                            </TableCell>
                            <TableCell>{new Date(item.promotion_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.student_name}</div>
                                <div className="text-xs text-gray-500">{item.studentID}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.old_program_code ? (
                                <span className="text-sm">
                                  {item.old_program_code} - {item.old_year_level}{item.old_section}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.new_program_code ? (
                                <span className="text-sm">
                                  {item.new_program_code} - {item.new_year_level}{item.new_section}
                                </span>
                              ) : (
                                <span className="text-gray-400">Alumni</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.promotion_type === "graduation" ? "default" : "secondary"}>
                                {item.promotion_type === "graduation" ? "Graduated" : "Promoted"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{item.notes}</TableCell>
                            <TableCell>
                              {item.promotion_type !== 'graduation' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                                  onClick={() => {
                                    setSelectedHistoryItem(item);
                                    setUndoDialogOpen(true);
                                  }}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Undo
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* History Pagination */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-2">
                      <div className="text-sm text-gray-600">
                        Page {historyPage} of {totalHistoryPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyPage === totalHistoryPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Graduation Dialog */}
      <Dialog open={graduationDialogOpen} onOpenChange={setGraduationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Graduate Students</DialogTitle>
            <DialogDescription>
              Enter graduation details for {selectedStudents.length} student(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Graduation Year</label>
              <Input
                type="number"
                min={2000}
                max={new Date().getFullYear() + 5}
                value={graduationData.graduationYear}
                onChange={(e) => setGraduationData({ ...graduationData, graduationYear: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Degree</label>
              <Input
                value={graduationData.degree}
                onChange={(e) => setGraduationData({ ...graduationData, degree: e.target.value })}
                placeholder="Degree will be auto-filled from student program"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Honors (Optional)</label>
              <Input
                value={graduationData.honors}
                onChange={(e) => setGraduationData({ ...graduationData, honors: e.target.value })}
                placeholder="e.g., Magna Cum Laude"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGraduationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmDialogOpen(true)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Promotion Preview
            </DialogTitle>
            <DialogDescription>
              Review the promotion details and warnings before confirming.
            </DialogDescription>
          </DialogHeader>
          
          {previewLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-700">{previewData.summary?.total || 0}</div>
                    <div className="text-xs text-slate-500">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{previewData.summary?.canPromote || 0}</div>
                    <div className="text-xs text-slate-500">Can Promote</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{previewData.summary?.withWarnings || 0}</div>
                    <div className="text-xs text-slate-500">With Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{previewData.summary?.blocked || 0}</div>
                    <div className="text-xs text-slate-500">Blocked</div>
                  </div>
                </div>
              </div>

              {/* Target Program */}
              <div className="text-sm text-slate-600">
                <strong>Target Program:</strong> {previewData.targetProgram?.programCode} - Year {previewData.targetProgram?.yearLevel} ({previewData.targetProgram?.section})
              </div>

              {/* Warnings */}
              {previewData.warnings && previewData.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-amber-800 mb-2">Warnings</div>
                  {previewData.warnings.map((warning: string, idx: number) => (
                    <div key={idx} className="text-sm text-amber-700">• {warning}</div>
                  ))}
                </div>
              )}

              {/* Student List */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.students?.map((student: any) => (
                      <TableRow key={student.studentId} className={!student.canPromote ? "bg-red-50" : student.warnings?.length > 0 ? "bg-amber-50" : ""}>
                        <TableCell className="font-medium">{student.studentName}</TableCell>
                        <TableCell>{student.currentProgram}</TableCell>
                        <TableCell>{student.targetProgram}</TableCell>
                        <TableCell>
                          {!student.canPromote ? (
                            <Badge variant="destructive">{student.blockReason}</Badge>
                          ) : student.warnings?.length > 0 ? (
                            <div className="space-y-1">
                              {student.warnings.map((w: string, i: number) => (
                                <div key={i} className="text-xs text-amber-700">{w}</div>
                              ))}
                            </div>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPreviewDialogOpen(false);
                setConfirmDialogOpen(true);
              }}
              disabled={previewLoading || (previewData?.summary?.withWarnings ?? 0) > 0 || (previewData?.summary?.blocked ?? 0) > 0}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === "graduate" ? "Confirm Graduation" : "Confirm Promotion"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "graduate" ? (
                <>
                  You are about to graduate <strong>{selectedStudents.length}</strong> student(s).
                  They will be converted to alumni status and will lose access to student features.
                </>
              ) : (
                <>
                  You are about to promote <strong>{selectedStudents.length}</strong> student(s) to
                  <strong> {programs.find(p => p.id.toString() === selectedTargetProgram)?.course_section}</strong>.
                  {promotionNotes && <span className="block mt-1 text-xs text-slate-500">Note: {promotionNotes}</span>}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={activeTab === "graduate" ? handleGraduate : handlePromote}
              disabled={loading}
              className={activeTab === "graduate" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {activeTab === "graduate" ? "Graduate Students" : "Promote Students"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo Promotion Dialog */}
      <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Undo Promotion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to undo this promotion? This will revert the student to their previous program.
            </DialogDescription>
          </DialogHeader>
          {selectedHistoryItem && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Student:</span>
                  <div className="font-medium">{selectedHistoryItem.student_name}</div>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">{selectedHistoryItem.promotion_type === 'graduation' ? 'Graduation' : 'Promotion'}</div>
                </div>
                <div>
                  <span className="text-gray-500">From:</span>
                  <div className="font-medium">
                    {selectedHistoryItem.old_program_code 
                      ? `${selectedHistoryItem.old_program_code} - Yr ${selectedHistoryItem.old_year_level} ${selectedHistoryItem.old_section}`
                      : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">To:</span>
                  <div className="font-medium">
                    {selectedHistoryItem.new_program_code 
                      ? `${selectedHistoryItem.new_program_code} - Yr ${selectedHistoryItem.new_year_level} ${selectedHistoryItem.new_section}`
                      : 'Alumni'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUndoPromotion}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Undo Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
