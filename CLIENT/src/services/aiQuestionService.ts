// AI Service for generating form questions using Google Gemini API

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedQuestion {
  question: string;
  type: "text" | "textarea" | "multiple-choice" | "checkbox" | "dropdown" | "rating" | "linear-scale";
  description?: string;
  options?: string[];
  required?: boolean;
}

export interface AIQuestionGenerationResponse {
  success: boolean;
  questions?: GeneratedQuestion[];
  error?: string;
  metadata?: {
    provider: string;
    model: string;
    duration?: number;
  };
}

// Response Analysis Types
export interface Theme {
  name: string;
  count: number;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  examples?: string[];
}

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  overall: "positive" | "neutral" | "negative";
}

export interface DistributionData {
  answer: string;
  count: number;
  percentage: number;
}

export interface QuestionAIInsight {
  questionId: string;
  question: string;
  type: string;
  
  // AI-generated insights
  summary: string;
  keyFindings: string[];
  themes?: Theme[];
  sentiment?: SentimentData;
  recommendations: string[];
  
  // Quick stats
  totalResponses: number;
  average?: number;
  maxRating?: number;
  distribution?: DistributionData[];
  trend?: string;
}

export interface ResponseAnalysisResponse {
  success: boolean;
  insights?: QuestionAIInsight[];
  overallSummary?: string;
  error?: string;
  metadata?: {
    provider: string;
    model: string;
    duration?: number;
  };
}

// CORRECT MODELS THAT WORK (Updated 2024)
const GEMINI_MODELS = [
 
  'gemini-3-flash-preview',
  
  

];

// Get environment variables (works with both Vite and Create React App)
function getEnvVar(key: string): string | undefined {
  // For Vite (import.meta.env)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  
  // For Create React App (process.env)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  // Try window._env for custom setup
  if (typeof window !== 'undefined' && (window as any)._env?.[key]) {
    return (window as any)._env[key];
  }
  
  return undefined;
}

// Get API key from multiple sources
function getApiKey(): string | null {
  // Check localStorage first (user might have saved it)
  const storedKeys = [
    localStorage.getItem('gemini_api_key'),
    localStorage.getItem('ai_api_key'),
  ];

  for (const key of storedKeys) {
    if (key && key.trim().length > 20 && !key.includes('your_api_key')) {
      return key.trim();
    }
  }

  // Check environment variables
  const envKeys = [
    getEnvVar('VITE_GEMINI_API_KEY'),
    getEnvVar('REACT_APP_GEMINI_API_KEY'),
  ];

  for (const key of envKeys) {
    if (key && key.trim().length > 20) {
      return key.trim();
    }
  }

  return null;
}

/**
 * Build prompt for Gemini
 */
function buildPrompt(
  description: string,
  category?: string,
  targetAudience?: string
): string {
  return `You are a school administrator at a private school who wants to gather feedback. 
  Generate a clear and well-organized questions up to 5 questions based on the ${description} with a ${category ? `Category: ${category}` : ''}.

  INSTRUCTIONS:
1. Use appropriate question types based on category:
   - textarea: Long responses
   - rating: 1-5 stars
2. For choice questions: Provide 3-5 options
3. Keep questions clear and concise

OUTPUT FORMAT (JSON array):
[
  {
    "question": "How satisfied are you?",
    "type": "rating",
    "description": "Optional description",
    "options": ["Option1", "Option2"],
    "required": true
  }
]

Return ONLY valid JSON. No other text.`;
}

/**
 * Try different Gemini models until one works
 */
