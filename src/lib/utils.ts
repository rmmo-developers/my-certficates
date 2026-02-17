export function generateCertificateID(
  firstName: string,
  surname: string,
  dateIssued: string, // Format: YYYY-MM-DD
  type: string,       // dropdown value from page.tsx
  serial: number      // e.g., 1, 2, 3...
) {
  const date = new Date(dateIssued);
  
  // YY - Year (e.g., 2026 -> 26)
  const yy = date.getFullYear().toString().slice(-2);
  
  // F - First Letter of First Name
  const f = firstName.charAt(0).toUpperCase();
  
  // MM - Month (e.g., 02)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // S - First Letter of Surname
  const s = surname.charAt(0).toUpperCase();
  
  // DD - Day (e.g., 15)
  const dd = date.getDate().toString().padStart(2, '0');
  
  // Determine Type Letter (C, A, or S) based on user request:
  // 1. Certificate of Completion = C
  // 2. Awards Certificate = A
  // 3. Certificate of Appreciation = S
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

  // Put it all together: RMMO-YYFMMSDDC00
  return `RMMO-${yy}${f}${mm}${s}${dd}${c}${serialStr}`;
}