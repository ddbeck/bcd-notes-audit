import { stringify } from "csv-stringify";
import { Readable } from "node:stream";
import winston from "winston";
import yargs from "yargs";
import { compatNotes, compatStatements } from "./index.mjs";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
  transports: [new winston.transports.Console({ level: "silly" })],
});

const argv = yargs(process.argv.slice(2))
  .command("statements", "Output TSV for support statements")
  .command("notes", "Output TSV for notes")
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
    default: false,
  })
  .demandCommand(1, 'You must specify either "statements" or "notes"')
  .help()
  .parseSync();

let dataStream;
let columns;

switch (argv._[0] as string) {
  case "statements":
    dataStream = Readable.from(compatStatements());
    columns = {
      referenceId: "Reference ID",
      description: "Description",
      mdn_url: "MDN URL",
      browser: "Browser ID",
      version_added: "version_added",
      version_removed: "version_removed",
      partial_implementation: "partial_implementation",
      notesCount: "Notes count",
    };
    break;
  case "notes":
    dataStream = Readable.from(compatNotes());
    columns = {
      referenceId: "Reference ID",
      compatKey: "Compat key",
      description: "Description",
      mdn_url: "MDN URL",
      browser: "Browser ID",
      version_added: "version_added",
      version_removed: "version_removed",
      partial_implementation: "partial_implementation",
      note: "Note text",
    };
    break;
  default:
    throw new Error("Unknown command");
}

function prettifyLink(value: string) {
  if (value.startsWith("https://")) {
    const url = new URL(value);
    return `=HYPERLINK("${value}", "${url.pathname}")`;
  }
  return value;
}

dataStream
  .pipe(
    stringify({
      columns,
      header: true,
      delimiter: "\t",
      cast: {
        boolean: (value) => (value ? "true" : "false"),
        string: prettifyLink,
      },
    }),
  )
  .pipe(process.stdout);
