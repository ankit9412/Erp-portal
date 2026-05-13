import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

const StatCard = ({ title, value, change, changeLabel, icon: Icon, color = 'blue', loading = false, prefix = '', suffix = '' }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: 'text-green-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: 'text-orange-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
  };

  const colors = colorMap[color] || colorMap.blue;
  const isPositive = change > 0;
  const isNeutral = change === 0 || change === undefined;

  if (loading) {
    return (
      <div className="stat-card">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="shimmer h-8 w-32 rounded mt-2" />
        <div className="shimmer h-3 w-20 rounded mt-2" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="stat-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {prefix}{value}{suffix}
          </p>
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.icon)} />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          {isNeutral ? (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          ) : isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn(
            'text-xs font-medium',
            isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
