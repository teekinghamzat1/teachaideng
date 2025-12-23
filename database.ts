import { User, LessonNote, Assessment, Student, Timetable, AppSettings, AdminLog, SystemSettings, Curriculum, Subject, ClassLevel } from './types';

// Helper for API calls
const API_URL = '/api';

const getAuthHeader = () => {
  const userStr = localStorage.getItem('teachaide_session');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
  }
  return {};
};

const getAdminAuthHeader = () => {
  const userStr = localStorage.getItem('teachaide_admin_session');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
  }
  return {};
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    const url = response.url;
    // Determine which session to clear based on the request context or try clearing both if unsure,
    // but better to be specific.
    // If it's an admin endpoint, clear admin session
    if (url.includes('/api/admin')) {
      console.error(`401 Unauthorized from Admin API: ${url}`);
      localStorage.removeItem('teachaide_admin_session');
      window.location.href = '/admin/login'; // Redirect to admin login
      throw new Error('Admin session expired.');
    } else if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
      console.error(`401 Unauthorized from: ${url}`);
      localStorage.removeItem('teachaide_session');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    // For login failure, just throw
    throw new Error('Invalid credentials');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API Error');
  }
  const data = await response.json();
  return data.data; // Assuming backend returns { success: true, message: '', data: ... }
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

    async loginAsAdminDemo(): Promise<User> {
      return this.login('admin@example.com', 'password123');
    },

    async getUsage(): Promise<{ used: number; limit: number; remaining: number }> {
      const response = await fetch(`${API_URL}/users/usage`, {
        headers: getAuthHeader(),
      });
      return handleResponse(response);
    },

    async logout(): Promise<void> {
      try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
      } catch (e) {
        console.error(e);
      }
      localStorage.removeItem('teachaide_session');
      window.dispatchEvent(new Event('auth-change'));
    },

    async requestPasswordReset(email: string): Promise<void> {
      console.log(`Password reset requested for ${email}`);
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
    }
  },

  async getUsage(): Promise<{ used: number; limit: number; remaining: number }> {
    const response = await fetch(`${API_URL}/users/usage`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('teachaide_session');
    window.dispatchEvent(new Event('auth-change'));
  },

  async requestPasswordReset(email: string): Promise<void> {
    // Backend doesn't have this yet.
    console.log(`Password reset requested for ${email}`);
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
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(note),
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
      const response = await fetch(`${API_URL}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(assessment),
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
        headers: getAdminAuthHeader(),
      });
      return handleResponse(response);
    },

    async getAnalytics() {
      const response = await fetch(`${API_URL}/admin/analytics`, {
        headers: getAdminAuthHeader(),
      });
      return handleResponse(response);
    },

    async getAllUsers(): Promise<User[]> {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: getAdminAuthHeader(),
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
      // Backend not fully implemented for status update, placeholder
      console.warn('Update user status not implemented in backend yet');
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
      return [];
    },


    async getSystemSettings(): Promise<SystemSettings> {
      const response = await fetch(`${API_URL}/settings`, {
        headers: getAdminAuthHeader(),
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
        headers: getAdminAuthHeader(),
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

    async getAllTestimonials(): Promise<any[]> {
      const response = await fetch(`${API_URL}/admin/testimonials`, {
        headers: getAdminAuthHeader()
      });
      return handleResponse(response);
    },

    async createTestimonial(data: any): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
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
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      await handleResponse(response);
    },

    async deleteTestimonial(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      await handleResponse(response);
    },

    async toggleTestimonialActive(id: string): Promise<void> {
      const response = await fetch(`${API_URL}/admin/testimonials/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeader()
      });
      await handleResponse(response);
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
    }
  },

  school: {
    async getDetails() {
      const response = await fetch(`${API_URL}/school`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },

    async addTeacher(name: string, email: string, gender?: string) {
      const response = await fetch(`${API_URL}/school/teachers`, {
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
      const response = await fetch(`${API_URL}/school/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ teacherStatus })
      });
      return handleResponse(response);
    },

    async removeTeacher(teacherId: string) {
      const response = await fetch(`${API_URL}/school/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },

    async toggleTeacherAdmin(teacherId: string, isAdmin: boolean) {
      const response = await fetch(`${API_URL}/school/teachers/${teacherId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ isAdmin })
      });
      return handleResponse(response);
    },

    async updateSettings(settings: { allowAdminAccess: boolean }) {
      const response = await fetch(`${API_URL}/school/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(settings)
      });
      return handleResponse(response);
    },
    async updateTeacherLimit(teacherId: string, limit: number) {
      const response = await fetch(`${API_URL}/school/teachers/${teacherId}/limit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ monthlyLessonLimit: limit })
      });
      return handleResponse(response);
    }
  },
  // Shared server-side cache for generated content
  shared: {
    async findGenerated(type: string, subject: string, classLevel: string, topic?: string) {
      const params = new URLSearchParams();
      params.set('type', type);
      params.set('subject', subject);
      params.set('classLevel', classLevel);
      if (topic) params.set('topic', topic);
      const response = await fetch(`${API_URL}/cache?${params.toString()}`, {
        headers: getAuthHeader()
      });
      return handleResponse(response);
    },
    async saveGenerated(type: string, subject: string, classLevel: string, topic: string, content: any) {
      // Ensure content is stored as a string (SQLite uses String for content)
      const payloadContent = typeof content === 'string' ? content : JSON.stringify(content);
      const response = await fetch(`${API_URL}/cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ type, subject, classLevel, topic, content: payloadContent })
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
  }
};