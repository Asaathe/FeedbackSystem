import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { Settings, Save, RefreshCw, GraduationCap, Building2, Plus, Calendar, ArrowRightLeft, Clock, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";

interface SystemSettingsProps {
  onNavigate?: (page: string) => void;
}

interface DepartmentSettings {
  semester: string;
  academic_year: string;
}

interface AllSettings {
  college: DepartmentSettings;
  seniorHigh: DepartmentSettings;
}

// Academic Period Types
interface AcademicPeriod {
  id: number;
  department: string;
  period_type: string;
  academic_year: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  auto_transition: boolean;
  transition_time: string;
  status: string;
  created_at: string;
}

interface SemesterStatus {
  department: string;
  current_period: AcademicPeriod | null;
  next_period: AcademicPeriod | null;
  recent_transitions: any[];
  period_type: string;
}

const semesterOptions = [
  { value: "1st", label: "1st Semester" },
  { value: "2nd", label: "2nd Semester" },
  { value: "Summer", label: "Summer" },
];

const quarterOptions = [
  { value: "1", label: "1st Quarter" },
  { value: "2", label: "2nd Quarter" },
  { value: "3", label: "3rd Quarter" },
  { value: "4", label: "4th Quarter" },
];

// Dynamically generate academic year options based on current year
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // Generate 3 years before, current year, and 3 years after
  for (let i = -2; i <= 3; i++) {
    const startYear = currentYear + i;
    const endYear = startYear + 1;
    years.push({
      value: `${startYear}-${endYear}`,
      label: `${startYear}-${endYear}`
    });
  }
  return years;
};

const academicYearOptions = generateAcademicYears();

