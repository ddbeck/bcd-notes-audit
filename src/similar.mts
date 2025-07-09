import { distance } from "fastest-levenshtein";
import { compatNotes } from "./index.mjs";

const threshold = 5;

function uniqueNotesPerBrowser(browser: string): string[] {
  return [
    ...new Set(
      [...compatNotes()]
        .filter((note) => note.browser === browser)
        .map((n) => n.note),
    ),
  ];
}

const uniques = uniqueNotesPerBrowser("safari");

for (const noteText of uniques) {
  const sufficientlySimilar = [];

  for (const n2 of uniques) {
    if (n2 === noteText) {
      continue;
    }
    const d = distance(noteText, n2);
    if (d < threshold) {
      sufficientlySimilar.push([d, n2]);
    }
  }

  if (sufficientlySimilar.length) {
    console.log(noteText);
    for (const [distance, text] of sufficientlySimilar) {
      console.log(`\t[${distance}] ${text}`);
    }
  }
}
