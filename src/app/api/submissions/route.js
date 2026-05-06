import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const dataDirectory = join(process.cwd(), "data");
const excelPath = join(dataDirectory, "submissions.xlsx");
const isVercel = Boolean(process.env.VERCEL);

const ensureWorkbook = async () => {
  if (!existsSync(dataDirectory)) {
    await mkdir(dataDirectory, { recursive: true });
  }

  if (!existsSync(excelPath)) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(excelPath, buffer);
  }
};

const readRecords = async () => {
  await ensureWorkbook();
  const fileContent = await readFile(excelPath);
  const workbook = XLSX.read(fileContent, { type: "buffer" });
  const worksheet = workbook.Sheets["Submissions"];
  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(worksheet);
};

const saveRecords = async (records) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(records);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFile(excelPath, buffer);
};

const generateId = () => {
  return String(Math.floor(Math.random() * 9000000000) + 1000000000);
};

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const department = String(body?.department || "").trim();
    const institute = String(body?.institute || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim();
    const photoBase64 = String(body?.photoBase64 || "").trim();

    if (!name || !department || !institute || !phone || !email || !photoBase64) {
      return Response.json(
        { error: "name, department, institute, phone, email and photo are required" },
        { status: 400 },
      );
    }

    const id = generateId();

    let photoPath = "";

    // Extract base64 data and extension
    const matches = photoBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = "png";
    let base64Data = photoBase64;
    
    if (matches && matches.length === 3) {
      ext = matches[1];
      base64Data = matches[2];
    } else {
      // fallback if it's just raw base64
      base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    }

    // Convert jpeg to jpg for standard extension
    if (ext === "jpeg") ext = "jpg";

    if (!isVercel) {
      // Local/dev: save image to public/uploads so it can be served as static file.
      const uploadDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileName = `${id}.${ext}`;
      photoPath = `/uploads/${fileName}`;
      const fullPath = join(uploadDir, fileName);
      const buffer = Buffer.from(base64Data, "base64");
      await writeFile(fullPath, buffer);
    }

    const recordToStore = {
      id,
      name,
      department,
      institute,
      phone,
      email,
      photoUrl: photoPath,
      createdAt: new Date().toISOString(),
    };

    // Keep base64 only in API response (for immediate preview), not in Excel.
    // XLSX cells have a 32,767 char limit and base64 images exceed that.
    const responseRecord = {
      ...recordToStore,
      photoBase64,
    };

    if (!isVercel) {
      const records = await readRecords();
      records.push(recordToStore);
      await saveRecords(records);
    }

    // Send data to Google Sheets via Webhook
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbyQWX-Pxw8QJGODmAc-z_BBcnWHYElh_t2cZRFABENOdc4rGXTo0bnMVgGnuRmUiMQ2bA/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          // Google Apps Script doPost gets the raw text, we stringify the object
          body: JSON.stringify({
            id: recordToStore.id,
            name: recordToStore.name,
            department: recordToStore.department,
            institute: recordToStore.institute,
            phone: recordToStore.phone,
            email: recordToStore.email,
            createdAt: recordToStore.createdAt,
          }),
        }
      );
    } catch (sheetError) {
      console.error("Failed to save to Google Sheets:", sheetError);
      // Continue even if webhook fails.
    }

    return Response.json({ record: responseRecord }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
