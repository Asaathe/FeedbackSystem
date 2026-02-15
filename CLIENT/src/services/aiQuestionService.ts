// AI Service for generating form questions using Google Gemini API

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedQuestion {
  question: string;
  type: "text" | "textarea" | "multiple-choice" | "checkbox" | "dropdown" | "rating" | "linear-scale";
  description?: string;
  options?: string[];
  required?: boolean;
  sectionId?: string;
  sectionTitle?: string;
}

export interface GeneratedSection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface AIQuestionGenerationResponse {
  success: boolean;
  questions?: GeneratedQuestion[];
  sections?: GeneratedSection[];
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

// New: Quick insight format for short main ideas
export interface QuickQuestionInsight {
  questionId: string;
  mainIdea: string;
  shortSentiment: "positive" | "neutral" | "negative";
}

export interface ResponseAnalysisResponse {
  success: boolean;
  insights?: QuickQuestionInsight[];
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
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
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
 * Build prompt for Gemini - generates questions organized by sections
 */
function buildPrompt(
  description: string,
  category?: string,
  targetAudience?: string
): string {
  return `You are a school administrator at a private school who wants to gather feedback. 
Generate a clear and well-organized feedback form based on: "${description}"


INSTRUCTIONS:
1. Organize questions into 2 logical sections based on the topic
2. Each section should have 3 questions
3. Use appropriate question types:
   - rating: 1-5 stars (for satisfaction/rating questions)
   - linear-scale: 1-10 scale (for detailed metrics)
   - multiple-choice: Single selection from options
   - checkbox: Multiple selections from options
   - dropdown: Single selection from dropdown
   - text: Short text response
   - textarea: Long text response

4. For choice questions (multiple-choice, checkbox, dropdown): Provide 3-5 options
5. Keep questions clear and concise
6. Section titles should be short (1-3 words)

OUTPUT FORMAT: Return ONLY a valid JSON object with NO additional text, markdown, or explanation. The response must be parseable JSON.

Example output format:
{"sections":[{"id":"section-1","title":"Section Title","description":"Optional description","order":1}],"questions":[{"question":"How satisfied are you?","type":"rating","description":"Optional description","options":["Option1","Option2"],"required":true,"sectionId":"section-1","sectionTitle":"Section Title"}]}

IMPORTANT: 
- Return ONLY the JSON object, no markdown code blocks, no explanation
- All strings must use double quotes
- Do not include any text before or after the JSON`;
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
          maxOutputTokens: 4000,  // Increased from 2000 to prevent truncation
        },
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text);
      console.log('Response length:', text.length);
      
      // Check if response appears truncated (doesn't end with } or ])
      const trimmedText = text.trim();
      const lastChar = trimmedText[trimmedText.length - 1];
      if (lastChar !== '}' && lastChar !== ']') {
        console.warn('Response appears truncated, last char:', lastChar);
      }
      
      // Clean up response
      let cleanText = text.trim();
      
      // Remove markdown code blocks
      cleanText = cleanText.replace(/```json\s*/gi, '');
      cleanText = cleanText.replace(/```\s*/gi, '');
      
