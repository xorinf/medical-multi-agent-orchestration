import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services/messageService';
import type { DirectMessage } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Send, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const DoctorMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const patientPartner = {
    id: 'pat-001',
    name: 'Elena Rostova',
  };

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const msgs = await messageService.getMessages(user.id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    try {
      const newMsg = await messageService.sendMessage({
        sender_id: user.id,
        sender_name: user.name,
        sender_role: 'doctor',
        recipient_id: patientPartner.id,
        recipient_name: patientPartner.name,
        content: input.trim(),
      });
      setMessages(prev => [...prev, newMsg]);
      setInput('');
      toast('Clinical directive transmitted to patient', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to send message', 'danger');
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between bg-charcoal-50/50 dark:bg-charcoal-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal-800 text-white flex items-center justify-center font-bold text-sm">
              ER
            </div>
            <div>
              <h2 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                {patientPartner.name}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                  Patient
                </span>
              </h2>
              <p className="text-xs text-charcoal-500">
                Case ID: conv-001 · Migraine evaluation
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-sage-700 dark:text-sage-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> HIPAA Secure Channel
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-charcoal-400">Loading conversation history...</div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-400">
              No messages with this patient yet. Transmit a directive below.
            </div>
          ) : (
            messages.map(m => {
              const isDoctorMe = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-lg ${isDoctorMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isDoctorMe ? 'bg-sage-700 text-white' : 'bg-charcoal-800 text-white'
                    }`}
                  >
                    {isDoctorMe ? 'MD' : 'PT'}
                  </div>
                  <div>
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isDoctorMe
                          ? 'bg-sage-900 text-white dark:bg-sage-800'
                          : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[10px] text-charcoal-400 mt-1 block px-1">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-charcoal-100 dark:border-charcoal-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Reply to ${patientPartner.name}...`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-sage-500/20 focus:border-sage-600"
          />
          <Button type="submit" variant="primary" disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DoctorMessagesPage;
