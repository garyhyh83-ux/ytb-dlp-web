// frontend/src/components/Layout.tsx
import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  statusBar: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ sidebar, statusBar, children }: LayoutProps) {
  return (
    <div className="app-layout">
      {/* Topbar */}
      <header className="app-topbar">
        <div className="app-topbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>yt-dlp</span>
        </div>
        <div className="app-topbar-title">下载管理器</div>
        <div className="app-topbar-spacer" />
      </header>

      {/* Body: sidebar + main */}
      <div className="app-body">
        {sidebar}
        <main className="app-main">
          {children}
        </main>
      </div>

      {/* StatusBar */}
      {statusBar}
    </div>
  );
}
