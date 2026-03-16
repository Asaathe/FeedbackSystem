import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  BookOpen,
  User,
  Send,
  Calendar,
  ChevronRight,
  Check,
  AlertCircle,
  Layers
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: number;
  category_name: string;
  description: string;
  display_order: number;
  feedback_type?: 'subject' | 'instructor' | 'general';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  parent_category_id?: number | null;
  subcategories?: Category[];
}

interface Subject {
  subject_id: number;
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

interface StudentFeedbackProps {
  onNavigate?: (page: string) => void;
}

export function StudentFeedback({ onNavigate }: StudentFeedbackProps = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [feedbackType, setFeedbackType] = useState<'subject' | 'instructor' | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('authToken');
      
      // Fetch categories (default to subject type for initial load)
      const categoriesResponse = await fetch('http://localhost:5000/api/feedback-templates/categories?feedback_type=subject', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      }

      // Check if evaluation is active
      const periodResponse = await fetch('http://localhost:5000/api/feedback-templates/periods/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const periodData = await periodResponse.json();
      if (periodData.success && periodData.period) {
        setPeriod(periodData.period);
      }

      // Fetch student's enrolled subjects
      const subjectsResponse = await fetch('http://localhost:5000/api/feedback-templates/student/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subjectsData = await subjectsResponse.json();
      if (subjectsData.success) {
        setSubjects(subjectsData.subjects || []);
        setAcademicYear(subjectsData.academic_year || "");
        setSemester(subjectsData.semester || "");
      }

      // Fetch feedback status
      const statusResponse = await fetch('http://localhost:5000/api/feedback-templates/student/feedback-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusResponse.json();
      if (statusData.success) {
        setFeedbackStatus({
          subject: statusData.subject_feedback || {},
          instructor: statusData.instructor_feedback || {}
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };

  const handleRateSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setFeedbackType('subject');
    setRatings({});
    loadCategories('subject');
  };

  const handleRateInstructor = (subject: Subject) => {
    setSelectedSubject(subject);
    setFeedbackType('instructor');
    setRatings({});
    loadCategories('instructor');
  };

  const loadCategories = async (type: 'subject' | 'instructor') => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/feedback-templates/categories?feedback_type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleRatingChange = (categoryId: number, rating: number) => {
    setRatings(prev => ({ ...prev, [categoryId]: rating }));
  };

  const handleSubmitFeedback = async () => {
    const subcategories = categories.filter(c => c.parent_category_id && c.parent_category_id !== 0);
    if (Object.keys(ratings).length !== subcategories.length) {
      toast.error("Please rate all categories");
      return;
    }

    if (!selectedSubject) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('authToken');
      
      // Calculate overall rating
      const ratingValues = Object.values(ratings);
      const overallRating = ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length;

      const responses: Record<string, number> = {};
      categories.forEach(cat => {
        responses[cat.category_name] = ratings[cat.id] || 0;
      });

      const endpoint = feedbackType === 'subject' 
        ? 'http://localhost:5000/api/feedback-templates/subject-feedback'
        : 'http://localhost:5000/api/feedback-templates/instructor-feedback';

      const payload = {
        subject_id: selectedSubject.subject_id,
        instructor_id: selectedSubject.instructor_id,
        responses,
        overall_rating: overallRating,
        academic_year: academicYear,
        semester: semester
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${feedbackType === 'subject' ? 'Subject' : 'Instructor'} feedback submitted successfully!`);
        setSelectedSubject(null);
        setFeedbackType(null);
        setRatings({});
        loadData(); // Refresh status
      } else {
        toast.error(data.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const isFeedbackSubmitted = (subjectId: number, type: 'subject' | 'instructor') => {
    if (type === 'subject') {
      return feedbackStatus.subject?.[subjectId] !== undefined;
    } else {
      // Check by subject-instructor combination
      const key = `${subjectId}`;
      return feedbackStatus.instructor?.[key] !== undefined;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your subjects...</p>
        </div>
      </div>
    );
  }

  // Check if evaluation is active
  const isEvaluationActive = period && period.is_active && period.is_within_period;

  // Feedback form view
  if (selectedSubject && feedbackType) {
    const submitted = isFeedbackSubmitted(selectedSubject.subject_id, feedbackType);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedSubject(null); setFeedbackType(null); }}>
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

        {submitted ? (
          <Card className="border-green-100">
            <CardContent className="py-8">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700">Feedback Already Submitted</h3>
                <p className="text-gray-600 mt-2">
                  You have already submitted your {feedbackType === 'subject' ? 'subject' : 'instructor'} feedback for this {feedbackType === 'subject' ? 'course' : 'instructor'}.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Instructor Info */}
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="text-lg">
                  {feedbackType === 'instructor' ? 'Instructor' : 'Subject'} Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    {selectedSubject.instructor_image ? (
                      <img src={selectedSubject.instructor_image} alt={selectedSubject.instructor_name} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-green-500 text-white">
                        {getInitials(selectedSubject.instructor_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedSubject.instructor_name}</p>
                    <p className="text-sm text-gray-500">
                      {feedbackType === 'instructor' ? 'Your Instructor' : 'Instructor for this subject'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating Form */}
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle>Rate {feedbackType === 'subject' ? 'this Subject' : 'this Instructor'}</CardTitle>
                <CardDescription>
                  Please select one option for each category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Group categories by parent - main categories (no parent) show as headings */}
                {(() => {
                  const mainCategories = categories.filter(c => !c.parent_category_id && c.parent_category_id !== 0);
  
  const getSubcategories = (parentId: number) => {
    return categories.filter(c => c.parent_category_id === parentId);
  };
                  
                  return mainCategories.map((mainCat) => (
                    <div key={mainCat.id} className="space-y-4">
                      {/* Main Category Heading */}
                      <div className="bg-green-50 rounded-lg border border-green-200 p-4 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800 text-lg">{mainCat.category_name}</h3>
                            {mainCat.description && (
                              <p className="text-sm text-green-600 mt-0.5">{mainCat.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Subcategories with ratings */}
                      {getSubcategories(mainCat.id).map((subcat) => (
                        <div key={subcat.id} className="ml-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Label className="text-base">
                              {subcat.category_name}
                              <span className="text-red-500 ml-1">*</span>
                            </Label>
                          </div>
                          {subcat.description && (
                            <p className="text-sm text-gray-500">{subcat.description}</p>
                          )}
                          <div className="pt-2">
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 5, label: 'Strongly Agree' },
                                { value: 4, label: 'Agree' },
                                { value: 3, label: 'Neutral' },
                                { value: 2, label: 'Disagree' },
                                { value: 1, label: 'Strongly Disagree' }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleRatingChange(subcat.id, option.value)}
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200
                                    ${ratings[subcat.id] === option.value 
                                      ? 'border-green-500 bg-green-50 text-green-700' 
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }
                                  `}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    ratings[subcat.id] === option.value 
                                      ? 'border-green-500 bg-green-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {ratings[subcat.id] === option.value && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium">{option.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmitFeedback}
              disabled={submitting || Object.keys(ratings).length !== categories.filter(c => c.parent_category_id && c.parent_category_id !== 0).length}
              className="w-full bg-green-500 hover:bg-green-600"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </>
        )}
      </div>
    );
  }

  // Subject list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl font-bold">My Subjects</h2>
        <p className="text-gray-600 mt-1">
          Rate your subjects and instructors for the current semester
        </p>
        {period && period.is_active && (
          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-green-500">
              <Calendar className="w-3 h-3 mr-1" />
              Evaluation Active
            </Badge>
            <span className="text-sm text-gray-600">
              {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
            </span>
          </div>
        )}
        {!period?.is_active && (
          <div className="mt-3">
            <Badge variant="secondary">
              Evaluation Period: Inactive
            </Badge>
          </div>
        )}
      </div>

      {/* Evaluation Status */}
      {!isEvaluationActive && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Evaluation Not Active</p>
                <p className="text-sm text-yellow-700">
                  Feedback collection is currently closed. Please check back later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Cards */}
      <div className="grid gap-4">
        {subjects.map((subject) => {
          const subjectSubmitted = isFeedbackSubmitted(subject.subject_id, 'subject');
          const instructorSubmitted = isFeedbackSubmitted(subject.subject_id, 'instructor');
          
          return (
            <Card key={subject.subject_id} className="border-green-100 hover:border-green-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      {subject.instructor_image ? (
                        <img src={subject.instructor_image} alt={subject.instructor_name} className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-green-500 text-white">
                          {getInitials(subject.instructor_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{subject.subject_name}</h3>
                      <p className="text-sm text-gray-600">
                        {subject.subject_code} • {subject.department}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-500">{subject.instructor_name}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={subjectSubmitted ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleRateSubject(subject)}
                    disabled={!isEvaluationActive}
                    className={subjectSubmitted ? "border-green-200" : "bg-green-500 hover:bg-green-600"}
                  >
                    {subjectSubmitted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Subject Rated
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-1" />
                        Rate Subject
                      </>
                    )}
                  </Button>
                  <Button
                    variant={instructorSubmitted ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleRateInstructor(subject)}
                    disabled={!isEvaluationActive}
                    className={instructorSubmitted ? "border-blue-200 text-blue-700" : "bg-blue-500 hover:bg-blue-600"}
                  >
                    {instructorSubmitted ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Instructor Rated
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-1" />
                        Rate Instructor
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {subjects.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No Subjects Enrolled</h3>
              <p className="text-gray-500 mt-1">You are not enrolled in any subjects for this semester.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
