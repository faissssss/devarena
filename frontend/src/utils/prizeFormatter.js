/**
 * Format prize money strings to a consistent format
 * Examples:
 *   "1,500,000 Usd" → 1,500,000 USD
 *   "200,000 Usd" → 200,000 USD
 *   "200" → 200 USD (assume USD if no currency)
 *   "500 EUR" → 500 EUR
 *   null → null
 */
export function formatPrize(prize) {
  if (!prize) return null;
  
  // Convert to string and trim
  let prizeStr = String(prize).trim();
  
  // Remove quotes if present
  prizeStr = prizeStr.replace(/^["']|["']$/g, '');
  
  // Check if it already has a currency
  const hasCurrency = /[a-z]{3}/i.test(prizeStr);
  
  if (hasCurrency) {
    // Replace "Usd" with "USD" (case insensitive)
    return prizeStr.replace(/\busd\b/gi, 'USD')
                   .replace(/\beur\b/gi, 'EUR')
                   .replace(/\bgbp\b/gi, 'GBP');
  } else {
    // No currency found - assume USD
    return `${prizeStr} USD`;
  }
}
