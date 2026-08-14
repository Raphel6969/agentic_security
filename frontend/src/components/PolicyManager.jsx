import React, { useEffect, useState } from 'react';
import { Sliders, Save, Check, RefreshCw, AlertCircle, FileCode } from 'lucide-react';

export default function PolicyManager() {
  const [yamlContent, setYamlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchPolicy = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/policy');
      const data = await response.json();
      setYamlContent(data.raw_yaml || '');
    } catch (err) {
      setErrorMessage('Failed to fetch policy.yaml from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_yaml: yamlContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update policy YAML.');
      }

      setStatusMessage('✅ Policy updated and reloaded in Policy Engine!');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bezel-shell">
      <div className="bezel-core space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Declarative Policy Engine Manager</h3>
              <p className="text-xs text-slate-400">Live editing of policy.yaml tool constraints & path wildcards</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPolicy}
              disabled={loading}
              className="btn-press px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn-press px-5 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save & Apply Policy
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* YAML Code Editor */}
        <div className="relative rounded-xl border border-white/10 bg-black/60 overflow-hidden">
          <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              policy/policy.example.yaml
            </span>
            <span>YAML Format</span>
          </div>
          <textarea
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            disabled={loading}
            rows={18}
            className="w-full bg-transparent p-4 font-mono text-xs text-emerald-400 leading-relaxed focus:outline-none resize-y selection:bg-indigo-500 selection:text-white"
            placeholder="Loading policy.yaml rules..."
          />
        </div>
      </div>
    </div>
  );
}
