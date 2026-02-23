
/**
 * Generates a Unique Certificate ID based on the Manual Date Issued.
 * Format: RMMO-YYFMMSDDC00
 * YY, MM, DD - Lahat ay kinuha sa manual dateIssued input string (YYYY-MM-DD)
 */
export function generateCertificateID(
  firstName: string,
  surname: string,
  dateIssued: string,    // format: YYYY-MM-DD (Manual Input)
  yearGraduated: string, // Hindi na ito gagamitin sa ID generation pero nandito para sa parameters consistency
  type: string,
  serial: number
) {
  // 1. I-split ang dateIssued string (YYYY-MM-DD)
  // Ginagamit ang split para makuha ang eksaktong tina-type mo, iwas sa timezone errors ng "new Date()"
  const dateParts = (dateIssued || "").split('-'); 
  
  const fullYear = dateParts[0] || "2026";
  const yy = fullYear.slice(-2);           // Kunin ang huling dalawang numero (e.g., "26")
  const mm = dateParts[1] || "01";         // Kunin ang buwan (e.g., "03")
  const dd = dateParts[2] || "01";         // Kunin ang araw (e.g., "27")
  
  // 2. Initials (F at S)
  const f = (firstName || "").charAt(0).toUpperCase();
  const s = (surname || "").charAt(0).toUpperCase();
  
  // 3. Type Letter (C, A, o S)
  let c = "C"; 
  if (type === "Awards Certificate") {
    c = "A";
  } else if (type === "Certificate of Appreciation") {
    c = "S";
  } else if (type === "Certificate of Completion") {
    c = "C";
  }
  
  // 4. Serial Number (01, 02, etc.)
  const serialStr = serial.toString().padStart(2, '0');

  // Final Format: RMMO-YYFMMSDDC00
  // Halimbawa: Date Issued na "2026-03-27" ay magiging "26...03...27"
  return `RMMO-${yy}${f}${mm}${s}${dd}${c}${serialStr}`;
}