import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseStandardTerms, type StandardTerms } from "./standardTerms";

/** templates/ lives at the repository root, one level above frontend/. */
const TEMPLATE_PATH = path.join(process.cwd(), "..", "templates", "Mutual-NDA.md");

export async function loadStandardTerms(): Promise<StandardTerms> {
  return parseStandardTerms(await readFile(TEMPLATE_PATH, "utf8"));
}
