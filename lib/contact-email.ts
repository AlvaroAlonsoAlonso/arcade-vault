export type ContactMessage = { name: string; email: string; msg: string };

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// Correo al equipo con el mensaje del formulario de contacto. Estilos inline (los clientes de
// correo ignoran <style>) con la paleta neón del tema.
export function buildContactEmail({ name, email, msg }: ContactMessage) {
  const subject = `[Arcade Vault] Nuevo mensaje de ${name}`;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMsg = escapeHtml(msg).replace(/\r?\n/g, "<br>");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#0a0a0f;font-family:'JetBrains Mono',Consolas,monospace;color:#e6e9ff;">
    <div style="max-width:560px;margin:0 auto;background:#0f0f18;border:1px solid rgba(0,245,255,0.18);">
      <div style="padding:16px 20px;border-bottom:1px solid rgba(0,245,255,0.18);font-size:13px;font-weight:700;letter-spacing:2px;color:#00f5ff;">
        ARCADE <span style="color:#ff006e;">VAULT</span> // NUEVO MENSAJE
      </div>
      <div style="padding:20px;font-size:14px;line-height:1.7;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#8a8fb5;">NOMBRE</p>
        <p style="margin:0 0 16px;">${safeName}</p>
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#8a8fb5;">CORREO ELECTRÓNICO</p>
        <p style="margin:0 0 16px;"><a href="mailto:${safeEmail}" style="color:#00f5ff;">${safeEmail}</a></p>
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#8a8fb5;">MENSAJE</p>
        <div style="padding:14px;background:#0a0a0f;border-left:3px solid #00ff88;">${safeMsg}</div>
      </div>
      <div style="padding:12px 20px;border-top:1px solid rgba(0,245,255,0.18);font-size:11px;color:#8a8fb5;">
        Responde a este correo para contestar directamente a ${safeName}.
      </div>
    </div>
  </body>
</html>`;

  const text = [
    "ARCADE VAULT // NUEVO MENSAJE",
    "",
    `Nombre: ${name}`,
    `Correo: ${email}`,
    "",
    "Mensaje:",
    msg,
    "",
    `Responde a este correo para contestar directamente a ${name}.`,
  ].join("\n");

  return { subject, html, text };
}
