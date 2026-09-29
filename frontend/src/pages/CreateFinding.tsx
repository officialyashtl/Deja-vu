import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useApp } from '../app/AppContext';
import { analysisService } from '../services/analysisService';
import type { Category, Finding, Severity } from '../types/finding';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

const CATEGORIES: Category[] = [
  'Access Control',
  'Data Retention',
  'Vendor Management',
  'Security',
  'Compliance',
];
const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

type FormErrors = Partial<Record<keyof Finding, string>>;

export function CreateFinding() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setCurrentFinding,
    setAnalysisResult,
    setIsAnalyzing,
    setAnalysisStep,
    setAnalysisError,
    resetAnalysis,
  } = useApp();

  const prefill = (location.state as { prefill?: Finding } | null)?.prefill;

  const [form, setForm] = useState({
    title: prefill?.title ?? '',
    description: prefill?.description ?? '',
    category: prefill?.category ?? ('' as Category | ''),
    severity: prefill?.severity ?? ('' as Severity | ''),
    regulation: prefill?.regulation ?? '',
    evidence: prefill?.evidence ?? '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // reset state when arriving fresh
  useEffect(() => {
    resetAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.severity) e.severity = 'Severity is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finding: Finding = {
      id: `A-${Date.now().toString().slice(-3)}`,
      title: form.title,
      description: form.description,
      category: form.category as Category,
      severity: form.severity as Severity,
      regulation: form.regulation,
      evidence: form.evidence,
      status: 'Open',
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setCurrentFinding(finding);
    setAnalyzing(true);
    setIsAnalyzing(true);
    setSubmitError(null);

    setStep('Analyzing finding…');
    setAnalysisStep('Analyzing finding…');

    try {
      setStep('Searching organizational memory…');
      setAnalysisStep('Searching organizational memory…');

      const result = await analysisService.analyzeFinding(finding);
      setAnalysisResult(result);
      setAnalysisError(null);
      setIsAnalyzing(false);
      setAnalyzing(false);
      navigate('/findings/analysis');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to analyze finding. Make sure the AuditTrail backend is running.';
      setSubmitError(message);
      setAnalysisError(message);
      setIsAnalyzing(false);
      setAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <div className="page fade-in">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Findings</p>
            <h1 className="page-title">Create Finding</h1>
            <p className="page-subtitle">
              Capture the issue and let AuditTrail AI search organizational memory for similar
              cases.
            </p>
          </div>
        </div>

        {/* Loading overlay */}
        {analyzing && (
          <div className="analyzing-overlay">
            <div className="analyzing-card">
              <div className="analyzing-icon">
                <Loader2 size={28} className="spin" />
              </div>
              <p className="analyzing-step">{step}</p>
              <div className="analyzing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {/* Backend error banner */}
        {submitError && !analyzing && (
          <div className="error-banner" role="alert">
            <AlertCircle size={16} className="error-banner-icon" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-layout">
          <form id="finding-form" onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Finding Title <span className="required">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className={`form-input ${errors.title ? 'input-error' : ''}`}
                  placeholder="e.g. Vendor access review overdue"
                  value={form.title}
                  onChange={handleChange}
                  disabled={analyzing}
                />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                  placeholder="Describe the control failure, affected process, and relevant context."
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  disabled={analyzing}
                />
                {errors.description && <p className="field-error">{errors.description}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    className={`form-select ${errors.category ? 'input-error' : ''}`}
                    value={form.category}
                    onChange={handleChange}
                    disabled={analyzing}
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="field-error">{errors.category}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="severity" className="form-label">
                    Severity <span className="required">*</span>
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    className={`form-select ${errors.severity ? 'input-error' : ''}`}
                    value={form.severity}
                    onChange={handleChange}
                    disabled={analyzing}
                  >
                    <option value="">Select severity…</option>
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.severity && <p className="field-error">{errors.severity}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regulation" className="form-label">
                  Regulation / Policy{' '}
                  <span className="optional">(optional)</span>
                </label>
                <input
                  id="regulation"
                  name="regulation"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ISO 27001 A.5.18"
                  value={form.regulation}
                  onChange={handleChange}
                  disabled={analyzing}
                />
              </div>

              <div className="form-group">
                <label htmlFor="evidence" className="form-label">
                  Evidence <span className="optional">(optional)</span>
                </label>
                <input
                  id="evidence"
                  name="evidence"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Access review report, vendor roster, approval record"
                  value={form.evidence}
                  onChange={handleChange}
                  disabled={analyzing}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/')}
                disabled={analyzing}
              >
                Cancel
              </button>
              <button
                id="btn-analyze"
                type="submit"
                className="btn-primary btn-analyze"
                disabled={analyzing}
              >
                <Sparkles size={16} />
                Analyze Finding
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
