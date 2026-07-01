import { LessonNote, Assessment } from "../types";
import { db } from "../database";
import { storage as localStorage } from "../utils/storage";

// Helper to get API URL
const getApiUrl = () => {
  // Check if we are in a Vite environment
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback for development if env not set: use relative path to leverage Vite proxy
  return '/api';
};

const API_URL = getApiUrl();

export const generateLessonNote = async (
  topic: string,
  subject: string,
  classLevel: string,
  duration: string = "40 minutes",
  subtopic: string = "",
  lessonType: string = "Normal Lesson",
  userPlan: 'Free' | 'Pro' | 'School' = 'Free',
  limitReached: boolean = false,
  smartHint: string = "",
  includeEvaluation: boolean = true,
  includeTeachingAids: boolean = true,
  nigerianCurriculum: boolean = true
): Promise<LessonNote> => {
  try {
    const token = db.auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_URL}/generate/lesson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        topic,
        subject,
        classLevel,
        duration,
        subtopic,
        lessonType,
        smartHint,
        includeEvaluation,
        includeTeachingAids,
        nigerianCurriculum
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate lesson note");
    }

    const resultData = data.data || data;

    // Helper to robustly extract JSON from a string
    const extractJson = (str: string): string => {
      if (typeof str !== 'string') return str;

      // 0. Strip control characters that can silently break JSON.parse
      let s = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
        if (c === '\n' || c === '\r' || c === '\t') return c;
        return '';
      });

      // 1. Try direct parse first – if it's already clean JSON, return as-is
      try {
        JSON.parse(s);
        return s;
      } catch (_) { /* fall through */ }

      // 2. Try to find JSON block in markdown
      const markdownMatch = s.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        return markdownMatch[1].trim();
      }

      // 3. Try to find the first '{' or '[' and the last '}' or ']'
      const firstCurly = s.indexOf('{');
      const firstBracket = s.indexOf('[');
      const first = (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) ? firstCurly : firstBracket;

      if (first !== -1) {
        const lastCurly = s.lastIndexOf('}');
        const lastBracket = s.lastIndexOf(']');
        const last = Math.max(lastCurly, lastBracket);

        if (last > first) {
          return s.substring(first, last + 1);
        }
      }

      return s.trim();
    };

    let parsedNote: any;
    if (resultData.text && typeof resultData.text === 'string') {
      const cleaned = extractJson(resultData.text);
      try {
        parsedNote = JSON.parse(cleaned);
      } catch (e) {
        console.error("JSON parse error from GenAI. Content was:", cleaned);
        console.error("Parse error details:", e);
        const parseError = new Error("Failed to parse AI response. Please try again.");
        (parseError as any).rawResponse = cleaned;
        throw parseError;
      }
    } else {
      parsedNote = resultData;
    }

    const cleanArray = (arr: any) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map(item => (typeof item === 'string' ? item.trim() : item))
        .filter(item => {
          if (typeof item !== 'string') return true;
          // Filter out empty strings or strings that are just | or > or - or *
          return item.length > 0 && !/^[\s|>•\-\*]+$/.test(item);
        });
    };

    // Ensure metadata from the request is preserved (AI might omit it)
    const normalizedNote: LessonNote = {
      ...parsedNote,
      topic: parsedNote.topic || topic,
      subject: parsedNote.subject || subject,
      classLevel: parsedNote.classLevel || classLevel,
      subtopic: parsedNote.subtopic || subtopic || "",
      duration: parsedNote.duration || duration || "40 minutes",
      // Normalize array fields
      objectives: cleanArray(parsedNote.objectives),
      references: cleanArray(parsedNote.references),
      evaluation: cleanArray(parsedNote.evaluation),
      instructionalMaterials: cleanArray(parsedNote.instructionalMaterials),
      presentation: Array.isArray(parsedNote.presentation) ? parsedNote.presentation.map(step => ({
        ...step,
        teacherActivity: typeof step.teacherActivity === 'string' ? step.teacherActivity.trim() : step.teacherActivity
      })) : [],
      // Normalize string fields in case AI returns them as arrays
      lessonContent: Array.isArray(parsedNote.lessonContent)
        ? parsedNote.lessonContent.join('\n\n')
        : (parsedNote.lessonContent || ''),
      previousKnowledge: Array.isArray(parsedNote.previousKnowledge)
        ? parsedNote.previousKnowledge.join('\n\n')
        : (parsedNote.previousKnowledge || ''),
      introduction: Array.isArray(parsedNote.introduction)
        ? parsedNote.introduction.join('\n\n')
        : (parsedNote.introduction || ''),
      assignment: Array.isArray(parsedNote.assignment)
        ? parsedNote.assignment.join('\n\n')
        : (parsedNote.assignment || ''),
      conclusion: Array.isArray(parsedNote.conclusion)
        ? parsedNote.conclusion.join('\n\n')
        : (parsedNote.conclusion || ''),
    };

    return normalizedNote;

  } catch (error: any) {
    console.error("Error generating lesson note:", error);

    // Log error to Admin Dashboard
    db.admin.logError({
      source: 'FRONTEND',
      path: '/generator',
      message: error.message || 'Frontend Lesson Generation Error',
      stack: error.stack,
      severity: 'high',
      metadata: {
        topic,
        subject,
        classLevel,
        duration,
        subtopic,
        rawResponse: error.rawResponse // We'll attach this to the error object if available
      }
    });

    throw error;
  }
};

