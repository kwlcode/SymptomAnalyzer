// Professional color scheme matching the design specification
export const AppColors = {
  // Primary colors
  primary: '#1e3a8a',        // Dark blue header
  secondary: '#3b82f6',      // Blue accents
  
  // Feature section colors
  purple: '#8b5cf6',         // AI Diagnostic System
  orange: '#f97316',         // Diagnostic Algorithm  
  green: '#10b981',          // Premium/Subscription
  lightGreen: '#d1fae5',     // Benefits section
  
  // Status and action colors
  enabled: '#3b82f6',        // Enabled badges
  success: '#10b981',        // Success states
  warning: '#f59e0b',        // Warning states
  error: '#ef4444',          // Error states
  
  // Neutral colors
  background: '#f8fafc',     // Light background
  surface: '#ffffff',        // Card/surface background
  border: '#e2e8f0',         // Border color
  text: '#1f2937',           // Primary text
  textSecondary: '#6b7280',  // Secondary text
  textLight: '#9ca3af',      // Light text
};

export const ButtonStyles = {
  primary: {
    backgroundColor: AppColors.green,
    borderRadius: 8,
    elevation: 2,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  dashed: {
    backgroundColor: 'transparent',
    borderColor: AppColors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  enabled: {
    backgroundColor: AppColors.enabled,
    borderRadius: 16,
  },
};