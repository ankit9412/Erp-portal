import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Search, Package, DollarSign, Users, BarChart3, Settings, X } from 'lucide-react';
import { setCommandPaletteOpen } from '../../features/ui/uiSlice';
import { cn } from '../../utils/cn';

const commands = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3, category: 'Navigation' },
  { label: 'Products', href: '/inventory/products', icon: Package, category: 'Inventory' },
  { label: 'Stock Management', href: '/inventory/stock', icon: Package, category: 'Inventory' },
  { label: 'Warehouses', href: '/inventory/warehouses', icon: Package, category: 'Inventory' },
  { label: 'Suppliers', href: '/inventory/suppliers', icon: Package, category: 'Inventory' },
  { label: 'Purchase Orders', href: '/inventory/purchase-orders', icon: Package, category: 'Inventory' },
  { label: 'Invoices', href: '/finance/invoices', icon: DollarSign, category: 'Finance' },
  { label: 'Create Invoice', href: '/finance/invoices/new', icon: DollarSign, category: 'Finance' },
  { label: 'Transactions', href: '/finance/transactions', icon: DollarSign, category: 'Finance' },
  { label: 'Expenses', href: '/finance/expenses', icon: DollarSign, category: 'Finance' },
  { label: 'Finance Reports', href: '/finance/reports', icon: DollarSign, category: 'Finance' },
  { label: 'Employees', href: '/hr/employees', icon: Users, category: 'HR' },
  { label: 'Attendance', href: '/hr/attendance', icon: Users, category: 'HR' },
  { label: 'Leave Management', href: '/hr/leaves', icon: Users, category: 'HR' },
  { label: 'Payroll', href: '/hr/payroll', icon: Users, category: 'HR' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Analytics' },
  { label: 'Settings', href: '/settings', icon: Settings, category: 'Settings' },
  { label: 'Audit Logs', href: '/audit', icon: Settings, category: 'Settings' },
];

const CommandPalette = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const filtered = query
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleSelect = (cmd) => {
    navigate(cmd.href);
    dispatch(setCommandPaletteOpen(false));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      handleSelect(filtered[selected]);
    } else if (e.key === 'Escape') {
      dispatch(setCommandPaletteOpen(false));
    }
  };

  // Group by category
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  let itemIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => dispatch(setCommandPaletteOpen(false))}
      />

      {/* Palette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.15 }}
        className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, actions..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground font-mono">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No results for "{query}"
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </p>
                  {items.map((cmd) => {
                    const currentIndex = itemIndex++;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.href}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelected(currentIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                          selected === currentIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><kbd className="bg-muted border border-border rounded px-1 font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-muted border border-border rounded px-1 font-mono">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="bg-muted border border-border rounded px-1 font-mono">ESC</kbd> close</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default CommandPalette;
