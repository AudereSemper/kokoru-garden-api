export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
  validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  };
}