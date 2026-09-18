import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Check, ArrowRight } from 'lucide-react';

interface Step {
  title: string;
  body: string;
}

const STEPS: Record<string, Step[]> = {
  patient: [
    {
      title: 'Describe your symptoms in natural language',
      body: 'Open your first consultation thread and explain what you are feeling. Our LangGraph multi-agent pipeline routes queries to clinical RAG or diagnostic tools.',
    },
    {
      title: 'Upload medical imaging for computer-vision triage',
      body: 'Attach chest radiographs or skin lesion images directly into chat. Vision classifiers provide immediate preliminary analysis with physician sign-off.',
    },
    {
      title: 'Connect with verified board-certified physicians',
      body: 'When your symptom profile or triage analysis requires in-person review, our automated matcher suggests relevant specialists and handles appointment booking.',
    },
  ],
  doctor: [
    {
      title: 'Welcome to your physician clinical workspace',
      body: 'Your doctor account is registered. Administrators verify your medical board license before your profile appears in public patient searches.',
    },
    {
      title: 'Review cases in the triage queue',
      body: 'Incoming patient consultations and diagnostic imaging requiring human validation will appear in your queue. Claim cases to add notes and provide oversight.',
    },
    {
      title: 'Receive your daily clinical curator digest',
      body: 'Every morning, MedAssist builds a 3-topic specialty digest summarizing the latest PubMed guidelines, case reports, and emerging therapies.',
    },
  ],
  admin: [
    {
      title: 'Maintain clinical integrity & provider verification',
      body: 'Review medical board license numbers and credential proofs for onboarding physicians before admitting them to the active clinical directory.',
    },
    {
      title: 'Monitor real-time multi-agent system telemetry',
      body: 'Track consultation volume, computer vision pipeline accuracy, human-in-the-loop validation triggers, and background task latency.',
    },
    {
      title: 'Inspect immutable platform audit trails',
      body: 'Every diagnosis generation, doctor case claim, patient appointment, and administrative verification is logged with cryptographic actor IDs.',
    },
  ],
};

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const role = user?.role || 'patient';
  const steps = STEPS[role] || STEPS.patient;
  const isLast = step === steps.length - 1;

  const destination = role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/app';

  const finish = () => {
    if (user?.id) {
      localStorage.setItem(`onboarded_${user.id}`, '1');
    }
    navigate(destination, { replace: true });
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ivory-100 dark:bg-charcoal-950">
      <div className="w-full max-w-xl">
        {/* Progress indicators */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-sage-600 dark:bg-sage-500' : 'bg-charcoal-200 dark:bg-charcoal-800'
              }`}
            />
          ))}
        </div>

        <Card className="p-8 shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-700 dark:text-sage-400">
              Onboarding · Step {step + 1} of {steps.length}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 capitalize">
              {role} Portal
            </span>
          </div>

          <h2 className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mb-3 tracking-tight">
            {steps[step].title}
          </h2>
          <p className="text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-8">
            {steps[step].body}
          </p>

          <div className="space-y-3 mb-8">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  idx <= step
                    ? 'border-sage-300 dark:border-sage-800 bg-sage-50/50 dark:bg-sage-950/20'
                    : 'border-charcoal-200/60 dark:border-charcoal-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    idx <= step
                      ? 'bg-sage-600 text-white'
                      : 'bg-charcoal-200 dark:bg-charcoal-800 text-charcoal-500'
                  }`}
                >
                  {idx < step ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-charcoal-900 dark:text-ivory-100">{s.title}</h4>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-charcoal-100 dark:border-charcoal-800">
            <Button variant="ghost" onClick={finish} className="text-charcoal-500">
              Skip intro
            </Button>
            <Button
              variant="primary"
              onClick={next}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isLast ? 'Enter Dashboard' : 'Next Step'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
