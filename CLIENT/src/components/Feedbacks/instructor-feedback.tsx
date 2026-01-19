import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search, Filter, MessageSquare, TrendingUp, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

const courseFeedback = [
  {
    id: 1,
    course: 'CS101 - Introduction to Computer Science',
    section: 'A',
    avgRating: 4.5,
    totalResponses: 38,
    categories: {
      'Teaching Quality': 4.6,
      'Course Content': 4.5,
      'Communication': 4.7,
      'Availability': 4.2,
    },
    comments: [
      { text: 'Great explanations and engaging lectures!', rating: 5, date: 'Oct 1, 2025', responded: false },
      { text: 'The pace is perfect for learning new concepts.', rating: 5, date: 'Sep 30, 2025', responded: false },
      { text: 'More hands-on examples would be helpful.', rating: 4, date: 'Sep 29, 2025', responded: false },
      { text: 'Assignments are challenging but fair.', rating: 4, date: 'Sep 28, 2025', responded: true },
    ],
  },
  {
    id: 2,
    course: 'CS201 - Data Structures and Algorithms',
    section: 'B',
    avgRating: 4.3,
    totalResponses: 35,
    categories: {
      'Teaching Quality': 4.4,
      'Course Content': 4.5,
      'Communication': 4.2,
      'Availability': 4.1,
    },
    comments: [
      { text: 'Clear examples, but assignments are challenging.', rating: 4, date: 'Sep 30, 2025', responded: false },
      { text: 'Would appreciate more office hours.', rating: 3, date: 'Sep 29, 2025', responded: false },
      { text: 'Excellent coverage of complex topics.', rating: 5, date: 'Sep 28, 2025', responded: true },
    ],
  },
  {
    id: 3,
    course: 'CS301 - Database Management Systems',
    section: 'A',
    avgRating: 4.7,
    totalResponses: 30,
    categories: {
      'Teaching Quality': 4.8,
      'Course Content': 4.7,
      'Communication': 4.6,
      'Availability': 4.7,
    },
    comments: [
      { text: 'Very practical approach to database concepts.', rating: 5, date: 'Sep 29, 2025', responded: false },
      { text: 'Best professor I have had!', rating: 5, date: 'Sep 28, 2025', responded: true },
      { text: 'Real-world examples make learning easy.', rating: 5, date: 'Sep 27, 2025', responded: false },
    ],
  },
];

export function InstructorFeedback() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);

  const filteredCourses = selectedCourse === 'all' 
    ? courseFeedback 
    : courseFeedback.filter(c => c.id.toString() === selectedCourse);

  const handleRespond = (course: any, comment: any) => {
    setSelectedComment({ course, comment });
    setResponseDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl">My Course Feedback</h2>
        <p className="text-gray-600">View and respond to student feedback</p>
      </div>

      {/* Filter */}
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseFeedback.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Feedback Cards */}
      <div className="space-y-4">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="border-green-100">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{course.course}</CardTitle>
                    <Badge variant="outline" className="border-green-200">
                      Section {course.section}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{course.totalResponses} student responses</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-3xl">⭐</span>
                    <span className="text-2xl">{course.avgRating}</span>
                  </div>
                  <Progress value={course.avgRating * 20} className="h-2 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categories */}
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Rating Breakdown</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(course.categories).map(([category, rating]) => (
                    <div key={category} className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-lime-50 border border-green-100">
                      <p className="text-xs text-gray-600 mb-1">{category}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rating}</span>
                        <Progress value={rating * 20} className="h-1 flex-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm text-gray-600">Student Comments ({course.comments.length})</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  >
                    {expandedCourse === course.id ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Hide Comments
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show Comments
                      </>
                    )}
                  </Button>
                </div>

                {expandedCourse === course.id && (
                  <div className="space-y-3 mt-3">
                    {course.comments.map((comment, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${comment.responded ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-sm ${i < comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            {comment.responded && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                Responded
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{comment.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                        {!comment.responded && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-green-200 hover:bg-green-50"
                            onClick={() => handleRespond(course, comment)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Respond
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Student Feedback</DialogTitle>
            <DialogDescription>
              Your response will be visible to administrators
            </DialogDescription>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm">{selectedComment.comment.text}</p>
              </div>

              <div className="space-y-2">
                <Label>Status Update</Label>
                <Select defaultValue="acknowledged">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="in-progress">Working on it</SelectItem>
                    <SelectItem value="resolved">Addressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Your Response (Optional)</Label>
                <Textarea 
                  placeholder="Add any notes or explanations..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setResponseDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-500 hover:bg-green-600">
                  Submit Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}