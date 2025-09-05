export interface IValidationService {
  validateEmail(email: string): boolean;
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  };
  sanitizeInput(input: string): string;
}
