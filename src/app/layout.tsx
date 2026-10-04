import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillFlow — AI-Powered Career Roadmap',
  description:
    'Analyze your skills, identify gaps, and generate a personalized learning path toward your target role.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background">{children}</div>
      </body>
    </html>
  );
}
