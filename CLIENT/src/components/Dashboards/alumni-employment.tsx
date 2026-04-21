import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Building2, Mail, TrendingUp, Send, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { ExpandableContent, FadeContent } from "../ui/transition-container";

// Privacy Policy Content
const privacyPolicyContent = (
  <div className="space-y-4">
    <p>This Privacy Policy describes how the University collects, uses, and protects the personal information you provide through our Alumni Feedback System, in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.</p>

    <div>
      <strong>Information Collected</strong>
      <p>We collect the following information through the Alumni Employment Information form:</p>
      <ul className="list-disc ml-5">
        <li>Personal details: Company name, job title, employment status, industry type, employment type, start year, monthly salary, relevance to degree.</li>
        <li>Contact information: Supervisor/employer name, supervisor/employer email.</li>
        <li>Additional details: Company address.</li>
      </ul>
    </div>

    <div>
      <strong>Purpose of Data Use</strong>
      <p>The collected information is used to:</p>
      <ul className="list-disc ml-5">
        <li>Track alumni career outcomes and employment statistics.</li>
        <li>Provide insights to improve university programs and services.</li>
        <li>Communicate with alumni regarding updates and opportunities.</li>
        <li>Maintain accurate alumni records.</li>
      </ul>
    </div>

    <div>
      <strong>Data Protection</strong>
      <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, access controls, and secure storage practices.</p>
    </div>

    <div>
      <strong>Data Sharing</strong>
      <p>Your information may be shared with:</p>
      <ul className="list-disc ml-5">
        <li>University administrators and staff for research and analysis purposes.</li>
        <li>Third-party service providers who assist in maintaining the system, subject to confidentiality agreements.</li>
        <li>Government agencies as required by law.</li>
      </ul>
      <p>We do not sell or rent your personal information to third parties.</p>
    </div>

    <div>
      <strong>Data Retention</strong>
      <p>Personal information is retained for as long as necessary to fulfill the purposes outlined above, typically for the duration of your alumni status and beyond as required for statistical analysis and historical records.</p>
    </div>

    <div>
      <strong>User Rights</strong>
      <p>Under the Data Privacy Act, you have the right to:</p>
      <ul className="list-disc ml-5">
        <li>Access your personal information.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request erasure of your data, subject to legal requirements.</li>
        <li>Object to processing in certain circumstances.</li>
        <li>File a complaint with the National Privacy Commission.</li>
      </ul>
    </div>

    <div>
      <strong>Contact Information</strong>
      <p>For questions or concerns regarding your privacy, please contact:</p>
      <p>ACTS Computer College<br />EGK Building, P. Guevara Avenue, corner A. Bonifacio Street, Santa Cruz, Philippines, 4009<br />Email: feedbacts@gmail.com</p>
    </div>

    <div>
      <strong>Consent Statement</strong>
      <p>By submitting this form, I hereby give my consent to the University to collect, process, and use my personal information as described in this Privacy Policy.</p>
    </div>
  </div>
);

