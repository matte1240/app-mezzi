export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { performBackup } = await import("@/lib/db-backup");
    const { sendBackupEmail } = await import("@/lib/email");
    const cron = await import("node-cron");

    // Schedule backup every day at 2:00 AM (default) or use env var
    const schedule = process.env.BACKUP_CRON_SCHEDULE || "0 2 * * *";

    cron.schedule(schedule, async () => {
      console.log("Running scheduled database backup...");
      const recipient = process.env.BACKUP_EMAIL_RECIPIENT || process.env.EMAIL_USER;

      try {
        const result = await performBackup();

        if (recipient) {
          await sendBackupEmail(recipient, true, result.filename, result.path);
        }
      } catch (error) {
        console.error("Scheduled backup failed:", error);

        if (recipient) {
          await sendBackupEmail(
            recipient,
            false,
            undefined,
            undefined,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    });

    console.log(`Backup scheduler initialized (${schedule})`);
  }
}
