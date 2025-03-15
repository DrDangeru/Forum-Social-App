/**
 * Type definitions for middleware used in Express
 */

// This ensures TypeScript recognizes middleware imports without errors
declare module 'middleware' {
  import { RequestHandler } from 'express';
  const middleware: RequestHandler;
  export default middleware;
}
