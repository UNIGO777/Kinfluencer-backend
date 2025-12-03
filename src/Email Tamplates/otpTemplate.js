export const otpTemplate = ({ code, minutes = 10, brand = 'Kingfluencer' }) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${brand} Login Code</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f7f8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 2px 10px rgba(15,23,42,0.06);">
            <tr>
              <td style="padding:24px 24px 0 24px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#111827;">${brand}</div>
                <div style="margin-top:6px;font-size:13px;color:#6b7280;">Secure login code</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 8px 24px;text-align:center;">
                <div style="font-size:14px;color:#374151;">Use the code below to complete your sign in.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 24px 24px;text-align:center;">
                <div style="display:inline-block;padding:18px 24px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;font-size:28px;letter-spacing:4px;font-weight:800;color:#111827;">${code}</div>
                <div style="margin-top:12px;font-size:12px;color:#6b7280;">This code expires in ${minutes} minutes.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;">
                <div style="height:1px;background:#e5e7eb;width:100%;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;text-align:center;">
                <div style="font-size:12px;color:#9ca3af;">If you didn’t request this code, you can ignore this email.</div>
              </td>
            </tr>
          </table>
          <div style="margin-top:12px;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} ${brand}</div>
        </td>
      </tr>
    </table>
  </body>
</html>`
