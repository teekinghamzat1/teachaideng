import { User, LessonNote, Assessment, Student, Timetable, AppSettings, AdminLog, SystemSettings, Curriculum, Subject, ClassLevel, School } from './types';

// Helper for API calls
const API_URL = '/api';

export const getAuthHeader = () => {
  const userStr = localStorage.getItem('teachaide_session');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
  }
  return {};
};

export const getAdminAuthHeader = () => {
  const userStr = localStorage.getItem('teachaide_admin_session');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
  }
  return {};
};

export const getAnyAuthHeader = () => {
  const adminHeader = getAdminAuthHeader();
  if (adminHeader.Authorization) return adminHeader;
  return getAuthHeader();
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    const { url } = response;
    const { pathname } = window.location;
    const isLoginPage = pathname === '/login' || pathname === '/admin/login';

    // Unified 401 logic
    const isAdminPath = window.location.pathname.startsWith('/admin');

    if (url.includes('/api/admin') || isAdminPath) {
      console.error(`401 Unauthorized from Admin API or Admin Path: ${url}`);
      localStorage.removeItem('teachaide_admin_session');
      if (!isLoginPage) {
        window.location.href = '/admin/login';
      }
      throw new Error('Admin session expired.');
    } else if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
      console.warn(`[FRONTEND_401] Observed 401 from: ${url}`);
      // For shared/public endpoints that MIGHT return 401 (though they shouldn't)
      // we only redirect if we aren't already on a login page and it's not a "soft" check
      const isSoftCheck = url.includes('/settings/public') || url.includes('/branding');

      if (!isLoginPage && !isSoftCheck) {
        console.error(`401 Unauthorized from: ${url}. Redirecting to login.`);
        localStorage.removeItem('teachaide_session');
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/login';
      } else {
        console.warn(`401 Unauthorized from: ${url}. Suppressing redirect loop.`);
      }
      throw new Error('Session expired. Please login again.');
    }
    // For login failure, just throw
    throw new Error('Invalid credentials');
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Server limit exceeded or timeout (504). Please try again in 30 seconds.');
    }
    const errorData = await response.json().catch(() => ({}));
    if (errorData.errors) {
      console.error('Validation Errors:', errorData.errors);
      const detailedMessage = errorData.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`${errorData.message}: ${detailedMessage}`);
    }
    throw new Error(errorData.message || 'API Error');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Received HTML instead of JSON. The server might be busy or down.');
  }

  const data = await response.json();
  return data.data;
};

