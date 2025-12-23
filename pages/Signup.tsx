import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../database';
import { Mail, Lock, Loader2, UserIcon, BookOpen, Building, Eye, EyeOff } from '../components/Icons';
import Loader from '../components/Loader';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const user = db.auth.getCurrentUser();
    if (user) {
      if (user.role === 'Admin' || user.role === 'superadmin') {
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

    setLoading(true);

    try {
      await db.auth.register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.gender,
        formData.schoolName,
        formData.accountType
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-xl w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm flex items-center animate-pulse">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          <div className="space-y-5">
            {/* Personal Details Group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  id="role"
                  name="role"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Student Teacher">Student Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* Account Type (progressive onboarding) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">How will you use TeachAide?</label>
              <div className="mt-2 flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input type="radio" name="accountType" value="individual" checked={formData.accountType === 'individual'} onChange={handleChange} className="form-radio" />
                  <span className="ml-2 text-sm">I&apos;m a Teacher</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="radio" name="accountType" value="school" checked={formData.accountType === 'school'} onChange={handleChange} className="form-radio" />
                  <span className="ml-2 text-sm">I represent a School</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-2">Choose how you will use TeachAide. You can change this later.</p>
            </div>

            {/* Inline testimonials (small) */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">What teachers say</h4>
              <SmallTestimonials />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">School Name (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                  placeholder="Your School Name"
                  value={formData.schoolName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="px-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300 ease-out`}
                      style={{ width: strength.width }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 text-right font-medium ${strength.textColor}`}>
                    {strength.label}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg placeholder-slate-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-700 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm shadow-sm"
                    placeholder="Repeat Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-md hover:shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Creating Account...
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </div>
        </form>
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