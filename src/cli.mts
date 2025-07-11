import { stringify } from "csv-stringify";
import { Readable } from "node:stream";
import winston from "winston";
import yargs from "yargs";
import { compatNotes, compatStatements, Note, Statement } from "./index.mjs";
import { stats } from "./stats.mjs";

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
  .command("stats", "Output general stats")
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

let columns:
  | { [Property in keyof Note]: string }
  | {
      [Property in keyof Statement]: string;
    };

const commonColumns: { [Property in keyof Note & keyof Statement]: string } = {
  statementId: "Statement ID",

  compatKey: "Compat key",
  description: "Description",
  mdn_url: "MDN URL",

  browser: "Browser ID",
  nameVariant: "Alt/prefix name",
  flagged: "Has flags",

  version_added: "version_added",
  version_removed: "version_removed",
  partial_implementation: "partial_implementation",
};

switch (argv._[0] as string) {
  case "statements":
    dataStream = Readable.from(compatStatements());
    columns = {
      ...commonColumns,
      notesCount: "Notes count",
    };
    break;
  case "notes":
    dataStream = Readable.from(compatNotes());
    columns = {
      ...commonColumns,
      note: "Note text",
    };
    break;
  case "stats":
    console.log(stats());
    process.exit(0);
  // eslint-disable-next-line no-fallthrough
  default:
    throw new Error("Unknown command");
}

dataStream
  .pipe(
    stringify({
      columns,
      header: true,
      delimiter: "\t",
      cast: {
        boolean: (value) => (value ? "true" : "false"),
        string: function prettifyLink(value: string) {
          if (value.startsWith("https://")) {
            const url = new URL(value);
            return `=HYPERLINK("${value}", "${url.pathname}")`;
          }
          return value;
        },
      },
    }),
  )
  .pipe(process.stdout);
