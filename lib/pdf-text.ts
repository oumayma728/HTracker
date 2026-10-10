/**
 * PDF text extraction for the Journey feature. Runs on the server only.
 * Takes an uploaded File, checks it, and returns plain text (or a user-facing error).
 */
import "server-only"; // keep PDF parsing out of the browser bundle
import { extractText, getDocumentProxy } from "unpdf"; // serverless-friendly build of PDF.js

export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB upload cap
const MAX_PDF_TEXT_CHARS = 50_000; // stop collecting text after this; Claude only gets the first 15k anyway
const MIN_PDF_TEXT_CHARS = 200; // below this the PDF is probably scanned images or empty

export type PdfTextResult = { ok: true; text: string } | { ok: false; error: string }; // success or UI-safe error

/** Validate an uploaded PDF and pull its text out. Never throws. */
export async function extractPdfText(file: unknown): Promise<PdfTextResult> {
  if (!(file instanceof File) || file.size === 0) { // nothing was uploaded
    return { ok: false, error: "Please choose a PDF file." }; // ask for a file
  }
  if (file.size > MAX_PDF_BYTES) { // over the size cap
    return { ok: false, error: "That PDF is larger than 10MB. Please upload a smaller file or paste the text instead." }; // clear limit
  }

  const bytes = new Uint8Array(await file.arrayBuffer()); // read the upload into memory
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // file starts with "%PDF"
  if (!isPdf) return { ok: false, error: "That file isn't a PDF." }; // don't trust the file name or MIME type

  try {
    const pdf = await getDocumentProxy(bytes); // parse the PDF structure
    const { text } = await extractText(pdf, { mergePages: true }); // all pages as one string
    const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_PDF_TEXT_CHARS); // tidy spacing, cap length

    if (cleaned.length < MIN_PDF_TEXT_CHARS) { // almost no selectable text
      return {
        ok: false, // treat as failure
        error: "We couldn't read enough text from that PDF (it may be a scanned image). Please paste the text instead.", // tell them what to do
      };
    }
    return { ok: true, text: cleaned }; // good to send to Claude
  } catch (error) {
    console.error("[journey] PDF parse failed:", error); // developer log
    return { ok: false, error: "That PDF couldn't be read. It may be damaged or password-protected. Try pasting the text instead." }; // friendly fallback
  }
}
