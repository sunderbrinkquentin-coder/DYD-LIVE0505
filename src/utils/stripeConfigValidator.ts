/**
 * Stripe Configuration Validator
 *
 * Validates that all required Stripe Price IDs are configured
 * in environment variables.
 */

export interface StripeConfigValidation {
  isValid: boolean;
  missingKeys: string[];
}

export function validateStripePriceIds(): StripeConfigValidation {
  const requiredKeys = [
    'VITE_STRIPE_PRICE_CV_OPT_1',
    'VITE_STRIPE_PRICE_CV_OPT_5',
    'VITE_STRIPE_PRICE_CV_OPT_10',
  ];

  const missingKeys: string[] = [];

  requiredKeys.forEach((key) => {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      missingKeys.push(key);
    }
  });

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}
