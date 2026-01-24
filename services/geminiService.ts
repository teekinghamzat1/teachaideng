import { LessonNote, Assessment } from "../types";
import { db } from "../database";

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

    // Helper to clean JSON string from Markdown code blocks
    const cleanJson = (str: string) => {
      if (typeof str !== 'string') return str;
      return str.replace(/```json\s*|\s*```/g, '').trim();
    };

    let parsedNote: any;
    if (resultData.text && typeof resultData.text === 'string') {
      try {
        parsedNote = JSON.parse(cleanJson(resultData.text));
      } catch (e) {
        console.error("JSON parse error from GenAI");
        throw new Error("Failed to parse AI response. Please try again.");
      }
    } else {
      parsedNote = resultData;
    }

    // Ensure metadata from the request is preserved (AI might omit it)
    const normalizedNote: LessonNote = {
      ...parsedNote,
      topic: parsedNote.topic || topic,
      subject: parsedNote.subject || subject,
      classLevel: parsedNote.classLevel || classLevel,
      subtopic: parsedNote.subtopic || subtopic || "",
      duration: parsedNote.duration || duration || "40 minutes",
      // Normalize array fields in case AI returns strings instead of arrays
      objectives: Array.isArray(parsedNote.objectives) ? parsedNote.objectives : [],
      references: Array.isArray(parsedNote.references) ? parsedNote.references : [],
      evaluation: Array.isArray(parsedNote.evaluation) ? parsedNote.evaluation : [],
      instructionalMaterials: Array.isArray(parsedNote.instructionalMaterials) ? parsedNote.instructionalMaterials : [],
      presentation: Array.isArray(parsedNote.presentation) ? parsedNote.presentation : [],
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
      metadata: { topic, subject, classLevel, duration, subtopic }
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
        const cleanJson = (str: string) => str.replace(/```json\s*|\s*```/g, '').trim();
        assessmentData = JSON.parse(cleanJson(resultData.text));
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