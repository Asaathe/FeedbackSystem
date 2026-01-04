import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Reusable_components/card";
import { Button } from "../Reusable_components/button";
import { Label } from "../Reusable_components/label";
import { Input } from "../Reusable_components/input";
import { Textarea } from "../Reusable_components/textarea";
import { RadioGroup, RadioGroupItem } from "../Reusable_components/radio-group";
import { Checkbox } from "../Reusable_components/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Reusable_components/select";
import { Progress } from "../Reusable_components/progress";
import { ArrowLeft, Send, Briefcase, GraduationCap } from "lucide-react";
import { Badge } from "../Reusable_components/badge";

interface AlumniForm {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: AlumniQuestion[];
}

interface AlumniQuestion {
  id: string;
  type: 'rating' | 'multiple-choice' | 'text' | 'textarea' | 'checkbox' | 'employment-info';
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
}

const alumniForms: AlumniForm[] = [
  {
    id: '1',
    title: 'Curriculum Relevance Assessment',
    description: 'Help us understand how well your academic program prepared you for your career',
    category: 'Career Impact',
    questions: [
      {
        id: '1',
        type: 'employment-info',
        question: 'Current Employment Information',
        required: true,
      },
      {
        id: '2',
        type: 'rating',
        question: 'How relevant is your current job to your field of study?',
        required: true,
      },
      {
        id: '3',
        type: 'multiple-choice',
        question: 'How well did the curriculum prepare you for your current role?',
        required: true,
        options: ['Extremely Well', 'Very Well', 'Moderately Well', 'Slightly Well', 'Not Well at All'],
      },
      {
        id: '4',
        type: 'checkbox',
        question: 'Which skills from your program do you use most in your career? (Select all that apply)',
        required: false,
        options: [
          'Technical/Programming Skills',
          'Problem-Solving',
          'Critical Thinking',
          'Communication',
          'Teamwork/Collaboration',
          'Project Management',
          'Research Skills',
          'Leadership',
        ],
      },
      {
        id: '5',
        type: 'textarea',
        question: 'What knowledge or skills do you wish had been emphasized more in the curriculum?',
        required: false,
      },
      {
        id: '6',
        type: 'textarea',
        question: 'What specific courses or topics would you recommend adding to better prepare future students?',
        required: false,
      },
    ],
  },
  {
    id: '2',
    title: 'Faculty & Instruction Quality',
    description: 'Reflect on the quality of teaching during your time at ACTS',
    category: 'Academic Experience',
    questions: [
      {
        id: '1',
        type: 'rating',
        question: 'Overall, how would you rate the quality of instruction you received?',
        required: true,
      },
      {
        id: '2',
        type: 'multiple-choice',
        question: 'How accessible were faculty members when you needed guidance?',
        required: true,
        options: ['Very Accessible', 'Accessible', 'Somewhat Accessible', 'Not Very Accessible', 'Not Accessible'],
      },
      {
        id: '3',
        type: 'textarea',
        question: 'Which faculty members had the most positive impact on your career? What made them effective?',
        required: false,
      },
      {
        id: '4',
        type: 'checkbox',
        question: 'What teaching methods were most effective for your learning? (Select all that apply)',
        required: false,
        options: [
          'Lectures',
          'Hands-on Labs/Projects',
          'Case Studies',
          'Group Work',
          'Industry Guest Speakers',
          'Research Opportunities',
          'Internships',
        ],
      },
      {
        id: '5',
        type: 'textarea',
        question: 'What improvements would you suggest for teaching methods or faculty development?',
        required: false,
      },
    ],
  },
  {
    id: '3',
    title: 'Post-Graduation Support',
    description: 'Share your experience with career guidance and alumni network',
    category: 'Alumni Support',
    questions: [
      {
        id: '1',
        type: 'rating',
        question: 'How would you rate the career guidance services you received?',
        required: true,
      },
      {
        id: '2',
        type: 'multiple-choice',
        question: 'How helpful was the university in your job search after graduation?',
        required: true,
        options: ['Extremely Helpful', 'Very Helpful', 'Moderately Helpful', 'Slightly Helpful', 'Not Helpful'],
      },
      {
        id: '3',
        type: 'checkbox',
        question: 'Which career services did you use? (Select all that apply)',
        required: false,
        options: [
          'Resume/CV Review',
          'Interview Preparation',
          'Job Board/Postings',
          'Career Fairs',
          'Alumni Networking Events',
          'Internship Placement',
          'Graduate School Guidance',
          'None',
        ],
      },
      {
        id: '4',
        type: 'multiple-choice',
        question: 'How active are you in the alumni network?',
        required: false,
        options: ['Very Active', 'Somewhat Active', 'Occasionally Active', 'Not Active'],
      },
      {
        id: '5',
        type: 'textarea',
        question: 'What additional support or services would benefit alumni in their careers?',
        required: false,
      },
      {
        id: '6',
        type: 'textarea',
        question: 'Would you be interested in mentoring current students? If yes, in what capacity?',
        required: false,
      },
    ],
  },
];

