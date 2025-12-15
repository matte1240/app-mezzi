import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import fs from "fs";
import path from "path";
import { isAdmin } from "@/lib/utils/user-utils";
import prisma from "@/lib/prisma";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Check if system is in setup mode (no users)
    const userCount = await prisma.user.count();
    const isSetupMode = userCount === 0;

    // Require admin authentication unless in setup mode
    if (!isSetupMode) {
      const session = await getServerSession(authOptions);
      if (!session?.user || !isAdmin(session)) {
        return NextResponse.json(
          { error: "Unauthorized - Admin access required" },
          { status: 401 }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Create temp file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join(process.cwd(), "backups", `restore-${Date.now()}.sql`);
    
    // Ensure backups directory exists
    const backupsDir = path.dirname(tempPath);
    if (!fs.existsSync(backupsDir)) {
      await fs.promises.mkdir(backupsDir, { recursive: true });
    }

    await writeFile(tempPath, buffer);

    // Database connection details from env
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Parse connection string
    // postgresql://user:password@host:port/dbname
    const url = new URL(dbUrl);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port;
    const dbname = url.pathname.slice(1);

    // Construct psql command
    const env = { ...process.env, PGPASSWORD: password };
    const command = `psql -h ${host} -p ${port} -U ${user} -d ${dbname} -f "${tempPath}"`;

    console.log("Restoring database...");
    await execAsync(command, { env });

    // Clean up temp file
    await unlink(tempPath);

    return NextResponse.json(
      { success: true, message: "Database restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      {
        error: "Failed to restore database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
