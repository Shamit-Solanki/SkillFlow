import Link from 'next/link';
import { ArrowLeft, GitBranch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
        <GitBranch className="w-6 h-6 text-primary" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-3">Page Not Found</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-8">
        The roadmap or page you are looking for doesn't exist or may have been moved.
      </p>
      <Link
        href="/dashboard/demo"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