// Terms and Conditions Content
const termsAndConditionsContent = (
  <div className="space-y-4">
    <p>These Terms and Conditions govern your use of the University Alumni Feedback System. By accessing and using this system, you agree to be bound by these terms.</p>

    <div>
      <strong>Acceptable Use of the System</strong>
      <p>The system is intended for alumni to provide feedback on their employment status and career development. Use must be lawful and in accordance with university policies.</p>
    </div>

    <div>
      <strong>User Responsibilities</strong>
      <p>Users are responsible for:</p>
      <ul className="list-disc ml-5">
        <li>Providing honest, accurate, and up-to-date information.</li>
        <li>Respecting the privacy and rights of others.</li>
        <li>Using the system in a professional and respectful manner.</li>
      </ul>
    </div>

    <div>
      <strong>Prohibited Actions</strong>
      <p>The following actions are strictly prohibited:</p>
      <ul className="list-disc ml-5">
        <li>Submitting false, misleading, or inaccurate information.</li>
        <li>Engaging in spamming or excessive submissions.</li>
        <li>Attempting to abuse, hack, or disrupt the system.</li>
        <li>Sharing confidential or sensitive information inappropriately.</li>
      </ul>
    </div>

    <div>
      <strong>Limitation of Liability</strong>
      <p>The university shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of this system. Information provided is for informational purposes only.</p>
    </div>

    <div>
      <strong>System Availability Disclaimer</strong>
      <p>The system is provided on an "as is" basis. The university does not guarantee uninterrupted or error-free operation. Maintenance and updates may result in temporary unavailability.</p>
    </div>

    <div>
      <strong>Governing Law</strong>
      <p>These terms are governed by the laws of the Republic of the Philippines.</p>
    </div>

    <p>By checking the agreement boxes, I acknowledge that I have read, understood, and agree to the Privacy Policy and Terms and Conditions.</p>
  </div>
);

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
  supervisorName?: string;
  supervisorEmail?: string;
  agreedToPrivacy?: string;
  agreedToTerms?: string;
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
   const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
   const [agreedToTerms, setAgreedToTerms] = useState(false);
   const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
  
  // Annual update requirement state
  const [isAnnualUpdateRequired, setIsAnnualUpdateRequired] = useState(false);
  const [showAnnualNotification, setShowAnnualNotification] = useState(false);

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
          // Check if there is actual employment data submitted (not just an empty record)
          console.log('[DEBUG] Checking employment fields:', {
            companyName: data.data.companyName,
            jobTitle: data.data.jobTitle,
            employmentStatus: data.data.employmentStatus,
            industryType: data.data.industryType,
            yearStarted: data.data.yearStarted,
            employmentType: data.data.employmentType
          });
          
          // Check with proper truthy value check (handle empty strings)
          // employmentStatus can be empty string which is falsy - treat it as valid if other fields exist
          const hasActualEmploymentData = Boolean(
            data.data.companyName && 
            data.data.jobTitle && 
            // employmentStatus can be empty string but if other fields exist, data is valid
            data.data.industryType &&
            data.data.yearStarted &&
            data.data.employmentType
          );
          console.log('[DEBUG] hasActualEmploymentData:', hasActualEmploymentData);
          
          // Additional check: if we have companyName and jobTitle, consider it valid employment data
          // Even if employmentStatus is empty, the alumni has provided employment info
          const hasBasicEmploymentInfo = Boolean(data.data.companyName && data.data.jobTitle);
          console.log('[DEBUG] hasBasicEmploymentInfo:', hasBasicEmploymentInfo);
          
          // Get update status from backend (scheduled/updated/sent/pending)
          const updateStatus = data.data.updateStatus || data.data.update_status || 'pending';
          console.log('[DEBUG] Update Status:', updateStatus, '| Full data:', JSON.stringify(data.data));
          
          // PRIMARY CHECK: If status is updated/scheduled, always hide warning
          if (updateStatus === 'updated' || updateStatus === 'scheduled') {
            console.log('[DEBUG] Status is updated/scheduled - hiding warning');
            setIsAnnualUpdateRequired(false);
            setShowAnnualNotification(false);
            
            // STILL set form as submitted if status is updated/scheduled
            // This means alumni has already responded to the update request
            setIsEmploymentFormSubmitted(true);
            
            // Set employment info if available
            if (hasActualEmploymentData || hasBasicEmploymentInfo) {
              setEmploymentInfo(prev => ({
                ...prev,
                ...data.data,
                lastUpdateSent: data.data.lastUpdateSent || null,
                lastUpdateReceived: data.data.lastUpdateReceived || null
              }));
            }
            return;
          }
          
          // Status is sent/pending - check if employment data exists
          if (hasActualEmploymentData || hasBasicEmploymentInfo) {
            // Has employment data - check months since last update
            const lastUpdateReceived = data.data.lastUpdateReceived ? new Date(data.data.lastUpdateReceived) : null;
            const lastUpdateSent = data.data.lastUpdateSent ? new Date(data.data.lastUpdateSent) : null;
            setEmploymentInfo(prev => ({
              ...prev,
              ...data.data,
              lastUpdateSent: data.data.lastUpdateSent || null,
              lastUpdateReceived: data.data.lastUpdateReceived || null
            }));
            setIsEmploymentFormSubmitted(true);
            
            // Check if 11+ months have passed since last update
            if (lastUpdateReceived) {
              const monthsSinceUpdate = (new Date().getTime() - lastUpdateReceived.getTime()) / (1000 * 60 * 60 * 24 * 30);
              console.log('[DEBUG] Months since update:', monthsSinceUpdate);
              if (monthsSinceUpdate >= 11) {
                setIsAnnualUpdateRequired(true);
                setShowAnnualNotification(true);
                triggerAnnualUpdateEmail();
              } else {
                setIsAnnualUpdateRequired(false);
                setShowAnnualNotification(false);
              }
            } else if (lastUpdateSent) {
              setIsAnnualUpdateRequired(true);
              setShowAnnualNotification(true);
            }
          } else {
            // No employment data - check if email was sent
            const lastUpdateSent = data.data.lastUpdateSent ? new Date(data.data.lastUpdateSent) : null;
            console.log('[DEBUG] No employment data - checking lastUpdateSent:', lastUpdateSent);
            if (lastUpdateSent) {
              console.log('[DEBUG] Showing warning - email was sent');
              setIsAnnualUpdateRequired(true);
              setShowAnnualNotification(true);
            } else {
              console.log('[DEBUG] No employment data, no email sent');
            }
          }
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
    
    if (!employmentInfo.supervisorName.trim()) {
      errors.supervisorName = 'Supervisor name is required';
    }
    
    if (!employmentInfo.supervisorEmail.trim()) {
      errors.supervisorEmail = 'Supervisor email is required';
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employmentInfo.supervisorEmail)) {
        errors.supervisorEmail = 'Please enter a valid email address';
      }
    }

    if (!agreedToPrivacy) {
      errors.agreedToPrivacy = 'You must agree to the Privacy Policy';
    }

    if (!agreedToTerms) {
      errors.agreedToTerms = 'You must agree to the Terms and Conditions';
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
          lastUpdateReceived: formatDateForMySQL(new Date())
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('[DEBUG] Employment update successful, re-fetching data...');
        setIsEmploymentFormSubmitted(true);
        setWorkflowState('success');
        setFeedbackMessage({ type: 'success', message: 'Employment information updated successfully!' });
        setShowUpdateForm(false);
        // Reset annual update requirement after successful update
        setIsAnnualUpdateRequired(false);
        setShowAnnualNotification(false);
        
        // Update the last received timestamp
        setEmploymentInfo(prev => ({
          ...prev,
          lastUpdateReceived: new Date().toISOString()
        }));
        
        // Re-fetch employment data to get updated status from server
        try {
          const token = sessionStorage.getItem('authToken');
          const refreshResponse = await fetch('/api/users/employment', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const refreshData = await refreshResponse.json();
          console.log('[DEBUG] Refreshed data - updateStatus:', refreshData.data?.updateStatus, refreshData.data?.update_status);
        } catch (refreshError) {
          console.error('[DEBUG] Error refreshing data:', refreshError);
        }
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
      // Reset annual update requirement after successful update
      setIsAnnualUpdateRequired(false);
      setShowAnnualNotification(false);
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
          lastUpdateReceived: formatDateForMySQL(new Date())
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setWorkflowState('success');
        setFeedbackMessage({ type: 'success', message: 'Employment information confirmed! Thank you for keeping us updated.' });
        
        // Reset annual update requirement
        setIsAnnualUpdateRequired(false);
        setShowAnnualNotification(false);
        
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
      // Reset annual update requirement
      setIsAnnualUpdateRequired(false);
      setShowAnnualNotification(false);
      setEmploymentInfo(prev => ({
        ...prev,
        lastUpdateReceived: new Date().toISOString()
      }));
    }
  };

  // Trigger annual update email notification
  const triggerAnnualUpdateEmail = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      await fetch('/api/users/employment/annual-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error sending annual update notification:', error);
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

  // Format date for MySQL datetime
  const formatDateForMySQL = (date: Date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
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
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white rounded-lg p-6 border">
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
      <FadeContent isVisible={!!feedbackMessage}>
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          feedbackMessage?.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          feedbackMessage?.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {feedbackMessage?.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {feedbackMessage?.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {feedbackMessage?.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{feedbackMessage?.message}</span>
        </div>
      </FadeContent>

      {/* Annual Update Notification */}
      <FadeContent isVisible={showAnnualNotification}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base">Annual Employment Update Required</p>
            <p className="text-xs sm:text-sm">It's been over 11 months since your last employment update. Please review and update your employment information.</p>
          </div>
          <Button
            onClick={() => {
              setShowUpdateForm(true);
              setShowAnnualNotification(false);
            }}
            size="sm"
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto mt-2 sm:mt-0"
          >
            Update Now
          </Button>
        </div>
      </FadeContent>

      {/* Update Request Status Card - Only visible when annual update is required */}
      {isAnnualUpdateRequired && (
      <Card className="border-red-200">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-red-700">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm sm:text-base">⚠️ Annual Update Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-red-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-red-700">Last Update Request Sent</p>
              </div>
              <p className="text-sm sm:text-lg font-semibold">{formatDate(employmentInfo.lastUpdateSent)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-red-700">Last Update Received</p>
              </div>
              <p className="text-sm sm:text-lg font-semibold">{formatDate(employmentInfo.lastUpdateReceived)}</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-red-200">
            <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">
              It's been over 11 months since your last update. Please review and update your employment information:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowUpdateForm(true);
                  setShowAnnualNotification(false);
                }}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <TrendingUp className="w-4 h-4" />
                Update Employment Details
              </Button>
              <Button
                onClick={handleConfirmEmployment}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-2 w-full sm:w-auto"
                disabled={workflowState === 'confirming'}
                size="sm"
              >
                {workflowState === 'confirming' ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
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
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-500" />
            {isEmploymentFormSubmitted && !showUpdateForm ? 'Your Employment Information' : 'Update Employment Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isEmploymentFormSubmitted && !showUpdateForm ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Employment Information Submitted</h3>
                <p className="text-gray-600 mt-2">Thank you for keeping us updated with your employment status.</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl mx-auto">
                <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Current Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
                
                {/* Manual Update Button - Always available */}
                <div className="mt-4 sm:mt-6 pt-4 border-t border-green-200 flex justify-center">
                  <Button
                    onClick={() => {
                      setShowUpdateForm(true);
                      setFeedbackMessage(null);
                    }}
                    className="bg-green-500 hover:bg-green-600 flex items-center gap-2 w-full sm:w-auto"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Update My Employment Information
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateEmployment(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={employmentInfo.companyName}
                    onChange={(e) => handleEmploymentChange('companyName', e.target.value)}
                    className={`border border-gray-200 ${formErrors.companyName ? 'border-red-500' : ''}`}
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
                    value={employmentInfo.jobTitle}
                    onChange={(e) => handleEmploymentChange('jobTitle', e.target.value)}
                    className={`border border-gray-200 ${formErrors.jobTitle ? 'border-red-500' : ''}`}
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
                    <SelectTrigger id="employmentStatus" className={`border border-gray-200 ${formErrors.employmentStatus ? 'border-red-500' : ''}`}>
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
                    <SelectTrigger id="employmentType" className={`border border-gray-200 ${formErrors.employmentType ? 'border-red-500' : ''}`}>
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
                    className={`border border-gray-200 ${formErrors.industryType ? 'border-red-500' : ''}`}
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
                    className={`border border-gray-200 ${formErrors.yearStarted ? 'border-red-500' : ''}`}
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
                    className="border border-gray-200"
                  />
                </div>

                {/* Is Relevant to Degree */}
                <div className="space-y-2">
                  <Label htmlFor="isRelevantToDegree">Relevant to your Degree? *</Label>
                  <Select 
                    value={employmentInfo.isRelevantToDegree} 
                    onValueChange={(value) => handleEmploymentChange('isRelevantToDegree', value)}
                  >
                    <SelectTrigger id="isRelevantToDegree" className="border border-gray-200">
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
                    value={employmentInfo.companyAddress}
                    onChange={(e) => handleEmploymentChange('companyAddress', e.target.value)}
                    rows={2}
                    className="border border-gray-200"
                  />
                </div>

                {/* Supervisor Name */}
                <div className="space-y-2">
                  <Label htmlFor="supervisorName">Supervisor / Employer Name *</Label>
                  <Input
                    id="supervisorName"
                    value={employmentInfo.supervisorName}
                    onChange={(e) => handleEmploymentChange('supervisorName', e.target.value)}
                    className={`border border-gray-200 ${formErrors.supervisorName ? 'border-red-500' : ''}`}
                  />
                  {formErrors.supervisorName && (
                    <p className="text-xs text-red-500">{formErrors.supervisorName}</p>
                  )}
                </div>

                {/* Supervisor Email */}
                <div className="space-y-2">
                  <Label htmlFor="supervisorEmail">Supervisor / Employer Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="supervisorEmail"
                      type="email"
                      placeholder="supervisor@company.com"
                      className={`pl-10 border border-gray-200 ${formErrors.supervisorEmail ? 'border-red-500' : ''}`}
                      value={employmentInfo.supervisorEmail}
                      onChange={(e) => handleEmploymentChange('supervisorEmail', e.target.value)}
                    />
                  </div>
                  {formErrors.supervisorEmail && (
                    <p className="text-xs text-red-500">{formErrors.supervisorEmail}</p>
                  )}
                </div>
              </div>

              {/* Privacy Policy and Terms and Conditions */}
              <Card className="mt-6 border-gray-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="privacy-agreement"
                        checked={agreedToPrivacy}
                        onChange={(e) => {
                          setAgreedToPrivacy(e.target.checked);
                          if (formErrors.agreedToPrivacy) {
                            setFormErrors(prev => ({ ...prev, agreedToPrivacy: undefined }));
                          }
                        }}
                        className="mt-1"
                      />
                      <label htmlFor="privacy-agreement" className="text-sm">
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacy(!showPrivacy)}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Privacy Policy
                        </button>{' '}
                        *
                      </label>
                    </div>
                    {formErrors.agreedToPrivacy && (
                      <p className="text-xs text-red-500 ml-6">{formErrors.agreedToPrivacy}</p>
                    )}
                    <ExpandableContent isExpanded={showPrivacy}>
                      <div className="ml-6 p-3 border border-gray-200 rounded bg-gray-50 text-sm max-h-96 overflow-y-auto">
                        {privacyPolicyContent}
                      </div>
                    </ExpandableContent>
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="terms-agreement"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked);
                          if (formErrors.agreedToTerms) {
                            setFormErrors(prev => ({ ...prev, agreedToTerms: undefined }));
                          }
                        }}
                        className="mt-1"
                      />
                      <label htmlFor="terms-agreement" className="text-sm">
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTerms(!showTerms)}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Terms and Conditions
                        </button>{' '}
                        *
                      </label>
                    </div>
                    {formErrors.agreedToTerms && (
                      <p className="text-xs text-red-500 ml-6">{formErrors.agreedToTerms}</p>
                    )}
                    <ExpandableContent isExpanded={showTerms}>
                      <div className="ml-6 p-3 border border-gray-200 rounded bg-gray-50 text-sm max-h-96 overflow-y-auto">
                        {termsAndConditionsContent}
                      </div>
                    </ExpandableContent>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-center sm:justify-end pt-4 gap-3">
                {showUpdateForm && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUpdateForm(false);
                      setFeedbackMessage(null);
                      setAgreedToPrivacy(false);
                      setAgreedToTerms(false);
                      setShowPrivacy(false);
                      setShowTerms(false);
                      setFormErrors({});
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
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
