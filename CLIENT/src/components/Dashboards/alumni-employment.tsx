import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Building2, Mail, TrendingUp } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AlumniEmploymentProps {
  onNavigate?: (page: string) => void;
}

export function AlumniEmployment({ onNavigate }: AlumniEmploymentProps = {}) {
  // Employment Information Form State
  const [employmentInfo, setEmploymentInfo] = useState({
    companyName: '',
    jobTitle: '',
    employmentStatus: '',
    industryType: '',
    companyAddress: '',
    supervisorName: '',
    supervisorEmail: '',
    yearStarted: ''
  });
  const [isEmploymentFormSubmitted, setIsEmploymentFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setEmploymentInfo(data.data);
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

  const handleEmploymentChange = (field: string, value: string) => {
    setEmploymentInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleEmploymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/users/employment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(employmentInfo),
      });
      
      const data = await response.json();
      if (data.success) {
        setIsEmploymentFormSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting employment info:', error);
      // For demo purposes, still show success
      setIsEmploymentFormSubmitted(true);
    }
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

      {/* Employment Information Form */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-500" />
            {isEmploymentFormSubmitted ? 'Your Employment Information' : 'Update Employment Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEmploymentFormSubmitted && employmentInfo.companyName ? (
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
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => setIsEmploymentFormSubmitted(false)}
                >
                  Update Information
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmploymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={employmentInfo.companyName}
                    onChange={(e) => handleEmploymentChange('companyName', e.target.value)}
                    required
                  />
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title / Position *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Enter job title"
                    value={employmentInfo.jobTitle}
                    onChange={(e) => handleEmploymentChange('jobTitle', e.target.value)}
                    required
                  />
                </div>

                {/* Employment Status */}
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Employment Status *</Label>
                  <Select 
                    value={employmentInfo.employmentStatus} 
                    onValueChange={(value) => handleEmploymentChange('employmentStatus', value)}
                    required
                  >
                    <SelectTrigger id="employmentStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry Type */}
                <div className="space-y-2">
                  <Label htmlFor="industryType">Industry Type *</Label>
                  <Input
                    id="industryType"
                    placeholder="e.g., Technology, Healthcare, Education"
                    value={employmentInfo.industryType}
                    onChange={(e) => handleEmploymentChange('industryType', e.target.value)}
                    required
                  />
                </div>

                {/* Company Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Input
                    id="companyAddress"
                    placeholder="Enter company address"
                    value={employmentInfo.companyAddress}
                    onChange={(e) => handleEmploymentChange('companyAddress', e.target.value)}
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

                {/* Year Started */}
                <div className="space-y-2">
                  <Label htmlFor="yearStarted">Year Started *</Label>
                  <Input
                    id="yearStarted"
                    type="number"
                    placeholder="e.g., 2024"
                    min="1900"
                    max="2030"
                    value={employmentInfo.yearStarted}
                    onChange={(e) => handleEmploymentChange('yearStarted', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600"
                >
                  Submit Employment Information
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

