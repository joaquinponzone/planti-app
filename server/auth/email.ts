import "server-only"

import { Resend } from "resend"

export type AuthEmailKind =
  /** Confirmar el email después de registrarse. */
  | "verify_email"
  /** Recuperar la contraseña. */
  | "reset_password"
  /**
   * Alguien intentó registrarse con un email que ya tiene cuenta. El
   * registro responde lo mismo que siempre (para no revelar qué emails
   * existen) y el aviso llega sólo al dueño del buzón, con un link de reset.
   */
  | "already_registered"

/**
 * La base de los links de los emails. En un deploy de preview tiene que ser
 * la URL del branch: el token vive en la base de preview, y un link al
 * dominio de producción llevaría a una base donde ese token no existe.
 * `VERCEL_BRANCH_URL` es estable para el branch (no cambia en cada push).
 */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "")
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return "http://localhost:3000"
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
  return value.replace(/[&<>"']/g, (c) => entities[c])
}

const COPY: Record<AuthEmailKind, { path: string; subject: string; heading: string; body: string; cta: string; expiry: string }> = {
  verify_email: {
    path: "/verify-email",
    subject: "Confirmá tu email en Planti",
    // 🪴 es el mismo dibujo que el favicon. El espacio antes es irrompible
    // ( ): si el título no entra en una línea, el emoji baja junto con
    // "Planti" en vez de quedar solo en el renglón de abajo.
    heading: "Te damos la bienvenida a Planti 🪴",
    body: "Confirmá tu email para empezar a cuidar tus plantas.",
    cta: "Confirmar mi email",
    expiry: "El enlace vence en 24 horas.",
  },
  reset_password: {
    path: "/reset-password",
    subject: "Recuperá tu contraseña de Planti",
    heading: "Recuperá tu contraseña",
    body: "Alguien pidió cambiar la contraseña de tu cuenta de Planti. Si fuiste vos, elegí una nueva:",
    cta: "Elegir una contraseña nueva",
    expiry: "El enlace vence en 30 minutos. Si no lo pediste, ignorá este email.",
  },
  already_registered: {
    path: "/reset-password",
    subject: "Ya tenés una cuenta en Planti",
    heading: "Ya tenés una cuenta",
    body: "Alguien intentó registrarse en Planti con este email, pero ya tiene una cuenta. Si fuiste vos y no te acordás la contraseña, podés elegir una nueva:",
    cta: "Elegir una contraseña nueva",
    expiry: "El enlace vence en 30 minutos. Si no fuiste vos, ignorá este email.",
  },
}

/**
 * Los colores de `app/globals.css`, en hex: los clientes de correo no
 * entienden las variables CSS ni `hsl()` en todos lados.
 */
const COLORS = {
  background: "#EDF7ED", // --background
  primary: "#BCE1BC", // --primary (los botones)
  ink: "#0A0A0A", // --foreground
  muted: "#737373", // --muted-foreground
}

const FONT = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif"

/*
 * Notas de compatibilidad, para quien toque el HTML:
 * - Tablas y estilos inline: es lo único que Gmail y Outlook respetan igual.
 * - La sombra neo-brutalista de la app (`box-shadow: 4px 4px 0 #000`) no
 *   existe en Gmail: la descarta. Se imita con los bordes derecho e inferior
 *   más gruesos que los otros dos.
 * - El preheader es el texto que el cliente muestra al lado del asunto en la
 *   bandeja de entrada. Va oculto en el cuerpo.
 */
export function buildAuthEmail(kind: AuthEmailKind, token: string) {
  const copy = COPY[kind]
  const url = `${appUrl()}${copy.path}?token=${encodeURIComponent(token)}`
  const e = escapeHtml
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Language" content="es">
<title>${e(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.background}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(copy.body)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.background}">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px">
      <tr><td lang="es" style="padding:0 0 20px;font-family:${FONT};color:${COLORS.ink}">
        <div style="font-size:36px;line-height:1;font-weight:900;letter-spacing:-1px">Planti</div>
        <div style="margin-top:6px;font-size:16px;font-weight:500;color:${COLORS.muted}">¡Mantené vivas a tus plantas!</div>
      </td></tr>
      <tr><td lang="es" style="background:#ffffff;border:4px solid ${COLORS.ink};border-right-width:8px;border-bottom-width:8px;padding:28px 24px;font-family:${FONT};color:${COLORS.ink}">
        <h1 style="margin:0 0 16px;padding:0 0 8px;border-bottom:4px solid ${COLORS.ink};font-size:26px;line-height:1.25;font-weight:700">${e(copy.heading)}</h1>
        <p style="margin:0 0 28px;font-size:17px;line-height:1.5">${e(copy.body)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background:${COLORS.primary};border:3px solid ${COLORS.ink};border-right-width:6px;border-bottom-width:6px">
            <a href="${e(url)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:18px;font-weight:700;color:${COLORS.ink};text-decoration:none">${e(copy.cta)}</a>
          </td>
        </tr></table>
        <p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:${COLORS.muted}">${e(copy.expiry)}</p>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${COLORS.muted}">Si el botón no funciona, copiá este enlace en el navegador:<br>
          <a href="${e(url)}" style="color:${COLORS.ink};word-break:break-all">${e(url)}</a></p>
      </td></tr>
      <tr><td lang="es" style="padding:20px 4px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${COLORS.muted}">
        Recibiste este email porque alguien usó esta dirección en Planti.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
  const text = `${copy.heading}\n\n${copy.body}\n\n${copy.cta}: ${url}\n\n${copy.expiry}\n\n--\nPlanti · Recibiste este email porque alguien usó esta dirección en Planti.`
  return { subject: copy.subject, html, text, url }
}

let resend: Resend | null = null

/**
 * El remitente. `RESEND_FROM_DOMAIN` tiene que estar verificado en Resend.
 *
 * Sin dominio cae en `onboarding@resend.dev`, la dirección de prueba de
 * Resend, que sólo entrega a la dirección dueña de la cuenta: sirve para
 * probar en local con una clave real, pero en Vercel los usuarios no
 * recibirían nada. Por eso allá es obligatorio.
 */
export function fromAddress(): string {
  const raw = process.env.RESEND_FROM_DOMAIN?.trim()
  if (!raw) {
    if (process.env.VERCEL) throw new Error("Falta RESEND_FROM_DOMAIN.")
    return "Planti <onboarding@resend.dev>"
  }

  // Sólo el dominio, sin "noreply@" ni "https://". Se valida acá porque, si
  // no, el error llega desde Resend ("Invalid `from` field") sin decir qué
  // valor tenía la variable. Pasó en el primer deploy, con "noreply@planti.casa".
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(raw)) {
    throw new Error(`RESEND_FROM_DOMAIN tiene que ser sólo el dominio, como "planti.casa". Tiene: ${JSON.stringify(raw)}`)
  }
  return `Planti <noreply@${raw}>`
}

/**
 * Manda el email. En local, sin `RESEND_API_KEY`, imprime el link en la
 * consola de `next dev` en vez de mandarlo: se puede probar todo el flujo sin
 * configurar nada. En Vercel no hay atajo: sin la clave, falla.
 */
export async function sendAuthEmail(to: string, kind: AuthEmailKind, token: string): Promise<void> {
  const email = buildAuthEmail(kind, token)
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    if (process.env.VERCEL) throw new Error("Falta RESEND_API_KEY.")
    console.log(`\n📧 [email de desarrollo] ${kind} → ${to}\n   ${email.url}\n`)
    return
  }

  resend ??= new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
  if (error) throw new Error(`Resend rechazó el email: ${error.message}`)
}
