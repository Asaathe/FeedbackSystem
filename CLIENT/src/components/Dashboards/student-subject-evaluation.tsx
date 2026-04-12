import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  BookOpen, 
  ArrowLeft, 
  ChevronRight,
  FileText,
  Clock,
  CheckCircle,
  Send,
  X,
  Calendar,
  Star,
  User
} from "lucide-react";
import { toast } from "sonner";

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  subject_instructor_id: number;
  semester: string;
  academic_year: string;
  course_section_id: number;
  instructor_id: number | null;
  instructor_name: string | null;
  instructor_email: string | null;
  instructor_department: string | null;
  instructor_image: string | null;
  enrollment_id: number;
  enrolled_at: string;
}

interface PublishedForm {
  id: string;
  title: string;
  description: string;
  category: string;
  target_audience: string;
  dueDate?: string;
  assignment_status: string;
  form_id?: number;
  is_submitted?: boolean;
  evaluation_form_id?: number;
}

interface Question {
  id?: number;
  question?: string;
  text?: string;
  type?: string;
  question_type?: string;
  options?: any[];
}

interface StudentSubjectEvaluationProps {
  onNavigate?: (page: string) => void;
}

export function StudentSubjectEvaluation({ onNavigate }: StudentSubjectEvaluationProps = {}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [availableForms, setAvailableForms] = useState<PublishedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(new Set());
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<PublishedForm | null>(null);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);
  const [formResponses, setFormResponses] = useState<Record<number, any>>({});
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  useEffect(() => {
    fetchMySubjects();
    fetchSubmittedFormIds();
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/settings/current-semester', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCurrentSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchMySubjects = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subject-evaluation/my-subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("My Subjects API response:", data);
      
      if (data.success) {
        console.log("Subjects received:", data.subjects);
        if (data.subjects && data.subjects.length > 0) {
          console.log("First subject instructor data:", {
            instructor_name: data.subjects[0].instructor_name,
            instructor_image: data.subjects[0].instructor_image
          });
        }
        setSubjects(data.subjects || []);
      } else {
        toast.error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedFormIds = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/forms/my-responses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const submittedIds = new Set<string>(result.responses?.map((r: any) => String(r.form_id)) || []);
        setSubmittedFormIds(submittedIds);
      }
    } catch (error) {
      console.error('Error fetching submitted forms:', error);
    }
  };

  const fetchFormsForSubject = async (subject: Subject) => {
    setLoadingForms(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        return;
      }

      const response = await fetch('/api/subject-evaluation/my-evaluations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.evaluations) {
        const subjectEvaluations = data.evaluations.filter((eval_item: any) => {
          return eval_item.subject_id === subject.subject_id && eval_item.form_id;
        });

        setAvailableForms(subjectEvaluations.map((eval_item: any) => ({
          id: eval_item.evaluation_form_id.toString(),
          title: eval_item.form_title || 'Subject Evaluation',
          description: eval_item.form_description || 'Please evaluate this subject',
          category: eval_item.form_category || 'Evaluation',
          target_audience: 'Student Subject Evaluation',
          dueDate: eval_item.end_date ? new Date(eval_item.end_date).toLocaleDateString() : undefined,
          assignment_status: eval_item.is_submitted ? 'completed' : 'pending',
          form_id: eval_item.form_id,
          is_submitted: eval_item.is_submitted,
          evaluation_form_id: eval_item.evaluation_form_id
        })));
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch evaluation forms');
    } finally {
      setLoadingForms(false);
    }
  };

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    await fetchFormsForSubject(subject);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setAvailableForms([]);
    setShowEvaluationForm(false);
  };

  const handleStartEvaluation = async (formId: string) => {
    const form = availableForms.find(f => f.id === formId);
    if (!form) {
      toast.error('Form not found');
      return;
    }

    if (!form.form_id) {
      toast.error('No form assigned to this evaluation');
      return;
    }

    setSelectedForm(form);
    setFormResponses({});
    setFormQuestions([]);
    setLoadingForm(true);
    setShowEvaluationForm(true);
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/forms/${form.form_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
       
      const data = await response.json();
      console.log("Form data received:", data);
      
      if (data.success && data.form) {
        const questions = data.form.questions || [];
        console.log("Questions count:", questions.length);
        console.log("Questions:", questions);
        setFormQuestions(questions);
      } else {
        toast.error(data.message || 'Failed to load form');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCloseEvaluation = () => {
    setShowEvaluationForm(false);
    setSelectedForm(null);
    setFormQuestions([]);
    setFormResponses({});
  };

  const handleResponseChange = (questionId: number, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedForm || !selectedSubject || !selectedForm.form_id) {
      toast.error('Missing form or subject information');
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const evaluationFormId = selectedForm.evaluation_form_id || parseInt(selectedForm.id);
      const response = await fetch('/api/subject-evaluation/evaluation-submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_id: selectedForm.form_id,
          subject_id: selectedSubject.subject_id,
          evaluation_form_id: evaluationFormId,
          responses: formResponses
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Evaluation submitted successfully!');
        handleCloseEvaluation();
        if (selectedSubject) {
          await fetchFormsForSubject(selectedSubject);
        }
      } else {
        toast.error(data.message || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Helper to get full image URL
  const getImageUrl = (imagePath: string | null | undefined): string | undefined => {
    if (!imagePath) return undefined;
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Otherwise, prepend the server URL
    return `${imagePath}`;
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    return isNaN(date.getTime()) ? false : date < new Date();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your subjects...</p>
        </div>
      </div>
    );
  }

  // View: Evaluation Form (inline, not popup)
  if (showEvaluationForm && selectedForm) {
    const answeredCount = Object.keys(formResponses).length;
    const progress = formQuestions.length > 0 ? (answeredCount / formQuestions.length) * 100 : 0;

    return (
      <div className="space-y-3 sm:space-y-4 -mx-3 px-3 sm:mx-0 sm:px-0">
        {/* Compact Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseEvaluation}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-xl font-bold truncate">{selectedForm.title}</h2>
            <p className="text-gray-500 text-xs sm:text-sm truncate">
              {selectedSubject?.subject_name} • {selectedSubject?.subject_code}
            </p>
          </div>
        </div>

        {/* Compact Progress */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="whitespace-nowrap">{answeredCount}/{formQuestions.length}</span>
        </div>

        {/* Questions */}
        {loadingForm ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-green-500"></div>
            <p className="ml-2 text-xs sm:text-sm text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 -mx-3 px-3 sm:mx-0 sm:px-0">
            {formQuestions.map((question, index) => (
              <Card key={question.id || index} className="border-gray-200">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-xs">
                      {index + 1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight pt-0.5">
                      {question.question || question.text}
                    </h3>
                  </div>
                  
                  {/* Rating Question */}
                  {(question.type === 'rating' || question.question_type === 'rating') && (
                    <div className="ml-7 sm:ml-11">
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleResponseChange(question.id!, rating)}
                            className={`p-0.5 transition-all duration-200 flex-shrink-0 ${
                              formResponses[question.id!] >= rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Text Question */}
                  {(question.type === 'text' || question.question_type === 'text') && (
                    <div className="ml-7 sm:ml-11">
                      <textarea
                        value={formResponses[question.id!] || ''}
                        onChange={(e) => handleResponseChange(question.id!, e.target.value)}
                        placeholder="Type here..."
                        className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 text-xs sm:text-sm"
                        rows={2}
                      />
                    </div>
                  )}
                  
                  {/* Multiple Choice Question */}
                  {((question.type === 'multiple_choice' || question.question_type === 'multiple_choice') && question.options) && (
                    <div className="ml-7 sm:ml-11 space-y-1 sm:space-y-2">
                      {question.options.map((option: any, optIndex: number) => {
                        const optionValue = option.option_text || option;
                        return (
                          <label
                            key={optIndex}
                            className={`flex items-center p-1.5 sm:p-2 border rounded cursor-pointer transition-all duration-200 ${
                              formResponses[question.id!] === optionValue
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                          >
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center mr-2 flex-shrink-0 ${
                              formResponses[question.id!] === optionValue
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {formResponses[question.id!] === optionValue && (
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={optionValue}
                              checked={formResponses[question.id!] === optionValue}
                              onChange={() => handleResponseChange(question.id!, optionValue)}
                              className="sr-only"
                            />
                            <span className="text-xs sm:text-sm text-gray-700">{optionValue}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 sm:pt-3 sm:border-t border-gray-200">
          <p className="text-xs text-gray-400 order-2 sm:order-1">Anonymous</p>
          <Button
            onClick={handleSubmitEvaluation}
            disabled={submitting || answeredCount === 0}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 sm:px-6 w-full sm:w-auto order-1 sm:order-2 text-sm"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent sm:mr-2" />
                <span className="hidden sm:inline text-xs">Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3 sm:mr-1.5" />
                <span className="text-xs">Submit</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // View: Subject Forms (when a subject is selected)
  if (selectedSubject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToSubjects}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{selectedSubject.subject_name}</h2>
            <p className="text-gray-600">
              {selectedSubject.subject_code} • {selectedSubject.semester} • {selectedSubject.academic_year}
            </p>
          </div>
        </div>

        {/* Instructor Card */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                {getImageUrl(selectedSubject?.instructor_image) ? (
                  <img 
                    src={getImageUrl(selectedSubject?.instructor_image) || ''} 
                    alt={selectedSubject?.instructor_name || 'Instructor'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <AvatarFallback className="bg-green-500 text-white text-lg">
                    {getInitials(selectedSubject.instructor_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">
                  {selectedSubject.instructor_name || 'No Instructor Assigned'}
                </h3>
                {selectedSubject.instructor_department && (
                  <p className="text-sm text-gray-600">
                    {selectedSubject.instructor_department}
                  </p>
                )}
                {selectedSubject.instructor_email && (
                  <p className="text-sm text-gray-500">
                    {selectedSubject.instructor_email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Evaluation Forms */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Subject Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingForms ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading evaluation forms...</p>
              </div>
            ) : availableForms.length > 0 ? (
              <div className="space-y-3">
                {availableForms.map((form) => {
                  const isSubmitted = submittedFormIds.has(form.id);
                  const overdue = isOverdue(form.dueDate) && !isSubmitted;
                  
                  return (
                    <div 
                      key={form.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isSubmitted 
                          ? 'border-green-200 bg-green-50/50' 
                          : overdue 
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-gray-200 hover:border-green-200 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{form.title}</h3>
                            {isSubmitted && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Submitted
                              </Badge>
                            )}
                            {overdue && !isSubmitted && (
                              <Badge className="bg-red-100 text-red-700">
                                <Clock className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{form.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {form.category}
                          </span>
                          {form.dueDate && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-600' : ''}`}>
                              <Clock className="w-4 h-4" />
                              Due: {form.dueDate}
                            </span>
                          )}
                        </div>
                        
                        {isSubmitted ? (
                           <Button variant="outline" size="sm" disabled>
                             <CheckCircle className="w-4 h-4 sm:mr-2" />
                             <span className="hidden sm:inline">Completed</span>
                           </Button>
                        ) : (
                           <Button
                             className="bg-green-500 hover:bg-green-600"
                             size="sm"
                             onClick={() => handleStartEvaluation(form.id)}
                           >
                             <Send className="w-4 h-4 sm:mr-2" />
                             <span className="hidden sm:inline">Start Evaluation</span>
                           </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No evaluation forms available for this subject</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for updates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Subjects List
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Subjects</h2>
            <p className="text-gray-600 mt-1">View your enrolled subjects and submit evaluations</p>
          </div>
          {currentSettings && (
            <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {(currentSettings.college?.semester || currentSettings.seniorHigh?.semester || 'No active period')} {(currentSettings.college?.academic_year || currentSettings.seniorHigh?.academic_year || '')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {subjects.map((subject) => (
            <Card
              key={subject.subject_id}
              className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer h-[320px] flex flex-col overflow-hidden"
              onClick={() => handleSubjectClick(subject)}
            >
              <CardHeader className="flex-shrink-0 pb-3">
                <CardTitle className="text-lg leading-tight line-clamp-2 h-16 flex items-start overflow-hidden" title={subject.subject_name} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {subject.subject_name}
                </CardTitle>
                <p className="text-sm text-gray-500">{subject.subject_code}</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 p-4 pt-0">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{subject.semester}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>{subject.academic_year}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Instructor</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        {getImageUrl(subject.instructor_image) ? (
                          <img
                            src={getImageUrl(subject.instructor_image)}
                            alt={subject.instructor_name || 'Instructor'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-green-500 text-white text-sm">
                            {getInitials(subject.instructor_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <p className="text-sm font-medium truncate">
                        {subject.instructor_name || 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <Button variant="outline" className="w-full border-green-200 hover:bg-green-50">
                    <span className="hidden sm:inline">View Evaluations</span>
                    <ChevronRight className="w-4 h-4 sm:ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-green-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No subjects enrolled yet</p>
            <p className="text-sm text-gray-400 mt-1">Contact your administrator for subject enrollment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

