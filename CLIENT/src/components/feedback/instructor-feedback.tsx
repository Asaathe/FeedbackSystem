import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Filter, Eye, BarChart3, List, ChevronDown, ChevronUp, Users, Star, MessageSquare, Hash, Search, X } from "lucide-react";
import { getSharedResponsesForInstructor, getSharedResponsesDetails, SharedResponse, Response, Answer } from "../../services/publishedFormsService";

// Type for aggregated question data
interface AggregatedQuestion {
  question: string;
  type: 'rating' | 'text' | 'multiple-choice' | 'unknown';
  totalResponses: number;
  ratingStats?: {
    average: number;
    distribution: Record<number, number>;
    total: number;
  };
  textStats?: {
    uniqueResponses: number;
    commonWords: Array<{ word: string; count: number }>;
    sampleResponses: string[];
  };
  optionStats?: {
    options: Array<{ option: string; count: number; percentage: number }>;
    total: number;
  };
}

// Helper function to determine if an answer is a rating
const isRatingAnswer = (answer: Answer): boolean => {
  return answer.rating !== undefined && typeof answer.rating === 'number';
};

// Helper function to extract common words from text responses
const extractCommonWords = (texts: string[], minLength: number = 3, topN: number = 5): Array<{ word: string; count: number }> => {
  const wordCounts: Record<string, number> = {};
  
  texts.forEach(text => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= minLength);
    
    words.forEach(word => {
      // Skip common stop words
      const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'would', 'could', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'into', 'year', 'your', 'some', 'them', 'than', 'then', 'look', 'only', 'come', 'over', 'such', 'also', 'back', 'after', 'with', 'this', 'that', 'from', 'they', 'will', 'more', 'very', 'really', 'think', 'much', 'even', 'still', 'well', 'because', 'through', 'being', 'other', 'should', 'because', 'actually', 'maybe', 'probably', 'definitely', 'always', 'never', 'often', 'usually', 'sometimes', 'everything', 'something', 'anything', 'nothing', 'everyone', 'someone', 'anyone', 'nothing'];
      
      if (!stopWords.includes(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });
  
  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
};

// Helper function to aggregate responses by question
const aggregateResponses = (responses: Response[]): AggregatedQuestion[] => {
  const questionMap: Map<string, AggregatedQuestion> = new Map();
  
  responses.forEach(response => {
    response.answers.forEach(answer => {
      const existing = questionMap.get(answer.question);
      const isRating = isRatingAnswer(answer);
      
      if (!existing) {
        // Initialize new question aggregation
        const newQuestion: AggregatedQuestion = {
          question: answer.question,
          type: isRating ? 'rating' : 'unknown',
          totalResponses: 1,
        };
        
        if (isRating && answer.rating !== undefined) {
          newQuestion.ratingStats = {
            average: answer.rating,
            distribution: { [answer.rating]: 1 },
            total: 1,
          };
        } else if (!isRating && answer.answer) {
          newQuestion.textStats = {
            uniqueResponses: 1,
            commonWords: extractCommonWords([answer.answer]),
            sampleResponses: [answer.answer],
          };
          // Try to detect if it's multiple choice (same answer across responses)
          newQuestion.type = 'text';
        }
        
        questionMap.set(answer.question, newQuestion);
      } else {
        // Update existing question
        existing.totalResponses += 1;
        
        if (isRating && answer.rating !== undefined) {
          existing.type = 'rating';
          if (!existing.ratingStats) {
            existing.ratingStats = {
              average: answer.rating,
              distribution: { [answer.rating]: 1 },
              total: 1,
            };
          } else {
            existing.ratingStats.distribution[answer.rating] = 
              (existing.ratingStats.distribution[answer.rating] || 0) + 1;
            existing.ratingStats.total += 1;
            // Recalculate average
            const sum = Object.entries(existing.ratingStats.distribution)
              .reduce((acc, [rating, count]) => acc + (Number(rating) * count), 0);
            existing.ratingStats.average = sum / existing.ratingStats.total;
          }
        } else if (!isRating && answer.answer) {
          if (existing.type === 'unknown') {
            existing.type = 'text';
          }
          
          if (!existing.textStats) {
            existing.textStats = {
              uniqueResponses: 1,
              commonWords: extractCommonWords([answer.answer]),
              sampleResponses: [answer.answer],
            };
          } else {
            // Check if unique response
            const isUnique = !existing.textStats.sampleResponses.includes(answer.answer);
            if (isUnique) {
              existing.textStats.uniqueResponses += 1;
            }
            
            // Add to sample responses (max 5)
            if (existing.textStats.sampleResponses.length < 5) {
              existing.textStats.sampleResponses.push(answer.answer);
            }
            
            // Recalculate common words
            const allTexts = responses
              .flatMap(r => r.answers)
              .filter(a => a.question === answer.question && a.answer)
              .map(a => a.answer);
            existing.textStats.commonWords = extractCommonWords(allTexts);
          }
        }
      }
    });
  });
  
  return Array.from(questionMap.values());
};

// Render rating distribution bar
const RatingDistribution = ({ distribution, total }: { distribution: Record<number, number>; total: number }) => {
  const maxCount = Math.max(...Object.values(distribution), 1);
  
  return (
    <div className="space-y-2 mt-3">
      {[5, 4, 3, 2, 1].map(rating => {
        const count = distribution[rating] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        return (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-12 flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              {rating}
            </span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">
              {count} ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Render text response summary
const TextResponseSummary = ({ textStats }: { textStats: AggregatedQuestion['textStats'] }) => {
  if (!textStats) return null;
  
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <Users className="w-4 h-4" />
          <span>{textStats.uniqueResponses} unique response{textStats.uniqueResponses !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      {textStats.commonWords.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
            <Hash className="w-3 h-3" />
            Common Themes/Keywords
          </p>
          <div className="flex flex-wrap gap-1">
            {textStats.commonWords.map((item, idx) => (
              <Badge key={idx} variant="outline" className="bg-white border-blue-200 text-blue-700 text-xs">
                {item.word} ({item.count})
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {textStats.sampleResponses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Sample Responses:</p>
          {textStats.sampleResponses.slice(0, 3).map((response, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic">
              "{response}"
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Render option distribution
const OptionDistribution = ({ optionStats }: { optionStats: AggregatedQuestion['optionStats'] }) => {
  if (!optionStats || !optionStats.options.length) return null;
  
  const maxCount = Math.max(...optionStats.options.map(o => o.count), 1);
  
  return (
    <div className="space-y-2 mt-3">
      {optionStats.options.map((option, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-sm text-gray-700 w-32 truncate">{option.option}</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${maxCount > 0 ? (option.count / maxCount) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-20 text-right">
            {option.count} ({option.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
};

export function InstructorFeedback() {
  const [selectedResponse, setSelectedResponse] = useState<SharedResponse | null>(null);
  const [viewingResponses, setViewingResponses] = useState(false);
  const [sharedResponses, setSharedResponses] = useState<SharedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'individual'>('summary');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadSharedResponses = async () => {
      setLoading(true);
      const responses = await getSharedResponsesForInstructor();
      setSharedResponses(responses);
      setLoading(false);
    };
    loadSharedResponses();
  }, []);

  // Get unique categories from responses
  const categories = useMemo(() => {
    const cats = new Set(sharedResponses.map(r => r.category || 'General'));
    return Array.from(cats).sort();
  }, [sharedResponses]);

  // Filter responses based on search and category
  const filteredResponses = useMemo(() => {
    return sharedResponses.filter(r => {
      // Filter by category
      if (selectedCategory !== 'all' && (r.category || 'General') !== selectedCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = r.formTitle?.toLowerCase().includes(query);
        const matchesDescription = r.formDescription?.toLowerCase().includes(query);
        const matchesCategory = r.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [sharedResponses, selectedCategory, searchQuery]);

  const handleViewResponses = async (response: SharedResponse) => {
    setSelectedResponse(response);
    setViewingResponses(true);
    setLoadingDetails(true);
    const detailedResponses = await getSharedResponsesDetails(response.id);
    setSelectedResponse({ ...response, responses: detailedResponses });
    setLoadingDetails(false);
    setViewMode('summary');
    setExpandedQuestions(new Set());
  };

  // Aggregate responses when detailed responses are loaded
  const aggregatedQuestions = useMemo(() => {
    if (!selectedResponse?.responses) return [];
    return aggregateResponses(selectedResponse.responses);
  }, [selectedResponse?.responses]);

  const toggleQuestionExpand = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
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
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-10 pr-10 border-green-200 focus:border-green-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-green-900">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-green-900">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      {!loading && sharedResponses.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-green-600">{filteredResponses.length}</span> of {sharedResponses.length} feedback response{sharedResponses.length !== 1 ? 's' : ''}
        </div>
      )}

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
            <Card key={response.id} className="border-green-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900">{response.formTitle}</CardTitle>
                    {response.formDescription && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {response.formDescription}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-400">Shared</p>
                    <p className="text-sm text-gray-600">{response.sharedDate}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 font-medium">
                    {response.category || 'General'}
                  </Badge>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleViewResponses(response)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Responses
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Viewer Dialog */}
      {viewingResponses && selectedResponse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedResponse.formTitle}</h3>
                    <Badge variant="outline" className="border-green-300 bg-white">
                      {selectedResponse.category || 'General'}
                    </Badge>
                  </div>
                  {selectedResponse.formDescription && (
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedResponse.formDescription}
                    </p>
                  )}
                </div>
                <Button variant="outline" onClick={() => setViewingResponses(false)}>
                  Close
                </Button>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'summary' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'summary' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setViewMode('summary')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Summary View
                </Button>
                <Button
                  variant={viewMode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  className={viewMode === 'individual' ? 'bg-green-500 hover:bg-green-600' : ''}
                  onClick={() => setViewMode('individual')}
                >
                  <List className="w-4 h-4 mr-2" />
                  Individual Responses
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
              ) : viewMode === 'summary' ? (
                /* Summary/Aggregated View */
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{selectedResponse.formTitle}</h4>
                      <Badge variant="outline" className="border-green-300 bg-white">
                        {selectedResponse.category || 'General'}
                      </Badge>
                    </div>
                    {selectedResponse.formDescription && (
                      <p className="text-sm text-gray-600">{selectedResponse.formDescription}</p>
                    )}
                  </div>
                  
                  {aggregatedQuestions.map((question, index) => (
                    <Card key={index} className="border-gray-200">
                      <CardHeader className="py-3 cursor-pointer" onClick={() => toggleQuestionExpand(index)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{question.question}</span>
                          </div>
                          {expandedQuestions.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Quick Stats Preview */}
                        <div className="mt-2">
                          {question.ratingStats && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <span className="text-lg font-semibold text-gray-800">
                                  {question.ratingStats.average.toFixed(1)}
                                </span>
                                <span className="text-sm text-gray-500">/ 5</span>
                              </div>
                              <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${(question.ratingStats.average / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {question.textStats && (
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>{question.textStats.uniqueResponses} responses</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      {/* Expanded Content */}
                      {expandedQuestions.has(index) && (
                        <CardContent className="pt-0 pb-4">
                          <div className="border-t border-gray-200 pt-4 mt-2">
                            {question.ratingStats && (
                              <RatingDistribution 
                                distribution={question.ratingStats.distribution}
                                total={question.ratingStats.total}
                              />
                            )}
                            {question.textStats && (
                              <TextResponseSummary textStats={question.textStats} />
                            )}
                            {question.optionStats && (
                              <OptionDistribution optionStats={question.optionStats} />
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                /* Individual Responses View */
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
