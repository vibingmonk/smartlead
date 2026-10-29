import { useEffect } from 'react';
import { useStore } from './store';
import { AutonomyModal, DemoPanel, SAPanel, SideNav, TopBar } from './shell';
import { Toasts } from './ui';
import ActionCenter from './pages/ActionCenter';
import Agents from './pages/Agents';
import Build from './pages/Build';
import { Accounts, Campaigns } from './pages/Campaigns';
import Goals from './pages/Goals';
import Home from './pages/Home';

const PAGES = { home: Home, build: Build, goals: Goals, campaigns: Campaigns, accounts: Accounts, actions: ActionCenter, agents: Agents };

export default function App() {
  const page = useStore((s) => s.page);
  const theme = useStore((s) => s.theme);
  const toggleDemo = useStore((s) => s.toggleDemo);
  const openSA = useStore((s) => s.openSA);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSA();
      } else if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'd') {
        toggleDemo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleDemo, openSA]);

  const Page = PAGES[page];
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <SideNav />
        <main className={page === 'build' ? 'min-w-0 flex-1 overflow-hidden' : 'scroll-thin min-w-0 flex-1 overflow-y-auto'}>
          <Page />
        </main>
        <SAPanel />
      </div>
      <AutonomyModal />
      <DemoPanel />
      <Toasts />
    </div>
  );
}
