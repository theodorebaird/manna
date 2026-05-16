import { NavLink } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Brain, Settings as SettingsIcon } from 'lucide-react';

const items = [
  { to: '/',          label: 'Home',     Icon: Home },
  { to: '/read',      label: 'Read',     Icon: BookOpen },
  { to: '/learn',     label: 'Learn',    Icon: GraduationCap },
  { to: '/memorize',  label: 'Memorize', Icon: Brain },
  { to: '/settings',  label: 'Settings', Icon: SettingsIcon }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-white/90 dark:bg-ink-900/90 backdrop-blur border-t border-gold-200 dark:border-ink-700 px-1 py-2 z-30">
      <ul className="flex justify-around">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition ${
                  isActive
                    ? 'text-gold-700 dark:text-gold-300'
                    : 'text-ink-500 dark:text-ink-300/70 hover:text-gold-600 dark:hover:text-gold-400'
                }`
              }
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
