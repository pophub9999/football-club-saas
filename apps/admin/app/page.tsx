'use client';

import { useEffect, useMemo, useState } from 'react';

type Section = 'dashboard' | 'branding' | 'members' | 'dues';
type Dashboard = { members: number; activeMemberships: number; openDues: number; overdueDues: number; paidAmount: number; upcomingFixtures: number; publishedArticles: number };
type Member = { id: string; memberNumber: string; firstName: string; lastName: string; email?: string | null; phone?: string | null; memberships: { planCode: string; status: string; validUntil?: string | null }[] };
type Due = { id: string; memberId: string; reference: string; description?: string | null; amount: number | string; paidAmount: number | string; currency: string; dueDate: string; status: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const defaults = { name: 'Clube Principal', shortName: 'Clube Principal', slogan: 'Juntos somos mais fortes', primary: '#008C45', secondary: '#005B2A', accent: '#D7E83F', background: '#07110D', surface: '#102019' };

export default function Home() {
  const [section, setSection] = useState<Section>('dashboard');
  const [token, setToken] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(defaults);

  useEffect(() => setToken(localStorage.getItem('football_admin_token') ?? ''), []);
  useEffect(() => { if (token) localStorage.setItem('football_admin_token', token); }, [token]);

  async function load(path: string) {
    setError('');
    if (!token) { setError('Introduz um JWT de administrador para ligar o backoffice à API.'); return null; }
    const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
    return response.json();
  }

  async function openSection(next: Section) {
    setSection(next);
    try {
      if (next === 'dashboard') setDashboard(await load('/admin/dashboard'));
      if (next === 'members') setMembers(await load('/admin/members') ?? []);
      if (next === 'dues') setDues(await load('/admin/dues') ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao comunicar com a API.'); }
  }

  useEffect(() => { if (token) openSection('dashboard'); }, [token]);

  const title = ({ dashboard: 'Dashboard', branding: 'Aparência da aplicação', members: 'Sócios', dues: 'Quotas e pagamentos' } as const)[section];

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">⚽</div><div><strong>Football Club SaaS</strong><span>Backoffice</span></div></div>
      <div className="nav">
        <Nav label="⌂ Dashboard" active={section === 'dashboard'} onClick={() => openSection('dashboard')} />
        <Nav label="🎨 Aparência da app" active={section === 'branding'} onClick={() => openSection('branding')} />
        <Nav label="🏟️ Clube" active={false} disabled />
        <Nav label="👥 Sócios" active={section === 'members'} onClick={() => openSection('members')} />
        <Nav label="💶 Quotas e pagamentos" active={section === 'dues'} onClick={() => openSection('dues')} />
        <Nav label="⚽ Jogos" active={false} disabled />
        <Nav label="📰 Conteúdos" active={false} disabled />
        <Nav label="🎟️ Bilhetes" active={false} disabled />
        <Nav label="⭐ Rewards" active={false} disabled />
        <Nav label="🔔 Notificações" active={false} disabled />
        <Nav label="⚙️ Configurações" active={false} disabled />
      </div>
      <div className="session"><label>JWT de administrador</label><input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Bearer token" /><small>Guardado apenas no browser local.</small></div>
    </aside>

    <main className="main">
      <header className="header"><h1>{title}</h1><p>Gestão por clube, com dados isolados por tenant e autorização no backend.</p></header>
      {error && <div className="error">{error}</div>}
      {section === 'dashboard' && <DashboardView data={dashboard} />}
      {section === 'branding' && <BrandingView config={config} setConfig={setConfig} />}
      {section === 'members' && <MembersView members={members} />}
      {section === 'dues' && <DuesView dues={dues} />}
    </main>
  </div>;
}

function Nav({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button className={`navItem ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`} disabled={disabled} onClick={onClick}>{label}{disabled && <small>brevemente</small>}</button>;
}

function DashboardView({ data }: { data: Dashboard | null }) {
  if (!data) return <Empty title="Dashboard ainda não carregado" text="Liga o backoffice com um JWT de club_owner ou club_admin." />;
  const cards = [['Sócios', data.members], ['Sócios ativos', data.activeMemberships], ['Quotas abertas', data.openDues], ['Quotas vencidas', data.overdueDues], ['Pagamentos recebidos', `${data.paidAmount.toFixed(2)} €`], ['Próximos jogos', data.upcomingFixtures], ['Notícias publicadas', data.publishedArticles]];
  return <div className="cards">{cards.map(([label, value]) => <div className="stat" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}<div className="panel wide"><h2>Estado do backoffice</h2><p>Os indicadores acima vêm diretamente da API e são filtrados pelo tenant associado ao JWT. Não são dados de demonstração.</p></div></div>;
}

function MembersView({ members }: { members: Member[] }) {
  return <section className="panel"><div className="panelHeader"><h2>Sócios</h2><span>{members.length} apresentados</span></div><div className="tableWrap"><table><thead><tr><th>Nº</th><th>Nome</th><th>Email</th><th>Telefone</th><th>Plano</th><th>Estado</th></tr></thead><tbody>{members.map(m => { const current = m.memberships[0]; return <tr key={m.id}><td>{m.memberNumber}</td><td><strong>{m.firstName} {m.lastName}</strong></td><td>{m.email ?? '—'}</td><td>{m.phone ?? '—'}</td><td>{current?.planCode ?? '—'}</td><td><Status value={current?.status ?? 'SEM PLANO'} /></td></tr>; })}</tbody></table></div></section>;
}

function DuesView({ dues }: { dues: Due[] }) {
  return <section className="panel"><div className="panelHeader"><h2>Quotas</h2><span>{dues.length} apresentadas</span></div><div className="tableWrap"><table><thead><tr><th>Referência</th><th>Descrição</th><th>Valor</th><th>Pago</th><th>Vencimento</th><th>Estado</th></tr></thead><tbody>{dues.map(d => <tr key={d.id}><td><strong>{d.reference}</strong></td><td>{d.description ?? '—'}</td><td>{Number(d.amount).toFixed(2)} {d.currency}</td><td>{Number(d.paidAmount).toFixed(2)} {d.currency}</td><td>{new Date(d.dueDate).toLocaleDateString('pt-PT')}</td><td><Status value={d.status} /></td></tr>)}</tbody></table></div></section>;
}

function Status({ value }: { value: string }) { return <span className="status">{value.replaceAll('_', ' ')}</span>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="panel empty"><h2>{title}</h2><p>{text}</p></div>; }

function BrandingView({ config, setConfig }: { config: typeof defaults; setConfig: React.Dispatch<React.SetStateAction<typeof defaults>> }) {
  const gradient = useMemo(() => `linear-gradient(135deg, ${config.secondary}, ${config.primary})`, [config.primary, config.secondary]);
  const set = (key: keyof typeof defaults, value: string) => setConfig(current => ({ ...current, [key]: value }));
  return <div className="grid"><section className="panel"><h2>Identidade do clube</h2><div className="formGrid"><Field label="Nome do clube" value={config.name} onChange={v => set('name', v)} /><Field label="Nome curto" value={config.shortName} onChange={v => set('shortName', v)} /><Field label="Slogan" value={config.slogan} onChange={v => set('slogan', v)} full /></div><h2 className="sectionTitle">Cores</h2><div className="colors">{(['primary','secondary','accent','background','surface'] as const).map(key => <ColorField key={key} label={{ primary: 'Primária', secondary: 'Secundária', accent: 'Destaque', background: 'Fundo', surface: 'Superfície' }[key]} value={config[key]} onChange={v => set(key, v)} />)}</div><button className="save" disabled>Guardar alterações — ligação ao endpoint de branding no próximo incremento</button></section><section className="preview"><div className="phone"><div className="phoneTop"><strong>Olá, Sócio 👋</strong><div className="phoneLogo" style={{ background: config.surface, color: config.primary }}>⚽</div></div><div className="phoneContent"><div className="hero" style={{ background: gradient }}><small>PRÓXIMO JOGO</small><h3>{config.shortName}</h3><p>20 SET · 20:15 · Estádio Municipal</p></div><strong>A tua quota</strong><div className="previewCard" style={{ background: config.surface }}><strong>Quota 2026/27 · 25,00 €</strong><span>Estado da quota</span></div><strong className="messageTitle">Mensagem do clube</strong><div className="previewCard" style={{ background: config.surface }}><strong>{config.slogan}</strong><span>A tua experiência começa aqui.</span></div></div></div></div></div>;
}
function Field({ label, value, onChange, full = false }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) { return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label><input value={value} onChange={e => onChange(e.target.value)} /></div>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="color"><div className="swatch" style={{ background: value }} /><span>{label}</span><input value={value} onChange={e => onChange(e.target.value)} /></div>; }
