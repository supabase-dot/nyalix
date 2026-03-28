/**
 * Validation utilities for form inputs
 */

/**
 * Validates phone number input
 * @param phone - The phone number string to validate
 * @returns Object with isValid boolean and optional error message
 */
export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  // Remove any whitespace for validation
  const cleanPhone = phone.replace(/\s/g, '');

  // Check if only contains digits
  const phoneRegex = /^\d+$/;

  if (!cleanPhone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, message: 'Phone number must contain only digits' };
  }

  // Optional: Check minimum length (adjust as needed)
  if (cleanPhone.length < 7) {
    return { isValid: false, message: 'Phone number must be at least 7 digits' };
  }

  return { isValid: true };
};

/**
 * Validates password input
 * @param password - The password string to validate
 * @returns Object with isValid boolean and optional error message
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  // Check length
  if (password.length < 8 || password.length > 15) {
    return { isValid: false, message: 'Password must be between 8 and 15 characters' };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must include uppercase, lowercase, number, and special character' };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must include uppercase, lowercase, number, and special character' };
  }

  // Check for number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must include uppercase, lowercase, number, and special character' };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?/]/.test(password)) {
    return { isValid: false, message: 'Password must include uppercase, lowercase, number, and special character' };
  }

  return { isValid: true };
};