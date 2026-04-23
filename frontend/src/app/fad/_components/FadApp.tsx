'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { MODULES, type ModuleDef } from '../_data/modules';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { FridayDrawer } from './FridayDrawer';
import { FridayFullscreen } from './FridayFullscreen';
import { InboxModule } from './modules/InboxModule';
import { CalendarModule } from './modules/CalendarModule';
import { SettingsModule } from './modules/SettingsModule';
import {
  FinanceModule,
  LegalModule,
  OperationsModule,
  OwnersModule,
  PropertiesModule,
  TasksModule,
  TeaseModule,
} from './modules/StubModules';
import {
  GuestsModule,
  IntelligenceModule,
  LeadsModule,
  MarketingModule,
  ReviewsModule,
} from './modules/Tier3Modules';
import { BugReportFab } from './BugReport';
import { AnalyticsModule } from './modules/AnalyticsModule';
import { ReservationsModule } from './modules/ReservationsModule';
import { TrainingModule } from './modules/TrainingModule';

type Theme = 'light' | 'dark';

interface FadAppProps {
  initialFridayFs?: boolean;
}

export default function FadApp({ initialFridayFs = false }: FadAppProps = {}) {
  const [active, setActive] = useState('inbox');
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [fridayOpen, setFridayOpen] = useState(false);
  const [fridayFs, setFridayFs] = useState(initialFridayFs);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [bellOpen, setBellOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const urlMod = new URLSearchParams(window.location.search).get('m');
    const savedActive = localStorage.getItem('fad:active');
    if (urlMod && MODULES.some((m) => m.id === urlMod)) {
      setActive(urlMod);
    } else if (savedActive) {
      setActive(savedActive);
    }
    setCollapsed(localStorage.getItem('fad:collapsed') === '1');
    const savedTheme = localStorage.getItem('fad:theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('fad-dark', theme === 'dark');
    if (hydrated) localStorage.setItem('fad:theme', theme);
    return () => {
      document.documentElement.classList.remove('fad-dark');
    };
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('fad:active', active);
    const url = new URL(window.location.href);
    if (url.searchParams.get('m') !== active) {
      url.searchParams.set('m', active);
      window.history.replaceState(null, '', url);
    }
  }, [active, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem('fad:collapsed', collapsed ? '1' : '0');
  }, [collapsed, hydrated]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (mod && e.key === '/') {
        e.preventDefault();
        setFridayOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setBellOpen(false);
        setHelpOpen(false);
        setAvatarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest('.fad-header')) {
        setBellOpen(false);
        setHelpOpen(false);
        setAvatarOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const dropdownHandler = (setter: (v: boolean) => void, others: Array<(v: boolean) => void>) =>
    (e: MouseEvent) => {
      e.stopPropagation();
      setter(!getCurrent(setter));
      others.forEach((o) => o(false));
    };

  const getCurrent = (setter: (v: boolean) => void) => {
    if (setter === setBellOpen) return bellOpen;
    if (setter === setHelpOpen) return helpOpen;
    if (setter === setAvatarOpen) return avatarOpen;
    return false;
  };

  const mod: ModuleDef = MODULES.find((m) => m.id === active) || MODULES[0];

  return (
    <div className="fad-app">
      <Header
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenFriday={() => setFridayOpen((o) => !o)}
        fridayOpen={fridayOpen}
        onToggleSidebar={() => {
          if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setMobileNavOpen((o) => !o);
          } else {
            setCollapsed((c) => !c);
          }
        }}
        onGoHome={() => {
          setActive('inbox');
          setFridayFs(false);
          setFridayOpen(false);
          setPaletteOpen(false);
          setMobileNavOpen(false);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenBell={dropdownHandler(setBellOpen, [setHelpOpen, setAvatarOpen])}
        bellOpen={bellOpen}
        onOpenHelp={dropdownHandler(setHelpOpen, [setBellOpen, setAvatarOpen])}
        helpOpen={helpOpen}
        onOpenAvatar={dropdownHandler(setAvatarOpen, [setBellOpen, setHelpOpen])}
        avatarOpen={avatarOpen}
      />
      <div className="fad-body">
        <Sidebar
          active={active}
          onSelect={(id) => {
            setActive(id);
            setFridayFs(false);
          }}
          collapsed={collapsed}
          fridayFs={fridayFs}
          onOpenFridayFs={() => {
            setFridayFs((v) => !v);
            setFridayOpen(false);
          }}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <main
          className="fad-main"
          key={fridayFs ? 'fs' : active}
          data-screen-label={fridayFs ? 'Friday Fullscreen' : mod.label}
        >
          {fridayFs ? (
            <FridayFullscreen
              onNavigate={(m) => {
                setActive(m);
                setFridayFs(false);
              }}
              onExit={() => setFridayFs(false)}
            />
          ) : (
            renderModule(mod, { theme, toggleTheme, openFriday: () => setFridayOpen(true) })
          )}
        </main>
      </div>
      <FridayDrawer
        open={fridayOpen && !fridayFs}
        onClose={() => setFridayOpen(false)}
        scope={mod.label}
        onNavigate={setActive}
        onExpand={() => {
          setFridayFs(true);
          setFridayOpen(false);
        }}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActive}
        onAskFriday={() => setFridayOpen(true)}
        onToggleTheme={toggleTheme}
      />
      <BugReportFab currentModuleLabel={fridayFs ? 'Ask Friday' : mod.label} />
    </div>
  );
}

function renderModule(
  mod: ModuleDef,
  ctx: { theme: Theme; toggleTheme: () => void; openFriday: () => void }
) {
  switch (mod.id) {
    case 'inbox':
      return <InboxModule onAskFriday={ctx.openFriday} />;
    case 'calendar':
      return <CalendarModule />;
    case 'settings':
      return <SettingsModule theme={ctx.theme} onToggleTheme={ctx.toggleTheme} />;
    case 'training':
      return <TrainingModule />;
    case 'tasks':
      return <TasksModule />;
    case 'reservations':
      return <ReservationsModule />;
    case 'finance':
      return <FinanceModule />;
    case 'legal':
      return <LegalModule />;
    case 'properties':
      return <PropertiesModule />;
    case 'operations':
      return <OperationsModule />;
    case 'owners':
      return <OwnersModule />;
    case 'reviews':
      return <ReviewsModule />;
    case 'guests':
      return <GuestsModule />;
    case 'marketing':
      return <MarketingModule />;
    case 'leads':
      return <LeadsModule />;
    case 'intelligence':
      return <IntelligenceModule />;
    case 'analytics':
      return <AnalyticsModule />;
    case 'syndic':
    case 'interior':
    case 'agency':
      return <TeaseModule mod={mod} />;
    default:
      return <div className="fad-module-body">Module not found.</div>;
  }
}
