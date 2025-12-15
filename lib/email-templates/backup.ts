export const getBackupEmailTemplate = (
  success: boolean,
  filename?: string,
  errorMessage?: string
) => {
  const html = success
    ? `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10B981;">Backup Completato con Successo</h2>
        <p>Il backup del database è stato eseguito correttamente.</p>
        <p><strong>File:</strong> ${filename}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
        <p>Il file di backup è allegato a questa email.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #EF4444;">Errore durante il Backup</h2>
        <p>Si è verificato un errore durante l'esecuzione del backup del database.</p>
        <p><strong>Errore:</strong> ${errorMessage}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;

  return { html };
};
