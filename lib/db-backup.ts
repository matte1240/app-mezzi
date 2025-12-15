import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export async function performBackup() {
  try {
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    
    // Ensure backups directory exists
    const backupsDir = path.join(process.cwd(), "backups", "database");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const backupPath = path.join(backupsDir, filename);

    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Remove query parameters that pg_dump doesn't support
    const cleanUrl = databaseUrl.split('?')[0];

    // Use pg_dump with connection string (format: plain SQL)
    // --clean adds DROP commands before CREATE to allow clean restore
    // --if-exists prevents errors if objects don't exist during DROP
    const command = `pg_dump "${cleanUrl}" -F p -b -v --clean --if-exists -f "${backupPath}"`;

    console.log(`Starting backup: ${filename}`);
    const { stderr } = await execAsync(command);
    
    // pg_dump writes verbose output to stderr, so we check if it failed
    // If the file exists and has size > 0, we assume success mostly
    if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
        throw new Error(`Backup failed: File not created or empty. Stderr: ${stderr}`);
    }

    console.log(`Backup completed successfully: ${filename}`);
    return { success: true, filename, path: backupPath };

  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  }
}
