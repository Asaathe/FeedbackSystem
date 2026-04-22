import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Settings, Shield, Download, Trash2, RefreshCw, AlertTriangle, Database, FileText, Plus, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface SystemSettingsProps {
  onNavigate?: (page: string) => void;
}

interface Backup {
  id: string;
  name: string;
  created_at: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'full' | 'incremental' | 'custom';
  tables?: string[];
  format?: 'sql' | 'csv';
}

interface TableOption {
  name: string;
  label: string;
  selected: boolean;
}

export function SystemSettings({ onNavigate }: SystemSettingsProps = {}) {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'sql' | 'csv'>('sql');

  const tableOptions: TableOption[] = [
    { name: 'academic_periods', label: 'Academic Periods', selected: false },
    { name: 'alumni', label: 'Alumni Records', selected: false },
    { name: 'alumni_employment', label: 'Alumni Employment', selected: false },
    { name: 'alumni_employment_history', label: 'Alumni Employment History', selected: false },
    { name: 'course_management', label: 'Course Management', selected: false },
    { name: 'employers', label: 'Employers', selected: false },
    { name: 'employment_update_queue', label: 'Employment Update Queue', selected: false },
    { name: 'evaluation_forms', label: 'Evaluation Forms', selected: false },
    { name: 'evaluation_periods', label: 'Evaluation Periods', selected: false },
    { name: 'evaluation_subjects', label: 'Evaluation Subjects', selected: false },
    { name: 'feedback_invitations', label: 'Feedback Invitations', selected: false },
    { name: 'feedback_template_categories', label: 'Feedback Template Categories', selected: false },
    { name: 'forms', label: 'Forms', selected: false },
    { name: 'form_assignments', label: 'Form Assignments', selected: false },
    { name: 'form_categories', label: 'Form Categories', selected: false },
    { name: 'form_deployments', label: 'Form Deployments', selected: false },
    { name: 'form_responses', label: 'Form Responses', selected: false },
    { name: 'graduation_records', label: 'Graduation Records', selected: false },
    { name: 'instructors', label: 'Instructors', selected: false },
    { name: 'instructor_courses', label: 'Instructor Courses', selected: false },
    { name: 'instructor_feedback', label: 'Instructor Feedback', selected: false },
    { name: 'notifications', label: 'Notifications', selected: false },
    { name: 'questions', label: 'Questions', selected: false },
    { name: 'question_details', label: 'Question Details', selected: false },
    { name: 'question_options', label: 'Question Options', selected: false },
    { name: 'sections', label: 'Sections', selected: false },
    { name: 'students', label: 'Students', selected: false },
    { name: 'student_promotion_history', label: 'Student Promotion History', selected: false },
    { name: 'subject_evaluation_responses', label: 'Subject Evaluation Responses', selected: false },
    { name: 'subject_feedback', label: 'Subject Feedback', selected: false },
    { name: 'subject_instructors', label: 'Subject Instructors', selected: false },
    { name: 'subject_offerings', label: 'Subject Offerings', selected: false },
    { name: 'subject_sections', label: 'Subject Sections', selected: false },
    { name: 'subject_students', label: 'Subject Students', selected: false },
    { name: 'system_settings', label: 'System Settings', selected: false },
    { name: 'users', label: 'Users', selected: false }
  ];

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/backups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBackups(data.backups || []);
      } else {
        console.error("Failed to fetch backups:", data.message);
        toast.error("Failed to load backups");
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast.error("Failed to load backups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error("Please enter a backup name");
      return;
    }

    if (selectedTables.length === 0) {
      toast.error("Please select at least one table to backup");
      return;
    }

    setCreatingBackup(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/backups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: backupName.trim(),
          tables: selectedTables,
          format: exportFormat,
          type: selectedTables.length === tableOptions.length ? 'full' : 'custom'
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Backup created successfully");
        fetchBackups();
        setShowCreateDialog(false);
        setBackupName("");
        setSelectedTables([]);
      } else {
        toast.error(data.message || "Failed to create backup");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Failed to create backup");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) {
      toast.error("Backup not found");
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/backups/${backupId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = backup.format === 'sql' ? '.sql' : '.csv';
        a.download = `backup-${backupId}${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Backup downloaded successfully");
      } else {
        toast.error("Failed to download backup");
      }
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast.error("Failed to download backup");
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    setSelectedDeleteId(backupId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBackup = async () => {
    if (!selectedDeleteId) return;

    setDeletingBackup(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/backups/${selectedDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Backup deleted successfully");
        fetchBackups();
        setShowDeleteDialog(false);
        setSelectedDeleteId(null);
      } else {
        toast.error(data.message || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Failed to delete backup");
    } finally {
      setDeletingBackup(false);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getLatestBackupDate = () => {
    const completedBackups = backups.filter(b => b.status === 'completed');
    if (completedBackups.length === 0) return 'No backups yet';
    const latest = completedBackups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    return formatDate(latest.created_at);
  };

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAllTables = () => {
    setSelectedTables(tableOptions.map(t => t.name));
  };

  const deselectAllTables = () => {
    setSelectedTables([]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-200 rounded animate-pulse"></div>
            <div>
              <div className="h-8 bg-blue-200 rounded animate-pulse mb-2 w-64"></div>
              <div className="h-4 bg-blue-100 rounded animate-pulse w-96"></div>
            </div>
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-16"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Backup Button Skeleton */}
        <Card className="border-blue-100">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-64"></div>
              </div>
              <div className="h-10 bg-blue-200 rounded animate-pulse w-40"></div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-24 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Backup & Recovery System</h2>
            <p className="text-gray-600 mt-1">
              Professional admin dashboard for managing University Feedback System database backups
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Overview - Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600">{backups.length}</div>
                <p className="text-sm text-blue-700">Total Backups</p>
              </div>
              <Database className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {backups.filter(b => b.status === 'completed').length}
                </div>
                <p className="text-sm text-green-700">Completed Backups</p>
              </div>
              <Shield className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-purple-600">{getLatestBackupDate()}</div>
                <p className="text-sm text-purple-700">Latest Backup</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Backup Section */}
      <Card className="border-blue-100">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Backup</h3>
              <p className="text-sm text-gray-600">Configure and create a new system backup</p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Management - Cards Display */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup Management</h3>
        {backups.length === 0 ? (
          <Card className="border-dashed border-gray-300">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Backups Found</h4>
                <p className="text-gray-600 mb-4">Get started by creating your first backup</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backups.map((backup) => (
              <Card key={backup.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{backup.name}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      backup.status === 'completed' ? 'bg-green-100 text-green-700' :
                      backup.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {backup.status === 'in_progress' ? 'In Progress' : backup.status}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      backup.type === 'full' ? 'bg-blue-100 text-blue-700' :
                      backup.type === 'incremental' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {backup.type}
                    </span>
                    {backup.format && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {backup.format.toUpperCase()}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Created:</strong> {formatDate(backup.created_at)}</p>
                    {backup.tables && backup.tables.length > 0 && (
                      <p><strong>Tables:</strong> {backup.tables.length} selected</p>
                    )}
                  </div>
                   <div className="flex gap-2 mt-4">
                     {backup.status === 'completed' && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDownloadBackup(backup.id)}
                         className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                       >
                         <Download className="w-4 h-4 mr-1" />
                         Download
                       </Button>
                     )}
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleDeleteBackup(backup.id)}
                       className="text-red-500 hover:text-red-700 hover:bg-red-50"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Backup Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Backup
            </DialogTitle>
            <DialogDescription>
              Configure your backup settings and select the data tables to include
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Backup Name */}
            <div className="space-y-2">
              <Label htmlFor="backup-name">Backup Name</Label>
              <Input
                id="backup-name"
                placeholder="Enter backup name..."
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
              />
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sql"
                    name="format"
                    value="sql"
                    checked={exportFormat === 'sql'}
                    onChange={(e) => setExportFormat(e.target.value as 'sql')}
                    className="text-blue-600"
                  />
                  <Label htmlFor="sql" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    SQL (.sql) - Complete database dump for restoration
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="csv"
                    name="format"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'csv')}
                    className="text-blue-600"
                  />
                  <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    CSV (.csv) - Tabular data format for spreadsheets
                  </Label>
                </div>
              </div>
            </div>

            {/* Table Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Data Tables</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllTables}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllTables}
                    className="text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                {tableOptions.map((table) => (
                  <div key={table.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={table.name}
                      checked={selectedTables.includes(table.name)}
                      onCheckedChange={() => toggleTableSelection(table.name)}
                    />
                    <Label
                      htmlFor={table.name}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {table.label}
                    </Label>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600">
                Selected: {selectedTables.length} of {tableOptions.length} tables
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBackup}
              disabled={creatingBackup || !backupName.trim() || selectedTables.length === 0}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {creatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Backup</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected backup. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Warning: Data Loss</p>
                  <p className="text-red-700 text-sm mt-1">
                    Deleting this backup will remove it permanently. Make sure you have downloaded it if needed.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this backup?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteBackup}
              disabled={deletingBackup}
              className="bg-red-500 hover:bg-red-600"
            >
              {deletingBackup ? "Deleting..." : "Delete Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default SystemSettings;