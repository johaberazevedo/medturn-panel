"use client";

import React, { useMemo, useState } from "react";

export default function SolicitarImplantacaoPage() {
  const [responsavel, setResponsavel] = useState("");
  const [cargo, setCargo] = useState("");
  const [emailInstitucional, setEmailInstitucional] = useState("");
  const [telefone, setTelefone] = useState("");
  const [hospital, setHospital] = useState("");
  const [cidade, setCidade] = useState("");
  const [qtdMedicos, setQtdMedicos] = useState("");
  const [mensagemExtra, setMensagemExtra] = useState("");
  const [copiado, setCopiado] = useState(false);

  // ✅ Troque aqui pelo email que vai receber as solicitações
  const supportEmail = "anestplus@outlook.com";

  const payload = useMemo(() => {
    const parts = [
      "Solicitação de implantação do MedTurn (Admin/Hospital)",
      "",
      `Responsável: ${responsavel || "-"}`,
      `Cargo: ${cargo || "-"}`,
      `E-mail institucional: ${emailInstitucional || "-"}`,
      `Telefone/WhatsApp (opcional): ${telefone || "-"}`,
      "",
      `Hospital/Instituição: ${hospital || "-"}`,
      `Cidade/UF: ${cidade || "-"}`,
      `Nº aproximado de médicos: ${qtdMedicos || "-"}`,
      "",
      "Observações:",
      mensagemExtra?.trim() ? mensagemExtra.trim() : "-",
      "",
      "Enviei esta solicitação pela página pública de implantação do MedTurn.",
    ];
    return parts.join("\n");
  }, [responsavel, cargo, emailInstitucional, telefone, hospital, cidade, qtdMedicos, mensagemExtra]);

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent("Solicitação de implantação — MedTurn");
    const body = encodeURIComponent(payload);
    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }, [payload, supportEmail]);

  async function copiarMensagem() {
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1200);
  }

  const podeEnviar =
    responsavel.trim() &&
    cargo.trim() &&
    emailInstitucional.trim() &&
    hospital.trim() &&
    cidade.trim();

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <header style={{ marginBottom: 16 }}>
          <div style={styles.badge}>MedTurn</div>
          <h1 style={styles.title}>Solicitar implantação</h1>
          <p style={styles.subtitle}>
            O MedTurn é uma plataforma SaaS para gestão de escalas médicas.
            Qualquer hospital ou instituição de saúde pode solicitar implantação.
            Preencha abaixo para gerar sua solicitação.
          </p>
        </header>

        <section style={styles.form}>
          <Field label="Nome do responsável" required>
            <input
              style={styles.input}
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Ex: Maria Souza"
              autoComplete="name"
            />
          </Field>

          <Field label="Cargo" required>
            <input
              style={styles.input}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Coordenação de Escalas / Direção"
              autoComplete="organization-title"
            />
          </Field>

          <Field label="E-mail institucional" required>
            <input
              style={styles.input}
              value={emailInstitucional}
              onChange={(e) => setEmailInstitucional(e.target.value)}
              placeholder="ex: coordenacao@hospital.com.br"
              autoComplete="email"
              inputMode="email"
            />
          </Field>

          <Field label="Telefone/WhatsApp (opcional)">
            <input
              style={styles.input}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Ex: (71) 9XXXX-XXXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>

          <Field label="Hospital/Instituição" required>
            <input
              style={styles.input}
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="Ex: Hospital Geral"
              autoComplete="organization"
            />
          </Field>

          <Field label="Cidade/UF" required>
            <input
              style={styles.input}
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex: Salvador/BA"
            />
          </Field>

          <Field label="Nº aproximado de médicos">
            <input
              style={styles.input}
              value={qtdMedicos}
              onChange={(e) => setQtdMedicos(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Ex: 35"
              inputMode="numeric"
            />
          </Field>

          <Field label="Observações (opcional)">
            <textarea
              style={{ ...styles.input, minHeight: 90, resize: "vertical" as const }}
              value={mensagemExtra}
              onChange={(e) => setMensagemExtra(e.target.value)}
              placeholder="Ex: Queremos iniciar pelo mês X, com regras de feriado e relatórios de pagamento."
            />
          </Field>

          <div style={styles.actions}>
            <a
              href={podeEnviar ? mailtoHref : undefined}
              onClick={(e) => {
                if (!podeEnviar) e.preventDefault();
              }}
              style={{
                ...styles.primaryBtn,
                opacity: podeEnviar ? 1 : 0.5,
                pointerEvents: podeEnviar ? "auto" : "none",
              }}
            >
              Enviar solicitação por e-mail
            </a>

            <button type="button" onClick={copiarMensagem} style={styles.secondaryBtn}>
              Copiar mensagem
            </button>
          </div>

          <div style={styles.helperRow}>
            {copiado ? (
              <span style={styles.ok}>Mensagem copiada ✅</span>
            ) : (
              <span style={styles.helper}>
                Dica: se preferir, copie a mensagem e envie por WhatsApp para seu time administrativo.
              </span>
            )}
          </div>

          <hr style={styles.hr} />

          <p style={styles.footer}>
            Após o envio, nossa equipe entra em contato para alinhar implantação, cadastro do hospital e criação dos primeiros administradores.
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.field}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{label}</span>
        {required ? <span style={styles.req}>Obrigatório</span> : null}
      </div>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "#f6f7fb",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "white",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: "rgba(0, 122, 255, 0.10)",
    color: "#0a66ff",
    width: "fit-content",
    marginBottom: 10,
  },
  title: { fontSize: 28, margin: 0, fontWeight: 800, letterSpacing: -0.2 },
  subtitle: { margin: "8px 0 0 0", color: "rgba(0,0,0,0.65)", lineHeight: 1.4 },
  form: { marginTop: 12 },
  field: { display: "block", marginTop: 14 },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, fontWeight: 700, marginBottom: 6 },
  req: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    background: "rgba(255, 149, 0, 0.12)",
    color: "#b45d00",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 14px",
    borderRadius: 12,
    background: "#0a66ff",
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  secondaryBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.08)",
    fontWeight: 800,
    cursor: "pointer",
  },
  helperRow: { marginTop: 10, minHeight: 22 },
  helper: { fontSize: 13, color: "rgba(0,0,0,0.60)" },
  ok: { fontSize: 13, fontWeight: 800, color: "rgba(0,0,0,0.75)" },
  hr: { margin: "18px 0", border: "none", borderTop: "1px solid rgba(0,0,0,0.08)" },
  footer: { margin: 0, fontSize: 13, color: "rgba(0,0,0,0.60)" },
};