export const generateRemark = async (data: {
  classLevel: string;
  subject: string;
  topic: string;
  lessonOutcome: string;
  students?: { name: string; observation: string }[];
  style?: string;
}): Promise<{ remark: string }> => {
  try {
    const token = db.auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_URL}/generate/remark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to generate remark");
    }

    return result.data || result;
  } catch (error: any) {
    console.error("Error generating remark:", error);
    throw error;
  }
};

export const generateAssessment = async (
  topic: string,
  classLevel: string,
  subject: string,
  questionCount: number = 5
): Promise<Assessment> => {
  try {
    const token = db.auth.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_URL}/generate/assessment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        topic,
        classLevel,
        subject,
        questionCount
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate assessment");
    }

    const resultData = data.data || data;

    let assessmentData;
    if (resultData.text && typeof resultData.text === 'string') {
      try {
        const extractJson = (str: string): string => {
          // Strip control chars
          let s = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
            if (c === '\n' || c === '\r' || c === '\t') return c;
            return '';
          });
          // Try direct parse first
          try { JSON.parse(s); return s; } catch (_) { /* fall through */ }
          const markdownMatch = s.match(/```json\s*([\s\S]*?)\s*```/);
          if (markdownMatch && markdownMatch[1]) return markdownMatch[1].trim();

          const first = Math.min(
            s.indexOf('{') === -1 ? Infinity : s.indexOf('{'),
            s.indexOf('[') === -1 ? Infinity : s.indexOf('[')
          );
          const last = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));

          if (first !== Infinity && last !== -1 && last > first) {
            return s.substring(first, last + 1);
          }
          return s.replace(/```json\s*|\s*```/g, '').trim();
        };

        assessmentData = JSON.parse(extractJson(resultData.text));
      } catch (e) {
        console.error("JSON parse error in assessment", e);
        // Fallback or attempt to extract JSON if needed
        assessmentData = { questions: [] };
      }
    } else {
      assessmentData = resultData;
    }

    // Normalize: AI might return { questions: [...] } or just [...]
    let questions = [];
    if (Array.isArray(assessmentData)) {
      questions = assessmentData;
    } else if (assessmentData && Array.isArray(assessmentData.questions)) {
      questions = assessmentData.questions;
    } else if (assessmentData && typeof assessmentData === 'object') {
      // Sometimes AI returns questions keyed by numbers or something else
      const possibleArray = Object.values(assessmentData).find(val => Array.isArray(val));
      if (possibleArray) questions = possibleArray;
    }

    return {
      id: '',
      userId: '',
      topic,
      classLevel,
      subject,
      createdAt: new Date().toISOString(),
      questions: questions.length > 0 ? questions : []
    };
  } catch (error: any) {
    console.error("Error generating assessment", error);

    // Log error to Admin Dashboard
    db.admin.logError({
      source: 'FRONTEND',
      path: '/assessment',
      message: error.message || 'Frontend Assessment Generation Error',
      stack: error.stack,
      severity: 'high',
      metadata: { topic, classLevel, subject, questionCount }
    });

    throw error;
  }
};

export const generateSEOSummary = async (title: string, textContent: string): Promise<string> => {
  try {
    let token = db.auth.getToken();
    if (!token) {
      const adminSession = localStorage.getItem('teachaide_admin_session');
      if (adminSession) token = JSON.parse(adminSession).token;
    }
    if (!token) throw new Error("Authentication required");

    const response = await fetch(`${API_URL}/generate/seo-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title, textContent }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to generate SEO summary");
    }

    return (data.data && data.data.summary) || data.summary || "";
  } catch (error: any) {
    console.error("Error generating SEO summary:", error);
    throw error;
  }
};