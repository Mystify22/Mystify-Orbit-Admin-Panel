import React, { useState } from 'react';
import { useUploads } from '../../context/UploadContext';
import { saveThemePromptApi } from '../../services/themePromptService';
import type { ThemePromptFormData, ThemePromptBackendResponse } from '../../types/themePrompt';
import './ThemePromptManager.css';
import {
  Save,
  X,
  Copy,
  Check,
  Layers,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const ThemeUploader: React.FC = () => {
  const { addToast } = useUploads();

  // Form input states (all strings and mandatory: Name, Prompt, Category, Tag)
  const [formData, setFormData] = useState<ThemePromptFormData>({
    name: '',
    prompt: '',
    category: '',
    tag: '',
  });

  const [formErrors, setFormErrors] = useState<{ [K in keyof ThemePromptFormData]?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Response display state
  const [latestResponse, setLatestResponse] = useState<ThemePromptBackendResponse | null>(null);
  const [responseViewMode, setResponseViewMode] = useState<'cards' | 'json'>('cards');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Handle field change and clear field-specific error
  const handleInputChange = (field: keyof ThemePromptFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Form validation - All parameters (Name, Prompt, Category, Tag) are mandatory strings
  const validateForm = (): boolean => {
    const errors: { [K in keyof ThemePromptFormData]?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is mandatory';
    }
    if (!formData.prompt.trim()) {
      errors.prompt = 'Prompt is mandatory';
    }
    if (!formData.category.trim()) {
      errors.category = 'Category is mandatory';
    }
    if (!formData.tag.trim()) {
      errors.tag = 'Tag is mandatory';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler: Saves prompt to backend and renders response
  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('error', 'Validation Error', 'All fields (Name, Prompt, Category, Tag) are mandatory.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await saveThemePromptApi(formData);
      setLatestResponse(response);

      // Clear all fields after hitting save
      setFormData({
        name: '',
        prompt: '',
        category: '',
        tag: '',
      });
      setFormErrors({});

      addToast(
        'success',
        'Theme Prompt Saved',
        `Prompt ID ${response.id} registered successfully for "${response.name}".`
      );
    } catch (err: unknown) {
      const error = err as Error;
      addToast('error', 'Save Failed', error.message || 'Could not save theme prompt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only enable button when all 4 mandatory fields are filled
  const isFormValid =
    formData.name.trim() !== '' &&
    formData.prompt.trim() !== '' &&
    formData.category.trim() !== '' &&
    formData.tag.trim() !== '';

  // Copy helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  return (
    <div className="theme-studio-container">
      {/* Main Grid: Left = Save Theme Prompt Form, Right = Backend Response Display */}
      <div className="theme-studio-grid">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Save Theme Prompt Section (Request Body Form)       */}
        {/* Order: Name -> Prompt -> Category -> Tag                          */}
        {/* ================================================================= */}
        <div className="red-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-styled">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-red-subtle)',
                  color: 'var(--primary-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Save Theme Prompt
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleSavePrompt} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Name (Mandatory String) */}
            <div className="form-group">
              <label className="form-label" htmlFor="theme-name-input">
                Name
                <span style={{ color: 'var(--primary-red)', marginLeft: '2px' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="theme-name-input"
                  type="text"
                  className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Cyberpunk Crimson Protocol"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{ paddingRight: formData.name ? '36px' : '14px' }}
                />
                {formData.name && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('name', '')}
                    title="Clear Name"
                    aria-label="Clear Name"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '50%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary-red)';
                      e.currentTarget.style.backgroundColor = 'var(--primary-red-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              {formErrors.name && (
                <div className="field-error-text">
                  <AlertTriangle size={13} /> {formErrors.name}
                </div>
              )}
            </div>

            {/* 2. Prompt (Mandatory String) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="theme-prompt-input">
                  Prompt
                  <span style={{ color: 'var(--primary-red)', marginLeft: '2px' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formData.prompt.length} characters
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="theme-prompt-input"
                  className={`form-input ${formErrors.prompt ? 'input-error' : ''}`}
                  rows={5}
                  placeholder="Enter prompt: Describe the visual aesthetics, background atmosphere, accent colors, textures, lighting, and styling rules..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  style={{ resize: 'vertical', minHeight: '110px', paddingRight: formData.prompt ? '36px' : '14px' }}
                />
                {formData.prompt && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('prompt', '')}
                    title="Clear Prompt"
                    aria-label="Clear Prompt"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary-red)';
                      e.currentTarget.style.borderColor = 'var(--primary-red-border)';
                      e.currentTarget.style.backgroundColor = '#fff1f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-card)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {formErrors.prompt && (
                <div className="field-error-text">
                  <AlertTriangle size={13} /> {formErrors.prompt}
                </div>
              )}
            </div>

            {/* 3. Category (Mandatory String) */}
            <div className="form-group">
              <label className="form-label" htmlFor="theme-category-input">
                Category
                <span style={{ color: 'var(--primary-red)', marginLeft: '2px' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="theme-category-input"
                  type="text"
                  className={`form-input ${formErrors.category ? 'input-error' : ''}`}
                  placeholder="e.g. Futuristic Cyber, Dark Fantasy, Minimalist"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{ paddingRight: formData.category ? '36px' : '14px' }}
                />
                {formData.category && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('category', '')}
                    title="Clear Category"
                    aria-label="Clear Category"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '50%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary-red)';
                      e.currentTarget.style.backgroundColor = 'var(--primary-red-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              {formErrors.category && (
                <div className="field-error-text">
                  <AlertTriangle size={13} /> {formErrors.category}
                </div>
              )}
            </div>

            {/* 4. Tag (Mandatory String) */}
            <div className="form-group">
              <label className="form-label" htmlFor="theme-tag-input">
                Tag
                <span style={{ color: 'var(--primary-red)', marginLeft: '2px' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="theme-tag-input"
                  type="text"
                  className={`form-input ${formErrors.tag ? 'input-error' : ''}`}
                  placeholder="e.g. dark-mode, neon-glow, ambient"
                  value={formData.tag}
                  onChange={(e) => handleInputChange('tag', e.target.value)}
                  style={{ paddingRight: formData.tag ? '36px' : '14px' }}
                />
                {formData.tag && (
                  <button
                    type="button"
                    onClick={() => handleInputChange('tag', '')}
                    title="Clear Tag"
                    aria-label="Clear Tag"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '50%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary-red)';
                      e.currentTarget.style.backgroundColor = 'var(--primary-red-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              {formErrors.tag && (
                <div className="field-error-text">
                  <AlertTriangle size={13} /> {formErrors.tag}
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !isFormValid}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spin-animation" style={{ display: 'inline-block' }}>⟳</span>
                    <span>Saving Prompt...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Prompt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Backend Response Section                            */}
        {/* Shows: Prompt ID (id), name, Prompt, Tag Name, theme category id,  */}
        {/* and theme name                                                    */}
        {/* ================================================================= */}
        <div className="red-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-styled">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Response
              </h2>
              {latestResponse && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  200 OK
                </span>
              )}
            </div>

            {/* View Switcher: Visual Cards vs JSON */}
            {latestResponse && (
              <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setResponseViewMode('cards')}
                  style={{
                    border: 'none',
                    background: responseViewMode === 'cards' ? '#ffffff' : 'transparent',
                    color: responseViewMode === 'cards' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: responseViewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Fields
                </button>
                <button
                  type="button"
                  onClick={() => setResponseViewMode('json')}
                  style={{
                    border: 'none',
                    background: responseViewMode === 'json' ? '#ffffff' : 'transparent',
                    color: responseViewMode === 'json' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: responseViewMode === 'json' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Raw JSON
                </button>
              </div>
            )}
          </div>

          {/* If No Response Available Yet */}
          {!latestResponse ? (
            <div
              style={{
                flex: 1,
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--border-card)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#fffdfd',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '32px',
              }}
            >
              <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '6px' }}>
                No Response Generated Yet
              </strong>
              <p style={{ fontSize: '0.85rem', maxWidth: '340px', lineHeight: 1.5 }}>
                Fill out Name, Prompt, Category, and Tag in the form, then click "Save Prompt" to see the response fields.
              </p>
            </div>
          ) : responseViewMode === 'cards' ? (
            /* Visual Field Cards Display */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Top Meta Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fafafa',
                  border: '1px solid #f1f2f4',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <Clock size={14} color="#6b7280" />
                  <span>Saved: {new Date(latestResponse.savedAt).toLocaleTimeString()}</span>
                </div>
                <button
                  type="button"
                  className="copy-pill-btn"
                  onClick={() => handleCopyText(JSON.stringify(latestResponse.rawPayload || latestResponse, null, 2), 'all_json')}
                >
                  {copiedKey === 'all_json' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  <span>{copiedKey === 'all_json' ? 'Copied JSON!' : 'Copy JSON'}</span>
                </button>
              </div>

              {/* Grid of Key Response Properties */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* 1. Prompt ID (id) */}
                <div className="res-field-box">
                  <div className="res-field-label">Prompt ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="res-field-value">{latestResponse.id}</div>
                    <button
                      type="button"
                      className="copy-pill-btn"
                      onClick={() => handleCopyText(String(latestResponse.id), 'prompt_id')}
                      title="Copy Prompt ID"
                    >
                      {copiedKey === 'prompt_id' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* 2. Theme Category ID */}
                <div className="res-field-box">
                  <div className="res-field-label">Theme Category ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="res-field-value">{latestResponse.themeCategoryId}</div>
                    <button
                      type="button"
                      className="copy-pill-btn"
                      onClick={() => handleCopyText(String(latestResponse.themeCategoryId), 'cat_id')}
                      title="Copy Category ID"
                    >
                      {copiedKey === 'cat_id' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* 3. Tag Name */}
                <div className="res-field-box">
                  <div className="res-field-label">Tag Name</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="res-field-value">{latestResponse.tagName}</div>
                    <button
                      type="button"
                      className="copy-pill-btn"
                      onClick={() => handleCopyText(latestResponse.tagName, 'tag_name')}
                      title="Copy Tag Name"
                    >
                      {copiedKey === 'tag_name' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* 4. Name */}
                <div className="res-field-box">
                  <div className="res-field-label">Name</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="res-field-value">{latestResponse.name}</div>
                    <button
                      type="button"
                      className="copy-pill-btn"
                      onClick={() => handleCopyText(latestResponse.name, 'name')}
                      title="Copy Name"
                    >
                      {copiedKey === 'name' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Theme Name */}
              <div className="res-field-box">
                <div className="res-field-label">Theme Name</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="res-field-value">{latestResponse.themeName}</div>
                  <button
                    type="button"
                    className="copy-pill-btn"
                    onClick={() => handleCopyText(latestResponse.themeName, 'theme_name')}
                    title="Copy Theme Name"
                  >
                    {copiedKey === 'theme_name' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* 6. Prompt */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="res-field-label" style={{ marginBottom: 0 }}>
                    Prompt
                  </div>
                  <button
                    type="button"
                    className="copy-pill-btn"
                    onClick={() => handleCopyText(latestResponse.prompt, 'prompt_text')}
                    title="Copy Prompt text"
                  >
                    {copiedKey === 'prompt_text' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    <span>{copiedKey === 'prompt_text' ? 'Copied Prompt' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <div className="prompt-display-box">
                  {latestResponse.prompt}
                </div>
              </div>
            </div>
          ) : (
            /* Raw JSON View */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Raw JSON Payload
                </span>
                <button
                  type="button"
                  className="copy-pill-btn"
                  onClick={() => handleCopyText(JSON.stringify(latestResponse.rawPayload || latestResponse, null, 2), 'raw_json')}
                >
                  {copiedKey === 'raw_json' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="code-preview-block">
                {JSON.stringify(latestResponse.rawPayload || latestResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
