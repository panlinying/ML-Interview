/**
 * Re-export auth utilities from AuthContext.
 *
 * This module provides backward compatibility and a cleaner import path.
 * All auth state is managed by AuthProvider in the component tree.
 */
export { useAuth, AuthProvider, getInitials } from './AuthContext'
export type { UserResponse } from './AuthContext'
