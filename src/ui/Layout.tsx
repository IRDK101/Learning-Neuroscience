import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { setSetting, useProgress } from '../progress/store';
import { Icon } from './bits';
import { SvgDefs } from './Diagram';
import { PopoverLayer } from './PopoverLayer';
import { Toaster } from './toast';

const NAV = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/learn', label: 'Learn', icon: 'book' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/cards', label: 'Cards', icon: 'cards' },
  { to: '/play', label: 'Play', icon: 'play' },
];

function ThemeButton() {
  const { settings } = useProgress();
  const next = settings.theme === 'system' ? 'light' : settings.theme === 'light' ? 'dark' : 'system';
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  }, [settings.theme]);
  const label = { system: 'Theme: match device', light: 'Theme: light', dark: 'Theme: dark' }[settings.theme];
  return (
    <button type="button" className="icon-btn" onClick={() => setSetting('theme', next)} title={`${label} (click to change)`} aria-label={`${label}. Change theme`}>
      <Icon name={settings.theme === 'system' ? 'auto' : settings.theme === 'light' ? 'sun' : 'moon'} />
    </button>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app">
      <SvgDefs />
      <a href="#main" className="sr-only" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="NeuroMap home">
            <img src="./favicon.svg" alt="" />
            NeuroMap
          </Link>
          <nav className="mainnav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <ThemeButton />
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <Link to="/progress">Progress & settings</Link> · <Link to="/corrections">Corrections to the notes</Link> · <Link to="/about">About & credits</Link>
      </footer>
      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} size={22} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <PopoverLayer />
      <Toaster />
    </div>
  );
}
