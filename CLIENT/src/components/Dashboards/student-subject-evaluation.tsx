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
  X
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

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
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<PublishedForm | null>(null);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);
  const [formResponses, setFormResponses] = useState<Record<number, any>>({});
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper function to render subject info with proper type handling
  const renderSubjectInfo = () => {
    const subject = selectedSubject;
    if (!subject || !subject.subject_name) return null;
    return (
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
        <p className="font-medium text-green-800">
          {subject.subject_name} ({subject.subject_code})
        </p>
        <p className="text-sm text-green-600">
          Instructor: {subject.instructor_name || 'Not Assigned'}
        </p>
      </div>
    );
  };

  useEffect(() => {
    fetchMySubjects();
    fetchSubmittedFormIds();
  }, []);

  const fetchMySubjects = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/subject-evaluation/my-subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
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

      const response = await fetch('http://localhost:5000/api/forms/my-responses', {
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

      // Get evaluation forms assigned to this student for this subject
      // Use the new API that returns subject-specific evaluations
      const response = await fetch('http://localhost:5000/api/subject-evaluation/my-evaluations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.evaluations) {
        // Filter evaluations that match the current subject
        const subjectEvaluations = data.evaluations.filter((eval_item: any) => {
          return eval_item.subject_id === subject.subject_id && eval_item.form_id;
        });

        setAvailableForms(subjectEvaluations.map((eval_item: any) => ({
          id: eval_item.subject_instructor_id.toString(), // Use subject_instructor_id as id
          title: eval_item.form_title || 'Subject Evaluation',
          description: eval_item.form_description || 'Please evaluate this subject',
          category: eval_item.form_category || 'Evaluation',
          target_audience: 'Student Subject Evaluation',
          dueDate: eval_item.end_date ? new Date(eval_item.end_date).toLocaleDateString() : undefined,
          assignment_status: eval_item.is_submitted ? 'completed' : 'pending',
          form_id: eval_item.form_id, // Store form_id for submission
          is_submitted: eval_item.is_submitted
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
  };

  const handleStartEvaluation = async (formId: string) => {
    // Find the form in availableForms
    const form = availableForms.find(f => f.id === formId);
    alert("Starting evaluation, form ID: " + formId);
    console.log("Starting evaluation with formId:", formId, "form:", form);
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
    setEvaluationDialogOpen(true);
    
    // Force re-render by using setTimeout
    setTimeout(() => {
      alert("Dialog should open now. State: evaluationDialogOpen=true");
    }, 100);
    
    // Fetch form details and questions
    try {
      const token = sessionStorage.getItem('authToken');
      console.log("Fetching form from:", `http://localhost:5000/api/forms/${form.form_id}`);
      const response = await fetch(`http://localhost:5000/api/forms/${form.form_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
       
      const data = await response.json();
      console.log("Form response data:", data);
      if (data.success && data.form) {
        setFormQuestions(data.form.questions || []);
        console.log("Form questions:", data.form.questions);
      } else {
        console.error("Form fetch failed:", data);
        toast.error(data.message || 'Failed to load form');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoadingForm(false);
    }
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
      const response = await fetch('http://localhost:5000/api/subject-evaluation/evaluation-submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form_id: selectedForm.form_id,
          subject_id: selectedSubject.subject_id,
          subject_instructor_id: parseInt(selectedForm.id),
          responses: formResponses
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Evaluation submitted successfully!');
        setEvaluationDialogOpen(false);
        // Refresh the forms list
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
                {selectedSubject.instructor_image ? (
                  <img 
                    src={selectedSubject.instructor_image} 
                    alt={selectedSubject.instructor_name || 'Instructor'} 
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
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        ) : (
                          <Button 
                            className="bg-green-500 hover:bg-green-600"
                            size="sm"
                            onClick={() => handleStartEvaluation(form.id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Start Evaluation
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
        <h2 className="text-2xl font-bold">My Subjects</h2>
        <p className="text-gray-600 mt-1">View your enrolled subjects and submit evaluations</p>
      </div>

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card 
              key={subject.subject_id}
              className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleSubjectClick(subject)}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <Avatar className="w-14 h-14">
                  {subject.instructor_image ? (
                    <img 
                      src={subject.instructor_image} 
                      alt={subject.instructor_name || 'Instructor'} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <AvatarFallback className="bg-green-500 text-white text-lg">
                      {getInitials(subject.instructor_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{subject.subject_name}</CardTitle>
                  <p className="text-sm text-gray-600 truncate">{subject.subject_code}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                    <p className="text-xs text-gray-500 mb-1">Instructor</p>
                    <p className="text-sm font-medium truncate">
                      {subject.instructor_name || 'Not Assigned'}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full mt-2 border-green-200 hover:bg-green-50">
                    View Evaluations
                    <ChevronRight className="w-4 h-4 ml-2" />
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

      {/* Modern Evaluation Form Dialog */}
      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedForm?.title}</h2>
                <p className="text-green-100 text-sm mt-1">{selectedSubject && 'subject_name' in selectedSubject ? (selectedSubject as any).subject_name : ''} - {selectedSubject && 'subject_code' in selectedSubject ? (selectedSubject as any).subject_code : ''}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-green-100 text-xs mb-1">
                <span>Progress</span>
                <span>{Object.keys(formResponses).length} of {formQuestions.length} answered</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${formQuestions.length > 0 ? (Object.keys(formResponses).length / formQuestions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 max-h-[60vh]">
            {loadingForm ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Loading evaluation form...</p>
              </div>
            ) : formQuestions.length > 0 ? (
              <div className="space-y-8">
                {formQuestions.map((question: any, index: number) => (
                  <div 
                    key={question.id || index} 
                    className={`transition-all duration-300 ${
                      formResponses[question.id] ? 'opacity-100' : 'opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-medium text-gray-800 pt-1">
                        {question.question || question.text}
                      </h3>
                    </div>
                    
                    {/* Rating Question */}
                    {(question.type === 'rating' || question.question_type === 'rating') && (
                      <div className="ml-11">
                        <div className="flex gap-2 flex-wrap">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleResponseChange(question.id, rating)}
                              className={`w-14 h-14 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                                formResponses[question.id] === rating
                                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Text Question */}
                    {(question.type === 'text' || question.question_type === 'text') && (
                      <div className="ml-11">
                        <textarea
                          value={formResponses[question.id] || ''}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 transition-colors bg-gray-50"
                          rows={4}
                        />
                      </div>
                    )}
                    
                    {/* Multiple Choice Question */}
                    {((question.type === 'multiple_choice' || question.question_type === 'multiple_choice') && question.options) && (
                      <div className="ml-11 space-y-3">
                        {question.options.map((option: any, optIndex: number) => (
                          <label
                            key={optIndex}
                            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              formResponses[question.id] === (option.option_text || option)
                                ? 'border-green-500 bg-green-50 shadow-sm'
                                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${
                              formResponses[question.id] === (option.option_text || option)
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {formResponses[question.id] === (option.option_text || option) && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <input
                              type="radio"
                              name={`question_${question.id}`}
                              value={option.option_text || option}
                              checked={formResponses[question.id] === (option.option_text || option)}
                              onChange={() => handleResponseChange(question.id, option.option_text || option)}
                              className="sr-only"
                            />
                            <span className="text-gray-700 font-medium">{option.option_text || option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No questions found in this form</p>
                <p className="text-gray-400 text-sm mt-1">Please contact your administrator</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Your responses are anonymous
              </p>
              <Button
                onClick={handleSubmitEvaluation}
                disabled={submitting || Object.keys(formResponses).length === 0}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-8"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
