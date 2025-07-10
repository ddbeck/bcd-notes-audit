import { coreBrowserSet } from "compute-baseline";
import { Compat, Feature } from "compute-baseline/browser-compat-data";

const compat = new Compat();

export interface Note {
  statementId: string;
  compatKey: string;
  description: string | undefined;
  mdn_url: string | undefined;
  browser: string;
  version_added: string | false;
  version_removed: string | false;
  partial_implementation: boolean;
  note: string;
}

export interface Statement {
  statementId: string;
  compatKey: string;
  description: string | undefined;
  mdn_url: string | undefined;
  browser: string;
  version_added: string | false;
  version_removed: string | false;
  partial_implementation: boolean;
  notesCount: number;
}

export function* compatNotes(): Generator<Note> {
  for (const node of walker()) {
    const { compatKey, description, mdn_url, index } = node;
    const browser = node.supportStatement.browser?.id as string;
    const version_added = node.supportStatement.version_added as string | false;
    const version_removed =
      (node.supportStatement.version_removed as string | false) || false;
    const { partial_implementation } = node.supportStatement;

    for (const note of notes(node.supportStatement.data.notes)) {
      yield {
        statementId: `${compatKey}.${browser}.${index}`,
        compatKey,
        description,
        mdn_url,
        browser,
        version_added,
        version_removed,
        partial_implementation,
        note,
      };
    }
  }
}

export function* compatStatements(): Generator<Statement> {
  for (const node of walker()) {
    const { compatKey, description, mdn_url, index } = node;
    const browser = node.supportStatement.browser?.id as string;
    const version_added = node.supportStatement.version_added as string | false;
    const version_removed =
      (node.supportStatement.version_removed as string | false) || false;
    const { partial_implementation } = node.supportStatement;
    const notesCount = notes(node.supportStatement.data.notes).length;

    yield {
      statementId: `${compatKey}.${browser}.${index}`,
      compatKey,
      description,
      mdn_url,
      browser,
      version_added,
      version_removed,
      partial_implementation,
      notesCount,
    };
  }
}

function* walker() {
  for (const feat of compat.walk()) {
    const { id: compatKey, mdn_url } = feat;
    const description = feat.data.__compat?.description;

    let index = 0;
    for (const supportStatement of allSupportStatements(feat)) {
      yield {
        compatKey,
        mdn_url,
        description,
        index,
        supportStatement,
      };
      index++;
    }
  }
}

const coreBrowsers = coreBrowserSet.map((browserId) =>
  compat.browser(browserId),
);

function* allSupportStatements(feature: Feature) {
  for (const browser of coreBrowsers) {
    let statements;
    try {
      statements = feature.supportStatements(browser);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("contains no support data for")) {
          continue;
        }
      }
      throw err;
    }

    for (const statement of statements) {
      yield statement;
    }
  }
}

function notes(note: string | string[] | undefined): string[] {
  if (!note) {
    return [];
  }
  if (typeof note === "string") {
    return [note];
  }
  return note;
}
