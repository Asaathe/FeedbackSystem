import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Label } from "../ui/label";
import { 
  Loader2, 
  BookOpen, 
  User, 
  Calendar, 
  GraduationCap, 
  Star, 
  CheckCircle, 
  ArrowLeft,
  Send,
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface Subject {
  subject_id: number;
  section_id?: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  instructor_id: number;
  instructor_name: string;
  instructor_image: string;
  has_subject_feedback: boolean;
  has_instructor_feedback: boolean;
}

interface EvaluationPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_within_period?: boolean;
}

interface Category {
  id: number;
  category_name: string;
  description: string;
  display_order: number;
  feedback_type?: 'subject' | 'instructor' | 'general';
  is_active: boolean;
  parent_category_id?: number | null;
}

interface MySubjectsProps {
  onNavigate?: (page: string) => void;
}

export function MySubjects({ onNavigate }: MySubjectsProps = {}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  
  // Rating form state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [feedbackType, setFeedbackType] = useState<'subject' | 'instructor' | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  // Lockout state to prevent re-submission after receiving "already submitted" message
  // Initialize from sessionStorage to persist across navigations
  const getInitialLockedState = (): Record<string, boolean> => {
    try {
      const stored = sessionStorage.getItem('feedbackSubmissionLocked');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };
  const [submissionLocked, setSubmissionLocked] = useState<Record<string, boolean>>(getInitialLockedState);

  useEffect(() => {
    fetchMySubjects();
  }, []);

  // Also refresh lockout state from sessionStorage on mount to ensure it's current
  useEffect(() => {
    const stored = sessionStorage.getItem('feedbackSubmissionLocked');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Object.keys(parsed).length > 0) {
          setSubmissionLocked(parsed);
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  // Check if evaluation is active
  const isEvaluationActive = period && period.is_active && period.is_within_period;

  const fetchMySubjects = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('authToken');
      
      // Check if evaluation is active
      const periodResponse = await fetch('/api/feedback-templates/periods/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const periodData = await periodResponse.json();
      if (periodData.success && periodData.period) {
        setPeriod(periodData.period);
      }

      const response = await fetch('/api/feedback-templates/student/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects || []);
        setAcademicYear(data.academic_year || "");
        setSemester(data.semester || "");
      } else {
        toast.error('Failed to load subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (type: 'subject' | 'instructor') => {
    setLoadingForm(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/feedback-templates/categories?feedback_type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load rating categories");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleRateSubject = (subject: Subject) => {
    // Check if instructor is assigned (required for subject feedback)
    if (!subject.instructor_id) {
      toast.error("Cannot rate subject: No instructor is assigned to this subject yet");
      return;
    }

    // Check if feedback is already submitted
    if (isFeedbackSubmitted(subject.subject_id, 'subject')) {
      setSelectedSubject(subject);
      setFeedbackType('subject');
      return;
    }

    setSelectedSubject(subject);
    setFeedbackType('subject');
    setRatings({});
    loadCategories('subject');
  };

  const handleRateInstructor = (subject: Subject) => {
    // Check if instructor is assigned
    if (!subject.instructor_id) {
      toast.error("No instructor is assigned to this subject yet");
      return;
    }

    // Check if submission is already locked (student already tried and got "already submitted")
    if (isSubmissionLocked(subject.subject_id, 'instructor')) {
      setSelectedSubject(subject);
      setFeedbackType('instructor');
      return;
    }

    // Check if feedback is already submitted
    if (isFeedbackSubmitted(subject.subject_id, 'instructor')) {
      setSelectedSubject(subject);
      setFeedbackType('instructor');
      return;
    }

    setSelectedSubject(subject);
    setFeedbackType('instructor');
    setRatings({});
    loadCategories('instructor');
  };

  const handleRatingChange = (categoryId: number, rating: number) => {
    setRatings(prev => ({ ...prev, [categoryId]: rating }));
  };

  const handleSubmitFeedback = async () => {
    if (!selectedSubject || !feedbackType) return;

    // Check if submission is locked before attempting
    if (isSubmissionLocked(selectedSubject.subject_id, feedbackType)) {
      toast.error("You have already submitted feedback for this " + (feedbackType === 'subject' ? 'subject' : 'instructor'));
      return;
    }

    // Check if all subcategories are rated (not main categories)
    const subcategories = categories.filter(c => c.parent_category_id && c.parent_category_id !== 0);
    const allRated = subcategories.every(cat => ratings[cat.id]);
    if (!allRated) {
      toast.error('Please rate all categories');
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('authToken');
      
      const payload = {
        subject_id: selectedSubject.subject_id,
        section_id: selectedSubject.section_id,
        instructor_id: selectedSubject.instructor_id,
        feedback_type: feedbackType,
        ratings: ratings,
        academic_year: academicYear,
        semester: semester
      };

      const response = await fetch('/api/feedback-templates/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Feedback submitted successfully!');
        // Update the subject's feedback status
        setSubjects(prev => prev.map(s => {
          if (s.subject_id === selectedSubject.subject_id) {
            if (feedbackType === 'subject') {
              return { ...s, has_subject_feedback: true };
            } else {
              return { ...s, has_instructor_feedback: true };
            }
          }
          return s;
        }));
        // Go back to cards view
        setSelectedSubject(null);
        setFeedbackType(null);
        setRatings({});
      } else {
        // Lock submission on ANY error to be safe - prevents re-submission attempts
        // This ensures students can't retry after any submission failure
        if (selectedSubject && feedbackType) {
          lockSubmission(selectedSubject.subject_id, feedbackType);
        }
        toast.error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'TBA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'Computer Science': 'bg-blue-100 text-blue-700',
      'Mathematics': 'bg-purple-100 text-purple-700',
      'Physics': 'bg-indigo-100 text-indigo-700',
      'Chemistry': 'bg-green-100 text-green-700',
      'Biology': 'bg-emerald-100 text-emerald-700',
      'Engineering': 'bg-orange-100 text-orange-700',
      'Business': 'bg-yellow-100 text-yellow-700',
      'English': 'bg-pink-100 text-pink-700',
      'History': 'bg-amber-100 text-amber-700',
    };
    return colors[department] || 'bg-gray-100 text-gray-700';
  };

  // Check if feedback submission is locked for a specific subject-type combination
  const isSubmissionLocked = (subjectId: number, type: 'subject' | 'instructor') => {
    const key = `${subjectId}-${type}`;
    return submissionLocked[key] === true;
  };

  // Lock feedback submission for a specific subject-type combination
  const lockSubmission = (subjectId: number, type: 'subject' | 'instructor') => {
    const key = `${subjectId}-${type}`;
    const newState = { ...submissionLocked, [key]: true };
    setSubmissionLocked(newState);
    // Persist to sessionStorage to survive page navigation
    try {
      sessionStorage.setItem('feedbackSubmissionLocked', JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save lockout state:', e);
    }
  };

  const isFeedbackSubmitted = (subjectId: number, type: 'subject' | 'instructor') => {
    // First check if submission is locked (most restrictive)
    if (isSubmissionLocked(subjectId, type)) {
      return true;
    }
    const subject = subjects.find(s => s.subject_id === subjectId);
    if (!subject) return false;
    return type === 'subject' ? subject.has_subject_feedback : subject.has_instructor_feedback;
  };

  // If showing rating form
  if (selectedSubject && feedbackType) {
    const submitted = isFeedbackSubmitted(selectedSubject.subject_id, feedbackType);
    
    if (submitted) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => { setSelectedSubject(null); setFeedbackType(null); }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Subjects
          </Button>
          
          <Card className="border-green-100">
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700">Feedback Already Submitted</h3>
                <p className="text-gray-600 mt-2">
                  You have already submitted your {feedbackType === 'subject' ? 'subject' : 'instructor'} feedback for this {feedbackType === 'subject' ? 'subject' : 'instructor'}.
                </p>
                <Button 
                  className="mt-4 bg-green-500 hover:bg-green-600"
                  onClick={() => { setSelectedSubject(null); setFeedbackType(null); }}
                >
                  Back to My Subjects
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedSubject(null); setFeedbackType(null); setRatings({}); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {feedbackType === 'subject' ? 'Rate Subject' : 'Rate Instructor'}
            </h2>
            <p className="text-gray-600">
              {selectedSubject.subject_name} ({selectedSubject.subject_code})
            </p>
          </div>
        </div>

        {/* Instructor Info */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                {selectedSubject.instructor_image ? (
                  <img src={selectedSubject.instructor_image} alt={selectedSubject.instructor_name} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-green-500 text-white text-2xl">
                    {getInitials(selectedSubject.instructor_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {selectedSubject.instructor_name || 'No Instructor Assigned'}
                </p>
                <p className="text-sm text-green-700 font-medium">
                  {feedbackType === 'instructor' ? 'Your Instructor' : 'Instructor for this subject'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSubject.subject_name} ({selectedSubject.subject_code})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Form */}
        {loadingForm ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : (
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Rate {feedbackType === 'subject' ? 'this Subject' : 'this Instructor'}</CardTitle>
              <CardDescription>
                Please select one option for each category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Group categories by parent - main categories show as headings */}
              {(() => {
                const mainCategories = categories.filter(c => !c.parent_category_id && c.parent_category_id !== 0);
                const getSubcategories = (parentId: number) => categories.filter(c => c.parent_category_id === parentId);
                
                return mainCategories.map((mainCat) => {
                  const subcategories = getSubcategories(mainCat.id);
                  
                  return (
                    <div key={mainCat.id} className="space-y-4">
                      {/* Main Category Heading - Google Forms Style */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{mainCat.category_name}</h3>
                            {mainCat.description && (
                              <p className="text-sm text-gray-600 mt-0.5">{mainCat.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Subcategories with ratings - Google Forms Checkbox Grid Style */}
                      {subcategories.length > 0 && (
                        <div className="overflow-x-auto border rounded-lg shadow-sm">
                          <table className="w-full border-collapse bg-white">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm min-w-[180px] border-b border-r">
                                  Criteria
                                </th>
                                {[
                                  { value: 5, label: 'Strongly Agree' },
                                  { value: 4, label: 'Agree' },
                                  { value: 3, label: 'Neutral' },
                                  { value: 2, label: 'Disagree' },
                                  { value: 1, label: 'Strongly Disagree' }
                                ].map((option) => (
                                  <th 
                                    key={option.value} 
                                    className="text-center py-3 px-4 font-semibold text-gray-700 text-sm min-w-[90px] border-b border-r last:border-r-0"
                                  >
                                    {option.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {subcategories.map((subcat, subIndex) => (
                                <tr 
                                  key={subcat.id} 
                                  className={`border-b last:border-b-0 ${subIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50/50 transition-colors cursor-pointer`}
                                >
                                  <td className="py-3 px-4 border-r">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-800">
                                        {subcat.category_name}
                                      </span>
                                      {subcat.description && (
                                        <span className="text-xs text-gray-500 mt-0.5">{subcat.description}</span>
                                      )}
                                    </div>
                                  </td>
                                  {[
                                    { value: 5, label: 'Strongly Agree' },
                                    { value: 4, label: 'Agree' },
                                    { value: 3, label: 'Neutral' },
                                    { value: 2, label: 'Disagree' },
                                    { value: 1, label: 'Strongly Disagree' }
                                  ].map((option) => (
                                    <td 
                                      key={option.value} 
                                      className="text-center py-3 px-4 border-r last:border-r-0 cursor-pointer hover:bg-green-100/50 transition-colors"
                                      onClick={() => handleRatingChange(subcat.id, option.value)}
                                    >
                                      <div className="flex justify-center">
                                        <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center shadow-sm ${
                                          ratings[subcat.id] === option.value
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'
                                        }`}>
                                          {ratings[subcat.id] === option.value && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              <Button 
                className="w-full bg-green-500 hover:bg-green-600 mt-4"
                onClick={handleSubmitFeedback}
                disabled={submitting || Object.keys(ratings).length !== categories.filter(c => c.parent_category_id && c.parent_category_id !== 0).length}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show subject cards
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <div className="h-8 bg-green-200 rounded animate-pulse mb-2 w-48"></div>
          <div className="h-4 bg-green-100 rounded animate-pulse w-80"></div>
        </div>

        {/* Subject Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-green-100 hover:border-green-300 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                  <div className="ml-2">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-28"></div>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-12"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-20"></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
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
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl font-bold text-gray-900">My Subjects</h2>
        <p className="text-gray-600 mt-1">
          View your enrolled subjects for {semester || 'current semester'} {academicYear ? academicYear : ''}
        </p>
      </div>

      {/* Evaluation Status */}
      {!isEvaluationActive && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-4">
            <Calendar className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Evaluation Period Inactive</p>
              <p className="text-sm text-yellow-700">
                Feedback collection is not currently active. Please wait for the admin to create and activate an evaluation period.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Cards */}
      {subjects.length === 0 ? (
        <Card className="border-green-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Subjects Found</h3>
            <p className="text-gray-500 mt-1">
              You don't have any enrolled subjects for this semester.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card 
              key={subject.subject_id}
              className="border-green-100 hover:border-green-300 hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge className="mb-2" variant="secondary">
                      {subject.subject_code}
                    </Badge>
                    <CardTitle className="text-lg leading-tight">
                      {subject.subject_name}
                    </CardTitle>
                  </div>
                  <div className="ml-2">
                    <Badge className={getDepartmentColor(subject.department)}>
                      {subject.department}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    {subject.instructor_image ? (
                      <img
                        src={subject.instructor_image}
                        alt={subject.instructor_name || 'Instructor'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-green-500 text-white">
                        {subject.instructor_name ? getInitials(subject.instructor_name) : 'TBA'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {subject.instructor_name || 'To Be Assigned'}
                    </p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>{subject.units} units</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{semester || 'No active period'} {academicYear || ''}</span>
                  </div>
                </div>

                 {/* Action Buttons */}
                 <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                      size="sm"
                      onClick={() => handleRateSubject(subject)}
                      disabled={!isEvaluationActive || !subject.instructor_id}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Rate Subject
                    </Button>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                      size="sm"
                      onClick={() => handleRateInstructor(subject)}
                      disabled={!isEvaluationActive || !subject.instructor_id}
                    >
                      <User className="w-4 h-4 mr-1" />
                      Rate Instructor
                    </Button>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

