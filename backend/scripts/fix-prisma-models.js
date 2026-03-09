const fs = require("fs");
const path = require("path");
const { pascalCase } = require("change-case");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

let schema = fs.readFileSync(schemaPath, "utf8");

const regex = /\b[a-z]+(_[a-z]+)+\b/g;

schema = schema.replace(regex, (match) => {
  if (
    match.includes("@@map") ||
    match.includes("@map") ||
    match.includes("map:")
  ) {
    return match;
  }

  const pascal = pascalCase(match);

  return pascal;
});

fs.writeFileSync(schemaPath, schema);

console.log("✅ Relation names converted to PascalCase");