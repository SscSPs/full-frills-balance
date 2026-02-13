import { AppConfig } from '@/src/constants/app-config';
import { roundToPrecision } from '@/src/utils/money';

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

export const validateAccountName = (name: string): { isValid: boolean; error?: string } => {
  const sanitizedName = sanitizeInput(name)
  const { minAccountNameLength, maxAccountNameLength } = AppConfig.constants.validation;

  if (!sanitizedName) {
    return { isValid: false, error: AppConfig.strings.validation.accountNameRequired }
  }

  if (sanitizedName.length < minAccountNameLength) {
    return { isValid: false, error: AppConfig.strings.validation.accountNameTooShort(minAccountNameLength) }
  }

  if (sanitizedName.length > maxAccountNameLength) {
    return { isValid: false, error: AppConfig.strings.validation.accountNameTooLong(maxAccountNameLength) }
  }

  if (!/^[a-zA-Z0-9\s\-_&().,'#]+$/.test(sanitizedName)) {
    return {
      isValid: false,
      error: AppConfig.strings.validation.invalidCharacters
    }
  }

  return { isValid: true }
}

export const validateCurrencyCode = (code: string): { isValid: boolean; error?: string } => {
  const sanitizedCode = sanitizeInput(code).toUpperCase()

  if (!sanitizedCode) {
    return { isValid: false, error: 'Currency code is required' }
  }

  if (sanitizedCode.length !== 3) {
    return { isValid: false, error: 'Currency code must be exactly 3 characters' }
  }

  if (!/^[A-Z]{3}$/.test(sanitizedCode)) {
    return { isValid: false, error: 'Currency code must contain only letters' }
  }

  return { isValid: true }
}

export const validateDescription = (description: string): { isValid: boolean; error?: string } => {
  const sanitizedDescription = sanitizeInput(description)

  if (sanitizedDescription && sanitizedDescription.length > AppConfig.input.maxDescriptionLength) {
    return { isValid: false, error: `Description must be less than ${AppConfig.input.maxDescriptionLength} characters` }
  }

  return { isValid: true }
}


export const sanitizeAmount = (amount: string | number, precision = AppConfig.constants.precision): number | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount

  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return null
  }

  return roundToPrecision(numAmount, precision)
}
