'use client';

import { useMemo, useState } from 'react';

const defaults = {
  name: 'Clube Principal',
  shortName: 'Clube Principal',
  slogan: 'Juntos somos mais fortes',
  primary: '#008C45',
  secondary: '#005B2A',
  accent: '#D7E83F',
  background: '#07110D',
  surface: '#102019',
};

export default function Home() {
  const [config, setConfig] = useState(defaults);
  const set = (key: keyof typeof defaults, value: string) => setConfig((current) => ({ ...current, [key]: value }));
  const gradient = useMemo(() => `linear-gradient(135deg, ${config.secondary}, ${config.primary})`, [config.primary, config.secondary]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">⚽</div><div><strong>Football Club SaaS</strong><span>Backoffice</span></div></div>
        <div className="nav"><div className="active">🎨 Aparência da app</div><div>🏟️ Clube</div><div>👥 Sócios</div><div>💶 Quotas e pagamentos</div><div>⚽ Jogos</div><div>📰 Conteúdos</div><div>🎟️ Bilhetes</div><div>⭐ Rewards</div><div>🔔 Notificações</div><div>⚙️ Configurações</div></div>
      </aside>

      <main className="main">
        <header className="header"><h1>Aparência da aplicação</h1><p>Configure o branding deste clube sem alterar o código da aplicação.</p></header>
        <div className="grid">
          <section className="panel">
            <h2>Identidade do clube</h2>
            <div className="formGrid">
              <Field label="Nome do clube" value={config.name} onChange={(v) => set('name', v)} />
              <Field label="Nome curto" value={config.shortName} onChange={(v) => set('shortName', v)} />
              <Field label="Slogan" value={config.slogan} onChange={(v) => set('slogan', v)} full />
            </div>
            <h2 style={{ marginTop: 30 }}>Cores</h2>
            <div className="colors">
              <ColorField label="Primária" value={config.primary} onChange={(v) => set('primary', v)} />
              <ColorField label="Secundária" value={config.secondary} onChange={(v) => set('secondary', v)} />
              <ColorField label="Destaque" value={config.accent} onChange={(v) => set('accent', v)} />
              <ColorField label="Fundo" value={config.background} onChange={(v) => set('background', v)} />
              <ColorField label="Superfície" value={config.surface} onChange={(v) => set('surface', v)} />
            </div>
            <button className="save">Guardar alterações</button>
          </section>

          <section className="preview">
            <div className="phone">
              <div className="phoneTop"><div><strong>Olá, Ricardo 👋</strong><div style={{ fontSize: 10, opacity: .55, marginTop: 4 }}>Sócio nº 12345</div></div><div className="phoneLogo" style={{ background: config.surface, color: config.primary }}>⚽</div></div>
              <div className="phoneContent">
                <div className="hero" style={{ background: gradient }}><small>PRÓXIMO JOGO</small><h3>{config.shortName}</h3><p>20 SET · 20:15 · Estádio Municipal</p></div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>A tua quota</div>
                <div className="previewCard" style={{ background: config.surface }}><strong>Quota 2026/27 · 25,00 €</strong><span>Vencida</span></div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 18 }}>Mensagem do clube</div>
                <div className="previewCard" style={{ background: config.surface }}><strong>{config.slogan}</strong><span>A tua experiência começa aqui.</span></div>
              </div>
              <div className="phoneNav"><span style={{ color: config.primary }}>⌂<br/>Início</span><span>⚽<br/>Jogos</span><span>♜<br/>Clube</span><span>▣<br/>Carteira</span><span>•••<br/>Mais</span></div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, full = false }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) {
  return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="color"><div className="swatch" style={{ background: value }} /><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #d5ded9', borderRadius: 7, padding: 5, fontSize: 11 }} /></div>;
}
