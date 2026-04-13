import { Link } from 'react-router-dom';

export function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">BlockNote</p>
            <p className="text-sm text-slate-500">A clean, modern note workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="grid gap-10 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 text-white shadow-xl shadow-slate-900/10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-sky-500/20 px-4 py-1 text-sm font-semibold text-sky-200">
              Notes, documents, and quick ideas
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Build better notes with a polished editor experience.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              BlockNote is designed to help you write clearly, organize documents effortlessly, and revisit your ideas whenever you need them.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
              >
                Create an account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Explore dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-200">Organize</p>
              <p className="mt-4 text-xl font-semibold text-white">Keep your documents tidy</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Easily find any note from the document list and keep your work within reach.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-200">Focus</p>
              <p className="mt-4 text-xl font-semibold text-white">Write without distractions</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">A calm interface for drafting documents, editing text, and staying on task.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-200">Sync</p>
              <p className="mt-4 text-xl font-semibold text-white">Access your work anywhere</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Your notes are ready when you return, keeping your project momentum moving fast.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-200">Smart</p>
              <p className="mt-4 text-xl font-semibold text-white">Built for real workflows</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Designed for people who want a lightweight but capable document workspace.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-3">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">Project overview</p>
            <h2 className="text-2xl font-semibold text-slate-900">What BlockNote offers</h2>
            <p className="text-sm leading-6 text-slate-600">
              A polished document manager with a clean home experience, a central dashboard, and a simple flow for creating and editing notes.
            </p>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-base font-semibold text-slate-900">Document library</h3>
            <p className="text-sm text-slate-500">Browse all your saved documents and quickly jump back into what matters most.</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-base font-semibold text-slate-900">Instant access</h3>
            <p className="text-sm text-slate-500">Fast page loads and intuitive navigation help you stay productive from the first click.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
