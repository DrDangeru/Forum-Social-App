import type { Response } from 'express';

export function handleServerError(res: Response, error: unknown, context: string) {
  console.error(`${context}:`, error);
  
  if (error instanceof Error) {
    return res.status(500).json({ error: error.message || context });
  }
  
  return res.status(500).json({ error: context });
}
