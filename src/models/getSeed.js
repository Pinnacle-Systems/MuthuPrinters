import fs from "fs";
import path from "path";

const dumpDirectory = path.resolve("./Dump20260411");
const outputDirectory = path.resolve("./src/models/seed-data");

const supportedEntities = {
  pages: {
    dumpFile: "muthuprinters_page.sql",
    columns: ["id", "name", "link", "type", "active", "pageGroupId"],
    outputFile: "pages.json",
    mapRow: (row) => ({
      ...row,
      active: Boolean(row.active),
    }),
    filterRow: () => true,
    cleanup: (row) => row,
  },
  pageGroups: {
    dumpFile: "muthuprinters_pagegroup.sql",
    columns: ["id", "type", "name", "active"],
    outputFile: "pagesGroup.json",
    mapRow: (row) => ({
      ...row,
      active: Boolean(row.active),
    }),
    filterRow: () => true,
    cleanup: (row) => row,
  },
  users: {
    dumpFile: "muthuprinters_user.sql",
    columns: [
      "id",
      "username",
      "email",
      "password",
      "roleId",
      "otp",
      "active",
      "employeeId",
    ],
    outputFile: "users.json",
    mapRow: (row) => ({
      username: row.username,
      email: row.email,
      password: row.password,
      active: Boolean(row.active),
      roleId: row.roleId,
      employeeId: row.employeeId,
    }),
    // Start with dependency-safe users only. We can widen this later as
    // roles and employees become part of the seed set.
    filterRow: (row) => row.roleId === null && row.employeeId === null,
    cleanup: (row) => ({
      username: row.username,
      email: row.email,
      password: row.password,
      active: row.active,
    }),
  },
};

function splitTuples(valuesText) {
  const tuples = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (const char of valuesText) {
    if (depth === 0 && !inString && (char === "," || /\s/.test(char))) {
      continue;
    }

    current += char;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue;
    }

    if (!inString && char === "(") {
      depth += 1;
      continue;
    }

    if (!inString && char === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(current.trim());
        current = "";
      }
      continue;
    }
  }

  return tuples;
}

function splitFields(tupleText) {
  const inner = tupleText.trim().replace(/^\(/, "").replace(/\)$/, "");
  const fields = [];
  let current = "";
  let inString = false;
  let escaped = false;

  for (const char of inner) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (char === "'") {
      current += char;
      inString = !inString;
      continue;
    }

    if (char === "," && !inString) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    fields.push(current.trim());
  }

  return fields;
}

function parseValue(value) {
  if (value === "NULL") {
    return null;
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return value;
}

function parseDumpRows(sqlText, columns) {
  const insertMatch = sqlText.match(/INSERT INTO `[^`]+` VALUES (.*);/s);
  if (!insertMatch) {
    throw new Error("Could not find INSERT INTO ... VALUES statement in dump.");
  }

  return splitTuples(insertMatch[1]).map((tupleText) => {
    const fields = splitFields(tupleText).map(parseValue);
    return Object.fromEntries(columns.map((column, index) => [column, fields[index]]));
  });
}

function writeSeedData(outputFile, data) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`);
}

function main() {
  const entity = process.argv[2];

  if (!entity || !supportedEntities[entity]) {
    const options = Object.keys(supportedEntities).join(", ");
    throw new Error(`Please provide a supported seed entity. Supported: ${options}`);
  }

  const config = supportedEntities[entity];
  const dumpFilePath = path.join(dumpDirectory, config.dumpFile);
  const outputFilePath = path.join(outputDirectory, config.outputFile);
  const dumpContents = fs.readFileSync(dumpFilePath, "utf8");

  const rows = parseDumpRows(dumpContents, config.columns)
    .map(config.mapRow)
    .filter(config.filterRow)
    .map(config.cleanup);

  writeSeedData(outputFilePath, rows);

  console.log(
    `Wrote ${rows.length} ${entity} record(s) to ${path.relative(process.cwd(), outputFilePath)}`,
  );
}

main();