// Helper function to format dates for display
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export function SystemSettings({ onNavigate }: SystemSettingsProps = {}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AllSettings>({
    college: { semester: "1st", academic_year: "2025-2026" },
    seniorHigh: { semester: "1st", academic_year: "2025-2026" },
  });

  // Academic Period Management State
  const [selectedDept, setSelectedDept] = useState<string>("College");
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [semesterStatus, setSemesterStatus] = useState<SemesterStatus | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [resetType, setResetType] = useState<"subjects" | "evaluations" | "both">("both");
  const [transitioning, setTransitioning] = useState(false);

  // New Period Form State
  const [newPeriod, setNewPeriod] = useState({
    department: "College",
    period_type: "semester",
    academic_year: "2025-2026",
    period_number: 1,
    start_date: "",
    end_date: "",
    auto_transition: false,
    transition_time: "06:00:00",
  });

  // Update newPeriod when selectedDept changes (for the Add Period modal)
  useEffect(() => {
    setNewPeriod(prev => ({
      ...prev,
      department: selectedDept,
      period_type: selectedDept === 'College' ? 'semester' : 'quarter'
    }));
  }, [selectedDept]);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch academic periods when department changes
  useEffect(() => {
    fetchAcademicPeriods();
    fetchSemesterStatus();
  }, [selectedDept]);

  const fetchAcademicPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `/api/settings/academic-periods?department=${selectedDept}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setPeriods(data.periods || []);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const fetchSemesterStatus = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `/api/settings/semester-status?department=${selectedDept}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setSemesterStatus(data);
      }
    } catch (error) {
      console.error("Error fetching semester status:", error);
    }
  };

  const handleCreatePeriod = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/settings/academic-periods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPeriod),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Academic period created successfully");
        setShowAddModal(false);
        setNewPeriod({
          department: selectedDept,
          period_type: selectedDept === "College" ? "semester" : "quarter",
          academic_year: "2025-2026",
          period_number: 1,
          start_date: "",
          end_date: "",
          auto_transition: false,
          transition_time: "06:00:00",
        });
        fetchAcademicPeriods();
        fetchSemesterStatus();
      } else {
        toast.error(data.message || "Failed to create period");
      }
    } catch (error) {
      console.error("Error creating period:", error);
      toast.error("Failed to create academic period");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePeriod = async (id: number) => {
    if (!confirm("Are you sure you want to delete this academic period?")) return;
    
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/settings/academic-periods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Academic period deleted");
        fetchAcademicPeriods();
      } else {
        toast.error(data.message || "Failed to delete period");
      }
    } catch (error) {
      console.error("Error deleting period:", error);
      toast.error("Failed to delete academic period");
    }
  };

  const handleTriggerTransition = async () => {
    if (!selectedPeriodId) return;
    
    setTransitioning(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `/api/settings/academic-periods/${selectedPeriodId}/set-current`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reset_type: resetType }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully transitioned to ${data.new_period?.period_type} ${data.new_period?.period_number}`);
        setShowTransitionModal(false);
        fetchAcademicPeriods();
        fetchSemesterStatus();
      } else {
        toast.error(data.message || "Failed to trigger transition");
      }
    } catch (error) {
      console.error("Error triggering transition:", error);
      toast.error("Failed to trigger semester transition");
    } finally {
      setTransitioning(false);
    }
  };

  const openTransitionModal = (periodId: number) => {
    setSelectedPeriodId(periodId);
    setResetType("both");
    setShowTransitionModal(true);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/settings/current-semester", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings({
          college: {
            semester: data.data.college?.semester || "1st",
            academic_year: data.data.college?.academic_year || "2025-2026",
          },
          seniorHigh: {
            semester: data.data.seniorHigh?.semester || "1st",
            academic_year: data.data.seniorHigh?.academic_year || "2025-2026",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (department: "college" | "seniorHigh") => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const deptKey = department === "college" ? "College" : "Senior High";
      
      const settingsToUpdate = [
        { key: "current_semester", value: settings[department].semester, department: deptKey },
        { key: "current_academic_year", value: settings[department].academic_year, department: deptKey },
      ];

      const response = await fetch("/api/settings/bulk/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`${deptKey} settings updated successfully`);
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (department: "college" | "seniorHigh", field: "semester" | "academic_year", value: string) => {
    setSettings((prev) => ({
      ...prev,
      [department]: {
        ...prev[department],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-gray-600 mt-1">
              Configure department-specific settings for the system
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="college" className="space-y-6" onValueChange={(value) => {
          if (value === 'college') setSelectedDept('College');
          else if (value === 'seniorHigh') setSelectedDept('Senior High');
        }}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="college" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            College
          </TabsTrigger>
          <TabsTrigger value="seniorHigh" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Senior High
          </TabsTrigger>
        </TabsList>

        {/* College Period Management */}
        <TabsContent value="college">
          <div className="space-y-6">
            {/* Department Selector */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Academic Period Management
                </CardTitle>
                <CardDescription>
                  Manage semesters for College and quarters for Senior High
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Period Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="ml-auto bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Period
                  </Button>
                </div>

                {/* Current Status */}
                {semesterStatus && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-900">Current Status:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                        {semesterStatus.current_period 
                          ? `${semesterStatus.period_type === 'semester' ? 'Semester' : 'Quarter'} ${semesterStatus.current_period.period_number}, SY ${semesterStatus.current_period.academic_year}`
                          : 'No active period'
                        }
                      </span>
                    </div>
                    {semesterStatus.next_period && (
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <ArrowRightLeft className="w-4 h-4" />
                        Next: {semesterStatus.period_type === 'semester' ? 'Semester' : 'Quarter'} {semesterStatus.next_period.period_number} ({formatDate(semesterStatus.next_period.start_date)} - {formatDate(semesterStatus.next_period.end_date)})
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Periods List */}
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg">Academic Periods</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPeriods ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading periods...</p>
                  </div>
                ) : periods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No academic periods found</p>
                    <p className="text-sm">Click "Add Period" to create one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Period</th>
                          <th className="text-left py-3 px-2">Academic Year</th>
                          <th className="text-left py-3 px-2">Dates</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Auto</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((period) => (
                          <tr key={period.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <span className="font-medium">
                                {period.period_type === 'semester' ? 'Semester' : 'Quarter'} {period.period_number}
                              </span>
                            </td>
                            <td className="py-3 px-2">{period.academic_year}</td>
                            <td className="py-3 px-2">
                              {formatDate(period.start_date)} - {formatDate(period.end_date)}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                period.status === 'active' ? 'bg-green-100 text-green-700' :
                                period.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                period.status === 'archived' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {period.status}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              {period.auto_transition ? (
                                <span className="flex items-center gap-1 text-xs">
                                  <Clock className="w-3 h-3" /> {period.transition_time}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Manual</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-2">
                                {period.status !== 'active' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openTransitionModal(period.id)}
                                    className="text-xs h-8"
                                  >
                                    Set Current
                                  </Button>
                                )}
                                {period.status !== 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePeriod(period.id)}
                                    className="text-red-500 hover:text-red-700 h-8 px-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seniorHigh">
          {/* Same period management UI for Senior High - uses selectedDept state */}
          <div className="space-y-6">
            {/* Department Info - Hidden since already selected via tab */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Senior High Quarter Management
                </CardTitle>
                <CardDescription>
                  Manage quarters (1st-4th) for Senior High School
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Period Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quarter
                  </Button>
                </div>

                {/* Current Status */}
                {semesterStatus && (
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-purple-900">Current Quarter:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                        {semesterStatus.current_period 
                          ? `Quarter ${semesterStatus.current_period.period_number}, SY ${semesterStatus.current_period.academic_year}`
                          : 'No active quarter'
                        }
                      </span>
                    </div>
                    {semesterStatus.next_period && (
                      <div className="flex items-center gap-2 text-sm text-purple-700">
                        <ArrowRightLeft className="w-4 h-4" />
                        Next: Quarter {semesterStatus.next_period.period_number} ({formatDate(semesterStatus.next_period.start_date)} - {formatDate(semesterStatus.next_period.end_date)})
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Periods List */}
            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg">Quarter List</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPeriods ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading quarters...</p>
                  </div>
                ) : periods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No quarters found</p>
                    <p className="text-sm">Click "Add Quarter" to create one</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Quarter</th>
                          <th className="text-left py-3 px-2">Academic Year</th>
                          <th className="text-left py-3 px-2">Dates</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Auto</th>
                          <th className="text-left py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((period) => (
                          <tr key={period.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-2">
                              <span className="font-medium">Quarter {period.period_number}</span>
                            </td>
                            <td className="py-3 px-2">{period.academic_year}</td>
                            <td className="py-3 px-2">
                              {formatDate(period.start_date)} - {formatDate(period.end_date)}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                period.status === 'active' ? 'bg-green-100 text-green-700' :
                                period.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                period.status === 'archived' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {period.status}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              {period.auto_transition ? (
                                <span className="flex items-center gap-1 text-xs">
                                  <Clock className="w-3 h-3" /> {period.transition_time}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Manual</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-2">
                                {period.status !== 'active' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openTransitionModal(period.id)}
                                    className="text-xs h-8"
                                  >
                                    Set Current
                                  </Button>
                                )}
                                {period.status !== 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePeriod(period.id)}
                                    className="text-red-500 hover:text-red-700 h-8 px-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Period Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Period</DialogTitle>
            <DialogDescription>
              Create a new semester for College or quarter for Senior High
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={selectedDept}
                disabled
                className="bg-gray-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select
                value={newPeriod.academic_year}
                onValueChange={(value) => setNewPeriod(prev => ({ ...prev, academic_year: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{selectedDept === 'College' ? 'Semester' : 'Quarter'}</Label>
              <Select
                value={String(newPeriod.period_number)}
                onValueChange={(value) => setNewPeriod(prev => ({ ...prev, period_number: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selectedDept === 'College' ? semesterOptions : quarterOptions).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newPeriod.start_date}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newPeriod.end_date}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between space-y-2">
              <div className="flex flex-col">
                <Label>Auto Transition</Label>
                <span className="text-xs text-gray-500">Automatically switch at end date</span>
              </div>
              <Switch
                checked={newPeriod.auto_transition}
                onCheckedChange={(checked) => setNewPeriod(prev => ({ ...prev, auto_transition: checked }))}
              />
            </div>
            
            {newPeriod.auto_transition && (
              <div className="space-y-2">
                <Label>Transition Time</Label>
                <Input
                  type="time"
                  value={newPeriod.transition_time}
                  onChange={(e) => setNewPeriod(prev => ({ ...prev, transition_time: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePeriod}
              disabled={saving || !newPeriod.start_date || !newPeriod.end_date}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {saving ? "Creating..." : "Create Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={showTransitionModal} onOpenChange={setShowTransitionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Switch to New Period</DialogTitle>
            <DialogDescription>
              This will archive the current period and activate the selected one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> This action will reset the system for the new period. 
                Students will see new subjects and can submit fresh evaluations.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>What to Reset:</Label>
              <Select
                value={resetType}
                onValueChange={(value: "subjects" | "evaluations" | "both") => setResetType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (Subjects & Evaluations)</SelectItem>
                  <SelectItem value="subjects">Subjects Only</SelectItem>
                  <SelectItem value="evaluations">Evaluations Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransitionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTriggerTransition}
              disabled={transitioning}
              className="bg-green-500 hover:bg-green-600"
            >
              {transitioning ? "Switching..." : "Confirm Transition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SystemSettings;

