/**
 * Generates a Unique Certificate ID based on Date Issued, Name, and Serial Number.
 * Format: RMMO-YYFMMSDDC00
 */
export function generateCertificateID(
  firstName: string,
  surname: string,
  dateIssued: string, // Dito na kukunin ang YY, MM, at DD base sa manual input
  type: string,       
  serial: number      
) {
  // Ginagawang Date object ang manual input na dateIssued
  const date = new Date(dateIssued);
  
  // YY - Year mula sa dateIssued (e.g., "2026-02-23" -> "26")
  const yy = date.getFullYear().toString().slice(-2);
  
  // F - Unang letra ng First Name
  const f = (firstName || "").charAt(0).toUpperCase();
  
  // MM - Buwan mula sa dateIssued (e.g., 02)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // S - Unang letra ng Surname
  const s = (surname || "").charAt(0).toUpperCase();
  
  // DD - Araw mula sa dateIssued (e.g., 23)
  const dd = date.getDate().toString().padStart(2, '0');
  
  // Pag-determina ng Type Letter (C, A, o S):
  let c = "C"; 
  if (type === "Awards Certificate") {
    c = "A";
  } else if (type === "Certificate of Appreciation") {
    c = "S";
  } else if (type === "Certificate of Completion") {
    c = "C";
  }
  
  // 00 - Serial Number (e.g., 01, 02)
  const serialStr = serial.toString().padStart(2, '0');

  // Final Format: RMMO-YYFMMSDDC00
  return `RMMO-${yy}${f}${mm}${s}${dd}${c}${serialStr}`;
}