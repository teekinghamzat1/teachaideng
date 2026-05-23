import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../database';
import { Mail, Lock, Loader2, UserIcon, BookOpen, Building, Eye, EyeOff, Sparkles, CheckCircle, ChevronDown } from '../components/Icons';
import Loader from '../components/Loader';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const user = db.auth.getCurrentUser();
    if (user) {
      const role = (user.role || '').toLowerCase();
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Teacher',
    gender: 'Female',
    schoolName: '',
    schoolAddress: '',
    accountType: 'individual' // 'individual' | 'school' (progressive onboarding flag)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Eliminate flash by not rendering if user is already logged in
  if (db.auth.getCurrentUser()) {
    return <Loader fullscreen message="Redirecting to dashboard..." />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types to improve UX
    if (error) setError(null);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, width: '0%', label: '', color: 'bg-slate-200', textColor: 'text-slate-400' };

    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (pass.length < 6) return { score: 1, width: '33%', label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score < 3) return { score: 2, width: '66%', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { score: 3, width: '100%', label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side Validation
    if (!formData.name.trim()) {
      setError("Full Name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.accountType === 'school') {
      if (!formData.schoolName.trim()) {
        setError("School Name is required.");
        return;
      }
      if (!formData.schoolAddress.trim()) {
        setError("School Address is required.");
        return;
      }
    }

    setLoading(true);

    try {
      await db.auth.register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.gender,
        formData.schoolName,
        formData.accountType,
        formData.schoolAddress
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Premium Ethereal Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#16A34A]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#16A34A]/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 opacity-20"><Sparkles className="w-8 h-8 text-[#16A34A]" /></div>
        <div className="absolute bottom-1/3 right-1/4 opacity-10"><Sparkles className="w-12 h-12 text-[#16A34A]" /></div>
      </div>

      <div className="z-10 w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Signup Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 relative group">
          <div className="absolute inset-x-0 -top-6 flex justify-center">
            <div className="w-12 h-12 bg-[#16A34A] rounded-2xl flex items-center justify-center shadow-xl shadow-[#16A34A]/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="text-center pt-2 mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Create your account</h2>
            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Join 1,000+ Nigerian teachers using <span className="text-[#16A34A]">TeachAide</span> AI
            </p>
          </div>

          {/* Testimonial Quote Section */}
          <div className="mb-10 relative">
            <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative z-10">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm text-[#16A34A]">
                <span className="text-xl font-serif">“</span>
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic mb-4">
                'This is very amazing! I must confess'
              </p>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 bg-[#16A34A]/30"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="text-slate-900 dark:text-white">John Doe</span>, Teacher
                </p>
              </div>
            </div>
            {/* Quote Bubble Tail */}
            <div className="absolute -bottom-2 left-10 w-4 h-4 bg-slate-50 dark:bg-slate-800 transform rotate-45 border-r border-b border-slate-100 dark:border-slate-800"></div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-3 animate-in shake duration-500">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-300 group-focus-within/field:text-[#16A34A] transition-colors" />
                  </div>
                  <input
                    name="name"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 shadow-sm transition-all outline-none"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-300 group-focus-within/field:text-[#16A34A] transition-colors" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 shadow-sm transition-all outline-none"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
                  <div className="relative group/field">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-11 pr-3 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 shadow-sm transition-all outline-none text-sm"
                      placeholder="Min 8 chars"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <div className="relative group/field">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="block w-full pl-11 pr-11 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 shadow-sm transition-all outline-none text-sm"
                      placeholder="Min 8 chars"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-[#16A34A] transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional Title */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Professional Title</label>
                <div className="relative">
                  <select
                    name="role"
                    className="block w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold appearance-none outline-none transition-all shadow-sm pr-10"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Principal">Principal</option>
                    <option value="Proprietor/Proprietress">Proprietor/Proprietress</option>
                    <option value="Admin">School Admin</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Account Type Toggle */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] ml-1 text-center sm:text-left">How will you use TeachAide?</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accountType: 'individual' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${formData.accountType === 'individual' ? 'bg-[#16A34A] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {formData.accountType === 'individual' && <CheckCircle className="w-4 h-4" />}
                    I'm a Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accountType: 'school' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${formData.accountType === 'school' ? 'bg-[#16A34A] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {formData.accountType === 'school' && <CheckCircle className="w-4 h-4" />}
                    I represent a School
                  </button>
                </div>
              </div>

              {/* Conditional School Form */}
              {formData.accountType === 'school' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  {/* School Name */}
                  <div className="space-y-2">
                    <label htmlFor="schoolName" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">School Name</label>
                    <div className="relative group/field">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-slate-300 group-focus-within/field:text-[#16A34A] transition-colors" />
                      </div>
                      <input
                        id="schoolName"
                        name="schoolName"
                        type="text"
                        required={formData.accountType === 'school'}
                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 outline-none transition-all"
                        placeholder="Enter your school's name"
                        value={formData.schoolName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {/* School Address */}
                  <div className="space-y-2">
                    <label htmlFor="schoolAddress" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">
                      School Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative group/field">
                      <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                        <Building className="h-5 w-5 text-slate-300 group-focus-within/field:text-[#16A34A] transition-colors" />
                      </div>
                      <textarea
                        id="schoolAddress"
                        name="schoolAddress"
                        rows={2}
                        required={formData.accountType === 'school'}
                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 outline-none transition-all resize-none"
                        placeholder="e.g. 12 School Road, Lagos State"
                        value={formData.schoolAddress}
                        onChange={handleChange as any}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[60px] bg-[#16A34A] text-white font-black rounded-2xl shadow-xl shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Creating Account...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm font-bold text-slate-400 flex items-center justify-center gap-2">
              Already have an account?
              <Link to="/login" className="text-[#16A34A] hover:underline font-black">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cognovia Technologies · Nigeria</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

const SmallTestimonials: React.FC = () => {
  const [items, setItems] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await db.testimonials.getActive();
        if (mounted) setItems((data || []).slice(0, 2));
      } catch (e) {
        if (mounted) setItems([]);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (items === null) return <div className="text-sm text-slate-400">Loading...</div>;
  if (items.length === 0) return <div className="text-sm text-slate-400">No reviews yet</div>;

  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map((t) => (
        <div key={t.id} className="text-sm text-slate-600 dark:text-slate-300">"{t.content}" — <span className="font-medium text-slate-900 dark:text-slate-100">{t.name}</span></div>
      ))}
    </div>
  );
};