      // Try to extract JSON object (prioritize object format for new structure)
      let jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fall back to array format
        jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      }
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      // Try to parse JSON with error handling
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Attempting to fix JSON...');
        console.log('Clean text before fix:', cleanText.substring(0, 500));
        
        // Try to fix common JSON issues more carefully
        let fixedText = cleanText;
        
        // Check if truncated - try to close unclosed structures
        const openBraces = (fixedText.match(/\{/g) || []).length;
        const closeBraces = (fixedText.match(/\}/g) || []).length;
        const openBrackets = (fixedText.match(/\[/g) || []).length;
        const closeBrackets = (fixedText.match(/\]/g) || []).length;
        
        console.log('Brace counts - open:', openBraces, 'close:', closeBraces);
        console.log('Bracket counts - open:', openBrackets, 'close:', closeBrackets);
        
        // If truncated, try to close the JSON properly
        if (openBraces > closeBraces || openBrackets > closeBrackets) {
          console.log('JSON appears truncated, attempting to close...');
          
          // Remove any incomplete trailing content (partial strings, etc.)
          // Find the last complete value
          let lastCompleteIndex = fixedText.length;
          
          // Try to find the last complete question object
          const lastCompleteQuestion = fixedText.lastIndexOf('"sectionTitle"');
          if (lastCompleteQuestion !== -1) {
            // Find the end of this question object
            let braceCount = 0;
            let foundStart = false;
            for (let i = lastCompleteQuestion; i < fixedText.length; i++) {
              if (fixedText[i] === '{') { braceCount++; foundStart = true; }
              if (fixedText[i] === '}') { braceCount--; }
              if (foundStart && braceCount === 0) {
                lastCompleteIndex = i + 1;
                break;
              }
            }
          }
          
          // Truncate to last complete question
          fixedText = fixedText.substring(0, lastCompleteIndex);
          
          // Close any unclosed arrays and objects
          // Count remaining unclosed
          const remainingOpenBraces = (fixedText.match(/\{/g) || []).length - (fixedText.match(/\}/g) || []).length;
          const remainingOpenBrackets = (fixedText.match(/\[/g) || []).length - (fixedText.match(/\]/g) || []).length;
          
          // Add missing closing characters
          for (let i = 0; i < remainingOpenBrackets; i++) {
            fixedText += ']';
          }
          for (let i = 0; i < remainingOpenBraces; i++) {
            fixedText += '}';
          }
          
          console.log('Fixed truncated JSON, new length:', fixedText.length);
        }
        
        // Fix trailing commas
        fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
        
        console.log('Fixed text:', fixedText.substring(0, 500));
        
        try {
          parsed = JSON.parse(fixedText);
        } catch (e2) {
          console.error('Failed to parse JSON after fixes:', e2);
          // Last resort: try to extract using a more lenient approach
          try {
            // Try to find and parse just the questions array
            const questionsMatch = fixedText.match(/"questions"\s*:\s*\[[\s\S]*?\]/);
            const sectionsMatch = fixedText.match(/"sections"\s*:\s*\[[\s\S]*?\]/);
            
            if (questionsMatch || sectionsMatch) {
              // Construct a valid object
              let reconstructedJson = '{';
              if (sectionsMatch) {
                reconstructedJson += sectionsMatch[0];
                if (questionsMatch) reconstructedJson += ',';
              }
              if (questionsMatch) {
                reconstructedJson += questionsMatch[0];
              }
              reconstructedJson += '}';
              
              console.log('Reconstructed JSON:', reconstructedJson.substring(0, 500));
              parsed = JSON.parse(reconstructedJson);
            } else {
              throw new Error('Could not extract valid JSON structure');
            }
          } catch (e3) {
            console.error('All JSON parsing attempts failed:', e3);
            throw new Error('Failed to parse AI response as JSON');
          }
        }
      }
      
      // Handle different response formats
      let questions: any[] = [];
      let sections: GeneratedSection[] = [];
      
      if (Array.isArray(parsed)) {
        // Old format: just an array of questions
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        // New format: object with sections and questions
        questions = parsed.questions;
        if (parsed.sections && Array.isArray(parsed.sections)) {
          sections = parsed.sections.map((s: any, index: number) => ({
            id: s.id || `section-${Date.now()}-${index}`,
            title: s.title || `Section ${index + 1}`,
            description: s.description,
            order: s.order ?? index,
          }));
        }
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
        .slice(0, 15) // Limit to 15 questions
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
            sectionId: q.sectionId,
            sectionTitle: q.sectionTitle,
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
        sections: sections.length > 0 ? sections : undefined,
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

// Extended question type that includes section information
export interface QuestionWithSection {
  id: string;
  question: string;
  type?: string;
  question_type?: string;
  options?: string[];
  sectionId?: string;
  sectionTitle?: string;
}

// Extended response type that includes section information
export interface FormSectionData {
  id: string;
  title: string;
  order: number;
}

/**
 * Build prompt for overall form analysis with sections and numerical results
 */
function buildDirectOverallAnalysisPrompt(
  formTitle: string,
  questions: Array<QuestionWithSection>,
  responses: Array<{ response_data: Record<string, any> }>,
  sections?: FormSectionData[]
): string {
  // Group questions by section
  const sectionMap = new Map<string, { section: FormSectionData | null; questions: typeof questions }>();
  
  // Initialize sections
  if (sections && sections.length > 0) {
    sections.forEach(s => {
      sectionMap.set(s.id, { section: s, questions: [] });
    });
  }
  
  // Add "no section" bucket
  sectionMap.set('no-section', { section: null, questions: [] });
  
  // Group questions by section
  questions.forEach(q => {
    const sectionId = q.sectionId || 'no-section';
    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, { 
        section: { id: sectionId, title: q.sectionTitle || 'General', order: sectionMap.size }, 
        questions: [] 
      });
    }
    sectionMap.get(sectionId)!.questions.push(q);
  });
  
  // Calculate numerical results for each question
  const calculateResult = (q: typeof questions[0]) => {
    const questionType = q.type || q.question_type || 'text';
    const questionId = String(q.id);
    
    const answers = responses
      .map(r => r.response_data[questionId] || r.response_data[q.id])
      .filter(a => a !== undefined && a !== null && a !== '');
    
    if (answers.length === 0) return 'No responses';
    
    if (questionType === 'rating') {
      const sum = answers.reduce((acc, a) => acc + (parseFloat(a) || 0), 0);
      const avg = sum / answers.length;
      return `${(avg / 5 * 100).toFixed(0)}%`;
    } else if (questionType === 'linear-scale') {
      const sum = answers.reduce((acc, a) => acc + (parseFloat(a) || 0), 0);
      const avg = sum / answers.length;
      return `${(avg / 10 * 100).toFixed(0)}%`;
    } else if (questionType === 'multiple-choice' || questionType === 'dropdown' || questionType === 'checkbox') {
      const counts: Record<string, number> = {};
      answers.forEach(a => {
        if (Array.isArray(a)) {
          a.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
        } else {
          counts[String(a)] = (counts[String(a)] || 0) + 1;
        }
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? `${Math.round((top[1] / answers.length) * 100)}%` : '0%';
    }
    
    return `${answers.length} responses`;
  };
  
  // Format sections data for the prompt
  let sectionsDataText = '';
  let sectionNumber = 1;
  
  sectionMap.forEach((data, sectionId) => {
    if (data.questions.length === 0 && sectionId !== 'no-section') return;
    
    const sectionName = data.section?.title || 'General';
    sectionsDataText += `\nSection ${sectionNumber}: ${sectionName}\n`;
    
    data.questions.forEach(q => {
      const result = calculateResult(q);
      sectionsDataText += `- Question: ${q.question} → Result: ${result}\n`;
    });
    
    sectionNumber++;
  });

  return `You are an AI assistant that creates concise summary reports from form responses.

I will provide you with:
1. The form title (if available)
2. Form sections and their questions
3. Numerical results for each question (averages/percentages)

Your task is to transform this data into a clean, organized summary following the format shown below.

---

INPUT DATA:
Form Title: ${formTitle || 'Untitled Form'}
${sectionsDataText}
---

OUTPUT FORMAT REQUIREMENTS:

Title: [Generate a brief, descriptive title based on form topic or use provided title]

[Section 1 Name - keep as is or shorten to 1-2 words]
[Brief description of Q1 (2-4 words)] -- [Convert result to X/5 or X/10 format]
[Brief description of Q2 (2-4 words)] -- [Convert result to X/5 or X/10 format]
[Brief description of Q3 (2-4 words)] -- [Convert result to X/5 or X/10 format]

[Section 2 Name - keep as is or shorten to 1-2 words]
[Brief description of Q1 (2-4 words)] -- [Convert result to X/5 or X/10 format]
[Brief description of Q2 (2-4 words)] -- [Convert result to X/5 or X/10 format]

[Continue for all sections]

---

CONVERSION GUIDELINES:
- If result is percentage (0-100%):
  - For general satisfaction/experience: Convert to X/5 (divide by 20)
    Example: 90% → 4.5/5, 75% → 3.8/5, 100% → 5/5
  - For time/duration/specific metrics: Convert to X/10 (divide by 10)
    Example: 75% → 7.5/10, 82% → 8.2/10, 95% → 9.5/10
- If result is already in X/5 or X/10 format, keep as is
- Round to one decimal place

QUESTION SUMMARIZATION RULES:
- Extract core topic from each question (2-4 words maximum)
- Examples:
  - "How would you rate the venue location?" → "Place"
  - "How satisfied were you with the event timing?" → "Time"
  - "How would you rate the speaker's knowledge and delivery?" → "Speaker"
  - "Was the registration process easy to complete?" → "Registration"
  - "How would you rate the quality of food?" → "Food quality"
  - "Did the event meet your expectations?" → "Overall experience"

FORMATTING RULES:
- Use double dash "--" between description and result
- One item per line
- No bullet points or numbering
- Section names should be on their own line, followed by indented items
- No additional text, explanations, or commentary

---

EXAMPLE OUTPUT:
Title: Annual Conference Feedback Summary

Overall Experience
Overall event -- 4.5/5
Value for money -- 4.2/5

Venue
Location -- 5/5
Parking -- 4/5
Comfort -- 4.5/5

Speaker
Content -- 4/5
Delivery -- 3.5/5
Q&A session -- 4/5

---

Now process the input data I provide and output ONLY the formatted summary following these exact guidelines.`;
}

/**
 * Analyze all form responses and generate a formatted summary with sections
 */
async function analyzeAllResponsesOverall(
  formTitle: string,
  questions: Array<QuestionWithSection>,
  responses: Array<{ response_data: Record<string, any> }>,
  sections?: FormSectionData[]
): Promise<{ overallSummary: string; questionInsights: any[]; topFindings: string[]; sentimentOverview: any; overallRecommendations: string[]; responseRate: any }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No API key available');
  }

  const prompt = buildDirectOverallAnalysisPrompt(formTitle, questions, responses, sections);
  
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
    
    // Clean up response - the new format returns plain text, not JSON
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```\s*/gi, '');
    
    // The response is now a formatted text summary, not JSON
    // Return it as the overallSummary
    return {
      overallSummary: cleanText,
      questionInsights: [],
      topFindings: [],
      sentimentOverview: { positive: 0, neutral: 0, negative: 0, overall: 'neutral' },
      overallRecommendations: [],
      responseRate: { total: responses.length, completed: responses.length, completionRate: '100%' }
    };
    
  } catch (error) {
    console.error('Error analyzing responses overall:', error);
    // Return basic fallback with empty insights
    return {
      overallSummary: `Analysis of ${responses.length} responses across ${questions.length} questions. The AI analysis encountered an issue but basic analytics are available.`,
      questionInsights: [],
      topFindings: [
        `Total responses: ${responses.length}`,
        `Total questions: ${questions.length}`,
        'Click "Get AI Insights" to retry analysis'
      ],
      sentimentOverview: { positive: 0, neutral: 0, negative: 0, overall: 'neutral' },
      overallRecommendations: ['Review responses manually for detailed insights', 'Try generating AI insights again'],
      responseRate: { total: responses.length, completed: responses.length, completionRate: '100%' }
    };
  }
}

/**
 * Main function to analyze all responses for a form - returns formatted summary with sections
 */
export async function analyzeFormResponses(
  formTitle: string,
  questions: Array<QuestionWithSection>,
  responses: Array<{ response_data: Record<string, any> }>,
  sections?: FormSectionData[]
): Promise<ResponseAnalysisResponse> {
  console.log('Analyzing form responses with AI (formatted summary with sections)...');
  
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

    // Generate formatted summary with sections
    const overallResult = await analyzeAllResponsesOverall(formTitle, questions, responses, sections);
    
    return {
      success: true,
      insights: overallResult.questionInsights || [],
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

