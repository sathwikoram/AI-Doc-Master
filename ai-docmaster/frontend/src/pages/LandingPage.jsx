import { Link } from 'react-router-dom'
import {
  Scale, Brain, Users, FileSearch, Shield, ChevronRight,
  Gavel, BookOpen, MessageSquare, Bell, BarChart3, CheckCircle,
} from 'lucide-react'

const FEATURES = [
  { icon: Brain,       title: 'NLP Case Classification',     desc: 'Describe your issue in plain language — AI instantly identifies the legal category and applicable laws.' },
  { icon: Users,       title: 'Smart Lawyer Matching',        desc: 'Scored recommendations based on expertise, win rate, location, experience, and availability.' },
  { icon: BookOpen,    title: 'Legal Section Suggestions',    desc: 'AI surfaces applicable BNS/IPC sections, Constitutional articles, and relevant Acts for your case.' },
  { icon: FileSearch,  title: 'Judgement Search (RAG)',       desc: 'Vector-similarity search across Indian court judgements to find relevant precedents instantly.' },
  { icon: MessageSquare, title: 'AI Chat Assistant',         desc: 'Ask any legal procedure question in plain language — get clear, jargon-free guidance 24/7.' },
  { icon: Shield,      title: 'Auto Advocate Replacement',    desc: 'If your lawyer is unavailable for a hearing, AI automatically finds the best available substitute.' },
  { icon: Gavel,       title: 'Document Checklist',          desc: 'AI generates a case-specific checklist of documents you must collect before approaching court.' },
  { icon: BarChart3,   title: 'Risk Assessment',              desc: 'Get an estimated timeline, complexity score, and settlement likelihood for your case.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register & Describe',  desc: 'Create an account and describe your legal issue in your own words.' },
  { step: '02', title: 'AI Analyzes',           desc: 'Our AI classifies your case, suggests applicable laws, and recommends suitable advocates.' },
  { step: '03', title: 'Connect with Lawyer',   desc: 'Review recommendations, book an appointment, and get your advocate assigned.' },
  { step: '04', title: 'Track Progress',         desc: 'Monitor hearings, upload documents, and stay informed at every stage.' },
]

const STATS = [
  { value: '8+',    label: 'Legal Categories' },
  { value: '10',    label: 'AI Features' },
  { value: '3',     label: 'Role Dashboards' },
  { value: '100%',  label: 'Secure & Private' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">AI DocMaster</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn-primary  btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-6 border border-white/20">
            <Sparkle size={12} /> AI-Powered Legal Assistance Platform
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
            Making Legal Help<br />
            <span className="text-accent-300">Accessible for Everyone</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            AI DocMaster connects citizens with the right advocates, provides AI-powered legal guidance,
            and streamlines case management — so you get justice faster.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn btn-lg bg-accent-500 text-white hover:bg-accent-600 shadow-lg">
              Register as Citizen
            </Link>
            <Link to="/register?role=advocate" className="btn btn-lg bg-white/10 text-white border border-white/30 hover:bg-white/20">
              I'm an Advocate
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 text-white py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-accent-400">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">AI Features that Set Us Apart</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto">
              Every feature is built to make legal access faster, smarter, and more transparent.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:shadow-elevated transition-shadow group">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4
                                group-hover:bg-primary-600 transition-colors">
                  <Icon size={20} className="text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-lg
                                flex items-center justify-center mx-auto mb-4">{step}</div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                {i < 3 && (
                  <ChevronRight size={20} className="absolute -right-3 top-5 text-slate-300 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Designed for Everyone</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: 'Citizen',
                color: 'from-primary-600 to-primary-800',
                icon: Users,
                points: ['Submit & track cases', 'AI lawyer recommendations', 'Document checklist', 'Book appointments', 'Chat with AI assistant', 'Progress timeline'],
              },
              {
                role: 'Advocate',
                color: 'from-emerald-600 to-emerald-800',
                icon: Scale,
                points: ['View assigned cases', 'AI legal section suggestions', 'Previous judgement search', 'Hearing management', 'Document repository', 'AI case summary'],
              },
              {
                role: 'Admin',
                color: 'from-slate-700 to-slate-900',
                icon: Shield,
                points: ['User & advocate management', 'Verify advocate credentials', 'Platform analytics', 'Case monitoring', 'Monthly reports', 'System oversight'],
              },
            ].map(({ role, color, icon: Icon, points }) => (
              <div key={role} className="card overflow-hidden p-0">
                <div className={`bg-gradient-to-br ${color} px-6 py-5 text-white`}>
                  <Icon size={24} className="mb-2" />
                  <h3 className="text-lg font-bold">{role} Portal</h3>
                </div>
                <ul className="px-6 py-5 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={14} className="text-success-500 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-white/80 mb-8 max-w-md mx-auto">
          Register today and let AI guide you to the right legal help.
        </p>
        <Link to="/register" className="btn btn-lg bg-white text-primary-700 hover:bg-slate-100">
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scale size={16} className="text-primary-400" />
          <span className="font-semibold text-white">AI DocMaster</span>
        </div>
        <p>An AI-powered legal assistance platform. Not a substitute for qualified legal advice.</p>
        <p className="mt-1 text-xs text-slate-600">© {new Date().getFullYear()} AI DocMaster. All rights reserved.</p>
      </footer>
    </div>
  )
}

function Sparkle({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  )
}
