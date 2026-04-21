import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Settings, Shield, Download, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
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
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'full' | 'incremental';
}

export function SystemSettings({ onNavigate }: SystemSettingsProps = {}) {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

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
          type: "full",
          name: `Backup ${new Date().toLocaleDateString()}`,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Backup created successfully");
        fetchBackups();
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
        a.download = `backup-${backupId}.zip`;
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
    if (!confirm("Are you sure you want to delete this backup? This action cannot be undone.")) return;

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/backups/${backupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Backup deleted successfully");
        fetchBackups();
      } else {
        toast.error(data.message || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Failed to delete backup");
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackupId) return;

    setRestoringBackup(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/backups/${selectedBackupId}/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Backup restored successfully. The system may need to be restarted.");
        setShowRestoreDialog(false);
        setSelectedBackupId(null);
      } else {
        toast.error(data.message || "Failed to restore backup");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error("Failed to restore backup");
    } finally {
      setRestoringBackup(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system settings...</p>
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
              Manage system backups and emergency recovery options
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Emergency Backup Notice</h3>
              <p className="text-sm text-amber-700 mt-1">
                Regular backups are crucial for system recovery in case of data loss, corruption, or emergencies.
                Create backups frequently and store them securely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Actions */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Backup Management
          </CardTitle>
          <CardDescription>
            Create, download, and restore system backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="bg-green-500 hover:bg-green-600"
            >
              {creatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Create New Backup
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={fetchBackups}
              className="border-green-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh List
            </Button>
          </div>

          {/* Backup Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{backups.length}</div>
              <div className="text-sm text-gray-600">Total Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {backups.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {backups.filter(b => b.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card className="border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Backup History</CardTitle>
          <CardDescription>
            View and manage all system backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Click "Create New Backup" to create your first backup</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{backup.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-700' :
                        backup.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {backup.status}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {backup.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Created: {formatDate(backup.created_at)} • Size: {formatSize(backup.size)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBackupId(backup.id);
                            setShowRestoreDialog(true);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Restore Backup</DialogTitle>
            <DialogDescription>
              This will restore the system to the selected backup point. Current data may be overwritten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Warning: Data Loss Risk</p>
                  <p className="text-red-700 text-sm mt-1">
                    Restoring from a backup will replace current system data. This action cannot be undone.
                    Ensure you have a recent backup before proceeding.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to restore this backup? The system may become temporarily unavailable.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRestoreBackup}
              disabled={restoringBackup}
              className="bg-red-500 hover:bg-red-600"
            >
              {restoringBackup ? "Restoring..." : "Confirm Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SystemSettings;