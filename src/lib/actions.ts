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
 * Counts total based on TYPE (S, C, or A) to keep serial numbers continuous.
 */
export async function getModernCount(year: string, type: string) {
  try {
    const result = await turso.execute({
      sql: "SELECT COUNT(*) as total FROM certificates_modern WHERE type = ?",
      args: [type], 
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
 * Updates a certificate record in the target table.
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
 * Searches BOTH tables for a certificate verification.
 */
export async function verifyCertificate(certNumber: string) {
  try {
    const cleanSearch = certNumber.trim().toUpperCase();

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

// ==========================================
// REGISTRANTS ACTIONS (Online Registration)
// ==========================================

/**
 * Saves a new registrant with status 'PENDING'.
 */
export async function saveRegistrant(data: any) {
  try {
    await turso.execute({
      sql: `INSERT INTO registrants (
        surname, first_name, middle_name, suffix, gender, birthday, grade_level_section, 
        strand, school_year_graduation, email, date_started, date_ended, position_assigned, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.surname.toUpperCase(),
        data.firstName.toUpperCase(),
        data.middleName.toUpperCase(),
        data.suffix ? data.suffix.toUpperCase() : "",
        data.gender,
        data.birthday,
        data.gradeLevelSection,
        data.strand,
        data.schoolYearGraduation,
        data.email,
        data.dateStarted,
        data.dateEnded,
        data.positionAssigned.toUpperCase(),
        "PENDING"
      ],
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    console.error("Registration error:", e);
    return { success: false, error: e.message };
  }
}

/**
 * Fetches all pending registrants for the dashboard.
 * Required by page.tsx.
 */
export async function getRegistrants() {
  try {
    const result = await turso.execute("SELECT * FROM registrants WHERE status = 'PENDING' ORDER BY id DESC");
    return JSON.parse(JSON.stringify(result.rows));
  } catch (e) {
    console.error("Fetch Pending Error:", e);
    return [];
  }
}

/**
 * Updates registrant status (e.g., APPROVED, REJECTED).
 * Required by page.tsx.
 */
export async function updateRegistrantStatus(id: number, status: string) {
  try {
    await turso.execute({
      sql: "UPDATE registrants SET status = ? WHERE id = ?",
      args: [status, id],
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    console.error("Update status error:", e);
    return { success: false };
  }
}

/**
 * APPROVE/PROMOTE: Moves registrant data to certificate tables.
 */
export async function approveRegistrant(registrant: any, certData: any) {
  try {
    const fullName = `${registrant.first_name} ${registrant.middle_name} ${registrant.surname} ${registrant.suffix || ""}`
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const isModernYear = registrant.school_year_graduation.includes("2025") || 
                         registrant.school_year_graduation.includes("2026");
    
    const targetTable = isModernYear ? "certificates_modern" : "certificates";

    await turso.execute({
      sql: `INSERT INTO ${targetTable} (cert_number, issued_to, type, issued_by, date_issued, school_year) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        certData.certNumber.toUpperCase(),
        fullName,
        certData.type,
        certData.issuedBy,
        certData.dateIssued,
        registrant.school_year_graduation
      ],
    });

    await turso.execute({
      sql: "UPDATE registrants SET status = 'APPROVED' WHERE id = ?",
      args: [registrant.id]
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: any) {
    console.error("Approval error:", e);
    return { success: false, error: e.message };
  }
}