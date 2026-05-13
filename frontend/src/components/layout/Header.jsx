import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu, Search, Bell, Sun, Moon, Monitor,
  LogOut, Settings, User, ChevronDown, Command,
} from 'lucide-react';
import { toggleSidebar, setTheme, toggleCommandPalette } from '../../features/ui/uiSlice';
import { toggleNotificationPanel } from '../../features/notification/notificationSlice';
import { logout } from '../../features/auth/authSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/formatters';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  const themes = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ];

  return (
    <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
      {themes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => dispatch(setTheme(value))}
          className={cn(
            'p-1.5 rounded-md transition-all',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={value}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
};

const UserMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [logoutApi] = useLogoutMutation();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {}
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">
            {getInitials(user?.firstName, user?.lastName)}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-foreground leading-none">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">
            {user?.roleType?.replace(/_/g, ' ')}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => { navigate('/profile'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

const Header = () => {
  const dispatch = useDispatch();
  const pageTitle = useSelector((state) => state.ui.pageTitle);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const breadcrumbs = useSelector((state) => state.ui.breadcrumbs);

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-4 gap-4 flex-shrink-0 z-10">
      {/* Sidebar toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs / Title */}
      <div className="flex-1 min-w-0">
        {breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted-foreground">/</span>}
                <span className={cn(
                  i === breadcrumbs.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground cursor-pointer'
                )}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="text-sm font-semibold text-foreground truncate">{pageTitle}</h1>
        )}
      </div>

      {/* Search */}
      <button
        onClick={() => dispatch(toggleCommandPalette())}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-accent rounded-lg text-sm text-muted-foreground transition-colors border border-border"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 text-xs bg-background border border-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <button
        onClick={() => dispatch(toggleNotificationPanel())}
        className="relative p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* User menu */}
      <UserMenu />
    </header>
  );
};

export default Header;
