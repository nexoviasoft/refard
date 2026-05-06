import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const dataDirectory = join(process.cwd(), "data");
const excelPath = join(dataDirectory, "submissions.xlsx");

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

export async function GET() {
  try {
    await ensureWorkbook();
    const fileBuffer = await readFile(excelPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="submissions.xlsx"',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
