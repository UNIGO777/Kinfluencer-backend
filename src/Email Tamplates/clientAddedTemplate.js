export const clientAddedTemplate = ({ name, companyName = '', industry = '', website = '', campaigns = 0, brand = 'Kingfluencer' }) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${brand} Client Added</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 2px 10px rgba(15,23,42,0.06);">
            <tr>
              <td style="padding:24px 24px 0 24px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#111827;">${brand}</div>
                <div style="margin-top:6px;font-size:13px;color:#6b7280;">Client profile created</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:14px;color:#374151;">Hi ${name}, you have been added as a Client.</div>
                <div style="margin-top:12px;font-size:13px;color:#6b7280;">Company: <strong style="color:#111827;">${companyName || '—'}</strong></div>
                <div style="margin-top:6px;font-size:13px;color:#6b7280;">Industry: <strong style="color:#111827;">${industry || '—'}</strong></div>
                <div style="margin-top:6px;font-size:13px;color:#6b7280;">Website: <a href="${website}" style="color:#3B83F6;text-decoration:none;">${website || '—'}</a></div>
                <div style="margin-top:6px;font-size:13px;color:#6b7280;">Campaigns: <strong style="color:#111827;">${campaigns}</strong></div>
              </td>
            </tr>
          </table>
          <div style="margin-top:12px;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} ${brand}</div>
        </td>
      </tr>
    </table>
  </body>
</html>`
