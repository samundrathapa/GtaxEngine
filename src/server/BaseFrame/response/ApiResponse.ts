export interface IApiResponse<T = any> {
  success: boolean;
  failure: boolean;
  status: number;
  message: string;
  data: T | null;
  errors: string[];
  validation_errors: Record<string, string[]>;
  timestamp: string;
}

export class ApiResponse {
  static buildSuccess<T>(data: T | null = null, message: string = "Success", status: number = 200): IApiResponse<T> {
    return {
      success: true,
      failure: false,
      status,
      message,
      data,
      errors: [],
      validation_errors: {},
      timestamp: new Date().toISOString()
    };
  }

  static buildFailure(
    message: string,
    errors: string[] = [],
    validationErrors: Record<string, string[]> = {},
    status: number = 400
  ): IApiResponse<null> {
    return {
      success: false,
      failure: true,
      status,
      message,
      data: null,
      errors: errors.length > 0 ? errors : [message],
      validation_errors: validationErrors,
      timestamp: new Date().toISOString()
    };
  }
}
