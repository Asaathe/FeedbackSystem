import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { 
  GraduationCap, 
  Users, 
  ArrowRight, 
  History, 
  Search, 
  Loader2,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

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

const API_BASE = "http://localhost:5000/api";

export default function StudentPromotion() {
  const [activeTab, setActiveTab] = useState("promote");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<PromotionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination state
  const [studentsPage, setStudentsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 15;
  
  // Filter states
  const [selectedCourseSection, setSelectedCourseSection] = useState<string>("all");
  const [selectedTargetProgram, setSelectedTargetProgram] = useState<string>("select");
  
  // Special options
  const [promotionType, setPromotionType] = useState<"regular" | "back" | "irregular">("regular");
  
  // Dialog states
  const [graduationDialogOpen, setGraduationDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [graduationData, setGraduationData] = useState({
    graduationYear: new Date().getFullYear(),
    degree: "",
    honors: "",
  });

  const token = sessionStorage.getItem('authToken');

  // Fetch all course sections for dropdown
  const fetchPrograms = async () => {
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
  };

  // Fetch students for selected course section
  const fetchStudents = async (courseSection: string) => {
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
  };

  // Fetch promotion history
  const fetchHistory = async () => {
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
  };

  useEffect(() => {
    fetchPrograms();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchStudents(selectedCourseSection);
  }, [selectedCourseSection]);

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
      let notes = "";
      if (promotionType === "back") {
        notes = "Back student - repeating year";
      } else if (promotionType === "irregular") {
        notes = "Irregular student - custom promotion";
      }

      const response = await fetch(`${API_BASE}/students/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          newProgramId: parseInt(selectedTargetProgram),
          notes: notes,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully promoted ${data.promoted} students`);
        setSelectedStudents([]);
        setSelectedTargetProgram("select");
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

  const filteredStudents = students.filter(student => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        student.full_name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.studentID?.toLowerCase().includes(term)
      );
    }
    return true;
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

  // Paginated history
  const totalHistoryPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  // Group students by course_section for display
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const key = student.course_section || `${student.program_code} - ${student.year_level}${student.section}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Student Promotion</h1>
        </div>
      </div>

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
              <ArrowRight className={`h-4 w-4 ${activeTab === "promote" ? "text-blue-600" : "text-slate-500"}`} />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Students for Promotion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Course Section Filter */}
              <div className="flex flex-wrap gap-4 mb-4 items-end">
                <div className="w-64">
                  <label className="text-sm font-medium mb-2 block">Select Course & Section</label>
                  <Select value={selectedCourseSection} onValueChange={handleCourseSectionChange}>
                    <SelectTrigger>
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
                      placeholder="Search by name, email, or student ID..."
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {selectedCourseSection === "all" 
                            ? "Select a course section to view students" 
                            : "No students found in this section"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student) => (
                        <TableRow key={student.student_id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.student_id)}
                              onCheckedChange={() => handleSelectStudent(student.student_id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{student.studentID || "N/A"}</TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.program_code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Year {student.year_level}</Badge>
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
                {/* Promotion Type Selection */}
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-medium">Promotion Type:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={promotionType === "regular" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPromotionType("regular")}
                    >
                      Regular
                    </Button>
                    <Button
                      variant={promotionType === "back" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPromotionType("back")}
                    >
                      Back Student (Repeat)
                    </Button>
                    <Button
                      variant={promotionType === "irregular" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPromotionType("irregular")}
                    >
                      Irregular
                    </Button>
                  </div>
                </div>

                {/* Info based on promotion type */}
                {promotionType === "back" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <strong>Back Student:</strong> Student will repeat the current year level.
                  </div>
                )}
                {promotionType === "irregular" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Irregular Student:</strong> Select any target program/section below.
                  </div>
                )}

                {/* Target Program Selection */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Promote to:</span>
                    <Select value={selectedTargetProgram} onValueChange={setSelectedTargetProgram}>
                      <SelectTrigger className="w-64">
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <Button
                    onClick={() => setConfirmDialogOpen(true)}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Graduate Students to Alumni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Important Notice</h4>
                <p className="text-sm text-yellow-700">
                  Graduating students will be converted to alumni status. Their feedback history will be preserved, 
                  but they will no longer have access to student features.
                </p>
              </div>

              {selectedStudents.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">
                    Selected Students ({selectedStudents.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {filteredStudents
                      .filter(s => selectedStudents.includes(s.student_id))
                      .map(s => (
                        <Badge key={s.student_id} variant="secondary">
                          {s.full_name}
                        </Badge>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 mb-4">
                  Select students from the Promote tab to graduate them
                </div>
              )}

              <Button
                onClick={() => setGraduationDialogOpen(true)}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Promotion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No promotion history yet
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Promoted By</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.promotion_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.student_name}</div>
                                <div className="text-xs text-gray-500">{item.studentID}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.promotion_type === "graduation" ? "default" : "secondary"}>
                                {item.promotion_type === "graduation" ? "Graduated" : "Promoted"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.old_program_code ? (
                                <span className="text-sm">
                                  {item.old_program_code} - Yr {item.old_year_level} {item.old_section}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.new_program_code ? (
                                <span className="text-sm">
                                  {item.new_program_code} - Yr {item.new_year_level} {item.new_section}
                                </span>
                              ) : (
                                <span className="text-gray-400">Alumni</span>
                              )}
                            </TableCell>
                            <TableCell>{item.promoted_by_name}</TableCell>
                            <TableCell className="text-sm text-gray-600">{item.notes}</TableCell>
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
                value={graduationData.graduationYear}
                onChange={(e) => setGraduationData({ ...graduationData, graduationYear: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Degree (Optional)</label>
              <Input
                value={graduationData.degree}
                onChange={(e) => setGraduationData({ ...graduationData, degree: e.target.value })}
                placeholder="e.g., Bachelor of Science"
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
                  {promotionType === "back" && " (Back Student - Repeating Year)"}
                  {promotionType === "irregular" && " (Irregular Student)"}
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
    </div>
  );
}
