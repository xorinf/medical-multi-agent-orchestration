import React, { useEffect, useState } from 'react';
import { curatorService } from '../../services/curatorService';
import type { CuratorDigest, CuratorTopic } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  RefreshCw, Bookmark, BookmarkCheck, ExternalLink
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DoctorCuratorPage: React.FC = () => {
  const [digest, setDigest] = useState<CuratorDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedIndices, setSavedIndices] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'digest' | 'saved'>('digest');

  const { toast } = useToast();

  useEffect(() => {
    loadDigest();
  }, []);

  const loadDigest = async () => {
    setLoading(true);
    try {
      const data = await curatorService.getToday();
      setDigest(data);
    } catch (err: any) {
      toast(err?.message || 'Failed to load curator digest', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await curatorService.refresh();
      setDigest(fresh);
      toast('Synthesized fresh 3-topic PubMed & web research digest', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to refresh digest', 'danger');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveTopic = async (idx: number) => {
    if (!digest) return;
    try {
      await curatorService.saveTopic(digest.id || 'digest-today', idx);
      if (savedIndices.includes(idx)) {
        setSavedIndices(prev => prev.filter(i => i !== idx));
        toast('Topic removed from clinical reading list', 'info');
      } else {
        setSavedIndices(prev => [...prev, idx]);
        toast('Topic added to your saved reading list', 'success');
      }
    } catch (err: any) {
      toast(err?.message || 'Failed to update reading list', 'danger');
    }
  };

  const savedTopics: { topic: CuratorTopic; index: number }[] = (digest?.topics || [])
    .map((topic, index) => ({ topic, index }))
    .filter(({ index }) => savedIndices.includes(index));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
              Daily Clinical Curator
            </h1>
            {digest && (
              <Badge variant={digest.cached ? 'neutral' : 'active'}>
                {digest.cached ? 'Cached' : 'Fresh'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            Automated 3-topic medical literature and guidelines digest · Date: {digest?.date || new Date().toISOString().split('T')[0]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Regenerate Digest
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-charcoal-200 dark:border-charcoal-800 pb-2">
        <button
          onClick={() => setActiveTab('digest')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'digest'
              ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          Today's Digest ({digest?.topics.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'saved'
              ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Saved Reading List ({savedIndices.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-sm text-charcoal-500">
          <div className="w-6 h-6 border-2 border-sage-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Retrieving PubMed articles & guidelines synthesis...
        </div>
      ) : activeTab === 'saved' && savedTopics.length === 0 ? (
        <Card>
          <EmptyState
            title="Reading list is empty"
            description="Bookmark relevant articles and trial summaries from the daily digest to read later."
            actionLabel="View Today's Digest"
            onAction={() => setActiveTab('digest')}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {(activeTab === 'digest' ? digest?.topics || [] : savedTopics.map(s => s.topic)).map((topic, i) => {
            const actualIndex = activeTab === 'digest' ? i : savedTopics[i].index;
            const isSaved = savedIndices.includes(actualIndex);

            return (
              <Card key={i} className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700 dark:text-sage-400 bg-sage-50 dark:bg-sage-950/40 px-2.5 py-1 rounded-full border border-sage-200 dark:border-sage-800 mb-2 inline-block">
                      Topic {actualIndex + 1} · Clinical Update
                    </span>
                    <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 leading-snug">
                      {topic.topic}
                    </h2>
                  </div>

                  <Button
                    variant={isSaved ? 'sage' : 'outline'}
                    size="sm"
                    onClick={() => handleSaveTopic(actualIndex)}
                    leftIcon={isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                </div>

                <div className="space-y-3 pt-2">
                  {topic.sources.map((source, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/60 border border-charcoal-200/60 dark:border-charcoal-700/60 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                          {source.title}
                        </h3>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sage-700 dark:text-sage-400 hover:text-sage-800 text-xs flex items-center gap-1 font-medium shrink-0"
                        >
                          PubMed <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                        {source.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorCuratorPage;