interface AlumniFeedbackProps {
  onBack?: () => void;
}

export function AlumniFeedback({ onBack }: AlumniFeedbackProps = {}) {
  const [selectedForm, setSelectedForm] = useState<AlumniForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleSelectForm = (form: AlumniForm) => {
    setSelectedForm(form);
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleBackToList = () => {
    setSelectedForm(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleSubmit = async () => {
    if (!selectedForm) {
      alert('No form selected.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to submit feedback.');
        return;
      }

      // Submit the form response
      const response = await fetch(`/api/forms/${selectedForm.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          responses: answers
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Thank you for your feedback! Your insights help us improve our program.');
        handleBackToList();
        onBack?.();
      } else {
        alert(result.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred while submitting your feedback. Please try again.');
    }
  };

  const renderQuestionInput = (question: AlumniQuestion) => {
    switch (question.type) {
      case 'employment-info':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Job Title *</Label>
              <Input
                placeholder="e.g., Software Developer"
                value={answers[`${question.id}_title`] || ''}
                onChange={(e) => setAnswers({ ...answers, [`${question.id}_title`]: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Company/Organization *</Label>
              <Input
                placeholder="e.g., Tech Solutions Inc."
                value={answers[`${question.id}_company`] || ''}
                onChange={(e) => setAnswers({ ...answers, [`${question.id}_company`]: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select
                  value={answers[`${question.id}_industry`]}
                  onValueChange={(value) => setAnswers({ ...answers, [`${question.id}_industry`]: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology/IT</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance/Banking</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Years in Current Role</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={answers[`${question.id}_years`] || ''}
                  onChange={(e) => setAnswers({ ...answers, [`${question.id}_years`]: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setAnswers({ ...answers, [question.id]: star })}
                className={`text-4xl transition-colors ${
                  answers[question.id] >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        );

      case 'multiple-choice':
        return (
          <RadioGroup
            value={answers[question.id]}
            onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
          >
            <div className="space-y-3">
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={answers[question.id]?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const current = answers[question.id] || [];
                    setAnswers({
                      ...answers,
                      [question.id]: checked
                        ? [...current, option]
                        : current.filter((item: string) => item !== option),
                    });
                  }}
                />
                <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Input
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Type your answer here..."
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={answers[question.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Share your thoughts and experiences..."
            rows={5}
          />
        );

      default:
        return null;
    }
  };

  // Show form list if no form is selected
  if (!selectedForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl">Alumni Feedback</h2>
              <p className="text-gray-600 mt-1">Share your post-graduation experience to help improve our program</p>
            </div>
          </div>
        </div>

        {/* Alumni Info Notice */}
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="text-blue-900">Why Your Feedback Matters</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Your insights about curriculum relevance, faculty quality, and career preparation help us improve 
                  our program for future students. Your responses are shared with administrators and used for 
                  strategic planning and accreditation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Forms */}
        <div className="grid grid-cols-1 gap-4">
          {alumniForms.map((form) => (
            <Card key={form.id} className="border-green-100 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{form.title}</CardTitle>
                      <Badge variant="outline" className="border-purple-200 bg-purple-50">
                        {form.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{form.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{form.questions.length} questions</p>
                  <Button
                    className="bg-purple-500 hover:bg-purple-600"
                    onClick={() => handleSelectForm(form)}
                  >
                    Start Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show form answering interface
  const currentQuestion = selectedForm.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selectedForm.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === selectedForm.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl">{selectedForm.title}</CardTitle>
            <Badge variant="outline" className="border-purple-200 bg-purple-100">
              {selectedForm.category}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-3">{selectedForm.description}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Question {currentQuestionIndex + 1} of {selectedForm.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Your feedback helps improve our program for future students</p>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card className="border-green-100">
        <CardContent className="pt-6 space-y-6">
          <div>
            <Label className="text-lg">
              {currentQuestionIndex + 1}. {currentQuestion.question}
              {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {currentQuestion.description && (
              <p className="text-sm text-gray-500 mt-1">{currentQuestion.description}</p>
            )}
          </div>

          {renderQuestionInput(currentQuestion)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
            } else {
              handleBackToList();
            }
          }}
          className="border-purple-200 hover:bg-purple-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentQuestionIndex === 0 ? 'Back to Forms' : 'Previous'}
        </Button>

        {isLastQuestion ? (
          <Button onClick={handleSubmit} className="bg-purple-500 hover:bg-purple-600">
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Next Question
          </Button>
        )}
      </div>
    </div>
  );
}