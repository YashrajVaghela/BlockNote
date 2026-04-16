import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  PenTool,
  Layers,
  Cloud,
  ArrowRight,
  Layout,
  MousePointer2,
  CheckCircle2
} from 'lucide-react';

export function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-sky-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="flex items-center justify-between w-full max-w-6xl glass rounded-[2rem] px-8 py-4 shadow-2xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-2 bg-slate-900 rounded-full group-hover:bg-sky-500 transition-colors" />
            <span className="text-xl font-black text-slate-900 tracking-tighter">BlockNote</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Sign in</Link>
            <Link to="/register" className="rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition hover:bg-black hover:shadow-sky-500/20 active:scale-95">
              Get Started
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full h-full max-w-7xl opacity-40">
          <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-sky-200 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" />
          <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-emerald-100 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-5xl text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/50 backdrop-blur-md px-4 py-1.5 mb-8"
          >
            <Sparkles size={14} className="text-sky-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600">The Modern Workspace Experience</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-[7rem] font-black text-slate-900 tracking-tight leading-[0.85] mb-8"
          >
            Draft. Organize. <br />
            <span className="text-sky-500 text-gradient">Scale Ideas.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-lg md:text-xl font-medium text-slate-500 leading-relaxed mb-12"
          >
            A razor-sharp, block-based workspace designed for the high-performance mind.
            Experience the future of digital documentation.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="group flex items-center gap-3 rounded-[2rem] bg-slate-900 px-10 py-5 text-lg font-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:bg-black hover:shadow-sky-500/20 active:scale-95">
              Launch Workspace
              <ChevronRight size={20} className="text-sky-400 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="group flex items-center gap-2 rounded-[2rem] border border-slate-200 bg-white/50 backdrop-blur-md px-10 py-5 text-lg font-black text-slate-900 transition-all hover:bg-white hover:border-slate-300 active:scale-95 shadow-xl shadow-slate-200/20">
              Demo Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof / Mock Content */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-6xl glass rounded-[3rem] p-1 shadow-2xl shadow-slate-200/50"
        >
          <div className="bg-white rounded-[2.8rem] overflow-hidden border border-slate-100 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="p-0 overflow-hidden relative aspect-video flex items-center justify-center">
              <img
                src="/dashboard_mockup.png"
                alt="BlockNote Premium Dashboard"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 bg-slate-900 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">System Protocols.</h2>
            <p className="text-slate-400 font-medium text-lg">Every component is engineered for peak cognitive performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: PenTool, color: "sky", title: "Block Architecture", desc: "Every element is a first-class citizen. Move, style, and transform with zero friction." },
              { icon: Zap, color: "emerald", title: "Instant Sync", desc: "Optimized engine architecture ensures your data is saved before you even finish the sentence." },
              { icon: Shield, color: "rose", title: "Enterprise Security", desc: "End-to-end encryption and robust access controls keep your sensitive ideas strictly private." },
              { icon: Layout, color: "indigo", title: "Smart Layouts", desc: "Responsive design that adapts to your creative style, whether you're on a phone or an ultrawide." },
              { icon: MousePointer2, color: "amber", title: "Drag & Drop", desc: "Reorder your thoughts with intuitive drag-and-drop interactions that feel natural." },
              { icon: Layers, color: "violet", title: "Slash Commands", desc: "The keyboard-first experience. Type '/' to access a world of structural commands instantly." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group p-10 rounded-[2.5rem] bg-slate-800/40 border border-slate-700/50 hover:border-sky-500/30 transition-all hover:bg-slate-800"
              >
                <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500 shadow-lg`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-4">{feature.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl rounded-[3.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-sky-900/20"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Sparkles size={200} />
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            Ready to build <br /> your next big thing?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="group flex items-center gap-3 rounded-[2rem] bg-sky-500 px-10 py-5 text-xl font-black text-white shadow-xl shadow-sky-500/30 transition hover:bg-sky-400 active:scale-95">
              Start Free Today
              <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="flex items-center gap-2 text-sky-200/60 font-bold uppercase tracking-widest text-xs">
              <CheckCircle2 size={16} />
              No credit card required
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="h-6 w-1.5 bg-slate-900 rounded-full" />
              <span className="text-lg font-black text-slate-900 tracking-tighter uppercase mb-0.5">BlockNote</span>
            </div>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
              The high-performance workspace for creators, designers, and systems thinkers.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center grow gap-x-12 gap-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Platform</h4>
              <div className="flex flex-col gap-2">
                <Link to="/register" className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">Workspace</Link>
                <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">Infrastructure</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Community</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">Documentation</a>
                <a href="#" className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">API Status</a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Legal</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">Privacy</a>
                <a href="#" className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors">Security</a>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right space-y-4">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">© 2026 BlockNote Inc.</p>
            <div className="flex items-center gap-4 justify-center md:justify-end">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
