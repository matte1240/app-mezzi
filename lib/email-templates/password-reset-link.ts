export const getPasswordResetLinkEmailTemplate = (
  username: string,
  resetUrl: string,
  validityDuration: string = "1 ora"
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
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
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
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2);
              transition: all 0.3s ease;
            }
            .button:hover {
              box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4), 0 10px 10px -5px rgba(37, 99, 235, 0.3);
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
              color: #2563eb;
              word-break: break-all;
              text-decoration: none;
            }
            .info-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .info-list {
              margin: 0;
              padding-left: 20px;
              color: #78350f;
              font-size: 14px;
            }
            .info-list li {
              margin: 8px 0;
            }
            .security-note {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 16px;
              margin-top: 24px;
              border-left: 4px solid #64748b;
            }
            .security-note-title {
              font-weight: 600;
              color: #334155;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .security-note-text {
              color: #475569;
              font-size: 13px;
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h1>Reimposta Password</h1>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>
              
              <p class="message">
                Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Time Tracker. 
                Nessun problema, succede a tutti!
              </p>

              <!-- CTA Box -->
              <div class="cta-box">
                <div class="cta-text">Clicca sul pulsante qui sotto per creare una nuova password:</div>
                <a href="${resetUrl}" class="button">
                  Reimposta la mia password
                </a>
                <div class="link-fallback">
                  Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                  <a href="${resetUrl}">${resetUrl}</a>
                </div>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <div class="info-box-title">⏰ Informazioni importanti</div>
                <ul class="info-list">
                  <li>Questo link è <strong>valido per ${validityDuration}</strong></li>
                  <li>Può essere utilizzato <strong>una sola volta</strong></li>
                  <li>Dopo il reset, dovrai effettuare il login con la nuova password</li>
                </ul>
              </div>

              <!-- Security Note -->
              <div class="security-note">
                <div class="security-note-title">🛡️ Non hai richiesto questo reset?</div>
                <div class="security-note-text">
                  Se non sei stato tu a richiedere la reimpostazione della password, ignora questa email 
                  e contatta immediatamente l'amministratore. Il tuo account rimane sicuro.
                </div>
              </div>
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
Reset Password

Ciao ${username},

Hai richiesto di reimpostare la password del tuo account Time Tracker.

Clicca sul link qui sotto per reimpostare la password:
${resetUrl}

⚠️ IMPORTANTE:
- Questo link è valido per ${validityDuration}
- Dopo aver reimpostato la password, il link non sarà più utilizzabile
- Se non hai richiesto questo reset, ignora questa email

🛡️ Sicurezza:
Se non hai richiesto questo reset, contatta immediatamente l'amministratore.

---
Questo è un messaggio automatico, per favore non rispondere a questa email.
© ${new Date().getFullYear()} Time Tracker. Tutti i diritti riservati.
    `;

  return { html, text };
};
