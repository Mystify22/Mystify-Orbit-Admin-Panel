import React, { useState } from 'react';
import { useUploads } from '../../context/UploadContext';
import { saveThemePromptApi, generateThemeApi } from '../../services/themePromptService';
import type {
  ThemePromptFormData,
  ThemePromptBackendResponse,
  GenerateThemeApiResponse,
} from '../../types/themePrompt';
import './ThemePromptManager.css';
import {
  Save,
  X,
  Copy,
  Check,
  Layers,
  Clock,
  AlertTriangle,
  Sparkles,
  Wand2,
  Palette,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  CheckCircle2,
  ArrowDown,
  RefreshCw,
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

  // Response display state for Save Theme Prompt
  const [latestResponse, setLatestResponse] = useState<ThemePromptBackendResponse | null>(null);
  const [responseViewMode, setResponseViewMode] = useState<'cards' | 'json'>('cards');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate Theme states
  const [generatePromptId, setGeneratePromptId] = useState<string>('');
  const [generatePromptIdError, setGeneratePromptIdError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateResponse, setGenerateResponse] = useState<GenerateThemeApiResponse | null>(null);
  const [generateViewMode, setGenerateViewMode] = useState<'preview' | 'json'>('preview');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

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

  // Validation for integer promptId (only positive integers allowed: e.g. 15)
  const isIntegerValid = (val: string): boolean => {
    const trimmed = val.trim();
    return /^[1-9]\d*$/.test(trimmed);
  };

  const handlePromptIdChange = (val: string) => {
    setGeneratePromptId(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setGeneratePromptIdError(null);
    } else if (!/^[1-9]\d*$/.test(trimmed)) {
      setGeneratePromptIdError('Prompt ID must be a positive integer (e.g. 15)');
    } else {
      setGeneratePromptIdError(null);
    }
  };

  // Only enable Generate Theme button when parameter is integer and not currently generating
  const isGenerateButtonEnabled = isIntegerValid(generatePromptId) && !isGenerating;

  const handleGenerateTheme = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIntegerValid(generatePromptId)) {
      setGeneratePromptIdError('Please enter a valid integer Prompt ID');
      addToast('error', 'Validation Error', 'Prompt ID must be a positive integer.');
      return;
    }

    const promptIdNum = parseInt(generatePromptId.trim(), 10);
    setIsGenerating(true);

    try {
      const response = await generateThemeApi(promptIdNum);
      setGenerateResponse(response);
      addToast(
        'success',
        'Theme Generated Successfully',
        `Theme artwork generated for Prompt ID #${promptIdNum}.`
      );
    } catch (err: unknown) {
      const error = err as Error;
      addToast('error', 'Generation Failed', error.message || 'Could not generate theme artwork.');
    } finally {
      setIsGenerating(false);
    }
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

      {/* ================================================================= */}
      {/* SECTION DIVIDER: Generate Theme Artwork                           */}
      {/* ================================================================= */}
      <div className="studio-section-divider">
        <div className="studio-divider-chip">
          <Wand2 size={15} />
          <span>Generate Theme Section</span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* GENERATE THEME GRID: Left = Parameter Input, Right = Response     */}
      {/* Takes integer promptId -> calls /v1/admin/generate-theme/{id}     */}
      {/* ================================================================= */}
      <div className="theme-studio-grid">
        {/* Left Column: Generate Theme Form */}
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
                <Palette size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Generate Theme
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateTheme} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <label className="form-label" htmlFor="generate-prompt-id-input">
                  Prompt ID (Integer)
                  <span style={{ color: 'var(--primary-red)', marginLeft: '2px' }}>*</span>
                </label>
                {latestResponse && (
                  <button
                    type="button"
                    className="quick-fill-btn"
                    onClick={() => handlePromptIdChange(String(latestResponse.id))}
                    title="Autofill from saved prompt above"
                  >
                    <ArrowDown size={13} />
                    <span>Use Prompt #{latestResponse.id}</span>
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="generate-prompt-id-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={`form-input no-spin-input ${generatePromptIdError ? 'input-error' : ''}`}
                  placeholder="Enter integer Prompt ID (e.g. 15)"
                  value={generatePromptId}
                  onChange={(e) => handlePromptIdChange(e.target.value)}
                  style={{ paddingRight: generatePromptId ? '36px' : '14px' }}
                />
                {generatePromptId && (
                  <button
                    type="button"
                    onClick={() => handlePromptIdChange('')}
                    title="Clear Prompt ID"
                    aria-label="Clear Prompt ID"
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

              {generatePromptIdError ? (
                <div className="field-error-text">
                  <AlertTriangle size={13} /> {generatePromptIdError}
                </div>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Enter a valid Theme ID. The Generate Theme button enables only when Theme ID is provided.
                </span>
              )}
            </div>

            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isGenerateButtonEnabled}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Generating Theme...</span>
                  </>
                ) : (
                  <span>Generate Theme</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Generation Result Card */}
        <div className="red-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-styled">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Response
              </h2>
              {generateResponse?.success && (
                <span className="status-badge-success">
                  <CheckCircle2 size={13} />
                  <span>Success: true</span>
                </span>
              )}
            </div>

            {/* View Switcher: Image Preview vs Raw JSON */}
            {generateResponse && (
              <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setGenerateViewMode('preview')}
                  style={{
                    border: 'none',
                    background: generateViewMode === 'preview' ? '#ffffff' : 'transparent',
                    color: generateViewMode === 'preview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: generateViewMode === 'preview' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Image Preview
                </button>
                <button
                  type="button"
                  onClick={() => setGenerateViewMode('json')}
                  style={{
                    border: 'none',
                    background: generateViewMode === 'json' ? '#ffffff' : 'transparent',
                    color: generateViewMode === 'json' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: generateViewMode === 'json' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Raw JSON
                </button>
              </div>
            )}
          </div>

          {/* Body: Loading / Empty / Content */}
          {isGenerating ? (
            <div className="generation-loading-container">
              <div className="generation-pulse-ring">
                <RefreshCw size={28} className="spin-animation" />
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Generating Theme Image...
                </strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.5 }}>
                  Communicating with AI render pipeline. This usually takes 15-30 seconds to generate and upload to Cloudinary.
                </p>
              </div>
            </div>
          ) : !generateResponse ? (
            <div
              style={{
                flex: 1,
                minHeight: '280px',
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
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-red-subtle)',
                  color: 'var(--primary-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <ImageIcon size={24} />
              </div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '6px' }}>
                No Theme Artwork Generated Yet
              </strong>
              <p style={{ fontSize: '0.85rem', maxWidth: '340px', lineHeight: 1.5 }}>
                Enter a registered Prompt ID (e.g. 15) on the left and click "Generate Theme" to synthesize and display the rendered theme image.
              </p>
            </div>
          ) : generateViewMode === 'preview' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Meta bar */}
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
                  <span>
                    Generated: {generateResponse.timestamp ? new Date(generateResponse.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    {generateResponse.status || 'OK'} ({generateResponse.code || 200})
                  </span>
                </div>
              </div>

              {/* Rendered Image Card */}
              <div className="generated-image-card">
                <img
                  src={generateResponse.data}
                  alt="Generated Theme Output"
                  className="generated-image-img"
                  loading="lazy"
                />
                <div className="image-overlay-actions">
                  <button
                    type="button"
                    className="image-overlay-btn"
                    onClick={() => setIsLightboxOpen(true)}
                    title="Expand Full View"
                  >
                    <Maximize2 size={13} />
                    <span>Expand</span>
                  </button>
                  <a
                    href={generateResponse.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="image-overlay-btn"
                    title="Open full image in new tab"
                  >
                    <ExternalLink size={13} />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              {/* Direct Link Box */}
              <div className="res-field-box">
                <div className="res-field-label">Rendered Image URL (Cloudinary)</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      color: '#2563eb',
                      wordBreak: 'break-all',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {generateResponse.data}
                  </span>
                  <button
                    type="button"
                    className="copy-pill-btn"
                    onClick={() => handleCopyText(generateResponse.data, 'img_url')}
                    title="Copy Image URL"
                  >
                    {copiedKey === 'img_url' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    <span>{copiedKey === 'img_url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Raw JSON View */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Response JSON Payload
                </span>
                <button
                  type="button"
                  className="copy-pill-btn"
                  onClick={() => handleCopyText(JSON.stringify(generateResponse, null, 2), 'gen_raw_json')}
                >
                  {copiedKey === 'gen_raw_json' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="code-preview-block">
                {JSON.stringify(generateResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && generateResponse?.data && (
        <div className="image-lightbox-backdrop" onClick={() => setIsLightboxOpen(false)}>
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={generateResponse.data}
              alt="Enlarged Theme Artwork"
              className="image-lightbox-img"
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
              <a
                href={generateResponse.data}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-white"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                <ExternalLink size={14} /> Open Original
              </a>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsLightboxOpen(false)}
                style={{ fontSize: '0.82rem', padding: '6px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
