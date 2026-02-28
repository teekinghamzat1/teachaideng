const fs = require('fs');
const file = 'c:\\Users\\adetu\\Downloads\\teachaide-ai\\pages\\AdminBlog.tsx';
const content = fs.readFileSync(file, 'utf8');

const updatedModal = `            {/* Edit/Create Modal - REDESIGNED */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-500/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-6 py-5 border-b border-[#F0F2F5] flex justify-between items-center bg-white z-10 shrink-0">
                            <div>
                                <h2 className="text-[20px] font-bold text-[#111827]">
                                    {isEditing ? 'Edit Post' : 'New Blog Post'}
                                </h2>
                                {isEditing && (
                                    <div className="flex items-center gap-2 mt-1">
                                        {isSaving ? (
                                            <span className="text-xs text-brand-600 flex items-center gap-1 font-medium">
                                                <LoadingSpinner /> Saving...
                                            </span>
                                        ) : lastSaved ? (
                                            <span className="text-xs text-slate-400 font-medium">
                                                Last saved: {lastSaved.toLocaleTimeString()}
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto w-full custom-scrollbar">
                            {/* Title */}
                            <div>
                                <label className="block text-[15px] font-semibold text-[#1F2937] mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter a title for your blog post..."
                                    value={currentPost.title || ''}
                                    onChange={e => {
                                        setCurrentPost({ ...currentPost, title: e.target.value });
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="w-full rounded-[8px] border border-[#F0F2F5] bg-[#F4F5F7] px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E5E7EB] focus:bg-white transition-all text-[15px]"
                                />
                            </div>

                            {/* Cover Image Selection */}
                            <div>
                                <label className="block text-[15px] font-semibold text-[#1F2937] mb-2">Cover Image</label>
                                
                                <div 
                                    className={\`relative border border-dashed rounded-[12px] p-8 flex flex-col items-center justify-center transition-colors \${currentPost.image ? 'border-[#D1D5DB] bg-[#F9FAFB]' : 'border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F3F4F6]'}\`}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleImageUpload(e.dataTransfer.files);
                                    }}
                                >
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 font-medium text-brand-600 rounded-xl">
                                            <LoadingSpinner />
                                            <span className="ml-2">Uploading...</span>
                                        </div>
                                    )}

                                    {currentPost.image ? (
                                        <div className="relative group w-full">
                                            <img src={currentPost.image} alt="Preview" className="h-[200px] w-full object-cover rounded-lg shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPost(p => ({ ...p, image: '' }))}
                                                className="absolute top-2 right-2 bg-white text-red-500 rounded-lg p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="mb-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-[#E5E7EB] bg-white text-[#94A3B8] p-2 rounded-lg">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <label htmlFor="file-upload" className="cursor-pointer bg-white border border-[#E5E7EB] text-[#059669] rounded-[8px] px-4 py-2 font-medium shadow-sm hover:shadow transition-all flex items-center space-x-2 text-[14px] max-w-fit mx-auto">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                <span>Upload Cover Image</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-[15px] font-semibold text-[#1F2937] mb-2">Content</label>
                                <div className="border border-[#F0F2F5] rounded-[8px] overflow-hidden bg-white">
                                    <ReactQuill
                                        theme="snow"
                                        value={currentPost.content || ''}
                                        onChange={(value) => {
                                            setCurrentPost({ ...currentPost, content: value });
                                            setHasUnsavedChanges(true);
                                        }}
                                        className="h-[250px] border-0 text-[15px]"
                                        placeholder="Write something amazing..."
                                    />
                                    <style>{\`
                                        .quill .ql-toolbar { border-top: none; border-left: none; border-right: none; border-bottom: 1px solid #F0F2F5; background: #FFF; padding: 12px; }
                                        .quill .ql-container { border: none; font-family: inherit; font-size: 15px; }
                                        .quill .ql-editor { min-height: 200px; padding: 16px; color: #111827; }
                                        .quill .ql-editor.ql-blank::before { font-style: normal; color: #9CA3AF; }
                                    \`}</style>
                                </div>
                            </div>

                            {/* Settings accordion or secondary section */}
                            <div className="pt-6 mt-6 border-t border-[#F0F2F5]">
                                <details className="group">
                                    <summary className="cursor-pointer flex items-center justify-between font-semibold text-[#4B5563] list-none select-none text-[15px]">
                                        <span>Advanced Settings & SEO</span>
                                        <span className="transition group-open:rotate-180 bg-[#F3F4F6] p-1 rounded-full text-[#9CA3AF]">
                                            <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <div className="mt-6 space-y-5 text-[14px]">
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block font-medium text-[#4B5563] mb-1">Slug (URL)</label>
                                                <input type="text" placeholder="auto-generated-if-empty" value={currentPost.slug || ''} onChange={e => { setCurrentPost({ ...currentPost, slug: e.target.value }); setHasUnsavedChanges(true); }} className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] shadow-sm focus:ring-2 focus:ring-[#E5E7EB] focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block font-medium text-[#4B5563] mb-1">Author Name</label>
                                                <input type="text" value={currentPost.author || ''} onChange={e => { setCurrentPost({ ...currentPost, author: e.target.value }); setHasUnsavedChanges(true); }} className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] shadow-sm focus:ring-2 focus:ring-[#E5E7EB] focus:outline-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-medium text-[#4B5563] mb-1">Summary</label>
                                            <textarea rows={2} value={currentPost.summary || ''} onChange={e => { setCurrentPost({ ...currentPost, summary: e.target.value }); setHasUnsavedChanges(true); }} className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] shadow-sm focus:ring-2 focus:ring-[#E5E7EB] focus:outline-none" />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-[#F0F2F5]">
                                            <div>
                                                <label className="block font-medium text-[#4B5563] mb-1">SEO Title</label>
                                                <input type="text" value={currentPost.metaTitle || ''} onChange={e => { setCurrentPost({ ...currentPost, metaTitle: e.target.value }); setHasUnsavedChanges(true); }} placeholder="Leave empty to use the Article Title" className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] shadow-sm focus:ring-2 focus:ring-[#E5E7EB] focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block font-medium text-[#4B5563] mb-1">SEO Description</label>
                                                <textarea rows={2} value={currentPost.metaDescription || ''} onChange={e => { setCurrentPost({ ...currentPost, metaDescription: e.target.value }); setHasUnsavedChanges(true); }} placeholder="Leave empty to use the Article Summary" className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] shadow-sm focus:ring-2 focus:ring-[#E5E7EB] focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block font-medium text-[#4B5563] mb-1">Keywords</label>
                                                <input type="text" value={currentPost.keywords || ''} onChange={e => { setCurrentPost({ ...currentPost, keywords: e.target.value }); setHasUnsavedChanges(true); }} placeholder="e.g. lesson planning, AI" className="w-full rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[#111827] shadow-sm focus:ring-2 focus:ring-[#E5E7EB] focus:outline-none" />
                                            </div>
                                        </div>

                                        <div className="flex items-center pt-2">
                                            <input type="checkbox" id="published" checked={currentPost.published || false} onChange={e => { setCurrentPost({ ...currentPost, published: e.target.checked }); setHasUnsavedChanges(true); }} className="rounded-[4px] border-[#D1D5DB] text-brand-600 focus:ring-brand-500 w-5 h-5 mr-3" />
                                            <label htmlFor="published" className="text-[14px] font-medium text-[#4B5563] select-none cursor-pointer">
                                                Publish this post immediately
                                            </label>
                                        </div>

                                    </div>
                                </details>
                            </div>

                            <div className="pt-6 mt-6 border-t border-[#F0F2F5] flex justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-[14px] font-medium text-[#4B5563] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-[8px] transition shadow-sm">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2.5 text-[14px] font-semibold bg-[#111827] text-white rounded-[8px] hover:bg-[#1F2937] shadow-sm transition">
                                    {isEditing ? 'Save Changes' : 'Create Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}`;

