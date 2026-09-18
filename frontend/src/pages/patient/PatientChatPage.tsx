import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import type { ChatConversation, ChatMessage } from '../../types';
import { Button } from '../../components/ui/Button';
import {
  Send, Plus, Image as ImageIcon, X, ChevronRight,
  ChevronDown, AlertCircle, Bot, User, ShieldCheck
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const STARTERS = [
  'I have had chest pain for two days. What could it be?',
  'My child has had a fever for 3 days.',
  'I noticed a new mole on my arm. Should I worry?',
  'I have a headache and blurred vision this morning.',
];

const ThinkingBlock: React.FC<{ text?: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  return (
    <div className="mt-3 pt-2 border-t border-charcoal-200/50 dark:border-charcoal-700/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-800 dark:hover:text-charcoal-200 transition-colors font-medium cursor-pointer select-none"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span>{open ? 'Hide clinical reasoning' : 'Show clinical reasoning'}</span>
        <span className="text-[10px] text-charcoal-400">({text.length} chars)</span>
      </button>

      {open && (
        <div className="mt-2 p-3 bg-charcoal-50 dark:bg-charcoal-950/60 border border-charcoal-200/70 dark:border-charcoal-800 rounded-xl font-mono text-xs text-charcoal-700 dark:text-charcoal-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
          {text}
        </div>
      )}
    </div>
  );
};

export const PatientChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string>('new');
  const [currentConv, setCurrentConv] = useState<ChatConversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId && activeId !== 'new') {
      loadConversationDetail(activeId);
    } else {
      setCurrentConv(null);
    }
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages, isSending]);

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversations');
    }
  };

  const loadConversationDetail = async (id: string) => {
    try {
      const conv = await chatService.getConversation(id);
      setCurrentConv(conv);
    } catch (err: any) {
      setError(err?.message || 'Failed to load conversation thread');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast('Image file exceeds the 5MB upload limit', 'danger');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputText).trim();
    if (!textToSend && !selectedImage) return;

    setError('');
    setIsSending(true);

    const tempImageUrl = imagePreview;

    // Optimistic patient bubble
    const optimisticMessage: ChatMessage = {
      role: 'patient',
      content: textToSend || 'Uploaded medical image for clinical analysis.',
      image_url: tempImageUrl || undefined,
      ts: new Date().toISOString(),
    };

    setCurrentConv((prev: ChatConversation | null) => {
      const base = prev || {
        id: activeId === 'new' ? `conv-${Date.now()}` : activeId,
        title: textToSend.slice(0, 32) || 'Image Consultation',
        updated_at: new Date().toISOString(),
        messages: [],
      };
      return {
        ...base,
        messages: [...(base.messages || []), optimisticMessage],
      };
    });

    setInputText('');
    clearImage();

    try {
      let imageFileId: string | undefined;
      if (selectedImage) {
        const uploadRes = await chatService.uploadImage(selectedImage);
        imageFileId = uploadRes.file_id;
      }

      const response = await chatService.sendMessage({
        text: textToSend,
        conversation_id: activeId !== 'new' ? activeId : undefined,
        image_file_id: imageFileId,
      });

      const agentMessage: ChatMessage = {
        role: 'agent',
        content: response.content,
        thinking: response.thinking,
        agent: response.agent,
        requires_validation: response.requires_validation,
        ts: new Date().toISOString(),
      };

      setCurrentConv((prev: ChatConversation | null) => {
        if (!prev) return null;
        return {
          ...prev,
          id: response.conversation_id,
          messages: [...(prev.messages || []), agentMessage],
        };
      });

      setActiveId(response.conversation_id);
      await loadConversations();
    } catch (err: any) {
      setError(err?.message || 'Agent failed to respond. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleValidate = async (decision: 'approve' | 'reject') => {
    if (!activeId || activeId === 'new') return;
    try {
      await chatService.validateDecision(activeId, decision);
      toast(`Consultation marked as ${decision}d`, 'success');
      await loadConversationDetail(activeId);
    } catch (err: any) {
      toast(err?.message || 'Failed to submit validation', 'danger');
    }
  };

  const messages = currentConv?.messages || [];

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-4">
      {/* Left Sidebar: Conversations List */}
      <aside className="lg:w-80 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 dark:border-charcoal-800 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
            Consultations
          </h3>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setActiveId('new');
              setCurrentConv(null);
            }}
          >
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-charcoal-400">
              No previous threads. Click "New" to start.
            </div>
          ) : (
            conversations.map(c => {
              const isActive = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex flex-col gap-1 ${
                    isActive
                      ? 'bg-sage-100 dark:bg-sage-900/50 border border-sage-300/80 dark:border-sage-700'
                      : 'hover:bg-charcoal-50 dark:hover:bg-charcoal-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-sage-900 dark:text-sage-200' : 'text-charcoal-800 dark:text-ivory-100'}`}>
                      {c.title || 'Consultation'}
                    </span>
                    {c.specialty_detected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sage-200/60 dark:bg-sage-800 text-sage-800 dark:text-sage-300 font-medium">
                        {c.specialty_detected}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-charcoal-400">
                    {new Date(c.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 rounded-2xl shadow-soft overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between bg-charcoal-50/40 dark:bg-charcoal-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                {activeId === 'new' ? 'New Clinical Consultation' : currentConv?.title || 'Consultation Thread'}
              </h2>
              <p className="text-[11px] text-charcoal-500">
                LangGraph Decision Engine · RAG & Computer Vision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-sage-100 dark:bg-sage-900/40 text-sage-800 dark:text-sage-300 border border-sage-200 dark:border-sage-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Evidence-Based Triage
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeId === 'new' && messages.length === 0 && (
            <div className="max-w-xl mx-auto py-10 text-center space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-300 flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100 mb-1">
                  How can we assist you today?
                </h3>
                <p className="text-xs text-charcoal-500 max-w-md mx-auto">
                  Type your symptoms below, attach radiographic or dermatological imaging, or select a common inquiry:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {STARTERS.map((s: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="p-3.5 rounded-xl border border-charcoal-200 dark:border-charcoal-800 hover:border-sage-400 dark:hover:border-sage-700 hover:bg-sage-50/40 dark:hover:bg-sage-950/20 text-xs text-charcoal-800 dark:text-ivory-200 transition-all text-left"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m: ChatMessage, idx: number) => {
            const isPatient = m.role === 'patient';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-2xl ${isPatient ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                    isPatient
                      ? 'bg-charcoal-800 text-white'
                      : 'bg-sage-700 dark:bg-sage-600 text-white'
                  }`}
                >
                  {isPatient ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl p-4 shadow-sm text-sm ${
                    isPatient
                      ? 'bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-950'
                      : 'bg-charcoal-50 dark:bg-charcoal-800/70 border border-charcoal-200/80 dark:border-charcoal-700/80 text-charcoal-900 dark:text-ivory-100'
                  }`}
                >
                  {m.image_url && (
                    <div className="mb-3">
                      <img
                        src={m.image_url}
                        alt="Attached Clinical Data"
                        className="max-h-60 rounded-xl object-contain border border-charcoal-300 dark:border-charcoal-700"
                      />
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                  {!isPatient && <ThinkingBlock text={m.thinking} />}

                  {/* Validation Prompt if flagged */}
                  {m.requires_validation && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Physician Validation Recommended</span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mb-3">
                        Because diagnostic computer vision or elevated clinical flags were triggered, secondary sign-off is recommended.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleValidate('approve')}>
                          Acknowledge & Sign
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate('/app/doctors')}>
                          Connect with Specialist
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[10px] opacity-70">
                    <span>{m.agent ? `via ${m.agent}` : isPatient ? 'You' : 'MedAssist AI'}</span>
                    <span>{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-8 h-8 rounded-xl bg-sage-700 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-charcoal-50 dark:bg-charcoal-800/70 border border-charcoal-200/80 dark:border-charcoal-700/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-sage-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-charcoal-600 dark:text-charcoal-300 font-medium">
                  Orchestrating agents (Docling parser, Qdrant vector retrieval, cross-encoder)...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="px-6 py-2 bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400 border-t border-red-200">
            {error}
          </div>
        )}

        {/* Composer Area */}
        <div className="p-4 border-t border-charcoal-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
          {imagePreview && (
            <div className="mb-3 inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-300 dark:border-sage-800 text-xs">
              <img src={imagePreview} alt="Upload preview" className="w-10 h-10 rounded-lg object-cover" />
              <span className="font-medium text-sage-900 dark:text-sage-200 truncate max-w-xs">
                {selectedImage?.name}
              </span>
              <button onClick={clearImage} className="p-1 rounded-full hover:bg-sage-200/60 dark:hover:bg-sage-900 text-sage-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-colors"
              title="Upload medical image (chest X-ray, skin lesion)"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe symptoms or clinical inquiry (Press Enter to send)..."
              rows={1}
              className="flex-1 max-h-32 min-h-[44px] py-2.5 px-4 bg-charcoal-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-xl text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600 resize-none leading-relaxed"
            />

            <Button
              variant="primary"
              onClick={() => handleSend()}
              disabled={(!inputText.trim() && !selectedImage) || isSending}
              isLoading={isSending}
              className="h-[44px] px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientChatPage;
