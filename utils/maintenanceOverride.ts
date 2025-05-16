/**
 * Utility for handling admin overrides of maintenance mode
 */

// Check if the current user has an admin override token
export const hasMaintenanceOverride = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check for admin override token in localStorage
  const overrideToken = localStorage.getItem('admin_override_token');
  
  // Check for override parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const overrideParam = urlParams.get('maintenance_override');
  
  // If there's a valid override parameter, save it to localStorage
  if (overrideParam === 'true' && urlParams.get('token') === 'elevee_admin_2023') {
    localStorage.setItem('admin_override_token', 'elevee_admin_2023');
    return true;
  }
  
  return overrideToken === 'elevee_admin_2023';
};

// Clear any admin override
export const clearMaintenanceOverride = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_override_token');
  }
};

export default {
  hasMaintenanceOverride,
  clearMaintenanceOverride
}; 