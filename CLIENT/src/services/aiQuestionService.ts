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
    localStorage.getItem('openai_api_key'),
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
    getEnvVar('VITE_OPENAI_API_KEY'),
    getEnvVar('REACT_APP_OPENAI_API_KEY'),
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
  return `Generate a clear and well-organized Frequently Asked Questions (FAQ) section with up to 10 questions based on the given description.

CONTEXT:
You are a school administrator at a private school who wants to gather feedback. The purpose of this feedback is: ${description}
${category ? `Category: ${category}` : ''}
${targetAudience ? `Audience: ${targetAudience}` : ''}

INSTRUCTIONS:
1. Include common questions from students covering topics such as participation in activities, attendance requirements, grading systems, assessments, evaluations, deadlines, appeals, and academic policies. Provide accurate, concise, and student-friendly answers in simple language appropriate for a university setting. Maintain a formal yet approachable tone, ensuring all answers follow general university policies and best academic practices
2. Use appropriate question types:
   - text: Short answers
   - textarea: Long responses
   - multiple-choice: Single select
   - checkbox: Multiple select
   - dropdown: Select from list
   - rating: 1-5 stars
   - linear-scale: 1-10 scale
3. For choice questions: Provide 3-5 options
4. Mark 2-3 key questions as required=true
5. Keep questions clear and concise

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
