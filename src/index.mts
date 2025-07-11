import { coreBrowserSet } from "compute-baseline";
import {
  Compat,
  Feature,
  SupportStatement,
} from "compute-baseline/browser-compat-data";
import assert from "node:assert";

const compat = new Compat();

interface Common {
  statementId: string;

  compatKey: string;
  description: string | undefined;
  mdn_url: string | undefined;

  browser: string;
  nameVariant: string | undefined;
  flagged: boolean;

  version_added: string | false;
  version_removed: string | false;
  partial_implementation: boolean;
}

export interface Note extends Common {
  note: string;
}

export interface Statement extends Common {
  notesCount: number;
}

export function* compatNotes(): Generator<Note> {
  for (const node of walker()) {
    const { compatKey, description, mdn_url, index, supportStatement } = node;
    const browser = supportStatement.browser?.id as string;
    const version_added = supportStatement.version_added as string | false;
    const version_removed =
      (supportStatement.version_removed as string | false) || false;
    const flagged = supportStatement.flags.length > 0;
    const { partial_implementation } = supportStatement;

    for (const note of notes(node.supportStatement.data.notes)) {
      yield {
        statementId: `${compatKey}.${browser}.${index}`,

        compatKey,
        description,
        mdn_url,

        browser,
        nameVariant: toNameVariant(supportStatement),
        flagged,

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
    const { compatKey, description, mdn_url, index, supportStatement } = node;
    const browser = supportStatement.browser?.id as string;
    const version_added = supportStatement.version_added as string | false;
    const version_removed =
      (supportStatement.version_removed as string | false) || false;
    const flagged = supportStatement.flags.length > 0;
    const { partial_implementation } = supportStatement;
    const notesCount = notes(supportStatement.data.notes).length;

    yield {
      statementId: `${compatKey}.${browser}.${index}`,

      compatKey,
      description,
      mdn_url,

      browser,
      nameVariant: toNameVariant(supportStatement),
      flagged,

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

    // Include everything but webextenions
    if (compatKey.startsWith("webextensions.")) {
      continue;
    }

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

function toNameVariant(statement: SupportStatement) {
  const { prefix, alternative_name } = statement.data;
  if (!prefix && !alternative_name) {
    return undefined;
  }

  if (alternative_name) {
    return alternative_name;
  }

  assert(statement.feature);
  const leaf = statement.feature.id.split("/").at(-1);
  assert(leaf);
  return `${prefix}${leaf}`;
}
