/**
* Utility functions for handling Persian text in the application
*/

/**
 * Get initials from Persian names with proper spacing
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Properly spaced initials
 */
export function getPersianInitials(firstName?: string | null, lastName?: string | null): string {
    if (!firstName && !lastName) return "U";

    const first = firstName ? firstName.charAt(0) : "";
    const last = lastName ? lastName.charAt(0) : "";
    const initials = (first + last).toUpperCase().slice(0, 2);

    // Add proper spacing for Persian characters
    if (initials.length === 2) {
        return initials.split('').join('\u200C'); // Add zero-width non-joiner
    }
    return initials;
}

/**
 * Get initials from any text (for project names, etc.)
 * @param text - The text to get initials from
 * @param maxLength - Maximum number of characters (default: 2)
 * @returns Properly spaced initials
 */
export function getTextInitials(text: string, maxLength: number = 2): string {
    if (!text) return "U";

    const initials = text.slice(0, maxLength).toUpperCase();

    // Add proper spacing for Persian characters
    if (initials.length === 2) {
        return initials.split('').join('\u200C'); // Add zero-width non-joiner
    }
    return initials;
}

/**
 * Get full name from first and last name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full name with proper spacing
 */
export function getFullName(firstName?: string | null, lastName?: string | null): string {
    if (!firstName && !lastName) return "کاربر";
    return [firstName, lastName].filter(Boolean).join(" ");
} 