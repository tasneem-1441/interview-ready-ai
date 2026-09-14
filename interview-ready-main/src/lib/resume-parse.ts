/**
 * Real client-side resume text extraction.
 * PDF -> pdfjs-dist, DOCX -> mammoth, TXT/MD -> plain read.
 * Runs only in the browser (dynamic imports).
 */

export class ResumeParseError extends Error {}

const MAX_BYTES = 8 * 1024 * 1024;

export function isSupportedResume(file: File) {
  return /\.(pdf|docx|txt|md)$/i.test(file.name);
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    out += `${content.items.map((i) => ("str" in i ? i.str : "")).join(" ")}\n`;
  }
  return out;
}

type MammothLike = {
  extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

async function extractDocx(file: File): Promise<string> {
  const mod = (await import("mammoth/mammoth.browser.js")) as unknown as {
    default?: MammothLike;
  } & MammothLike;
  const api: MammothLike = mod.default ?? mod;
  const result = await api.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

export async function extractResumeText(file: File): Promise<string> {
  if (!isSupportedResume(file)) {
    throw new ResumeParseError("Unsupported file type. Upload a PDF, DOCX, TXT or MD file.");
  }
  if (file.size > MAX_BYTES) {
    throw new ResumeParseError("That file is larger than 8 MB. Please upload a smaller resume.");
  }

  let text = "";
  try {
    if (/\.pdf$/i.test(file.name)) text = await extractPdf(file);
    else if (/\.docx$/i.test(file.name)) text = await extractDocx(file);
    else text = await file.text();
  } catch {
    throw new ResumeParseError(
      "We couldn't read that file. Try re-saving it, or paste your resume text instead.",
    );
  }

  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 120) {
    throw new ResumeParseError(
      "We found almost no readable text — this looks like a scanned image. Paste your resume text instead.",
    );
  }
  return cleaned;
}