async function tryGeminiModels(
  prompt: string,
  apiKey: string
): Promise<AIQuestionGenerationResponse> {
  const startTime = Date.now();
  
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${modelName}`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);
      
      // Clean up response
      let cleanText = text.trim();
      
      // Remove markdown code blocks
      cleanText = cleanText.replace(/```json\s*/gi, '');
      cleanText = cleanText.replace(/```\s*/gi, '');
      
      // Try to extract JSON if wrapped in other text
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/) || cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      // Parse JSON
      const parsed = JSON.parse(cleanText);
      
      // Handle different response formats
      let questions: any[] = [];
      
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        questions = parsed.data;
      } else if (parsed.results && Array.isArray(parsed.results)) {
        questions = parsed.results;
      } else {
        // Try to extract any array from object
        const arrays = Object.values(parsed).filter(v => Array.isArray(v));
        if (arrays.length > 0) {
          questions = arrays[0];
        }
      }
      
      // Validate and format questions
      const validatedQuestions: GeneratedQuestion[] = questions
        .slice(0, 10) // Limit to 10 questions
        .map((q: any, index: number) => {
          // Ensure we have valid question text
          const questionText = q.question || q.text || q.prompt || `Question ${index + 1}`;
          
          // Determine question type
          let type: GeneratedQuestion['type'] = 'text';
          if (q.type && [
            'text', 'textarea', 'multiple-choice', 
            'checkbox', 'dropdown', 'rating', 'linear-scale'
          ].includes(q.type)) {
            type = q.type;
          } else if (questionText.toLowerCase().includes('rate') || questionText.includes('★')) {
            type = 'rating';
          } else if (questionText.toLowerCase().includes('scale') || questionText.includes('1-10') || questionText.includes('1-5')) {
            type = 'linear-scale';
          } else if (questionText.includes('?') && questionText.length < 100) {
            type = 'text';
          } else {
            type = 'textarea';
          }
          
          return {
            question: String(questionText),
            type,
            description: q.description ? String(q.description) : undefined,
            options: q.options && Array.isArray(q.options) 
              ? q.options.map((opt: any) => String(opt))
              : undefined,
            required: typeof q.required === 'boolean' ? q.required : index < 2,
          };
        })
        .filter((q: GeneratedQuestion) => q.question.trim().length > 0);
      
      if (validatedQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        questions: validatedQuestions,
        metadata: {
          provider: 'gemini',
          model: modelName,
          duration,
        },
      };
      
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error);
      // Continue to next model
      continue;
    }
  }
  
  // All models failed
  throw new Error('All Gemini models failed. Please check your API key.');
}

/**
 * Main function to generate questions
 */
export async function generateQuestionsWithAI(
  description: string,
  category?: string,
  targetAudience?: string
): Promise<AIQuestionGenerationResponse> {
  console.log('Generating questions with AI...');
  
  // Validate input
  if (!description || description.trim().length < 5) {
    return {
      success: false,
      error: 'Please provide a description of at least 5 characters',
    };
  }
  
  try {
    // Get API key
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.log('No API key found');
      return {
        success: false,
        error: 'No Gemini API key configured. Please add your API key in settings.',
      };
    }
    
    // Build prompt
    const prompt = buildPrompt(description, category, targetAudience);
    console.log('Prompt:', prompt);
    
    // Try Gemini
    const geminiResult = await tryGeminiModels(prompt, apiKey);
    
    if (geminiResult.success) {
      return geminiResult;
    } else {
      return {
        success: false,
        error: geminiResult.error || 'Failed to generate questions with Gemini API',
      };
    }
    
  } catch (error) {
    console.error('Error in generateQuestionsWithAI:', error);
    
    return {
      success: false,
      error: `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test API key
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent('Say "OK" if you are working.');
    const response = await result.response;
    const text = response.text();
    
    if (text.toLowerCase().includes('ok')) {
      return { valid: true };
    } else {
      return { valid: false, error: 'Unexpected response' };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid API key' 
    };
  }
}

/**
 * Save API key
 */
export function saveApiKey(apiKey: string): void {
  localStorage.setItem('gemini_api_key', apiKey.trim());
}

/**
 * Clear API key
 */
export function clearApiKey(): void {
  localStorage.removeItem('gemini_api_key');
}

/**
 * Check if API key exists
 */
export function hasApiKey(): boolean {
  return !!getApiKey();
}

// ============================================================================
// ============================================================================
// RESPONSE ANALYSIS FUNCTIONS - Overall Summary Only
// ============================================================================

/**
 * Build prompt for overall form analysis (direct from raw responses)
 */
function buildDirectOverallAnalysisPrompt(
  formTitle: string,
  questions: Array<{ id: string; question: string; type?: string; question_type?: string; options?: string[] }>,
  responses: Array<{ response_data: Record<string, any> }>
): string {
  // Format all questions and responses
  const questionsData = questions.map((q, idx) => {
    const questionType = q.type || q.question_type || 'text';
    const questionId = String(q.id);
    
    // Get all answers for this question
    const answers = responses
      .map(r => r.response_data[questionId] || r.response_data[q.id])
      .filter(a => a !== undefined && a !== null && a !== '');
    
    let answersText = '';
    if (questionType === 'text' || questionType === 'textarea') {
      answersText = answers.map((a, i) => `${i + 1}. "${a}"`).join('\n');
    } else if (questionType === 'rating' || questionType === 'linear-scale') {
      answersText = answers.map((a, i) => `${i + 1}. Rating: ${a}`).join('\n');
    } else {
      answersText = answers.map((a, i) => `${i + 1}. ${a}`).join('\n');
    }
    
    return `QUESTION ${idx + 1}: ${q.question}
TYPE: ${questionType}
RESPONSES (${answers.length}):
${answersText || '(No responses)'}`;
  }).join('\n\n');

  return `You are analyzing feedback responses for a school feedback system.

FORM TITLE: "${formTitle}"
TOTAL QUESTIONS: ${questions.length}
TOTAL RESPONSES: ${responses.length}

${questionsData}

TASK: Analyze ALL the feedback responses together and provide a comprehensive overall summary.

OUTPUT FORMAT (JSON):
{
  "overallSummary": "4-5 sentence comprehensive overview of all feedback",
  "topFindings": [
    "Most important finding 1 across all questions",
    "Most important finding 2 across all questions",
    "Most important finding 3 across all questions"
  ],
  "sentimentOverview": {
    "positive": number (percentage),
    "neutral": number (percentage),
    "negative": number (percentage),
    "overall": "positive|neutral|negative"
  },
  "overallRecommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "responseRate": {
    "total": number,
    "completed": number,
    "completionRate": "percentage"
  }
}

GUIDELINES:
- Provide a comprehensive summary that covers all questions and responses
- Identify cross-question patterns and trends
- Focus on actionable insights that the school can use
- Keep the overall summary substantive (4-5 sentences)
- Highlight any particularly strong positive or negative feedback
- Consider the distribution of responses for rating questions
- Return ONLY valid JSON. No other text.`;
}

