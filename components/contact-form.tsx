"use client";

import { useActionState, useState, type FormEvent } from "react";
import { sendContact, type ContactField, type ContactState } from "@/app/acerca/actions";

const EMPTY = { name: "", email: "", msg: "" };
const INITIAL: ContactState = { status: "idle" };

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [shake, setShake] = useState(false);
  // Resultado que el usuario ya cerró (REINTENTAR / ENVIAR OTRO MENSAJE): vuelve a verse el formulario
  const [dismissed, setDismissed] = useState<ContactState | null>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const [state, formAction, pending] = useActionState(async (prev: ContactState, formData: FormData) => {
    const next = await sendContact(prev, formData);
    if (next.status === "invalid") triggerShake();
    return next;
  }, INITIAL);

  // Validación previa de vacíos, como el prototipo: tiembla sin llamar a la Server Action
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault();
      triggerShake();
    }
  };

  const visible = state === dismissed ? INITIAL : state;
  const errors = visible.status === "invalid" ? visible.errors : {};

  const field = (key: ContactField) => ({
    id: "contact-" + key,
    name: key,
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? "contact-" + key + "-error" : undefined,
  });

  const fieldError = (key: ContactField) =>
    errors[key] && <div id={"contact-" + key + "-error"} className="field-error pixel">{errors[key]}</div>;

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} action={formAction} onSubmit={onSubmit}>
      {visible.status === "sent" ? (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">&gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {visible.name.toUpperCase()}.<span className="caret">_</span></div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={() => { setForm(EMPTY); setDismissed(state); }}>ENVIAR OTRO MENSAJE</button>
            </div>
          </div>
        </div>
      ) : visible.status === "error" ? (
        <div className="terminal-success terminal-error" role="alert">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line err">[ERR] Conexión con servidor de correo fallida.</div>
            <div className="line err">[ERR] Paquete no transmitido.</div>
            <div className="line failure">&gt; NO SE PUDO ENVIAR EL MENSAJE. INTÉNTALO DE NUEVO.<span className="caret">_</span></div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={() => setDismissed(state)}>REINTENTAR</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Honeypot: invisible para personas, los bots lo rellenan */}
          <div aria-hidden="true" style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="contact-website">WEB</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <div className={"field" + (errors.name ? " invalid" : "")}>
            <label htmlFor="contact-name">NOMBRE</label>
            <input {...field("name")} placeholder="px_kai" />
            {fieldError("name")}
          </div>
          <div className={"field" + (errors.email ? " invalid" : "")}>
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input {...field("email")} type="email" placeholder="jugador@vault.gg" />
            {fieldError("email")}
          </div>
          <div className={"field" + (errors.msg ? " invalid" : "")}>
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea {...field("msg")} rows={5} placeholder="Cuéntanos qué tienes en mente…"></textarea>
            {fieldError("msg")}
          </div>
          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}
