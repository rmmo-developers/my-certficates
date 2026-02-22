/**
 * Generates a Unique Certificate ID based on Batch Year, Name, and Serial Number.
 * Format: RMMO-YYFMMSDDC00
 */
export function generateCertificateID(
  firstName: string,
  surname: string,
  yearGraduated: string, 
  type: string,       
  serial: number      
) {
  // YY - Gets the last two digits of the graduation year (e.g., "2026" -> "26")
  const yy = yearGraduated.substring(2, 4);
  
  // Uses the current date for MM and DD of the generation moment
  const date = new Date();
  
  // F - First letter of First Name
  const f = firstName.charAt(0).toUpperCase();
  
  // MM - Current Month (e.g., 02)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // S - First letter of Surname
  const s = surname.charAt(0).toUpperCase();
  
  // DD - Current Day (e.g., 23)
  const dd = date.getDate().toString().padStart(2, '0');
  
  // Determine Type Letter (C, A, or S):
  let c = "C"; 
  if (type === "Awards Certificate") {
    c = "A";
  } else if (type === "Certificate of Appreciation") {
    c = "S";
  } else if (type === "Certificate of Completion") {
    c = "C";
  }
  
  // 00 - Serial Number (e.g., 01, 02)
  // This value is now determined by getModernCount(year, type) in actions.ts
  const serialStr = serial.toString().padStart(2, '0');

  // Final Format: RMMO-YYFMMSDDC00
  return `RMMO-${yy}${f}${mm}${s}${dd}${c}${serialStr}`;
}