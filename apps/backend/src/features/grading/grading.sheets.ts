// Fitur: helper integrasi Google Sheets
import { sheets } from "../../config/sheets";

export const getColLetter = (colIndex: number): string => {
  let letter = "";
  let idx = colIndex;
  while (idx >= 0) {
    letter = String.fromCharCode((idx % 26) + 65) + letter;
    idx = Math.floor(idx / 26) - 1;
  }
  return letter;
};

export const extractSpreadsheetId = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const str = input.trim();
  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (!str.includes("/")) return str;
  return str;
};

export const syncGradeToSheet = async (
  spreadsheetId: string | undefined | null,
  studentNis: string,
  studentName: string,
  assignmentTitle: string,
  score: number
) => {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    return { synced: false, reason: "Kelas tidak memiliki spreadsheet_id yang valid" };
  }

  // 1. Dapatkan metadata spreadsheet untuk membaca nama tab sheet pertama
  let metaRes;
  try {
    metaRes = await sheets.spreadsheets.get({ spreadsheetId: cleanId });
  } catch (e: any) {
    if (e.message?.includes("Requested entity was not found") || e.code === 404 || e.status === 404) {
      throw new Error(`ID Google Spreadsheet '${cleanId}' tidak ditemukan di Google Drive (404). Periksa kembali ID di Pengaturan Kelas.`);
    }
    if (e.message?.includes("The caller does not have permission") || e.code === 403 || e.status === 403) {
      throw new Error(`Akses ditolak (403). Pastikan Spreadsheet sudah di-share sebagai Editor ke Email Service Account.`);
    }
    throw e;
  }

  const firstSheetTitle = metaRes.data.sheets?.[0]?.properties?.title || "Sheet1";
  const sheetRef = `'${firstSheetTitle.replace(/'/g, "\\'")}'`;

  // 2. Dapatkan Header Row 1
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: cleanId,
    range: `${sheetRef}!1:1`,
  });
  const header: string[] = headerRes.data.values?.[0] || [];

  if (header.length === 0) {
    header.push("No", "NIS", "Nama");
    await sheets.spreadsheets.values.update({
      spreadsheetId: cleanId,
      range: `${sheetRef}!A1:C1`,
      valueInputOption: "RAW",
      requestBody: { values: [["No", "NIS", "Nama"]] },
    });
  }

  let colIdx = header.findIndex((h) => h && h.trim().toLowerCase() === assignmentTitle.trim().toLowerCase());
  if (colIdx === -1) {
    colIdx = header.length < 3 ? 3 : header.length;
    const colLetter = getColLetter(colIdx);
    await sheets.spreadsheets.values.update({
      spreadsheetId: cleanId,
      range: `${sheetRef}!${colLetter}1`,
      valueInputOption: "RAW",
      requestBody: { values: [[assignmentTitle]] },
    });
  }

  // 3. Cari Baris Siswa berdasarkan NIS di Kolom B (atau Nama di Kolom C)
  const nisRes = await sheets.spreadsheets.values.get({
    spreadsheetId: cleanId,
    range: `${sheetRef}!B:B`,
  });
  const nisRows: string[][] = nisRes.data.values || [];

  const safeNis = (studentNis || "").trim();
  const safeName = (studentName || "Siswa").trim();

  let targetRow = -1;
  for (let i = 0; i < nisRows.length; i++) {
    const val = (nisRows[i][0] || "").toString().trim();
    if (safeNis && val === safeNis) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }

  if (targetRow === -1) {
    targetRow = Math.max(nisRows.length + 1, 2);
    const studentNo = targetRow - 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: cleanId,
      range: `${sheetRef}!A${targetRow}:C${targetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [[studentNo, safeNis || "-", safeName]] },
    });
  }

  // 4. Tulis Skor pada Sel Perpotongan
  const cellLetter = getColLetter(colIdx);
  await sheets.spreadsheets.values.update({
    spreadsheetId: cleanId,
    range: `${sheetRef}!${cellLetter}${targetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [[score]] },
  });

  return { synced: true };
};
