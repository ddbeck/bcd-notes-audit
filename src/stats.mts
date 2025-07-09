import { compatNotes, compatStatements, Note } from "./index.mjs";

export function stats() {
  const statements = [...compatStatements()];
  const notes = [...compatNotes()];
  const osMentions = notes.filter(mentionsAnOS);
  const deviceMentions = notes.filter(mentionsDevice);

  return {
    supportStatements: {
      total: statements.length,
      partialImplementations: statements.filter((s) => s.partial_implementation)
        .length,
      partialImplementationsWithoutNotes: statements.filter(
        (s) => s.partial_implementation && s.notesCount < 1,
      ).length,
    },
    notes: {
      total: notes.length,
      unique: new Set(notes.map((n) => n.note)).size,
      osMentions: osMentions.length,
      uniqueOSMentions: new Set(osMentions.map((n) => n.note)).size,
      deviceMentions: deviceMentions.length,
      uniqueDeviceMentions: new Set(deviceMentions.map((n) => n.note)).size,
    },
  };
}

function mentionsAnOS(note: Note) {
  const oses = /windows|macos|linux|chromeos/i;
  return oses.test(note.note);
}

function mentionsDevice(note: Note) {
  const devices = /ipad|iphone/i;
  return devices.test(note.note);
}
