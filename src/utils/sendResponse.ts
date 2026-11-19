import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Payload<T> {
  statusCode?: number;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

/** Single response envelope for every successful API call. */
export const sendResponse = <T>(res: Response, { statusCode = 200, message = 'OK', data, meta }: Payload<T>) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};
