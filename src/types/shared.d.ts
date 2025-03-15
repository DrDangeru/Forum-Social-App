/**
 * Global type declarations for the shared types
 */

// Re-export all shared types from their respective files
declare module 'shared' {
  export * from './shared/User';
  export * from './shared/Profile';
  export * from './shared/Utils';
  export * from './shared/index';
}
