import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ChevronDown, ChevronUp, ClipboardList, Check, Eye, Calendar } from "lucide-react";
import { getAuthToken } from "../../utils/auth";

interface UserResponse {
  id: number;
  form_id: number;
  form_title: string;
  category: string;
  answers: Record<string, any>;
  submitted_at: string;
}

export function MySubmissions() {
  const [submissions, setSubmissions] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<UserResponse | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/forms/my-responses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSubmissions(result.responses || []);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnswerDisplay = (questionId: string, answer: any) => {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    if (typeof answer === "object" && answer !== null) {
      return JSON.stringify(answer);
    }
    return String(answer);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <h2 className="text-2xl">My Submissions</h2>
          <p className="text-gray-600 mt-1">View your feedback submission history</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-gray-600">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">My Submissions</h2>
        <p className="text-gray-600 mt-1">
          You have submitted {submissions.length} feedback form{submissions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card className="border-green-100">
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">
                You haven't submitted any feedback forms yet. Complete your assigned forms to see them here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="border-green-100 overflow-hidden">
              {/* Card Header */}
              <div
                className="p-4 bg-gradient-to-r from-green-50 to-lime-50 cursor-pointer hover:from-green-100 hover:to-lime-100 transition-colors"
                onClick={() => setExpandedId(expandedId === submission.id ? null : submission.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{submission.form_title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {submission.category}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(submission.submitted_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubmission(submission);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Responses
                    </Button>
                    {expandedId === submission.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === submission.id && (
                <CardContent className="p-4 border-t border-gray-100">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Your Responses:</h4>
                    {Object.entries(submission.answers || {}).length === 0 ? (
                      <p className="text-gray-500 text-sm">No response data available</p>
                    ) : (
                      <div className="grid gap-3">
                        {Object.entries(submission.answers || {}).map(([questionId, answer]) => (
                          <div key={questionId} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {questionId.replace(/_/g, " ").replace(/q/i, "Question ")}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getAnswerDisplay(questionId, answer)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* View Responses Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              {selectedSubmission?.form_title}
            </DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && formatDate(selectedSubmission.submitted_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="secondary">{selectedSubmission?.category}</Badge>
              <span>•</span>
              <span>Submitted: {selectedSubmission && formatDate(selectedSubmission.submitted_at)}</span>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Your Responses:</h4>
              {selectedSubmission && Object.entries(selectedSubmission.answers || {}).length === 0 ? (
                <p className="text-gray-500 text-sm">No response data available</p>
              ) : selectedSubmission ? (
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.answers || {}).map(([questionId, answer]) => (
                    <div key={questionId} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {questionId.replace(/_/g, " ").replace(/(\d+)/g, "Question $1")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getAnswerDisplay(questionId, answer)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