const startMarker = "{/* Edit/Create Modal - UPDATED */}";
const startIdx = content.indexOf(startMarker);

// Find the end of the modal closing div, before the final closing div of the component.
// The easiest way is to slice before the last </div>\\n    );\\n};
const endIdxStr = "    );\\r?\\n};";
const endRegex = new RegExp(\`(</div>\\\\s*)\${endIdxStr}\`);
const match = content.match(endRegex);

if (startIdx !== -1 && match) {
    // We split by start marker and the matched end string
    const endMatchIndex = match.index;
    
    // We replace everything from startIdx to endMatchIndex
    let before = content.substring(0, startIdx);
    let after = content.substring(endMatchIndex); // this is "</div>\n    );\n};"
    
    // We actually only want to replace up to the LAST "</div>\n            )}\n        </div>"
    // Let's just use string splitting.
    
    const parts = content.split('{/* Edit/Create Modal - UPDATED */}');
    const firstPart = parts[0];
    const secondPart = parts[1];
    
    const endMarkerIndex = secondPart.lastIndexOf('</div>\\n            )}\\n        </div>');
    // Find the end
    let replaceTill = secondPart.lastIndexOf(')}');
    // find the previous closing div for showModal
    let newSecondPart = secondPart.substring(replaceTill + 2); // this will give '\n        </div>\n    );\n};\nexport default AdminBlog;'
    
    let modified = firstPart + updatedModal + newSecondPart;
    fs.writeFileSync(file, modified);
    console.log("Successfully replaced modal content.");
} else {
    console.log("Could not find start or end markers.");
}