export const db = {
  // Regular User Auth
  auth: {
    async register(name: string, email: string, password: string, role: string, gender: string, schoolName: string, accountType: string = 'individual'): Promise<User> {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role, gender, schoolName, accountType }),
      });

      const user = await handleResponse(response);
      localStorage.setItem('teachaide_session', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      return user;
    },

    async login(email: string, password: string): Promise<User> {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const user = await handleResponse(response);
      localStorage.setItem('teachaide_session', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-change'));
      return user;
    },



    async getUsage(schoolId?: string): Promise<{ used: number; limit: number; remaining: number; duration: string; resetDate: string }> {
      const url = schoolId ? `${API_URL}/users/usage?schoolId=${schoolId}` : `${API_URL}/users/usage`;
      const response = await fetch(url, {
        headers: getAuthHeader(),
      });
      return handleResponse(response);
    },

    async logout(): Promise<void> {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeader()
        });
      } catch (e) {
        console.error(e);
      }
      localStorage.removeItem('teachaide_session');
      window.dispatchEvent(new Event('auth-change'));
    },

    async requestPasswordReset(email: string): Promise<void> {
      // Logic for password reset...
    },

    getCurrentUser(): User | null {
      const sessionStr = localStorage.getItem('teachaide_session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    },

    getToken(): string | null {
      const user = this.getCurrentUser();
      return user?.token || null;
    },

    // ... rest of auth methods
    async refreshUser(): Promise<User | null> {
      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          headers: getAuthHeader()
        });
        const result = await handleResponse(response);
        if (result) {
          const current = this.getCurrentUser();
          localStorage.setItem('teachaide_session', JSON.stringify({ ...current, ...result }));
          window.dispatchEvent(new Event('auth-change'));
          return result;
        }
        return null;
      } catch (error) {
        console.error('Failed to refresh user:', error);
        return null;
      }
    },
    async updateProfile(data: Partial<User> & { password?: string }): Promise<User> {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      const updated = await handleResponse(response);
      if (updated) {
        try {
          const current = this.getCurrentUser();
          localStorage.setItem('teachaide_session', JSON.stringify({ ...current, ...updated }));
          window.dispatchEvent(new Event('auth-change'));
        } catch (e) {
          console.warn('Failed to update local session after profile update', e);
        }
      }
      return updated;
    },
    async deleteAccount(): Promise<void> {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
      localStorage.removeItem('teachaide_session');
      window.dispatchEvent(new Event('auth-change'));
    },
  },

  // Admin Specific Auth using separate session key
  adminAuth: {
    async login(email: string, password: string): Promise<User> {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const user = await handleResponse(response);
      // Store in ADMIN session
      localStorage.setItem('teachaide_admin_session', JSON.stringify(user));
      // We don't fire 'auth-change' because main app doesn't care about admin login
      return user;
    },

    async logout(): Promise<void> {
      localStorage.removeItem('teachaide_admin_session');
    },

    getCurrentUser(): User | null {
      const sessionStr = localStorage.getItem('teachaide_admin_session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    },

    async updateProfile(data: Partial<User> & { password?: string }): Promise<User> {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      const updated = await handleResponse(response);
      if (updated) {
        const current = this.getCurrentUser();
        localStorage.setItem('teachaide_admin_session', JSON.stringify({ ...current, ...updated }));
      }
      return updated;
    },

    async refreshUser(): Promise<User | null> {
      try {
        const response = await fetch(`${API_URL}/users/profile`, {
          headers: getAdminAuthHeader()
        });
        const result = await handleResponse(response);
        if (result) {
          const current = this.getCurrentUser();
          localStorage.setItem('teachaide_admin_session', JSON.stringify({ ...current, ...result }));
          return result;
        }
        return null;
      } catch (error) {
        console.error('Failed to refresh admin user:', error);
        return null;
      }
    }
  },

  async getUsage(schoolId?: string): Promise<{ used: number; limit: number; remaining: number }> {
    const url = schoolId ? `${API_URL}/users/usage?schoolId=${schoolId}` : `${API_URL}/users/usage`;
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeader()
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('teachaide_session');
    window.dispatchEvent(new Event('auth-change'));
  },

  async requestPasswordReset(email: string): Promise<void> {
    // Backend doesn't have this yet.
    console.info(`Password reset requested for a user`);
  },

  getCurrentUser(): User | null {
    const sessionStr = localStorage.getItem('teachaide_session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  getToken(): string | null {
    const user = this.getCurrentUser();
    return user?.token || null;
  },

  async refreshUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: getAuthHeader()
      });
      const result = await handleResponse(response);
      // handleResponse returns data.data, so result is already the user object
      if (result) {
        // Update the session with fresh user data - merge to preserve token
        const current = this.getCurrentUser();
        localStorage.setItem('teachaide_session', JSON.stringify({ ...current, ...result }));
        window.dispatchEvent(new Event('auth-change'));
        return result;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  },
  async updateProfile(data: Partial<User> & { password?: string }): Promise<User> {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    const updated = await handleResponse(response);
    // Update local session with fresh user data if returned
    if (updated) {
      try {
        // backend returns user object; refresh stored session - merge to preserve token
        const current = this.getCurrentUser();
        localStorage.setItem('teachaide_session', JSON.stringify({ ...current, ...updated }));
        window.dispatchEvent(new Event('auth-change'));
      } catch (e) {
        console.warn('Failed to update local session after profile update', e);
      }
    }
    return updated;
  },
  async deleteAccount(): Promise<void> {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    await handleResponse(response);
    // Clear local session after deletion
    localStorage.removeItem('teachaide_session');
    window.dispatchEvent(new Event('auth-change'));
  },


  notes: {
    async save(note: LessonNote): Promise<{ success: boolean; message: string; data: LessonNote }> {
      const user = JSON.parse(localStorage.getItem('teachaide_session') || '{}');

      // Normalize the note to ensure all fields match expected types
      const normalizedNote = {
        ...note,
        // Convert array fields to strings if needed
        lessonContent: Array.isArray(note.lessonContent)
          ? note.lessonContent.join('\n\n')
          : note.lessonContent,
        previousKnowledge: Array.isArray(note.previousKnowledge)
          ? note.previousKnowledge.join('\n\n')
          : note.previousKnowledge,
        introduction: Array.isArray(note.introduction)
          ? note.introduction.join('\n\n')
          : note.introduction,
        assignment: Array.isArray(note.assignment)
          ? note.assignment.join('\n\n')
          : note.assignment,
        conclusion: Array.isArray(note.conclusion)
          ? note.conclusion.join('\n\n')
          : note.conclusion,
      };

      const payload = { ...normalizedNote, schoolId: user.schoolId };
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        // Shared logic with handleResponse for 401
        localStorage.removeItem('teachaide_session');
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }
      return data;
    },

    async getUserNotes(): Promise<LessonNote[]> {
      const response = await fetch(`${API_URL}/notes`, {
        headers: getAuthHeader(),
      });
      return handleResponse(response); // Returns array
    },

    async getPublicNote(id: string): Promise<LessonNote> {
      const response = await fetch(`${API_URL}/notes/public/${id}`);
      return handleResponse(response);
    },

    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
    },
    async email(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/notes/${id}/email`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
    }
  },

  assessments: {
    async save(assessment: Assessment): Promise<Assessment> {
      const user = JSON.parse(localStorage.getItem('teachaide_session') || '{}');
      const payload = { ...assessment, schoolId: user.schoolId };
      const response = await fetch(`${API_URL}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    async getUserAssessments(): Promise<Assessment[]> {
      const response = await fetch(`${API_URL}/assessments`, {
        headers: getAuthHeader(),
      });
      return handleResponse(response);
    },
    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/assessments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
    }
  },

  students: {
    async save(student: Student): Promise<Student> {
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(student),
      });
      return handleResponse(response);
    },
    async getAll(): Promise<Student[]> {
      const response = await fetch(`${API_URL}/students`, {
        headers: getAuthHeader(),
      });
      return handleResponse(response);
    },
    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
    }
  },

  timetable: {
    async save(timetable: Timetable): Promise<Timetable> {
      const response = await fetch(`${API_URL}/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(timetable),
      });
      return handleResponse(response);
    },
    async get(): Promise<Timetable | null> {
      const response = await fetch(`${API_URL}/timetable`, {
        headers: getAuthHeader(),
      });
      return handleResponse(response);
    }
  },

  settings: {
    async getPublic(): Promise<SystemSettings> {
      const response = await fetch(`${API_URL}/settings/public`);
      return handleResponse(response);
    },
    get(): AppSettings {
      const str = localStorage.getItem('teachaide_settings');
      return str ? JSON.parse(str) : { theme: 'light', textSize: 'medium' };
    },
    save(settings: AppSettings) {
      localStorage.setItem('teachaide_settings', JSON.stringify(settings));
      if (settings.textSize === 'small') document.body.style.fontSize = '14px';
      if (settings.textSize === 'medium') document.body.style.fontSize = '16px';
      if (settings.textSize === 'large') document.body.style.fontSize = '18px';

      // Apply theme classes immediately to avoid flash
      try {
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.remove('bg-slate-50', 'text-slate-900');
          document.body.classList.add('bg-slate-900', 'text-slate-100');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('bg-slate-900', 'text-slate-100');
          document.body.classList.add('bg-slate-50', 'text-slate-900');
        }
      } catch (e) {
        // ignore in non-browser contexts
      }
      try {
        // Notify interested parts of the app that settings changed
        window.dispatchEvent(new Event('settings-change'));
      } catch (e) { }
    },
  },

  notifications: {
    async create(title: string, message: string, type: 'info' | 'alert' | 'success' = 'info', target: string = 'all'): Promise<void> {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ title, message, type, target }),
      });
      await handleResponse(response);
    },
    async markAsRead(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
    },
    async get(): Promise<any[]> {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: getAuthHeader(),
      });
      return handleResponse(response);
    },
    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      await handleResponse(response);
    },
    async update(id: string, data: any): Promise<void> {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      await handleResponse(response);
    }
  },

  payment: {
    async verify(reference: string, plan: 'Pro' | 'School'): Promise<void> {
      const response = await fetch(`${API_URL}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ reference, plan })
      });
      await handleResponse(response);
    }
  },

  admin: {
    async getStats() {
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: getAnyAuthHeader(),
      });
      return handleResponse(response);
    },

    async getAnalytics() {
      const response = await fetch(`${API_URL}/admin/analytics`, {
        headers: getAnyAuthHeader(),
      });
      return handleResponse(response);
    },

    async getAllUsers(): Promise<User[]> {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAnyAuthHeader(),
      });
      return handleResponse(response);
    },
    async getAllSchools(): Promise<School[]> {
      const response = await fetch(`${API_URL}/admin/schools`, {
        headers: getAnyAuthHeader(),
      });
      return handleResponse(response);
    },

    async createUser(data: Partial<User> & { password: string }): Promise<void> {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      await handleResponse(response);
    },

    async updateUserStatus(userId: string, status: 'Active' | 'Suspended'): Promise<void> {
      const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ status })
      });
      await handleResponse(response);
    },

    async deleteUser(userId: string): Promise<void> {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });
      await handleResponse(response);
    },

    async resetUserLimit(userId: string): Promise<void> {
      const response = await fetch(`${API_URL}/admin/users/${userId}/reset-limit`, {
        method: 'POST',
        headers: getAdminAuthHeader(),
      });
      await handleResponse(response);
    },

    async getAllNotes(): Promise<LessonNote[]> {
      const response = await fetch(`${API_URL}/admin/content/notes`, {
        headers: getAdminAuthHeader(),
      });
      return handleResponse(response);
    },

    async updateNoteStatus(noteId: string, status: 'Approved' | 'Flagged'): Promise<void> {
      const response = await fetch(`${API_URL}/admin/content/notes/${noteId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ status })
      });
      await handleResponse(response);
    },

    async getLogs(): Promise<AdminLog[]> {
      const response = await fetch(`${API_URL}/admin/logs`, {
        headers: getAdminAuthHeader(),
      });
      return handleResponse(response);
    },


    async getSystemSettings(): Promise<SystemSettings> {
      const response = await fetch(`${API_URL}/settings`, {
        headers: getAnyAuthHeader(),
      });
      return handleResponse(response);
    },

    async updateSystemSettings(settings: SystemSettings): Promise<void> {
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(settings),
      });
      await handleResponse(response);
    },

    async getCurriculum(): Promise<Curriculum> {
      const response = await fetch(`${API_URL}/curriculum`, {
        headers: getAnyAuthHeader(),
      });
      return handleResponse(response);
    },

    async saveCurriculum(data: Curriculum): Promise<void> {
      const response = await fetch(`${API_URL}/curriculum`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      await handleResponse(response);
    },

    async sendMassEmail(data: { subject: string; body: string; targetGroup: string }): Promise<void> {
      const response = await fetch(`${API_URL}/admin/mass-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      await handleResponse(response);
    },

    async getMassEmailHistory(): Promise<any[]> {
      const response = await fetch(`${API_URL}/admin/mass-email`, {
        headers: getAdminAuthHeader(),
      });
      return handleResponse(response);
    },

    referenceSchemes: {
      async getAll(params?: { subject?: string; classLevel?: string; term?: string }): Promise<any[]> {
        const query = new URLSearchParams(params as any).toString();
        const response = await fetch(`${API_URL}/reference-schemes?${query}`, {
          headers: getAdminAuthHeader()
        });
        return handleResponse(response);
      },
      async getOne(id: string): Promise<any> {
        const response = await fetch(`${API_URL}/reference-schemes/${id}`, {
          headers: getAdminAuthHeader()
        });
        return handleResponse(response);
      },
      async create(data: any): Promise<any> {
        const response = await fetch(`${API_URL}/reference-schemes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeader()
          },
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      async updateWeek(schemeId: string, weekNumber: number, data: any): Promise<any> {
        const response = await fetch(`${API_URL}/reference-schemes/${schemeId}/weeks/${weekNumber}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeader()
          },
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      async delete(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/reference-schemes/${id}`, {
          method: 'DELETE',
          headers: getAdminAuthHeader()
        });
        await handleResponse(response);
      }
    },

    async getAllTestimonials(): Promise<any[]> {
      const response = await fetch(`${API_URL}/admin/testimonials`, {
        headers: getAnyAuthHeader()
      });
      return handleResponse(response);
    },

    async createTestimonial(data: any): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAnyAuthHeader()
        },
        body: JSON.stringify(data)
      });
      await handleResponse(response);
    },

    async updateTestimonial(id: string, data: any): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAnyAuthHeader()
        },
        body: JSON.stringify(data)
      });
      await handleResponse(response);
    },

    async deleteTestimonial(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: getAnyAuthHeader()
      });
      await handleResponse(response);
    },

    async toggleTestimonialActive(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials/${id}/toggle`, {
        method: 'PATCH',
        headers: getAnyAuthHeader()
      });
      await handleResponse(response);
    },

    async updateTeacherLimit(schoolId: string, limit: number): Promise<void> {
      const response = await fetch(`${API_URL}/admin/schools/${schoolId}/teacher-limit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ teacherLimit: limit })
      });
      await handleResponse(response);
    },

    async logError(errorData: { source: string; path: string; message: string; stack?: string; metadata?: any; severity?: string }) {
      try {
        await fetch(`${API_URL}/admin/error-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAnyAuthHeader()
          },
          body: JSON.stringify(errorData)
        });
      } catch (e) {
        console.error('Silent failure while logging error:', e);
      }
    },

    async getErrorLogs(filters?: { severity?: string, source?: string, isResolved?: boolean }) {
      const params = new URLSearchParams();
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.source) params.append('source', filters.source);
      if (filters?.isResolved !== undefined) params.append('isResolved', String(filters.isResolved));

      const response = await fetch(`${API_URL}/admin/error-logs?${params.toString()}`, {
        headers: getAdminAuthHeader()
      });
      return handleResponse(response);
    },

    async resolveError(id: string, isResolved: boolean = true) {
      const response = await fetch(`${API_URL}/admin/error-logs/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ isResolved })
      });
      return handleResponse(response);
    },

    async updateUserPlan(id: string, plan: 'Free' | 'Pro' | 'School') {
      const response = await fetch(`${API_URL}/admin/users/${id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeader()
        },
        body: JSON.stringify({ plan })
      });
      return handleResponse(response);
    }
  },

  testimonials: {
    async getActive(): Promise<any[]> {
      try {
        const response = await fetch(`${API_URL}/testimonials`);
        return handleResponse(response);
      } catch (err) {
        console.error('Failed to load testimonials', err);
        return [];
      }
    },

    async submit(data: any): Promise<any> {
      const response = await fetch(`${API_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }
  },

  school: {
    async getDetails() {
      const response = await fetch(`${API_URL}/school-admin/details`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async getActivityLogs() {
      const response = await fetch(`${API_URL}/school-admin/activity`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },

    async addTeacher(name: string, email: string, gender?: string) {
      const response = await fetch(`${API_URL}/school-admin/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ name, email, gender })
      });
      return handleResponse(response);
    },

    async updateTeacherStatus(teacherId: string, teacherStatus: string) {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ teacherStatus })
      });
      return handleResponse(response);
    },

    async removeTeacher(teacherId: string) {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },

    async toggleTeacherAdmin(teacherId: string, isAdmin: boolean) {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}/toggle-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ isAdmin })
      });
      return handleResponse(response);
    },

    async updateSettings(settings: { allowAdminAccess: boolean }) {
      const response = await fetch(`${API_URL}/school-admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(settings)
      });
      return handleResponse(response);
    },
    async updateTeacherLimit(teacherId: string, limit: number) {
      const response = await fetch(`${API_URL}/school-admin/teachers/${teacherId}/limit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ monthlyLessonLimit: limit })
      });
      return handleResponse(response);
    },
    async updateProfile(details: { name: string, address?: string, phone?: string, email?: string, website?: string, capacity?: number }) {
      const response = await fetch(`${API_URL}/school-admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(details)
      });
      return handleResponse(response);
    }
  },

  // Shared server-side cache for generated content
  shared: {
    async findGenerated(type: string, subject: string, classLevel: string, topic: string, subtopic?: string) {
      const params = new URLSearchParams();
      params.set('type', type);
      params.set('subject', subject);
      params.set('classLevel', classLevel);
      params.set('topic', topic);
      if (subtopic) params.set('subtopic', subtopic);
      params.set('_t', Date.now().toString());

      const response = await fetch(`${API_URL}/cache?${params.toString()}`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async saveGenerated(type: string, subject: string, classLevel: string, topic: string, content: any, subtopic?: string) {
      // Ensure content is stored as a string (SharedContent uses String for content)
      const payloadContent = typeof content === 'string' ? content : JSON.stringify(content);
      const response = await fetch(`${API_URL}/cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          type,
          subject,
          classLevel,
          topic,
          subtopic: subtopic || '',
          content: payloadContent
        })
      });
      return handleResponse(response);
    },
    async incrementUsage(id: string) {
      const response = await fetch(`${API_URL}/cache/${id}/usage`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async delete(id: string) {
      const response = await fetch(`${API_URL}/cache/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    }
  },

  support: {
    // User-facing methods (use regular user auth only)
    async startSession(): Promise<any> {
      const response = await fetch(`${API_URL}/support/sessions`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async getMessages(sessionId: string, markAsRead: boolean = false): Promise<any[]> {
      const response = await fetch(`${API_URL}/support/sessions/${sessionId}/messages?markAsRead=${markAsRead}`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async sendMessage(sessionId: string, content: string, attachment?: string): Promise<any> {
      const response = await fetch(`${API_URL}/support/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ content, attachment })
      });
      return handleResponse(response);
    },
    async getUserSessions(): Promise<any[]> {
      const response = await fetch(`${API_URL}/support/my-sessions`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async convertToTicket(sessionId: string, data: { subject: string; description: string }): Promise<any> {
      const response = await fetch(`${API_URL}/support/sessions/${sessionId}/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    admin: {
      async getAllSessions(): Promise<any[]> {
        const response = await fetch(`${API_URL}/support/admin/sessions`, {
          headers: getAdminAuthHeader()
        });
        return handleResponse(response);
      },
      async getMessages(sessionId: string): Promise<any[]> {
        const response = await fetch(`${API_URL}/support/sessions/${sessionId}/messages`, {
          headers: getAdminAuthHeader()
        });
        return handleResponse(response);
      },
      async sendMessage(sessionId: string, content: string, attachment?: string): Promise<any> {
        const response = await fetch(`${API_URL}/support/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeader()
          },
          body: JSON.stringify({ content, attachment })
        });
        return handleResponse(response);
      },
      async closeSession(sessionId: string): Promise<void> {
        const response = await fetch(`${API_URL}/support/sessions/${sessionId}/close`, {
          method: 'PUT',
          headers: getAdminAuthHeader()
        });
        await handleResponse(response);
      },
      async getTickets(): Promise<any[]> {
        const response = await fetch(`${API_URL}/support/admin/tickets`, {
          headers: getAdminAuthHeader()
        });
        return handleResponse(response);
      },
      async updateTicket(ticketId: string, data: any): Promise<void> {
        const response = await fetch(`${API_URL}/support/tickets/${ticketId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeader()
          },
          body: JSON.stringify(data)
        });
        await handleResponse(response);
      }
    }
  },
  smartClass: {
    async create(data: { classLevel: string; subject: string; term: string; startWeek: number }): Promise<any> {
      const response = await fetch(`${API_URL}/smart-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },
    async getAll(): Promise<any[]> {
      const response = await fetch(`${API_URL}/smart-class`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async markComplete(dayId: string): Promise<any> {
      const response = await fetch(`${API_URL}/smart-class/days/${dayId}/complete`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async unmarkComplete(dayId: string): Promise<any> {
      const response = await fetch(`${API_URL}/smart-class/days/${dayId}/uncomplete`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async updateDayTopic(dayId: string, topic: string, subtopic?: string): Promise<any> {
      const response = await fetch(`${API_URL}/smart-class/days/${dayId}/topic`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ topic, subtopic })
      });
      return handleResponse(response);
    },
    async delete(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/smart-class/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      await handleResponse(response);
    }
  }
};