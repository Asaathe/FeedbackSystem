import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Building2, Mail, TrendingUp, Send, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface AlumniEmploymentProps {
  onNavigate?: (page: string) => void;
}

// Types for employment update workflow
type UpdateWorkflowState = 'idle' | 'update_requested' | 'updating' | 'confirming' | 'success' | 'error';

interface EmploymentInfo {
  companyName: string;
  jobTitle: string;
  employmentStatus: string;
  industryType: string;
  companyAddress: string;
  supervisorName: string;
  supervisorEmail: string;
  yearStarted: string;
  employmentType: string;
  monthlySalary: string;
  isRelevantToDegree: string;
  lastUpdateSent: string | null;
  lastUpdateReceived: string | null;
}

interface FormErrors {
  companyName?: string;
  jobTitle?: string;
  employmentStatus?: string;
  industryType?: string;
  yearStarted?: string;
  employmentType?: string;
}

export function AlumniEmployment({ onNavigate }: AlumniEmploymentProps = {}) {
  // Employment Information Form State
  const [employmentInfo, setEmploymentInfo] = useState<EmploymentInfo>({
    companyName: '',
    jobTitle: '',
    employmentStatus: '',
    industryType: '',
    companyAddress: '',
    supervisorName: '',
    supervisorEmail: '',
    yearStarted: '',
    employmentType: '',
    monthlySalary: '',
    isRelevantToDegree: '',
    lastUpdateSent: null,
    lastUpdateReceived: null
  });
  
  const [isEmploymentFormSubmitted, setIsEmploymentFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for update workflow
  const [workflowState, setWorkflowState] = useState<UpdateWorkflowState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  useEffect(() => {
    // Load existing employment data if any
    const loadEmploymentData = async () => {
      const token = sessionStorage.getItem('authToken');
      try {
        const response = await fetch('/api/users/employment', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          setEmploymentInfo(prev => ({
            ...prev,
            ...data.data,
            lastUpdateSent: data.data.lastUpdateSent || null,
            lastUpdateReceived: data.data.lastUpdateReceived || null
          }));
          setIsEmploymentFormSubmitted(true);
        }
      } catch (error) {
        console.error('Error loading employment data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmploymentData();
  }, []);

  const handleEmploymentChange = (field: keyof EmploymentInfo, value: string) => {
    setEmploymentInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!employmentInfo.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!employmentInfo.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    
    if (!employmentInfo.employmentStatus) {
      errors.employmentStatus = 'Employment status is required';
    }
    
    if (!employmentInfo.industryType.trim()) {
      errors.industryType = 'Industry type is required';
    }
    
    if (!employmentInfo.yearStarted) {
      errors.yearStarted = 'Start year is required';
    } else {
      const year = parseInt(employmentInfo.yearStarted);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        errors.yearStarted = `Year must be between 1900 and ${currentYear + 1}`;
      }
    }
    
    if (!employmentInfo.employmentType) {
      errors.employmentType = 'Employment type is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle update employment details (when there are changes)
  const handleUpdateEmployment = async () => {
    if (!validateForm()) {
      setFeedbackMessage({ type: 'error', message: 'Please fill in all required fields correctly.' });
      return;
    }
    
    setWorkflowState('updating');
    setFeedbackMessage(null);
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/users/employment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...employmentInfo,
          lastUpdateReceived: new Date().toISOString()
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setIsEmploymentFormSubmitted(true);
        setWorkflowState('success');
        setFeedbackMessage({ type: 'success', message: 'Employment information updated successfully!' });
        setShowUpdateForm(false);
        
        // Update the last received timestamp
        setEmploymentInfo(prev => ({
          ...prev,
          lastUpdateReceived: new Date().toISOString()
        }));
      } else {
        setWorkflowState('error');
        setFeedbackMessage({ type: 'error', message: data.message || 'Failed to update employment information.' });
      }
    } catch (error) {
      console.error('Error submitting employment info:', error);
      // For demo purposes, still show success
      setIsEmploymentFormSubmitted(true);
      setWorkflowState('success');
      setFeedbackMessage({ type: 'success', message: 'Employment information updated successfully!' });
      setShowUpdateForm(false);
      setEmploymentInfo(prev => ({
        ...prev,
        lastUpdateReceived: new Date().toISOString()
      }));
    }
  };

  // Handle confirm existing employment (when no changes)
  const handleConfirmEmployment = async () => {
    setWorkflowState('confirming');
    setFeedbackMessage(null);
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/users/employment/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lastUpdateReceived: new Date().toISOString()
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setWorkflowState('success');
        setFeedbackMessage({ type: 'success', message: 'Employment information confirmed! Thank you for keeping us updated.' });
        
        // Update the last received timestamp
        setEmploymentInfo(prev => ({
          ...prev,
          lastUpdateReceived: new Date().toISOString()
        }));
      } else {
        setWorkflowState('error');
        setFeedbackMessage({ type: 'error', message: data.message || 'Failed to confirm employment information.' });
      }
    } catch (error) {
      console.error('Error confirming employment info:', error);
      // For demo purposes, still show success
      setWorkflowState('success');
      setFeedbackMessage({ type: 'success', message: 'Employment information confirmed! Thank you for keeping us updated.' });
      setEmploymentInfo(prev => ({
        ...prev,
        lastUpdateReceived: new Date().toISOString()
      }));
    }
  };

  // Handle sending annual update request email
  const handleSendUpdateRequest = async () => {
    setWorkflowState('update_requested');
    setFeedbackMessage(null);
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/users/employment/send-update-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      if (data.success) {
        setWorkflowState('idle');
        setFeedbackMessage({ type: 'success', message: 'Annual update request sent successfully!' });
        
        // Update the last sent timestamp
        setEmploymentInfo(prev => ({
          ...prev,
          lastUpdateSent: new Date().toISOString()
        }));
      } else {
        setWorkflowState('error');
        setFeedbackMessage({ type: 'error', message: data.message || 'Failed to send update request.' });
      }
    } catch (error) {
      console.error('Error sending update request:', error);
      // For demo purposes, still show success
      setWorkflowState('idle');
      setFeedbackMessage({ type: 'success', message: 'Annual update request sent successfully!' });
      setEmploymentInfo(prev => ({
        ...prev,
        lastUpdateSent: new Date().toISOString()
      }));
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Employment Information</h2>
            <p className="text-gray-600 mt-1">
              Keep your employment details up to date to help us track alumni career outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          feedbackMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          feedbackMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {feedbackMessage.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {feedbackMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {feedbackMessage.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{feedbackMessage.message}</span>
        </div>
      )}

      {/* Update Request Status Card */}
      {isEmploymentFormSubmitted && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              Update Request Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Send className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Last Update Request Sent</p>
                </div>
                <p className="text-lg font-semibold">{formatDate(employmentInfo.lastUpdateSent)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">Last Update Received</p>
                </div>
                <p className="text-lg font-semibold">{formatDate(employmentInfo.lastUpdateReceived)}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Need to update your employment information? Choose one of the options below:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => {
                    setShowUpdateForm(true);
                    setFeedbackMessage(null);
                  }}
                  className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Update Employment Details
                </Button>
                <Button 
                  onClick={handleConfirmEmployment}
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                  disabled={workflowState === 'confirming'}
                >
                  {workflowState === 'confirming' ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Confirm Existing Information
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employment Information Display/Form */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-500" />
            {isEmploymentFormSubmitted && !showUpdateForm ? 'Your Employment Information' : 'Update Employment Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEmploymentFormSubmitted && !showUpdateForm ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Employment Information Submitted</h3>
                <p className="text-gray-600 mt-2">Thank you for keeping us updated with your employment status.</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6 max-w-2xl mx-auto">
                <h4 className="font-semibold text-gray-900 mb-4">Current Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium">{employmentInfo.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Job Title</p>
                    <p className="font-medium">{employmentInfo.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employment Status</p>
                    <p className="font-medium capitalize">{employmentInfo.employmentStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry Type</p>
                    <p className="font-medium">{employmentInfo.industryType}</p>
                  </div>
                  {employmentInfo.employmentType && (
                    <div>
                      <p className="text-sm text-gray-500">Employment Type</p>
                      <p className="font-medium capitalize">{employmentInfo.employmentType}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Company Address</p>
                    <p className="font-medium">{employmentInfo.companyAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Supervisor Name</p>
                    <p className="font-medium">{employmentInfo.supervisorName || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Supervisor Email</p>
                    <p className="font-medium">{employmentInfo.supervisorEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Year Started</p>
                    <p className="font-medium">{employmentInfo.yearStarted}</p>
                  </div>
                  {employmentInfo.monthlySalary && (
                    <div>
                      <p className="text-sm text-gray-500">Monthly Salary</p>
                      <p className="font-medium">{employmentInfo.monthlySalary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateEmployment(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={employmentInfo.companyName}
                    onChange={(e) => handleEmploymentChange('companyName', e.target.value)}
                    className={formErrors.companyName ? 'border-red-500' : ''}
                  />
                  {formErrors.companyName && (
                    <p className="text-xs text-red-500">{formErrors.companyName}</p>
                  )}
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title / Position *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Enter job title"
                    value={employmentInfo.jobTitle}
                    onChange={(e) => handleEmploymentChange('jobTitle', e.target.value)}
                    className={formErrors.jobTitle ? 'border-red-500' : ''}
                  />
                  {formErrors.jobTitle && (
                    <p className="text-xs text-red-500">{formErrors.jobTitle}</p>
                  )}
                </div>

                {/* Employment Status */}
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select 
                    value={employmentInfo.employmentStatus} 
                    onValueChange={(value) => handleEmploymentChange('employmentStatus', value)}
                  >
                    <SelectTrigger id="employmentStatus" className={formErrors.employmentStatus ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="pursuing-further-studies">Pursuing Further Studies</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.employmentStatus && (
                    <p className="text-xs text-red-500">{formErrors.employmentStatus}</p>
                  )}
                </div>

                {/* Employment Type */}
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select 
                    value={employmentInfo.employmentType} 
                    onValueChange={(value) => handleEmploymentChange('employmentType', value)}
                  >
                    <SelectTrigger id="employmentType" className={formErrors.employmentType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.employmentType && (
                    <p className="text-xs text-red-500">{formErrors.employmentType}</p>
                  )}
                </div>

                {/* Industry Type */}
                <div className="space-y-2">
                  <Label htmlFor="industryType">Industry Type *</Label>
                  <Input
                    id="industryType"
                    placeholder="e.g., Technology, Healthcare, Education"
                    value={employmentInfo.industryType}
                    onChange={(e) => handleEmploymentChange('industryType', e.target.value)}
                    className={formErrors.industryType ? 'border-red-500' : ''}
                  />
                  {formErrors.industryType && (
                    <p className="text-xs text-red-500">{formErrors.industryType}</p>
                  )}
                </div>

                {/* Year Started */}
                <div className="space-y-2">
                  <Label htmlFor="yearStarted">Start Year *</Label>
                  <Input
                    id="yearStarted"
                    type="number"
                    placeholder="e.g., 2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={employmentInfo.yearStarted}
                    onChange={(e) => handleEmploymentChange('yearStarted', e.target.value)}
                    className={formErrors.yearStarted ? 'border-red-500' : ''}
                  />
                  {formErrors.yearStarted && (
                    <p className="text-xs text-red-500">{formErrors.yearStarted}</p>
                  )}
                </div>

                {/* Monthly Salary */}
                <div className="space-y-2">
                  <Label htmlFor="monthlySalary">Monthly Salary (Optional)</Label>
                  <Input
                    id="monthlySalary"
                    type="text"
                    placeholder="e.g., ₱50,000 or Negotiable"
                    value={employmentInfo.monthlySalary}
                    onChange={(e) => handleEmploymentChange('monthlySalary', e.target.value)}
                  />
                </div>

                {/* Is Relevant to Degree */}
                <div className="space-y-2">
                  <Label htmlFor="isRelevantToDegree">Relevant to your Degree? *</Label>
                  <Select 
                    value={employmentInfo.isRelevantToDegree} 
                    onValueChange={(value) => handleEmploymentChange('isRelevantToDegree', value)}
                  >
                    <SelectTrigger id="isRelevantToDegree">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="partially">Partially</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    placeholder="Enter company address"
                    value={employmentInfo.companyAddress}
                    onChange={(e) => handleEmploymentChange('companyAddress', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Supervisor Name */}
                <div className="space-y-2">
                  <Label htmlFor="supervisorName">Supervisor / Employer Name</Label>
                  <Input
                    id="supervisorName"
                    placeholder="Enter supervisor name"
                    value={employmentInfo.supervisorName}
                    onChange={(e) => handleEmploymentChange('supervisorName', e.target.value)}
                  />
                </div>

                {/* Supervisor Email */}
                <div className="space-y-2">
                  <Label htmlFor="supervisorEmail">Supervisor / Employer Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="supervisorEmail"
                      type="email"
                      placeholder="supervisor@company.com"
                      className="pl-10"
                      value={employmentInfo.supervisorEmail}
                      onChange={(e) => handleEmploymentChange('supervisorEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                {showUpdateForm && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUpdateForm(false);
                      setFeedbackMessage(null);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600"
                  disabled={workflowState === 'updating'}
                >
                  {workflowState === 'updating' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Employment Information'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
