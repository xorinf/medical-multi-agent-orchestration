import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Database, Shield, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { toast } = useToast();

  const [ragConfidence, setRagConfidence] = useState('0.40');
  const [chunkSize, setChunkSize] = useState('512');
  const [chunkOverlap, setChunkOverlap] = useState('50');
  const [topK, setTopK] = useState('5');
  const [rerankerTopK, setRerankerTopK] = useState('3');

  const [cvChestGate, setCvChestGate] = useState(true);
  const [cvSkinGate, setCvSkinGate] = useState(true);
  const [cvBrainGate, setCvBrainGate] = useState(true);

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast('Orchestration hyperparameters & clinical gating saved', 'success');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
          Agent Orchestration Configuration
        </h1>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
          Fine-tune RAG thresholds, embedding chunking, and human-in-the-loop clinical gates
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* RAG & Retrieval Tuning */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <Database className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 dark:text-ivory-100">
              Qdrant Vector Retrieval & Semantic Search
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Min Retrieval Confidence"
              value={ragConfidence}
              onChange={e => setRagConfidence(e.target.value)}
              helperText="Controls RAG → Web Search fallback (default 0.40)"
            />
            <Input
              label="Vector Top-K Chunks"
              value={topK}
              onChange={e => setTopK(e.target.value)}
              helperText="Initial vector recall count (default 5)"
            />
            <Input
              label="Reranker Top-K"
              value={rerankerTopK}
              onChange={e => setRerankerTopK(e.target.value)}
              helperText="Cross-encoder output count (default 3)"
            />
            <Input
              label="Document Chunk Size"
              value={chunkSize}
              onChange={e => setChunkSize(e.target.value)}
              helperText="Docling token chunk length (default 512)"
            />
            <Input
              label="Chunk Overlap"
              value={chunkOverlap}
              onChange={e => setChunkOverlap(e.target.value)}
              helperText="Sliding context overlap (default 50)"
            />
          </div>
        </Card>

        {/* Human-in-the-loop Validation Gates */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
            <Shield className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 dark:text-ivory-100">
              Human-in-the-Loop Validation Gating
            </h2>
          </div>
          <p className="text-xs text-charcoal-500">
            When enabled, AI diagnostic outputs from computer vision models pause for verified clinician validation before commitment to patient records.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200/80 dark:border-charcoal-800 cursor-pointer hover:bg-charcoal-50 dark:hover:bg-charcoal-800/40">
              <div>
                <span className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 block">
                  Chest Radiograph Diagnostic Agent (COVID-19 & Pneumonia)
                </span>
                <span className="text-xs text-charcoal-500">
                  DenseNet-121 / ResNet-50 ensemble triage validation
                </span>
              </div>
              <input
                type="checkbox"
                checked={cvChestGate}
                onChange={e => setCvChestGate(e.target.checked)}
                className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200/80 dark:border-charcoal-800 cursor-pointer hover:bg-charcoal-50 dark:hover:bg-charcoal-800/40">
              <div>
                <span className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 block">
                  Skin Lesion Dermoscopy Agent (Melanoma Segmentation)
                </span>
                <span className="text-xs text-charcoal-500">
                  ISIC 2018 U-Net cutaneous boundary and classification verification
                </span>
              </div>
              <input
                type="checkbox"
                checked={cvSkinGate}
                onChange={e => setCvSkinGate(e.target.checked)}
                className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200/80 dark:border-charcoal-800 cursor-pointer hover:bg-charcoal-50 dark:hover:bg-charcoal-800/40">
              <div>
                <span className="text-sm font-semibold text-charcoal-900 dark:text-ivory-100 block">
                  Brain Tumor Neuro-Imaging Agent (MRI Triage)
                </span>
                <span className="text-xs text-charcoal-500">
                  Multi-agent neuro-oncology classifier gate
                </span>
              </div>
              <input
                type="checkbox"
                checked={cvBrainGate}
                onChange={e => setCvBrainGate(e.target.checked)}
                className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500"
              />
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Orchestration Parameters
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
