import { Armchair, Footprints, TrendingDown, TrendingUp, Scale, Zap, type LucideIcon } from 'lucide-react';
import type { ActivityLevel, FitnessGoal } from '../types/user';

export interface ActivityOption {
  value: ActivityLevel;
  label: string;
  steps: string;
  description: string;
  icon: LucideIcon;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: 'low',
    label: 'Low activity',
    steps: 'Under 5,000 steps a day',
    description: 'Mostly seated, with short walks.',
    icon: Armchair,
  },
  {
    value: 'moderate',
    label: 'Moderate activity',
    steps: '5,000 to 10,000 steps a day',
    description: 'On your feet for part of the day.',
    icon: Footprints,
  },
  {
    value: 'high',
    label: 'High activity',
    steps: 'Over 10,000 steps a day',
    description: 'Active most of the day or on a physical job.',
    icon: Zap,
  },
];

export interface GoalOption {
  value: FitnessGoal;
  label: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile */
  tone: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'cut',
    label: 'Cut',
    tagline: 'Reduce body fat / lose weight',
    description: 'Reduce body fat while maintaining muscle.',
    icon: TrendingDown,
    tone: 'bg-water-soft text-water',
  },
  {
    value: 'bulk',
    label: 'Bulk',
    tagline: 'Gain weight',
    description: 'Increase body weight and support muscle growth.',
    icon: TrendingUp,
    tone: 'bg-pine-100 text-pine-700',
  },
  {
    value: 'maintain',
    label: 'Maintain',
    tagline: 'Hold your current weight',
    description: 'Maintain your current body weight.',
    icon: Scale,
    tone: 'bg-volt-soft text-pine-800',
  },
];

export const GOAL_LABEL: Record<FitnessGoal, string> = {
  cut: 'Cut',
  bulk: 'Bulk',
  maintain: 'Maintain',
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  low: 'Low activity',
  moderate: 'Moderate activity',
  high: 'High activity',
};
