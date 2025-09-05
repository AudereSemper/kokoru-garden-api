import { MessageCode } from '../constants/message-codes';

export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  messageCode: MessageCode;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    messageCode: MessageCode;
    statusCode: number;
    stack?: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
