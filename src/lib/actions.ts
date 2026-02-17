"use server";
import { turso } from "./turso";
import { revalidatePath } from "next/cache";

// --- LEGACY TABLE ACTIONS (certificates table) ---

/**
 * Saves a record to the original legacy certificates table.
 */
export async function saveCertificate(data: any) {
  try {
    const certNumber = data.certNumber.trim().toUpperCase();
    await turso.execute({
      sql: `INSERT INTO certificates (cert_number, type, issued_by, issued_to, date_issued, validity, school_year, year_graduated, google_photos_link) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        certNumber, 
        data.type, 
        data.issuedBy, 
        data.issuedTo, 
        data.dateIssued, 
        data.validity, 
        data.schoolYear, 
        data.yearGraduated, 
        data.googlePhotosLink
      ],
    });
    revalidatePath("/dashboard");
    revalidatePath("/"); 
    return { success: true };
  } catch (e) {
    console.error("Legacy Save error:", e);
    return { success: false, error: e };
  }
}

/**
 * Retrieves all records from the legacy certificates table.
 */
export async function getCertificates() {
  try {
    const result = await turso.execute("SELECT * FROM certificates ORDER BY id DESC");
    return JSON.parse(JSON.stringify(result.rows)); 
  } catch (e) {
    console.error("Legacy Fetch error:", e);
    return [];
  }
}

// --- MODERN TABLE ACTIONS (certificates_modern table) ---

/**
 * Counts records based on the specific year and type.
 * This ensures the serial restarts for every release year and category.
 */
export async function getModernCount(year: string, type: string) {
  try {
    const result = await turso.execute({
      sql: "SELECT COUNT(*) as total FROM certificates_modern WHERE year_graduated = ? AND type = ?",
      args: [year, type],
    });
    return Number(result.rows[0].total) || 0;
  } catch (e) {
    console.error("Modern Count error:", e);
    return 0;
  }
}

/**
 * Saves record to the certificates_modern table for 2025/2026 records.
 */
export async function saveModernCertificate(data: any) {
  try {
    const certNumber = data.certNumber.trim().toUpperCase();
    await turso.execute({
      sql: `INSERT INTO certificates_modern (cert_number, type, issued_by, issued_to, date_issued, validity, school_year, year_graduated, google_photos_link) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        certNumber, 
        data.type, 
        data.issuedBy, 
        data.issuedTo, 
        data.dateIssued, 
        data.validity, 
        data.schoolYear, 
        data.yearGraduated, 
        data.googlePhotosLink
      ],
    });
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Modern Save error:", e);
    return { success: false, error: e };
  }
}

/**
 * Retrieves records from the modern table.
 */
export async function getModernCertificates() {
  try {
    const result = await turso.execute("SELECT * FROM certificates_modern ORDER BY id DESC");
    return JSON.parse(JSON.stringify(result.rows)); 
  } catch (e) {
    console.error("Modern Fetch error:", e);
    return [];
  }
}

// --- GENERAL SHARED ACTIONS ---

/**
 * Updates a certificate record. 
 * The 'isModern' boolean tells the function which table to target.
 */
export async function updateCertificate(id: number, data: any, isModern: boolean = false) {
  try {
    const table = isModern ? "certificates_modern" : "certificates";
    const certNumber = data.certNumber.trim().toUpperCase();

    await turso.execute({
      sql: `UPDATE ${table} SET 
        cert_number = ?, type = ?, issued_by = ?, issued_to = ?, date_issued = ?, validity = ?, school_year = ?, year_graduated = ?, google_photos_link = ?
        WHERE id = ?`,
      args: [
        certNumber, 
        data.type, 
        data.issuedBy, 
        data.issuedTo, 
        data.dateIssued, 
        data.validity, 
        data.schoolYear, 
        data.yearGraduated, 
        data.googlePhotosLink, 
        id
      ],
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Update error:", e);
    return { success: false, error: e };
  }
}

/**
 * Deletes a record from either table based on the isModern flag.
 */
export async function deleteCertificate(id: number, isModern: boolean = false) {
  try {
    const table = isModern ? "certificates_modern" : "certificates";
    await turso.execute({
      sql: `DELETE FROM ${table} WHERE id = ?`,
      args: [id],
    });
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("Delete error:", e);
    return { success: false };
  }
}

/**
 * Searches BOTH tables for a certificate.
 * Used for the public verification page to check old and new records.
 */
export async function verifyCertificate(certNumber: string) {
  try {
    const cleanSearch = certNumber.trim().toUpperCase();

    // 1. Check Modern Table First (High priority for new records)
    const modernResult = await turso.execute({
      sql: "SELECT * FROM certificates_modern WHERE UPPER(cert_number) = ?",
      args: [cleanSearch],
    });

    if (modernResult.rows.length > 0) {
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(modernResult.rows[0])), 
        isModern: true 
      };
    }

    // 2. Check Legacy Table Second
    const legacyResult = await turso.execute({
      sql: "SELECT * FROM certificates WHERE UPPER(cert_number) = ?",
      args: [cleanSearch],
    });

    if (legacyResult.rows.length > 0) {
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(legacyResult.rows[0])), 
        isModern: false 
      };
    }

    return { success: false, message: "Certificate not found." };
  } catch (e) {
    console.error("Verification error:", e);
    return { success: false, message: "An error occurred during verification." };
  }
}