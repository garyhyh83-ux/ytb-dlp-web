// frontend/src/App.tsx
import { useState, useCallback } from 'react';
import { useWebSocket } from './api/useWebSocket';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import NewDownload from './pages/NewDownload';
import Downloading from './pages/Downloading';
import Completed from './pages/Completed';
import Playlists from './pages/Playlists';
import Settings from './pages/Settings';
import './App.css';

export type Page = 'new' | 'downloading' | 'completed' | 'playlists' | 'settings';

function App() {
  const [page, setPage] = useState<Page>('new');
  const { tasks, connected } = useWebSocket();

  const activeDownloads = tasks.filter(
    t => t.status === 'downloading' || t.status === 'paused' || t.status === 'pending'
  ).length;

  const pageComponent = useCallback(() => {
    switch (page) {
      case 'new': return <NewDownload />;
      case 'downloading': return <Downloading tasks={tasks.filter(t => t.status !== 'done' && t.status !== 'failed')} />;
      case 'completed': return <Completed />;
      case 'playlists': return <Playlists />;
      case 'settings': return <Settings />;
    }
  }, [page, tasks]);

  return (
    <Layout
      sidebar={<Sidebar page={page} onPage={setPage} activeCount={activeDownloads} />}
      statusBar={<StatusBar connected={connected} activeCount={activeDownloads} />}
    >
      {pageComponent()}
    </Layout>
  );
}

export default App;
