import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Filter, Eye } from "lucide-react";
import { getSharedResponsesForInstructor, getSharedResponsesDetails, SharedResponse, Response, Answer } from "../../services/publishedFormsService";

export function InstructorFeedback() {
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [selectedResponse, setSelectedResponse] = useState<SharedResponse | null>(null);
  const [viewingResponses, setViewingResponses] = useState(false);
  const [sharedResponses, setSharedResponses] = useState<SharedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const loadSharedResponses = async () => {
      setLoading(true);
      const responses = await getSharedResponsesForInstructor();
      setSharedResponses(responses);
      setLoading(false);
    };
    loadSharedResponses();
  }, []);

  const filteredResponses = selectedForm === 'all'
    ? sharedResponses
    : sharedResponses.filter(r => r.id === selectedForm);

  const handleViewResponses = async (response: SharedResponse) => {
    setSelectedResponse(response);
    setViewingResponses(true);
    setLoadingDetails(true);
    const detailedResponses = await getSharedResponsesDetails(response.id);
    setSelectedResponse({ ...response, responses: detailedResponses });
    setLoadingDetails(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">My Feedback</h2>
        <p className="text-gray-600">View feedback responses shared by administrators</p>
      </div>

      {/* Filter */}
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {sharedResponses.map((response) => (
                    <SelectItem key={response.id} value={response.id}>
                      {response.formTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Responses */}
      {loading ? (
        <Card className="border-green-100">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Loading shared responses...</p>
            </div>
          </CardContent>
        </Card>
      ) : sharedResponses.length === 0 ? (
        <Card className="border-green-100">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500">No feedback responses have been shared with you yet.</p>
              <p className="text-sm text-gray-400 mt-2">Administrators will share responses when available.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredResponses.map((response) => (
            <Card key={response.id} className="border-green-100">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{response.formTitle}</CardTitle>
                      <Badge variant="outline" className="border-green-200">
                        {response.category || 'General'}
                      </Badge>
                      {response.section && (
                        <Badge variant="outline" className="border-blue-200">
                          {response.section}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {response.totalResponses} response{response.totalResponses !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{response.sharedDate}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleViewResponses(response)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Responses
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Viewer Dialog */}
      {viewingResponses && selectedResponse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedResponse.formTitle}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedResponse.courseCode} - Section {selectedResponse.section}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setViewingResponses(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading responses...</p>
                </div>
              ) : selectedResponse.responses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No responses yet for this form.</p>
                </div>
              ) : (
                selectedResponse.responses.map((response, index) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="border-green-200">
                        Response #{index + 1}
                      </Badge>
                      <span className="text-xs text-gray-500">{response.submittedDate}</span>
                    </div>
                    <div className="space-y-3">
                      {response.answers.map((answer, answerIndex) => (
                        <div key={answerIndex}>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {answer.question}
                          </p>
                          {answer.rating !== undefined ? (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${
                                      answer.rating !== undefined && i < answer.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">({answer.rating}/5)</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">{answer.answer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
