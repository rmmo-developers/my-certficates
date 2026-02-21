export function generateCertificateID(
  firstName: string,
  surname: string,
  yearGraduated: string, // Binago: yearGraduated na ang gagamitin sa halip na dateIssued
  type: string,       // dropdown value mula sa page.tsx
  serial: number      // e.g., 1, 2, 3...
) {
  // YY - Kunin ang huling dalawang numero ng graduation year (e.g., "2025" -> "25")
  // Gumagana ito kahit "2025" o "2025-2026" ang format
  const yy = yearGraduated.substring(2, 4);
  
  // Gagamitin ang current date para sa MM at DD ng Certificate ID
  const date = new Date();
  
  // F - Unang letra ng First Name
  const f = firstName.charAt(0).toUpperCase();
  
  // MM - Kasalukuyang Buwan (e.g., 02)
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // S - Unang letra ng Surname
  const s = surname.charAt(0).toUpperCase();
  
  // DD - Kasalukuyang Araw (e.g., 15)
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

  // Format: RMMO-YYFMMSDDC00
  return `RMMO-${yy}${f}${mm}${s}${dd}${c}${serialStr}`;
}