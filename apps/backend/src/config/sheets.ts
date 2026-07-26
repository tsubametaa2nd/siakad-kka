// Fitur: klien Google Sheets
import { google } from "googleapis";
import { env } from "./env";

const auth = new google.auth.JWT({
  email: env.GOOGLE_SA_EMAIL,
  key: env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });
