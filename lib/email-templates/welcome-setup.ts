export const getWelcomeSetupEmailTemplate = (
  username: string,
  setupUrl: string,
  email: string
) => {
  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #1e293b;
              background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header-icon {
              width: 64px;
              height: 64px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 16px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
              backdrop-filter: blur(10px);
            }
            .header h1 {
              color: white;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 16px;
            }
            .message {
              color: #475569;
              margin-bottom: 24px;
              font-size: 15px;
            }
            .welcome-box {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #86efac;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .welcome-box-title {
              color: #166534;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .welcome-box-text {
              color: #15803d;
              font-size: 14px;
              margin: 8px 0;
            }
            .cta-box {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 32px;
              text-align: center;
              margin: 32px 0;
            }
            .cta-text {
              color: #334155;
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2);
              transition: all 0.3s ease;
            }
            .button:hover {
              box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4), 0 10px 10px -5px rgba(16, 185, 129, 0.3);
              transform: translateY(-2px);
            }
            .link-fallback {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
            }
            .link-fallback a {
              color: #10b981;
              word-break: break-all;
              text-decoration: none;
            }
            .info-box {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .info-list {
              margin: 0;
              padding-left: 20px;
              color: #1e3a8a;
              font-size: 14px;
            }
            .info-list li {
              margin: 8px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              color: #64748b;
              font-size: 13px;
              margin: 8px 0;
            }
            .footer-brand {
              color: #334155;
              font-weight: 600;
              font-size: 14px;
              margin-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
              <div class="header-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h1>Benvenuto nel Team!</h1>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>
              
              <p class="message">
                Siamo entusiasti di darti il benvenuto su <strong>Time Tracker</strong>! 
                Il tuo account è stato creato con successo.
              </p>

              <!-- Welcome Box -->
              <div class="welcome-box">
                <div class="welcome-box-title">🎯 Iniziamo!</div>
                <div class="welcome-box-text">
                  Per completare la configurazione del tuo account, è necessario impostare una password personale.
                  Questo ti garantirà un accesso sicuro alla piattaforma.
                </div>
              </div>

              <!-- CTA Box -->
              <div class="cta-box">
                <div class="cta-text">Clicca sul pulsante qui sotto per impostare la tua password:</div>
                <a href="${setupUrl}" class="button">
                  Imposta la Mia Password
                </a>
                <div class="link-fallback">
                  Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                  <a href="${setupUrl}">${setupUrl}</a>
                </div>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <div class="info-box-title">📋 Informazioni Importanti</div>
                <ul class="info-list">
                  <li>Questo link è <strong>valido per 24 ore</strong></li>
                  <li>Scegli una password sicura (minimo 8 caratteri)</li>
                  <li>Dopo aver impostato la password, potrai accedere immediatamente</li>
                  <li>Usa la tua email (<strong>${email}</strong>) come username</li>
                </ul>
              </div>

              <p class="message">
                Se hai domande o hai bisogno di assistenza, non esitare a contattare l'amministratore.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-text">
                Questa è un'email automatica, ti preghiamo di non rispondere.
              </div>
              <div class="footer-brand">
                Time Tracker © ${new Date().getFullYear()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

  const text = `
Benvenuto su Time Tracker!

Ciao ${username}!

Siamo entusiasti di darti il benvenuto! Il tuo account è stato creato con successo.

🎯 INIZIAMO
Per completare la configurazione del tuo account, è necessario impostare una password personale.

Clicca sul link qui sotto per impostare la tua password:
${setupUrl}

📋 INFORMAZIONI IMPORTANTI:
- Questo link è valido per 24 ore
- Scegli una password sicura (minimo 8 caratteri)
- Dopo aver impostato la password, potrai accedere immediatamente
- Usa la tua email (${email}) come username

Se hai domande o hai bisogno di assistenza, non esitare a contattare l'amministratore.

---
Questa è un'email automatica, ti preghiamo di non rispondere.
Time Tracker © ${new Date().getFullYear()}
    `;

  return { html, text };
};
