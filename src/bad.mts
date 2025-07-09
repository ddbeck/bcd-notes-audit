import { compatNotes } from "./index.mjs";

const blocklist: (string | RegExp)[] = [/currently/i];

for (const n of compatNotes()) {
  for (const entry of blocklist) {
    if (new RegExp(entry).test(n.note)) {
      console.log(`${entry} :: ${n.compatKey} :: ${n.browser} :: ${n.note}`);
    }
  }
}
