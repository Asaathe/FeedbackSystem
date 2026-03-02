import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import { Target } from "lucide-react";

interface SubjectInstructor {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  instructor_id: number;
  instructor_name: string;
  semester: string;
  academic_year: string;
  course_section: string;
}

interface EvaluationTargetSelectorProps {
  evaluationType: 'subject' | 'instructor';
  onEvaluationTypeChange: (type: 'subject' | 'instructor') => void;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function EvaluationTargetSelector({
  evaluationType,
  onEvaluationTypeChange,
  selectedIds,
  onSelectionChange,
}: EvaluationTargetSelectorProps) {
  const [subjectInstructors, setSubjectInstructors] = useState<SubjectInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectInstructors();
  }, []);

  const fetchSubjectInstructors = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/subject-evaluation/subject-instructors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubjectInstructors(data.subjectInstructors || []);
      }
    } catch (error) {
      console.error('Error fetching subject-instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Group by subject or instructor based on evaluation type
  const groupedData = subjectInstructors.reduce((acc, si) => {
    const key = evaluationType === 'subject' ? si.subject_name : (si.instructor_name || 'No Instructor');
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(si);
    return acc;
  }, {} as Record<string, SubjectInstructor[]>);

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-purple-700">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">
            Evaluation Target
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Evaluation Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Select What to Evaluate
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onEvaluationTypeChange('subject')}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                evaluationType === 'subject'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="font-medium text-sm">Subject</div>
              <div className="text-xs text-gray-500">Evaluate the subject/course</div>
            </button>
            <button
              type="button"
              onClick={() => onEvaluationTypeChange('instructor')}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                evaluationType === 'instructor'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="font-medium text-sm">Instructor</div>
              <div className="text-xs text-gray-500">Evaluate the instructor</div>
            </button>
          </div>
        </div>

        {/* Target Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Select {evaluationType === 'subject' ? 'Subjects' : 'Instructors'}
          </Label>
          <p className="text-xs text-gray-600">
            Choose which {evaluationType === 'subject' ? 'subjects' : 'instructors'} students will evaluate
          </p>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Loading...</p>
            </div>
          ) : subjectInstructors.length > 0 ? (
            <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {Object.entries(groupedData).map(([name, items]) => (
                  <div key={name}>
                    <div className="font-medium text-sm text-purple-700 mb-1">{name}</div>
                    {items.map((si) => (
                      <div
                        key={si.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 ml-2"
                      >
                        <Checkbox
                          id={`si-${si.id}`}
                          checked={selectedIds.includes(si.id)}
                          onCheckedChange={() => toggleSelection(si.id)}
                        />
                        <Label
                          htmlFor={`si-${si.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          <span className="text-gray-700">{si.subject_code}</span>
                          <span className="text-gray-400 text-xs ml-1">- {si.semester} {si.academic_year}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No subject-instructor assignments found. Please set up subjects and assign instructors first.
            </div>
          )}

          {/* Selection Summary */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
              <span className="text-sm text-purple-700 font-medium">
                Selected:
              </span>
              <span className="text-sm font-semibold text-purple-900">
                {selectedIds.length} {evaluationType === 'subject' ? 'subject(s)' : 'instructor(s)'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
