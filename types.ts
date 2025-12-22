export enum ClassLevel {
  Primary1 = 'Primary 1',
  Primary2 = 'Primary 2',
  Primary3 = 'Primary 3',
  Primary4 = 'Primary 4',
  Primary5 = 'Primary 5',
  Primary6 = 'Primary 6',
  JSS1 = 'JSS 1',
  JSS2 = 'JSS 2',
  JSS3 = 'JSS 3',
}

export enum Subject {
  Mathematics = 'Mathematics',
  EnglishLanguage = 'English Language',
  BasicScience = 'Basic Science',
  SocialStudies = 'Social Studies',
  CivicEducation = 'Civic Education',
  AgricScience = 'Agricultural Science',
  HomeEconomics = 'Home Economics',
  CRS = 'C.R.S',
  IRS = 'I.R.S',
  CreativeArts = 'Creative Arts',
}

export interface PresentationStep {
  step: string;
  teacherActivity: string;
  pupilActivity: string;
}

export interface LessonNote {
  id?: string;
  userId?: string;
  topic: string;
  subtopic: string;
  classLevel: string;
  subject: string;
  duration: string;
  date?: string;
  createdAt?: string;
  references: string[];
  objectives: string[];
  instructionalMaterials: string[];
  previousKnowledge: string;
  introduction: string;
  lessonContent: string;
  presentation: PresentationStep[];
  evaluation: string[];
  assignment: string;
  conclusion: string;
  status?: 'Approved' | 'Flagged' | 'Pending'; // For moderation
}

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: 'Free' | 'Pro' | 'School';
  role: string;
  gender: string;
  schoolName?: string;
  status?: 'Active' | 'Suspended';
  lastActive?: string;
}

export interface Question {
  id: string;
  type: 'MCQ' | 'TrueFalse' | 'ShortAnswer';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
}

export interface Assessment {
  id: string;
  userId: string;
  topic: string;
  classLevel: string;
  subject: string;
  createdAt: string;
  questions: Question[];
  status?: 'Approved' | 'Flagged' | 'Pending';
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  subject: string;
  notes?: string;
}

export interface TimetableSlot {
  day: string; // Monday, Tuesday, etc.
  time: string; // 08:00 - 08:40
  subject: string;
}

export interface Timetable {
  id: string;
  userId: string;
  className: string;
  slots: TimetableSlot[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  textSize: 'small' | 'medium' | 'large';
}

// Admin Specific Types
export interface AdminLog {
  id: string;
  action: string;
  adminName: string;
  target: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error';
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowSignup: boolean;
  defaultModel: string;
  maxTokens: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
}

export interface Curriculum {
  subjects: string[];
  classLevels: string[];
}

// School Management Types
export interface School {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  teacherLimit: number;
  allowAdminAccess: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teachers?: Teacher[];
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  teacherStatus: string; // 'Invited', 'Active', 'Suspended'
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  subscriptionPlan?: string;
  avatar?: string;
  token?: string;
  schoolId?: string;
  isSchoolAdmin?: boolean;
  teacherStatus?: string;
  teacherLimit?: number;
  accountType?: 'individual' | 'school';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization?: string;
  content: string;
  avatarUrl?: string;
  rating?: number;
  isActive?: boolean;
  createdAt?: string;
}