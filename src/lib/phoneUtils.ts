/**
 * Format a phone number to (XXX) XXX-XXXX format
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    // Handle numbers with country code
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if format doesn't match
  return phone;
};

/**
 * Format phone number as user types
 */
export const formatPhoneInput = (value: string): string => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");
  
  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);
  
  // Format progressively as user types
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};
