import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  Stethoscope, ShieldCheck, Sparkles,
  ArrowRight, FileSearch, Activity, Brain, CheckCircle2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (!user) {
      navigate('/login');
    } else {
      const dest = user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/app';
      navigate(dest);
    }
  };

  const features = [
    {
      icon: <Brain className="w-5 h-5 text-sage-600 dark:text-sage-400" />,
      title: 'Multimodal Intake',
      desc: 'Process natural symptom descriptions alongside chest X-rays and dermoscopy images with dedicated CV neural models.',
    },
    {
      icon: <Stethoscope className="w-5 h-5 text-sage-600 dark:text-sage-400" />,
      title: 'Smart Specialty Matching',
      desc: 'When queries indicate physician review, symptoms are classified and ranked against verified, board-certified clinicians.',
    },
    {
      icon: <FileSearch className="w-5 h-5 text-sage-600 dark:text-sage-400" />,
      title: 'Curated Reading for Doctors',
      desc: 'Automatic 3-topic daily clinical digest spanning the latest practice guidelines, peer-reviewed case reports, and pharmacological updates.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-sage-600 dark:text-sage-400" />,
      title: 'Verified Physician Network',
      desc: 'Strict administrative credential verification gating ensures all practicing providers are board-licensed before patient routing.',
    },
    {
      icon: <Activity className="w-5 h-5 text-sage-600 dark:text-sage-400" />,
      title: 'Human-in-the-Loop Safeguards',
      desc: 'High-stakes computer-vision outputs pause for validated physician confirmation before conclusions are committed to patient records.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-sage-600 dark:text-sage-400" />,
      title: 'Audit-Grade Traceability',
      desc: 'Complete agent reasoning logs, citation footprints, retrieval confidence metrics, and state transitions permanently tracked.',
    },
  ];

  const techStack = [
    'LangGraph', 'Qdrant Vector DB', 'PubMedBERT', 'Docling Semantic Parser',
    'Cross-Encoder Reranker', 'DenseNet-121 CV', 'FastAPI & React 19'
  ];

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-charcoal-950/80 backdrop-blur-md border-b border-charcoal-200/60 dark:border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sage-700 dark:bg-sage-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">M+</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">MedAssist</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-sage-700 dark:text-sage-400 px-2 py-0.5 rounded-full bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-800">
                Multi-Agent Clinical AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="primary" onClick={handleStart} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Portal ({user.role})
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sage-100 dark:bg-sage-900/40 text-sage-800 dark:text-sage-300 border border-sage-300/80 dark:border-sage-700 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-Agent Medical Orchestration Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-charcoal-950 dark:text-ivory-50 leading-[1.15] mb-6">
          One unified copilot for <span className="text-sage-700 dark:text-sage-400">patients</span>, <span className="text-sage-700 dark:text-sage-400">doctors</span>, and clinical triage.
        </h1>

        <p className="text-lg sm:text-xl text-charcoal-600 dark:text-charcoal-300 max-w-3xl mx-auto leading-relaxed mb-10">
          Describe symptoms in natural language or upload radiographic imaging. MedAssist orchestrates retrieval-augmented medical evidence, computer-vision triage, and human-in-the-loop physician validation in a single pipeline.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" onClick={handleStart} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Start Patient Intake
          </Button>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Physician & Staff Portal
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white dark:bg-charcoal-900/50 border-y border-charcoal-200/60 dark:border-charcoal-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sage-700 dark:text-sage-400 mb-2">
              Architecture & Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight">
              Designed around evidence-based clinical consultations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="p-6 hover:border-sage-300 dark:hover:border-sage-700 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-sage-50 dark:bg-sage-950/50 flex items-center justify-center mb-4 border border-sage-200/60 dark:border-sage-800">
                  {f.icon}
                </div>
                <h4 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mb-2">{f.title}</h4>
                <p className="text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Split Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sage-700 dark:text-sage-400 mb-2">
            Two Clinical Sides · One Coordinated Thread
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight">
            Tailored interfaces for patients and practitioners
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Patient Card */}
          <Card className="p-8 border-2 border-charcoal-200/80 dark:border-charcoal-700 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-3 block">
                For Patients
              </span>
              <h4 className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mb-3">
                Intelligent Medical Symptom Checker
              </h4>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-6">
                Explain what you are feeling in plain words. Upload skin spot photos or chest radiographs for rapid computer vision screening, and find verified doctors in your area.
              </p>
              <ul className="space-y-2.5 text-sm text-charcoal-700 dark:text-charcoal-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                  Multimodal conversation (text + image attachments)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                  Transparent step-by-step clinical reasoning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                  Direct appointment requests with board-certified physicians
                </li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="primary" className="w-full">
                Register as Patient
              </Button>
            </Link>
          </Card>

          {/* Doctor Card */}
          <Card className="p-8 border-2 border-sage-300 dark:border-sage-800 bg-sage-50/30 dark:bg-sage-950/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sage-700 dark:text-sage-400 mb-3 block">
                For Physicians
              </span>
              <h4 className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mb-3">
                Clinical Dashboard & Case Queue
              </h4>
              <p className="text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed mb-6">
                Review triaged cases with pre-computed differential diagnoses, write clinical notes, validate imaging outputs, and review daily PubMed guideline digests.
              </p>
              <ul className="space-y-2.5 text-sm text-charcoal-700 dark:text-charcoal-300 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                  Triage queue with human-in-the-loop verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                  Daily automated clinical research & guideline digest
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                  Physician clinical notes synced directly to case records
                </li>
              </ul>
            </div>
            <Link to="/register">
              <Button variant="sage" className="w-full">
                Apply as Medical Provider
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Tech Strip */}
      <section className="py-12 bg-white dark:bg-charcoal-900 border-t border-charcoal-200/60 dark:border-charcoal-800 text-center px-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 mb-4">
          Powered by Open-Source Health & AI Infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {techStack.map((tech, idx) => (
            <span
              key={idx}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-charcoal-200 dark:border-charcoal-700"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-charcoal-950 text-charcoal-400 text-xs border-t border-charcoal-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ivory-100">MedAssist</span>
            <span>· Local Clinical Development Build</span>
          </div>
          <p className="text-center sm:text-right text-[11px] text-charcoal-500 max-w-md">
            Notice: Not for unassisted emergency clinical use. Human physician verification is required for all diagnostic triage outputs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
