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
  boardName?: string;
  title?: string;
  configuration?: string; // JSON string for full flexibility
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
  googleGeminiApiKey?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  paystackSecretKey?: string;
  paystackPublicKey?: string;
  jwtSecret?: string;
  jwtExpire?: string;
  databaseUrl?: string;
  port: number;
  nodeEnv: string;

  // Site Customization & Branding
  siteName?: string;
  siteTagline?: string;
  siteLogo?: string;
  siteLogoDark?: string;
  siteFavicon?: string;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  brandAccentColor?: string;
  brandFont?: string;
  lessonGenerationCost?: number;
  assessmentGenerationCost?: number;
  freePlanLessonLimit?: number;
  proPlanLessonLimit?: number;
  schoolPlanLessonLimit?: number;
  freePlanTokenLimit?: number;
  proPlanTokenLimit?: number;
  schoolPlanTokenLimit?: number;

  // Plan Pricing
  freePlanName?: string;
  freePlanPrice?: number;
  freePlanDuration?: string;

  proPlanName?: string;
  proPlanPrice?: number;
  proPlanDuration?: string;

  schoolPlanName?: string;
  schoolPlanPrice?: number;
  schoolPlanDuration?: string;

  schoolBasicPlanName?: string;
  schoolBasicPlanPrice?: number;
  schoolBasicPlanLessonLimit?: number;

  schoolStandardPlanName?: string;
  schoolStandardPlanPrice?: number;
  schoolStandardPlanLessonLimit?: number;

  schoolProPlanName?: string;
  schoolProPlanPrice?: number;
  schoolProPlanLessonLimit?: number;
  individualDailyLimit?: number;
  schoolTeacherDailyLimit?: number;

  // Paystack Plan Codes
  proPlanCode?: string;
  schoolBasicPlanCode?: string;
  schoolStandardPlanCode?: string;
  schoolProPlanCode?: string;

  // Top-up Configuration
  individualTopUpPrice?: number;
  individualTopUpAmount?: number;
  schoolTopUpPrice?: number;
  schoolTopUpAmount?: number;
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
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
  planType?: 'Basic' | 'Standard' | 'Pro';
  additionalNotes?: number;
  notesUsedThisMonth?: number;
  lastUsageReset?: string;
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
  isSchoolAdmin?: boolean;
  monthlyLessonLimit?: number;
  lessonsUsedThisMonth?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  subscriptionPlan: string;
  gender?: string;
  schoolName?: string;
  status?: 'Active' | 'Suspended';
  lastActive?: string;
  avatar?: string;
  token?: string;
  schoolId?: string;
  isSchoolAdmin?: boolean;
  usage?: { used: number; limit: number; remaining: number };
  teacherStatus?: string;
  teacherLimit?: number;
  accountType?: 'individual' | 'school';

  // Lesson usage tracking (USER-FACING)
  monthlyLessonLimit?: number;
  lessonsUsedThisMonth?: number;
  lastUsageReset?: string;
  additionalNotes?: number;
}

// Lesson usage statistics (USER-FACING ONLY - no tokens exposed)
export interface UsageStats {
  lessonsUsed: number;
  lessonsRemaining: number;
  monthlyLimit: number;
  resetDate: string;
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