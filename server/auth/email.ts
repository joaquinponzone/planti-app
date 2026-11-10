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
    heading: "Te damos la bienvenida a Planti 🌱",
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

export function buildAuthEmail(kind: AuthEmailKind, token: string) {
  const copy = COPY[kind]
  const url = `${appUrl()}${copy.path}?token=${encodeURIComponent(token)}`
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:4px solid #000;padding:24px;box-shadow:6px 6px 0 #000">
    <h1 style="margin:0 0 16px;font-size:24px">${escapeHtml(copy.heading)}</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapeHtml(copy.body)}</p>
    <a href="${escapeHtml(url)}" style="display:inline-block;background:#22c55e;color:#000;font-weight:bold;text-decoration:none;padding:12px 20px;border:3px solid #000">${escapeHtml(copy.cta)}</a>
    <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.5">${escapeHtml(copy.expiry)}</p>
    <p style="margin:12px 0 0;font-size:12px;color:#777;word-break:break-all">${escapeHtml(url)}</p>
  </div>
</body></html>`
  const text = `${copy.heading}\n\n${copy.body}\n\n${url}\n\n${copy.expiry}`
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
function fromAddress(): string {
  const domain = process.env.RESEND_FROM_DOMAIN?.trim()
  if (domain) return `Planti <noreply@${domain}>`
  if (process.env.VERCEL) throw new Error("Falta RESEND_FROM_DOMAIN.")
  return "Planti <onboarding@resend.dev>"
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
