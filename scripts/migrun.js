import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_DIR = path.resolve(__dirname, "../backend/DbMigration");

function getNextVersionNumber() {
  if (!fs.existsSync(MIGRATION_DIR)) {
    fs.mkdirSync(MIGRATION_DIR, { recursive: true });
  }

  const files = fs.readdirSync(MIGRATION_DIR);
  let maxVersion = 0;

  for (const file of files) {
    const match = file.match(/^V(\d+)__/i);
    if (match) {
      const ver = parseInt(match[1], 10);
      if (ver > maxVersion) {
        maxVersion = ver;
      }
    }
  }

  const nextNum = maxVersion + 1;
  const formattedVersion = `V${String(nextNum).padStart(3, "0")}`;
  return { nextNum, formattedVersion };
}

function promptQuestion(rl, questionText, defaultValue) {
  return new Promise((resolve) => {
    const promptLabel = defaultValue ? `${questionText} (default: ${defaultValue}): ` : `${questionText}: `;
    rl.question(promptLabel, (answer) => {
      const result = answer.trim() || defaultValue || "";
      resolve(result);
    });
  });
}

async function runInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=========================================================================");
  console.log("       gtax Enterprise - Dynamic Migration Generator (migrun)");
  console.log("=========================================================================");

  const { formattedVersion } = getNextVersionNumber();
  console.log(`Target Migration Directory: ${MIGRATION_DIR}`);
  console.log(`Next Migration Version:     ${formattedVersion}\n`);

  console.log("Select Migration Action Type:");
  console.log("  [1] CREATE - Create a new database table");
  console.log("  [2] ALTER  - Alter an existing table (Add/Modify Column)\n");

  const actionChoice = await promptQuestion(rl, "Enter choice [1 or 2]", "2");
  const isCreate = actionChoice === "1" || actionChoice.toLowerCase().startsWith("c");

  if (isCreate) {
    const tableName = await promptQuestion(rl, "Enter Table Name (e.g. tbl_custom_fee)", "tbl_custom_fees");
    const description = await promptQuestion(rl, "Enter Brief Description", `Create ${tableName} table`);

    const sqlContent = `-- ${formattedVersion}: ${description}
-- Enforces mandatory BaseFrame 7 audit columns

CREATE TABLE IF NOT EXISTS ${tableName} (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT '1',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT '1',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
`;

    const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const fileName = `${formattedVersion}__create_${sanitizedTable}.sql`;
    const filePath = path.join(MIGRATION_DIR, fileName);

    fs.writeFileSync(filePath, sqlContent, "utf-8");
    console.log("\n=========================================================================");
    console.log(`SUCCESS: Migration file created successfully!`);
    console.log(`File: ${filePath}`);
    console.log("=========================================================================\n");
  } else {
    // ALTER TABLE
    const tableName = await promptQuestion(rl, "Enter Table Name to Alter", "tbl_malpot_rates");
    const alterAction = await promptQuestion(rl, "Select Alter Sub-type (1=ADD COLUMN, 2=DROP COLUMN, 3=MODIFY COLUMN)", "1");

    if (alterAction === "1" || alterAction.toLowerCase().startsWith("a")) {
      const columnName = await promptQuestion(rl, "Enter Column Name to Add", "is_parent");
      const dataType = await promptQuestion(rl, "Enter Data Type (BOOLEAN, VARCHAR(255), NUMERIC(14,2), INT)", "BOOLEAN");
      const defaultValue = await promptQuestion(rl, "Enter Default Value (e.g. FALSE, NULL, 0.00)", "FALSE");
      const notNullChoice = await promptQuestion(rl, "Require NOT NULL? (y/n)", "y");

      const isNotNull = notNullChoice.toLowerCase().startsWith("y");
      const defaultClause = defaultValue ? ` DEFAULT ${defaultValue}` : "";
      const nullClause = isNotNull ? " NOT NULL" : "";

      const description = `Alter ${tableName} add column ${columnName}`;
      const sqlContent = `-- ${formattedVersion}: ${description}

ALTER TABLE IF EXISTS ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${dataType}${defaultClause}${nullClause};
`;

      const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const sanitizedColumn = columnName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const fileName = `${formattedVersion}__alter_${sanitizedTable}_add_${sanitizedColumn}.sql`;
      const filePath = path.join(MIGRATION_DIR, fileName);

      fs.writeFileSync(filePath, sqlContent, "utf-8");
      console.log("\n=========================================================================");
      console.log(`SUCCESS: Migration file created successfully!`);
      console.log(`File: ${filePath}`);
      console.log("=========================================================================\n");
    } else if (alterAction === "2" || alterAction.toLowerCase().startsWith("d")) {
      const columnName = await promptQuestion(rl, "Enter Column Name to Drop", "old_column");
      const description = `Alter ${tableName} drop column ${columnName}`;
      const sqlContent = `-- ${formattedVersion}: ${description}

ALTER TABLE IF EXISTS ${tableName} DROP COLUMN IF EXISTS ${columnName};
`;

      const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const sanitizedColumn = columnName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const fileName = `${formattedVersion}__alter_${sanitizedTable}_drop_${sanitizedColumn}.sql`;
      const filePath = path.join(MIGRATION_DIR, fileName);

      fs.writeFileSync(filePath, sqlContent, "utf-8");
      console.log("\n=========================================================================");
      console.log(`SUCCESS: Migration file created successfully!`);
      console.log(`File: ${filePath}`);
      console.log("=========================================================================\n");
    } else {
      const columnName = await promptQuestion(rl, "Enter Column Name to Modify", "code");
      const newDataType = await promptQuestion(rl, "Enter New Data Type (e.g. VARCHAR(128))", "VARCHAR(128)");
      const description = `Alter ${tableName} modify column ${columnName}`;

      const sqlContent = `-- ${formattedVersion}: ${description}

ALTER TABLE IF EXISTS ${tableName} ALTER COLUMN ${columnName} TYPE ${newDataType};
`;

      const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const sanitizedColumn = columnName.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
      const fileName = `${formattedVersion}__alter_${sanitizedTable}_modify_${sanitizedColumn}.sql`;
      const filePath = path.join(MIGRATION_DIR, fileName);

      fs.writeFileSync(filePath, sqlContent, "utf-8");
      console.log("\n=========================================================================");
      console.log(`SUCCESS: Migration file created successfully!`);
      console.log(`File: ${filePath}`);
      console.log("=========================================================================\n");
    }
  }

  rl.close();
}