/**
 * Analyze all form responses and generate a single overall summary
 */
async function analyzeAllResponsesOverall(
  formTitle: string,
  questions: Array<{ id: string; question: string; type?: string; question_type?: string; options?: string[] }>,
  responses: Array<{ response_data: Record<string, any> }>
): Promise<{ overallSummary: string; topFindings: string[]; sentimentOverview: any; overallRecommendations: string[]; responseRate: any }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key available');
  }

  const prompt = buildDirectOverallAnalysisPrompt(formTitle, questions, responses);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/gi, '');
    cleanText = cleanText.replace(/```\s*/gi, '');
    
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanText);
    
    return {
      overallSummary: parsed.overallSummary || '',
      topFindings: Array.isArray(parsed.topFindings) ? parsed.topFindings : [],
      sentimentOverview: parsed.sentimentOverview,
      overallRecommendations: Array.isArray(parsed.overallRecommendations) ? parsed.overallRecommendations : [],
      responseRate: parsed.responseRate
    };
    
  } catch (error) {
    console.error('Error analyzing responses overall:', error);
    // Return basic fallback
    return {
      overallSummary: `Analysis of ${responses.length} responses across ${questions.length} questions.`,
      topFindings: [`Total responses: ${responses.length}`, `Total questions: ${questions.length}`],
      sentimentOverview: { positive: 0, neutral: 0, negative: 0, overall: 'neutral' },
      overallRecommendations: ['Review responses manually for detailed insights'],
      responseRate: { total: responses.length, completed: responses.length, completionRate: '100%' }
    };
  }
}

/**
 * Main function to analyze all responses for a form - returns ONLY overall summary
 */
export async function analyzeFormResponses(
  formTitle: string,
  questions: Array<{ id: string; question: string; type?: string; question_type?: string; options?: string[] }>,
  responses: Array<{ response_data: Record<string, any> }>
): Promise<ResponseAnalysisResponse> {
  console.log('Analyzing form responses with AI (overall summary only)...');
  
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'No API key configured. Please add your API key in settings.'
      };
    }
    
    if (responses.length === 0) {
      return {
        success: false,
        error: 'No responses to analyze'
      };
    }

    // Generate overall summary directly from all responses
    const overallResult = await analyzeAllResponsesOverall(formTitle, questions, responses);
    
    return {
      success: true,
      insights: [], // Empty - we no longer generate per-question insights
      overallSummary: overallResult.overallSummary,
      metadata: {
        provider: 'gemini',
        model: 'gemini-3-flash-preview'
      }
    };
    
  } catch (error) {
    console.error('Error in analyzeFormResponses:', error);
    return {
      success: false,
      error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
// ============================================================================

/**
 * Build prompt for analyzing a single question's responses
 */
function buildQuestionAnalysisPrompt(
  question: string,
  questionType: string,
  responses: any[],
  options?: string[]
): string {
  const responseCount = responses.length;
  
  // Format responses for the prompt
  let responsesText = '';
  if (questionType === 'text' || questionType === 'textarea') {
    responsesText = responses.map((r, i) => `${i + 1}. "${r.answer || r}"`).join('\n');
  } else if (questionType === 'rating' || questionType === 'linear-scale') {
    responsesText = responses.map((r, i) => `${i + 1}. Rating: ${r.answer || r}`).join('\n');
  } else {
    responsesText = responses.map((r, i) => `${i + 1}. Answer: ${r.answer || r}`).join('\n');
  }

  return `You are analyzing feedback responses for a school feedback system.

QUESTION: "${question}"
QUESTION TYPE: ${questionType}
TOTAL RESPONSES: ${responseCount}
${options ? `AVAILABLE OPTIONS: ${options.join(', ')}` : ''}

RESPONSES:
${responsesText}

TASK: Analyze these responses and provide insights.

OUTPUT FORMAT (JSON):
{
  "summary": "2-3 sentence overview of the responses",
  "keyFindings": [
    "Finding 1",
    "Finding 2",
    "Finding 3"
  ],
  "themes": [
    {
      "name": "Theme name",
      "count": number,
      "sentiment": "positive|neutral|negative|mixed",
      "examples": ["example 1", "example 2"]
    }
  ],
  "sentiment": {
    "positive": number,
    "neutral": number,
    "negative": number,
    "overall": "positive|neutral|negative"
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}

GUIDELINES:
- For rating questions: Focus on satisfaction level, trends, and what drives high/low ratings
- For multiple choice/dropdown: Analyze why certain options are more/less popular
- For text/textarea: Extract themes, sentiment, and actionable points
- Keep summary concise (2-3 sentences)
- Provide 3-5 key findings
- For text questions, extract 3-5 main themes
- Provide 2-3 actionable recommendations
- Return ONLY valid JSON. No other text.`;
}

/**
 * Build prompt for overall form analysis
 */
function buildOverallAnalysisPrompt(
  formTitle: string,
  questionInsights: QuestionAIInsight[]
): string {
  const insightsSummary = questionInsights.map((insight, i) => 
    `Q${i + 1}: ${insight.question}\nSummary: ${insight.summary}\nKey Findings: ${insight.keyFindings.join(', ')}`
  ).join('\n\n');

  return `You are analyzing feedback for a school feedback system.

FORM: "${formTitle}"
TOTAL QUESTIONS: ${questionInsights.length}

QUESTION INSIGHTS:
${insightsSummary}

TASK: Provide an overall summary of the feedback.

OUTPUT FORMAT (JSON):
{
  "overallSummary": "3-4 sentence overview of the entire feedback",
  "topFindings": [
    "Top finding 1",
    "Top finding 2",
    "Top finding 3"
  ],
  "overallRecommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

GUIDELINES:
- Identify patterns across questions
- Highlight the most important findings
- Provide actionable recommendations
- Return ONLY valid JSON. No other text.`;
}

/**
 * Analyze responses for a single question using AI
 */
async function analyzeQuestionWithAI(
  question: string,
  questionType: string,
  questionId: string,
  responses: any[],
  options?: string[]
): Promise<QuestionAIInsight> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key available');
  }

  const prompt = buildQuestionAnalysisPrompt(question, questionType, responses, options);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up response
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/gi, '');
    cleanText = cleanText.replace(/```\s*/gi, '');
    
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanText);
    
    // Calculate basic stats
    let average: number | undefined;
    let maxRating: number = questionType === 'rating' ? 5 : 10;
    let distribution: DistributionData[] | undefined;
    
    if (questionType === 'rating' || questionType === 'linear-scale') {
      const sum = responses.reduce((acc, r) => {
        const val = parseFloat(r.answer || r);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const validCount = responses.filter(r => !isNaN(parseFloat(r.answer || r))).length;
      average = validCount > 0 ? parseFloat((sum / validCount).toFixed(2)) : undefined;
    } else if (questionType === 'multiple-choice' || questionType === 'dropdown' || questionType === 'checkbox') {
      const counts: Record<string, number> = {};
      responses.forEach(r => {
        const answer = String(r.answer || r);
        counts[answer] = (counts[answer] || 0) + 1;
      });
      distribution = Object.entries(counts).map(([answer, count]) => ({
        answer,
        count,
        percentage: Math.round((count / responses.length) * 100)
      })).sort((a, b) => b.count - a.count);
    }
    
    return {
      questionId,
      question,
      type: questionType,
      summary: parsed.summary || '',
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      themes: parsed.themes,
      sentiment: parsed.sentiment,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      totalResponses: responses.length,
      average,
      maxRating,
      distribution
    };
    
  } catch (error) {
    console.error('Error analyzing question:', error);
    // Return basic stats if AI fails
    let average: number | undefined;
    if (questionType === 'rating' || questionType === 'linear-scale') {
      const sum = responses.reduce((acc, r) => {
        const val = parseFloat(r.answer || r);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      const validCount = responses.filter(r => !isNaN(parseFloat(r.answer || r))).length;
      average = validCount > 0 ? parseFloat((sum / validCount).toFixed(2)) : undefined;
    }
    
    return {
      questionId,
      question,
      type: questionType,
      summary: `Analysis based on ${responses.length} responses.`,
      keyFindings: [`Total responses: ${responses.length}`],
      recommendations: ['Review responses manually for detailed insights'],
      totalResponses: responses.length,
      average
    };
  }
}

