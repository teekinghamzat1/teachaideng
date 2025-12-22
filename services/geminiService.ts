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
  userPlan: 'Free' | 'Pro' | 'School' = 'Free',
  limitReached: boolean = false
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
        subtopic
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Pass through specific error messages from backend (like Limit Reached)
      throw new Error(data.message || "Failed to generate lesson note");
    }

    // Backend returns { success: true, message: 'Generated', data: { text: ..., usage: ... } }
    const resultData = data.data || data;

    // Parse the text JSON string from GenAI
    return resultData.text ? JSON.parse(resultData.text) : resultData;

  } catch (error: any) {
    console.error("Error generating lesson note:", error);
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
        assessmentData = JSON.parse(resultData.text);
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
    throw error;
  }
};