// Allow CLI parameter invocation as well as interactive:
// node scripts/migrun.js create tbl_name
// node scripts/migrun.js alter tbl_malpot_rates add is_parent BOOLEAN FALSE NOT NULL
const args = process.argv.slice(2);
if (args.length >= 3) {
  const mode = args[0].toLowerCase();
  const tableName = args[1];
  const { formattedVersion } = getNextVersionNumber();

  if (mode === "alter" && args[2].toLowerCase() === "add" && args[3]) {
    const columnName = args[3];
    const dataType = args[4] || "BOOLEAN";
    const defaultValue = args[5] || "FALSE";
    const notNullStr = (args[6] || "NOT_NULL").toUpperCase().includes("NOT") ? " NOT NULL" : "";

    const sqlContent = `-- ${formattedVersion}: Alter ${tableName} add column ${columnName}

ALTER TABLE IF EXISTS ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${dataType} DEFAULT ${defaultValue}${notNullStr};
`;
    const fileName = `${formattedVersion}__alter_${tableName}_add_${columnName}.sql`;
    const filePath = path.join(MIGRATION_DIR, fileName);
    fs.writeFileSync(filePath, sqlContent, "utf-8");
    console.log(`[migrun] Created migration: ${filePath}`);
  } else if (mode === "create") {
    const sqlContent = `-- ${formattedVersion}: Create ${tableName} table

CREATE TABLE IF NOT EXISTS ${tableName} (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT '1',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT '1',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
`;
    const fileName = `${formattedVersion}__create_${tableName}.sql`;
    const filePath = path.join(MIGRATION_DIR, fileName);
    fs.writeFileSync(filePath, sqlContent, "utf-8");
    console.log(`[migrun] Created migration: ${filePath}`);
  } else {
    runInteractive();
  }
} else {
  runInteractive();
}
