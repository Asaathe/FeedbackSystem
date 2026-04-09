import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  Calendar,
  Search,
  RefreshCw,
  Users,
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";

// Types
type TrackingStatus = 'pending' | 'sent' | 'updated' | 'scheduled';

interface AlumniTrackerRecord {
  id: number;
  alumni_user_id: number;
  alumni_name: string;
  alumni_email: string;
  company_name: string | null;
  job_title: string | null;
  employment_status: string | null;
  update_status: TrackingStatus;
  last_update_sent: string | null;
  last_update_received: string | null;
  next_email_date: string | null;
  update_email_count: number;
  response_deadline: string | null;
  days_since_last_update: number;
  status_description: string;
  graduation_date?: string | null;
}

interface Props {
  onNavigate?: (page: string) => void;
}

// Status configuration for the Shopee-like stepper
const statusConfig: Record<TrackingStatus, { 
  label: string; 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
 
}> = {
  pending: {
    label: "Email Pending",
    icon: <Mail className="w-4 h-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
   
  },
  sent: {
    label: "Email Sent",
    icon: <Send className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  
  },
  updated: {
    label: "Employment Updated",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
   
  },
  scheduled: {
    label: "Next Email Scheduled",
    icon: <Calendar className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",

  }
};

// Shopee-like Progress Stepper Component
function ProgressStepper({ currentStatus }: { currentStatus: TrackingStatus }) {
  const steps: TrackingStatus[] = ['pending', 'sent', 'updated', 'scheduled'];
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const config = statusConfig[step];

        return (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {index > 0 && (
              <div 
                className={`absolute top-5 left-0 w-full h-0.5 -z-10 ${
                  index <= currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
                style={{ 
                  left: '-50%', 
                  width: 'calc(100% - 2.5rem)',
                  transform: 'translateY(-50%)'
                }}
              />
            )}
            
            {/* Step circle */}
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${isCurrent ? `${config.bgColor} ${config.color} ring-2 ring-offset-2 ring-${config.color.replace('text-', '')}` : ''}
                ${isPending ? 'bg-gray-100 text-gray-400' : ''}
              `}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                config.icon
              )}
            </div>
            
            {/* Step label */}
            <span 
              className={`
                text-xs mt-2 text-center font-medium
                ${isCurrent ? config.color : isCompleted ? 'text-green-600' : 'text-gray-400'}
              `}
            >
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Compact stepper for table rows
function CompactStepper({ currentStatus }: { currentStatus: TrackingStatus }) {
  const steps: TrackingStatus[] = ['pending', 'sent', 'updated', 'scheduled'];
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const config = statusConfig[step];

        return (
          <div key={step} className="flex items-center">
            <div 
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${isCurrent ? `${config.bgColor} ${config.color}` : ''}
                ${isPending ? 'bg-gray-100 text-gray-300' : ''}
              `}
              title={config.label}
            >
              {isCompleted ? '✓' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`w-4 h-0.5 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AlumniEmploymentTracker({ onNavigate }: Props) {
  const [records, setRecords] = useState<AlumniTrackerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [selectedAlumniForStepper, setSelectedAlumniForStepper] = useState<AlumniTrackerRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch tracker data
  const fetchTrackerData = async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/employment-tracker?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
        setTotalPages(data.pagination.total_pages);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error('Error fetching tracker data:', error);
      toast.error('Failed to load tracker data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrackerData(1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Send update request to single alumni
  const handleSendUpdateRequest = async (alumniUserId: number) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/employment-tracker/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ alumniUserId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Update request email sent successfully');
        fetchTrackerData(currentPage);
      } else {
        toast.error(data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending update request:', error);
      toast.error('Failed to send update request');
    }
  };

  // Send bulk update requests
  const handleBulkSend = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one alumni');
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/employment-tracker/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ alumniUserIds: selectedRecords }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Sent ${data.success} emails successfully${data.failed > 0 ? `, ${data.failed} failed` : ''}`);
        setSelectedRecords([]);
        fetchTrackerData(currentPage);
      } else {
        toast.error(data.message || 'Failed to send bulk emails');
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast.error('Failed to send bulk emails');
    }
  };

  // Run the scheduler manually (for testing)
  const handleRunScheduler = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/employment-tracker/test-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Scheduler ran: ${data.result.sent} emails sent, ${data.result.failed} failed`);
        fetchTrackerData(currentPage);
      } else {
        toast.error(data.message || 'Failed to run scheduler');
      }
    } catch (error) {
      console.error('Error running scheduler:', error);
      toast.error('Failed to run scheduler');
    }
  };

  // Toggle record selection
  const toggleSelectRecord = (id: number) => {
    setSelectedRecords(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(r => r.id));
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status: TrackingStatus) => {
    const config = statusConfig[status];
    if (!config) {
      return (
        <Badge className="bg-gray-100 text-gray-600 border-0">
          <span className="ml-1">{status || 'Unknown'}</span>
        </Badge>
      );
    }
    return (
      <Badge className={`${config.bgColor} ${config.color} border-0`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Alumni Employment Update Tracker</h2>
            <p className="text-gray-600 mt-1">
              Track and manage employment update requests for alumni 
            </p>
          </div>
        </div>
      </div>

      {/* Shopee-like Stepper Legend */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-500" />
            Progress Tracking - Email Update Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {selectedAlumniForStepper ? (
            <ProgressStepper currentStatus={selectedAlumniForStepper.update_status} />
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-1 text-gray-300" />
              <p className="text-sm">Click on an alumni row to view their progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card className="border-gray-200">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Email Pending</SelectItem>
                <SelectItem value="sent">Email Sent</SelectItem>
                <SelectItem value="updated">Employment Updated</SelectItem>
                <SelectItem value="scheduled">Next Email Scheduled</SelectItem>
                <SelectItem value="due">Due for Update (11+ months)</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBulkSend}
                disabled={selectedRecords.length === 0}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Update Request{selectedRecords.length > 0 && ` (${selectedRecords.length})`}
              </Button>
              <Button
                variant="outline"
                onClick={handleRunScheduler}
                className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                title="Run the employment update scheduler now (for testing)"
              >
                <Clock className="w-4 h-4" />
                Run Scheduler
              </Button>
            </div> 
          </div>

        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="p-0 h-8"
                  >
                    {selectedRecords.length === records.length && records.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="pl-4">Alumni</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Next Email</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No alumni employment records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <React.Fragment key={record.id}>
                    <TableRow
                      className={`${selectedRecords.includes(record.id) ? 'bg-green-50' : ''} ${selectedAlumniForStepper?.id === record.id ? 'ring-2 ring-green-500' : ''} cursor-pointer hover:bg-gray-50`}
                      onClick={() => setSelectedAlumniForStepper(record)}
                    >
                      <TableCell className="pl-4 w-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSelectRecord(record.id)}
                          className="p-0 h-8"
                        >
                          {selectedRecords.includes(record.id) ? (
                            <CheckSquare className="w-4 h-4 text-green-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="pl-4">
                        <div>
                          <div className="font-medium">{record.alumni_name}</div>
                          <div className="text-xs text-gray-500">{record.alumni_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{record.company_name || '-'}</div>
                          <div className="text-xs text-gray-500">{record.job_title || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.update_status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Sent: {formatDate(record.last_update_sent)}</div>
                          <div className="text-xs text-gray-500">Received: {formatDate(record.last_update_received)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.next_email_date ? (
                          <div className="text-sm">
                            <div>{formatDate(record.next_email_date)}</div>
                            <div className="text-xs text-gray-500">
                              {record.update_email_count} request{record.update_email_count !== 1 ? 's' : ''} sent
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          {record.update_status !== 'updated' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendUpdateRequest(record.alumni_user_id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    

                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
          {/* Pagination - inside table card for seamless appearance */}
          {totalPages > 1 && (
            <div className="border-t bg-gray-50 py-3">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTrackerData(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTrackerData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

export default AlumniEmploymentTracker;
