import React, { useEffect, useState } from 'react';
import { db, getAnyAuthHeader } from '../database';
import { Trash, Edit, Plus, CheckCircle, X, Users, Star } from '../components/Icons';
import { showAlert } from '../utils/alerts';

type FormState = {
  name: string;
  role: string;
  organization: string;
  content: string;
  avatarUrl?: string;
  rating: number;
};

const AdminTestimonials: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', role: '', organization: '', content: '', avatarUrl: '', rating: 5 });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.admin.getAllTestimonials();
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
  };

  const startCreate = () => { setEditing(null); setForm({ name: '', role: '', organization: '', content: '', avatarUrl: '', rating: 5 }); setErrors({}); setShowForm(true); };

  const startEdit = (t: any) => { setEditing(t); setForm({ name: t.name, role: t.role, organization: t.organization || '', content: t.content, avatarUrl: t.avatarUrl || '', rating: t.rating || 5 }); setShowForm(true); };

  const validate = (f: FormState) => {
    const errs: Partial<FormState> = {};
    if (!f.name || f.name.trim().length < 2) errs.name = 'Please enter a valid name';
    if (!f.content || f.content.trim().length < 10) errs.content = 'Quote must be at least 10 characters';
    return errs;
  };

  const save = async () => {
    const v = validate(form);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }

    try {
      if (editing) {
        await db.admin.updateTestimonial(editing.id, form);
      } else {
        await db.admin.createTestimonial(form);
      }
      setShowForm(false);
      load();
      showAlert.success('Success', `Testimonial ${editing ? 'updated' : 'created'} successfully.`);
    } catch (e: any) {
      console.error(e);
      showAlert.error('Error', e.message || 'Failed to save testimonial');
    }
  };

  const remove = async (id: string) => {
    if (await showAlert.confirm('Delete Testimonial', 'Are you sure you want to delete this testimonial?')) {
      await db.admin.deleteTestimonial(id);
      showAlert.success('Deleted', 'Testimonial removed.');
      load();
    }
  };

  const toggleActive = async (id: string) => {
    await db.admin.toggleTestimonialActive(id);
    load();
  };

  return (
    <div className="bg-white dark:bg-slate-800 dark:text-slate-100 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Testimonials</h2>
        <div className="flex items-center gap-2">
          <button onClick={startCreate} className="inline-flex items-center px-3 py-2 bg-brand-600 text-white rounded-md">
            <Plus className="w-4 h-4 mr-2" /> Add
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500">Close</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className={`mt-1 p-2 border rounded w-full bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.name ? 'border-red-400' : ''}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <input name="role" value={form.role} onChange={handleChange} placeholder="Role" className="mt-1 p-2 border rounded w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Organization</label>
                  <input name="organization" value={form.organization} onChange={handleChange} placeholder="Organization" className="mt-1 p-2 border rounded w-full bg-white dark:bg-slate-700 dark:text-slate-100" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-1">Rating</label>
                <div className="flex gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className="transition-transform active:scale-90"
                    >
                      <Star className={`w-6 h-6 ${star <= form.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Quote</label>
                <textarea name="content" value={form.content} onChange={handleChange} placeholder="Quote" className={`mt-1 p-2 border rounded w-full h-28 bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.content ? 'border-red-400' : ''}`} />
                {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">Avatar</label>
                <div className="mt-1 flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('image', file);
                    setUploading(true);
                    setUploadError('');
                    try {
                      const resp = await fetch('/api/upload/image', {
                        method: 'POST',
                        headers: getAnyAuthHeader() as Record<string, string>,
                        body: fd
                      });
                      const result = await resp.json().catch(() => null);
                      if (!resp.ok) {
                        const msg = result?.message || result?.error || `Upload failed (${resp.status})`;
                        throw new Error(msg);
                      }
                      // result.data.url expected
                      const url = result?.data?.url || result?.data?.secure_url || result?.url;
                      if (!url) throw new Error('Upload succeeded but no URL returned');
                      setForm(prev => ({ ...prev, avatarUrl: url }));
                    } catch (err: any) {
                      console.error('Upload error', err);
                      const msg = err?.message || String(err) || 'Upload failed';
                      setUploadError(msg);
                    } finally {
                      setUploading(false);
                    }
                  }} />
                  {uploading ? <div className="text-sm text-slate-500">Uploading...</div> : (
                    form.avatarUrl ? <img src={form.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 bg-slate-100 rounded-full" />
                  )}
                  {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setShowForm(false); }} className="px-4 py-2 bg-slate-200 rounded">Cancel</button>
                <button onClick={save} className="px-4 py-2 bg-brand-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <div>Loading...</div> : (
        <div className="space-y-8">
          {/* Pending / Inactive Section */}
          {items.filter(i => !i.isActive).length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-amber-600 dark:text-amber-500 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Pending / Inactive Testimonials
              </h3>
              <div className="space-y-3">
                {items.filter(i => !i.isActive).map(t => (
                  <div key={t.id} className="flex items-start justify-between border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                    <div className="flex items-start gap-4">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">{t.name?.charAt(0)}</div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Pending Review</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t.role} {t.organization && ` at ${t.organization}`}</p>
                        {t.rating > 0 && (
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-slate-700 dark:text-slate-300 italic">"{t.content}"</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Submitted: {new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(t.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                        title="Approve & Publish"
                      >
                        <CheckCircle className="w-3 h-3 mr-1.5" /> Approve
                      </button>
                      <button onClick={() => startEdit(t)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(t.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"><Trash className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Section */}
          <div>
            <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Published Testimonials
            </h3>
            {items.filter(i => i.isActive).length === 0 ? (
              <p className="text-slate-500 italic">No published testimonials.</p>
            ) : (
              <div className="space-y-3">
                {items.filter(i => i.isActive).map(t => (
                  <div key={t.id} className="flex items-start justify-between border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-white dark:bg-slate-800">
                    <div className="flex items-start gap-4">
                      {t.avatarUrl ? (
                        <img src={t.avatarUrl} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold">{t.name?.charAt(0)}</div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t.role} {t.organization && ` at ${t.organization}`}</p>
                        {t.rating > 0 && (
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-slate-700 dark:text-slate-300 italic">"{t.content}"</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(t.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded transition-colors"
                        title="Unpublish (Hide)"
                      >
                        <X className="w-3 h-3 mr-1.5" /> Unpublish
                      </button>
                      <button onClick={() => startEdit(t)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(t.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600"><Trash className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
