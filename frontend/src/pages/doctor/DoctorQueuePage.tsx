import React, { useEffect, useState } from 'react';
import { caseService } from '../../services/caseService';
import type { CaseItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { XCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DoctorQueuePage: React.FC = () => {
  const [tab, setTab] = useState<'mine' | 'unassigned'>('mine');
  const [casesList, setCasesList] = useState<CaseItem[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);
  const [clinicalNote, setClinicalNote] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadQueue();
  }, [tab]);

  useEffect(() => {
    if (activeCaseId) {
      loadCaseDetail(activeCaseId);
    } else {
      setActiveCase(null);
    }
  }, [activeCaseId]);

  const loadQueue = async () => {
    setLoadingList(true);
    try {
      const data = tab === 'mine'
        ? await caseService.getQueue()
        : await caseService.getUnassigned();
      setCasesList(data);
      if (data.length > 0 && !activeCaseId) {
        setActiveCaseId(data[0].id);
      }
    } catch (err: any) {
      toast(err?.message || 'Failed to load case queue', 'danger');
    } finally {
      setLoadingList(false);
    }
  };

  const loadCaseDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await caseService.getCaseDetail(id);
      setActiveCase(detail);
    } catch (err: any) {
      toast(err?.message || 'Failed to load case detail', 'danger');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClaim = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await caseService.claimCase(id);
      toast('Case successfully claimed into your active clinical queue', 'success');
      setTab('mine');
      setActiveCaseId(id);
      await loadQueue();
    } catch (err: any) {
      toast(err?.message || 'Failed to claim case', 'danger');
    }
  };

  const handleAddNote = async () => {
    if (!activeCaseId || !clinicalNote.trim()) return;
    setSavingNote(true);
    try {
      await caseService.addNote(activeCaseId, clinicalNote);
      toast('Physician clinical note saved and logged to record', 'success');
      setClinicalNote('');
      await loadCaseDetail(activeCaseId);
    } catch (err: any) {
      toast(err?.message || 'Failed to save note', 'danger');
    } finally {
      setSavingNote(false);
    }
  };

  const handleCloseCase = async () => {
    if (!activeCaseId) return;
    try {
      await caseService.closeCase(activeCaseId);
      toast('Case successfully closed and archived', 'info');
      setActiveCaseId(null);
      await loadQueue();
    } catch (err: any) {
      toast(err?.message || 'Failed to close case', 'danger');
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-4">
      {/* Left Column: Queue List */}
      <aside className="lg:w-80 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 rounded-2xl p-4 shadow-soft">
        <div className="flex gap-1.5 p-1 bg-charcoal-100 dark:bg-charcoal-800 rounded-xl mb-3">
          <button
            onClick={() => { setTab('mine'); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'mine'
                ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 shadow-soft'
                : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            My Queue
          </button>
          <button
            onClick={() => { setTab('unassigned'); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'unassigned'
                ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 shadow-soft'
                : 'text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            Unassigned
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loadingList ? (
            <div className="py-12 text-center text-xs text-charcoal-400">Loading cases...</div>
          ) : casesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-400">
              {tab === 'mine' ? 'No assigned cases. Inbox zero.' : 'No unassigned patient cases.'}
            </div>
          ) : (
            casesList.map(c => {
              const isActive = activeCaseId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveCaseId(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'border-sage-400 dark:border-sage-700 bg-sage-50/60 dark:bg-sage-900/40 shadow-sm'
                      : 'border-charcoal-200/60 dark:border-charcoal-800 hover:border-charcoal-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate">
                      {c.title || 'Case'}
                    </span>
                    <Badge size="sm" variant={c.status === 'awaiting_doctor' ? 'awaiting_doctor' : 'active'}>
                      {c.status}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-charcoal-500 truncate mb-2">
                    Patient: {c.patient?.name || 'Patient'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-charcoal-400 pt-1 border-t border-charcoal-100 dark:border-charcoal-800/80">
                    <span>{new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {tab === 'unassigned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="py-0.5 px-2 text-[10px] h-6"
                        onClick={(e) => handleClaim(c.id, e)}
                      >
                        Claim Case
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Area: Selected Case & Clinical Notes */}
      <main className="flex-1 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 rounded-2xl shadow-soft overflow-hidden">
        {loadingDetail ? (
          <div className="flex-1 flex items-center justify-center p-6 text-charcoal-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-sage-600" />
            <span className="text-xs">Loading case record...</span>
          </div>
        ) : !activeCase ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              title="Select a Case from the Queue"
              description="Review multi-agent reasoning, diagnostic imaging findings, and write clinical notes for patient records."
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Case Patient Header */}
            <div className="px-6 py-4 border-b border-charcoal-100 dark:border-charcoal-800 flex flex-wrap items-center justify-between gap-3 bg-charcoal-50/40 dark:bg-charcoal-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                    {activeCase.patient?.name || 'Elena Rostova'}
                  </h2>
                  <Badge variant={activeCase.status === 'awaiting_doctor' ? 'awaiting_doctor' : 'active'}>
                    {activeCase.status}
                  </Badge>
                </div>
                <p className="text-xs text-charcoal-500">
                  {activeCase.patient?.gender || 'Female'} · DOB: {activeCase.patient?.dob || '1992-04-14'} · Case ID: {activeCase.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleCloseCase} leftIcon={<XCircle className="w-3.5 h-3.5" />}>
                  Close Case
                </Button>
              </div>
            </div>

            {/* Conversation Stream & Imaging */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-2">
                Consultation History & Evidence
              </h3>

              {activeCase.messages?.map((m, idx) => {
                const isDoc = m.role === 'doctor';
                const isPat = m.role === 'patient';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-2xl ${isDoc ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white mt-1 ${
                        isDoc ? 'bg-sage-700' : isPat ? 'bg-charcoal-800' : 'bg-charcoal-700'
                      }`}
                    >
                      {isDoc ? 'MD' : isPat ? 'PT' : 'AI'}
                    </div>

                    <div
                      className={`rounded-2xl p-4 shadow-sm text-sm ${
                        isDoc
                          ? 'bg-sage-900 text-white dark:bg-sage-800'
                          : isPat
                          ? 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100'
                          : 'bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-200/80 dark:border-charcoal-700/80 text-charcoal-900 dark:text-ivory-100'
                      }`}
                    >
                      {m.image_url && (
                        <div className="mb-3">
                          <img
                            src={m.image_url}
                            alt="Case radiograph / lesion"
                            className="max-h-60 rounded-xl border border-charcoal-300 dark:border-charcoal-700"
                          />
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                      {m.thinking && (
                        <div className="mt-3 pt-2 border-t border-charcoal-200 dark:border-charcoal-700/60 font-mono text-xs opacity-80 whitespace-pre-wrap bg-charcoal-100/60 dark:bg-charcoal-950/60 p-2.5 rounded-lg">
                          <strong>Agent Reasoning Trace:</strong>
                          <br />
                          {m.thinking}
                        </div>
                      )}

                      <div className="mt-2 text-[10px] opacity-70 flex justify-between">
                        <span>{m.role}{m.agent ? ` · ${m.agent}` : ''}</span>
                        <span>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clinical Notes Editor */}
            <div className="p-4 border-t border-charcoal-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
              <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 dark:text-charcoal-300 block mb-1.5">
                Physician Clinical Note & Directives
              </label>
              <div className="flex gap-2">
                <textarea
                  value={clinicalNote}
                  onChange={e => setClinicalNote(e.target.value)}
                  placeholder="Record physician clinical observations, recommendations, or patient directives..."
                  rows={2}
                  className="flex-1 p-3 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-charcoal-50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600 resize-none leading-relaxed"
                />
                <Button
                  variant="primary"
                  onClick={handleAddNote}
                  disabled={!clinicalNote.trim() || savingNote}
                  isLoading={savingNote}
                  className="h-auto self-stretch"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorQueuePage;
