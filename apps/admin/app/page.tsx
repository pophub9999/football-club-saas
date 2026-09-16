'use client';

import { useEffect, useMemo, useState } from 'react';

type Section = 'dashboard' | 'branding' | 'club' | 'members' | 'dues' | 'games' | 'content' | 'tickets' | 'settings';
type Dashboard = { members: number; activeMemberships: number; openDues: number; overdueDues: number; paidAmount: number; upcomingFixtures: number; publishedArticles: number };
type Member = { id: string; memberNumber: string; firstName: string; lastName: string; email?: string | null; phone?: string | null; memberships: { planCode: string; status: string; validUntil?: string | null }[] };
type Due = { id: string; reference: string; description?: string | null; amount: number | string; paidAmount: number | string; currency: string; dueDate: string; status: string };
type Fixture = { id: string; kickoffAt: string; status: string; venueName?: string | null; venueCity?: string | null; homeTeam: { name: string }; awayTeam: { name: string }; competition?: { name: string; season?: string | null } | null };
type Article = { id: string; title: string; excerpt?: string | null; category?: string | null; publishedAt?: string | null };
type TicketEvent = { id: string; name: string; startsAt: string; endsAt?: string | null; venueName?: string | null; venueAddress?: string | null; status: string };
type Branding = { name: string; shortName: string; slogan: string; primary: string; secondary: string; accent: string; background: string; surface: string };
type Club = { id: string; slug: string; name: string; status: string; shortName?: string | null; slogan?: string | null };
type Settings = { defaultLocale: string; enabledFeatures: Record<string, unknown>; homeConfiguration: Record<string, unknown>; socialLinks: Record<string, unknown>; legalLinks: Record<string, unknown> };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const defaults: Branding = { name: 'Clube Principal', shortName: 'Clube Principal', slogan: 'Juntos somos mais fortes', primary: '#008C45', secondary: '#005B2A', accent: '#D7E83F', background: '#07110D', surface: '#102019' };

export default function Home() {
  const [section, setSection] = useState<Section>('dashboard');
  const [token, setToken] = useState('');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [config, setConfig] = useState<Branding>(defaults);
  const [club, setClub] = useState<Club | null>(null);
  const [settings, setSettings] = useState<Settings>({ defaultLocale: 'pt-PT', enabledFeatures: {}, homeConfiguration: {}, socialLinks: {}, legalLinks: {} });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [article, setArticle] = useState({ slug: '', title: '', excerpt: '', body: '', category: '', imageUrl: '', isPublished: true });

  useEffect(() => setToken(localStorage.getItem('football_admin_token') ?? ''), []);
  useEffect(() => { if (token) localStorage.setItem('football_admin_token', token); }, [token]);

  async function load(path: string, init?: RequestInit) {
    setError('');
    if (!token) { setError('Introduz um JWT de administrador para ligar o backoffice à API.'); return null; }
    const response = await fetch(`${API_URL}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) }, cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
    return response.json();
  }

  async function openSection(next: Section) {
    setSection(next);
    try {
      if (next === 'dashboard') setDashboard(await load('/admin/dashboard'));
      if (next === 'branding') { const r = await load('/admin/branding'); const b = r?.branding; setConfig({ name: r?.tenant?.name ?? defaults.name, shortName: b?.shortName ?? r?.tenant?.name ?? defaults.shortName, slogan: b?.slogan ?? defaults.slogan, primary: b?.primaryColor ?? defaults.primary, secondary: b?.secondaryColor ?? defaults.secondary, accent: b?.accentColor ?? defaults.accent, background: b?.backgroundColor ?? defaults.background, surface: b?.surfaceColor ?? defaults.surface }); }
      if (next === 'club') setClub(await load('/admin/club'));
      if (next === 'settings') setSettings(await load('/admin/settings'));
      if (next === 'members') setMembers(await load('/admin/members') ?? []);
      if (next === 'dues') setDues(await load('/admin/dues') ?? []);
      if (next === 'games') setFixtures(await load('/football/fixtures/upcoming?limit=50') ?? []);
      if (next === 'content') setArticles(await load('/content/news?limit=50') ?? []);
      if (next === 'tickets') setEvents(await load('/tickets/events') ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao comunicar com a API.'); }
  }

  async function saveBranding() {
    setBusy(true); try { await load('/admin/branding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }); setError('Aparência guardada com sucesso.'); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar aparência.'); } finally { setBusy(false); }
  }
  async function saveClub() {
    if (!club) return; setBusy(true); try { const r = await load('/admin/club', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: club.name, slug: club.slug }) }); setClub({ ...club, ...r }); setError('Dados do clube guardados com sucesso.'); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar clube.'); } finally { setBusy(false); }
  }
  async function saveSettings() {
    setBusy(true); try { const r = await load('/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); setSettings(r); setError('Configurações guardadas com sucesso.'); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao guardar configurações.'); } finally { setBusy(false); }
  }
  async function syncGames() {
    setBusy(true); try { const result = await load('/admin/football/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: 45 }) }); setFixtures(await load('/football/fixtures/upcoming?limit=50') ?? []); setError(`Sincronização concluída: ${result?.synced ?? 0} jogos recebidos (${result?.provider ?? 'provider'}).`); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao sincronizar jogos.'); } finally { setBusy(false); }
  }
  async function createArticle() {
    if (!article.slug || !article.title || !article.body) { setError('Slug, título e conteúdo são obrigatórios.'); return; }
    setBusy(true); try { await load('/admin/content/news', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(article) }); setArticle({ slug: '', title: '', excerpt: '', body: '', category: '', imageUrl: '', isPublished: true }); setArticles(await load('/content/news?limit=50') ?? []); } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao criar notícia.'); } finally { setBusy(false); }
  }
  useEffect(() => { if (token) openSection('dashboard'); }, [token]);

  const title = ({ dashboard: 'Dashboard', branding: 'Aparência da aplicação', club: 'Clube', members: 'Sócios', dues: 'Quotas e pagamentos', games: 'Jogos', content: 'Conteúdos', tickets: 'Bilhetes', settings: 'Configurações' } as const)[section];
  return <div className="shell"><aside className="sidebar"><div className="brand"><div className="brandMark">⚽</div><div><strong>Football Club SaaS</strong><span>Backoffice</span></div></div><div className="nav">
    <Nav label="⌂ Dashboard" active={section === 'dashboard'} onClick={() => openSection('dashboard')} />
    <Nav label="🎨 Aparência da app" active={section === 'branding'} onClick={() => openSection('branding')} />
    <Nav label="🏟️ Clube" active={section === 'club'} onClick={() => openSection('club')} />
    <Nav label="👥 Sócios" active={section === 'members'} onClick={() => openSection('members')} />
    <Nav label="💶 Quotas e pagamentos" active={section === 'dues'} onClick={() => openSection('dues')} />
    <Nav label="⚽ Jogos" active={section === 'games'} onClick={() => openSection('games')} />
    <Nav label="📰 Conteúdos" active={section === 'content'} onClick={() => openSection('content')} />
    <Nav label="🎟️ Bilhetes" active={section === 'tickets'} onClick={() => openSection('tickets')} />
    <Nav label="⭐ Rewards" disabled /><Nav label="🔔 Notificações" disabled />
    <Nav label="⚙️ Configurações" active={section === 'settings'} onClick={() => openSection('settings')} />
  </div><div className="session"><label>JWT de administrador</label><input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Bearer token" /><small>Guardado apenas no browser local.</small></div></aside>
  <main className="main"><header className="header"><h1>{title}</h1><p>Gestão por clube, com dados isolados por tenant e autorização no backend.</p></header>{error && <div className="error">{error}</div>}
    {section === 'dashboard' && <DashboardView data={dashboard} />}
    {section === 'branding' && <BrandingView config={config} setConfig={setConfig} busy={busy} onSave={saveBranding} />}
    {section === 'club' && <ClubView club={club} setClub={setClub} busy={busy} onSave={saveClub} />}
    {section === 'settings' && <SettingsView settings={settings} setSettings={setSettings} busy={busy} onSave={saveSettings} />}
    {section === 'members' && <MembersView members={members} />}{section === 'dues' && <DuesView dues={dues} />}{section === 'games' && <GamesView fixtures={fixtures} busy={busy} onSync={syncGames} />}{section === 'content' && <ContentView articles={articles} article={article} setArticle={setArticle} busy={busy} onCreate={createArticle} />}{section === 'tickets' && <TicketsView events={events} />}
  </main></div>;
}

function Nav({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick?: () => void }) { return <button className={`navItem ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`} disabled={disabled} onClick={onClick}>{label}{disabled && <small>brevemente</small>}</button>; }
function DashboardView({ data }: { data: Dashboard | null }) { if (!data) return <Empty title="Dashboard ainda não carregado" text="Liga o backoffice com um JWT de club_owner ou club_admin." />; const cards = [['Sócios', data.members], ['Sócios ativos', data.activeMemberships], ['Quotas abertas', data.openDues], ['Quotas vencidas', data.overdueDues], ['Pagamentos recebidos', `${data.paidAmount.toFixed(2)} €`], ['Próximos jogos', data.upcomingFixtures], ['Notícias publicadas', data.publishedArticles]]; return <div className="cards">{cards.map(([label, value]) => <div className="stat" key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}<div className="panel wide"><h2>Estado do backoffice</h2><p>Os indicadores vêm diretamente da API e são filtrados pelo tenant associado ao JWT.</p></div></div>; }
function MembersView({ members }: { members: Member[] }) { return <section className="panel"><div className="panelHeader"><h2>Sócios</h2><span>{members.length} apresentados</span></div><div className="tableWrap"><table><thead><tr><th>Nº</th><th>Nome</th><th>Email</th><th>Telefone</th><th>Plano</th><th>Estado</th></tr></thead><tbody>{members.map(m => { const current = m.memberships[0]; return <tr key={m.id}><td>{m.memberNumber}</td><td><strong>{m.firstName} {m.lastName}</strong></td><td>{m.email ?? '—'}</td><td>{m.phone ?? '—'}</td><td>{current?.planCode ?? '—'}</td><td><Status value={current?.status ?? 'SEM PLANO'} /></td></tr>; })}</tbody></table></div></section>; }
function DuesView({ dues }: { dues: Due[] }) { return <section className="panel"><div className="panelHeader"><h2>Quotas</h2><span>{dues.length} apresentadas</span></div><div className="tableWrap"><table><thead><tr><th>Referência</th><th>Descrição</th><th>Valor</th><th>Pago</th><th>Vencimento</th><th>Estado</th></tr></thead><tbody>{dues.map(d => <tr key={d.id}><td><strong>{d.reference}</strong></td><td>{d.description ?? '—'}</td><td>{Number(d.amount).toFixed(2)} {d.currency}</td><td>{Number(d.paidAmount).toFixed(2)} {d.currency}</td><td>{new Date(d.dueDate).toLocaleDateString('pt-PT')}</td><td><Status value={d.status} /></td></tr>)}</tbody></table></div></section>; }
function GamesView({ fixtures, busy, onSync }: { fixtures: Fixture[]; busy: boolean; onSync: () => void }) { return <section className="panel"><div className="panelHeader"><div><h2>Jogos futuros</h2><span>{fixtures.length} apresentados</span></div><button className="action" onClick={onSync} disabled={busy}>{busy ? 'A sincronizar…' : 'Sincronizar jogos'}</button></div>{fixtures.length === 0 ? <Empty title="Sem jogos" text="Não existem jogos futuros sincronizados para este clube." /> : <div className="tableWrap"><table><thead><tr><th>Data</th><th>Jogo</th><th>Competição</th><th>Local</th><th>Estado</th></tr></thead><tbody>{fixtures.map(f => <tr key={f.id}><td>{new Date(f.kickoffAt).toLocaleString('pt-PT')}</td><td><strong>{f.homeTeam.name}</strong> vs <strong>{f.awayTeam.name}</strong></td><td>{f.competition?.name ?? '—'}{f.competition?.season ? ` · ${f.competition.season}` : ''}</td><td>{f.venueName ?? '—'}{f.venueCity ? ` · ${f.venueCity}` : ''}</td><td><Status value={f.status} /></td></tr>)}</tbody></table></div>}</section>; }
function ContentView({ articles, article, setArticle, busy, onCreate }: { articles: Article[]; article: { slug: string; title: string; excerpt: string; body: string; category: string; imageUrl: string; isPublished: boolean }; setArticle: React.Dispatch<React.SetStateAction<typeof article>>; busy: boolean; onCreate: () => void }) { const set = (key: keyof typeof article, value: string | boolean) => setArticle(a => ({ ...a, [key]: value })); return <div className="grid"><section className="panel"><div className="panelHeader"><h2>Notícias publicadas</h2><span>{articles.length} apresentadas</span></div>{articles.length === 0 ? <Empty title="Sem notícias" text="Ainda não existem notícias publicadas para este clube." /> : <div className="articleList">{articles.map(a => <article className="article" key={a.id}><strong>{a.title}</strong><p>{a.excerpt ?? 'Sem resumo.'}</p><small>{a.category ?? 'Sem categoria'} · {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('pt-PT') : 'sem data'}</small></article>)}</div>}</section><section className="panel"><h2>Nova notícia</h2><div className="formGrid"><Field label="Slug" value={article.slug} onChange={v => set('slug', v)} /><Field label="Categoria" value={article.category} onChange={v => set('category', v)} /><Field label="Título" value={article.title} onChange={v => set('title', v)} full /><Field label="Resumo" value={article.excerpt} onChange={v => set('excerpt', v)} full /><div className="field full"><label>Conteúdo</label><textarea value={article.body} onChange={e => set('body', e.target.value)} rows={9} /></div><Field label="Imagem URL" value={article.imageUrl} onChange={v => set('imageUrl', v)} full /></div><label className="check"><input type="checkbox" checked={article.isPublished} onChange={e => set('isPublished', e.target.checked)} /> Publicar imediatamente</label><button className="save activeSave" onClick={onCreate} disabled={busy}>{busy ? 'A guardar…' : 'Criar notícia'}</button></section></div>; }
function TicketsView({ events }: { events: TicketEvent[] }) { return <section className="panel"><div className="panelHeader"><h2>Eventos com bilhetes</h2><span>{events.length} apresentados</span></div>{events.length === 0 ? <Empty title="Sem eventos" text="Não existem eventos de bilhetes disponíveis para este clube." /> : <div className="tableWrap"><table><thead><tr><th>Evento</th><th>Início</th><th>Fim</th><th>Local</th><th>Estado</th></tr></thead><tbody>{events.map(e => <tr key={e.id}><td><strong>{e.name}</strong></td><td>{new Date(e.startsAt).toLocaleString('pt-PT')}</td><td>{e.endsAt ? new Date(e.endsAt).toLocaleString('pt-PT') : '—'}</td><td>{e.venueName ?? '—'}{e.venueAddress ? ` · ${e.venueAddress}` : ''}</td><td><Status value={e.status} /></td></tr>)}</tbody></table></div>}</section>; }
function BrandingView({ config, setConfig, busy, onSave }: { config: Branding; setConfig: React.Dispatch<React.SetStateAction<Branding>>; busy: boolean; onSave: () => void }) { const gradient = useMemo(() => `linear-gradient(135deg, ${config.secondary}, ${config.primary})`, [config.primary, config.secondary]); const set = (key: keyof Branding, value: string) => setConfig(current => ({ ...current, [key]: value })); return <div className="grid"><section className="panel"><h2>Identidade do clube</h2><div className="formGrid"><Field label="Nome do clube" value={config.name} onChange={v => set('name', v)} /><Field label="Nome curto" value={config.shortName} onChange={v => set('shortName', v)} /><Field label="Slogan" value={config.slogan} onChange={v => set('slogan', v)} full /></div><h2 className="sectionTitle">Cores</h2><div className="colors">{(['primary','secondary','accent','background','surface'] as const).map(key => <ColorField key={key} label={{ primary: 'Primária', secondary: 'Secundária', accent: 'Destaque', background: 'Fundo', surface: 'Superfície' }[key]} value={config[key]} onChange={v => set(key, v)} />)}</div><button className="save activeSave" onClick={onSave} disabled={busy}>{busy ? 'A guardar…' : 'Guardar alterações'}</button></section><section className="preview"><div className="phone"><div className="phoneTop"><strong>Olá, Sócio 👋</strong><div className="phoneLogo" style={{ background: config.surface, color: config.primary }}>⚽</div></div><div className="phoneContent"><div className="hero" style={{ background: gradient }}><small>PRÓXIMO JOGO</small><h3>{config.shortName}</h3><p>20 SET · 20:15 · Estádio Municipal</p></div><strong>A tua quota</strong><div className="previewCard" style={{ background: config.surface }}><strong>Quota 2026/27 · 25,00 €</strong><span>Estado da quota</span></div><strong className="messageTitle">Mensagem do clube</strong><div className="previewCard" style={{ background: config.surface }}><strong>{config.slogan}</strong><span>A tua experiência começa aqui.</span></div></div></div></div></div>; }
function ClubView({ club, setClub, busy, onSave }: { club: Club | null; setClub: React.Dispatch<React.SetStateAction<Club | null>>; busy: boolean; onSave: () => void }) { if (!club) return <Empty title="Clube ainda não carregado" text="Seleciona novamente Clube depois de autenticar." />; return <section className="panel"><h2>Dados do clube</h2><div className="formGrid"><Field label="Nome do clube" value={club.name} onChange={v => setClub({ ...club, name: v })} /><Field label="Slug" value={club.slug} onChange={v => setClub({ ...club, slug: v })} /><Field label="Nome curto" value={club.shortName ?? ''} onChange={() => {}} /><Field label="Slogan" value={club.slogan ?? ''} onChange={() => {}} /></div><p><Status value={club.status} /></p><button className="save activeSave" onClick={onSave} disabled={busy}>{busy ? 'A guardar…' : 'Guardar dados do clube'}</button></section>; }
function SettingsView({ settings, setSettings, busy, onSave }: { settings: Settings; setSettings: React.Dispatch<React.SetStateAction<Settings>>; busy: boolean; onSave: () => void }) { return <section className="panel"><h2>Configurações da aplicação</h2><div className="formGrid"><Field label="Idioma predefinido" value={settings.defaultLocale} onChange={v => setSettings(s => ({ ...s, defaultLocale: v }))} full /></div><div className="panelHeader"><div><h3>Funcionalidades</h3><span>JSON para configuração por clube</span></div></div><textarea rows={8} value={JSON.stringify(settings.enabledFeatures, null, 2)} onChange={e => { try { setSettings(s => ({ ...s, enabledFeatures: JSON.parse(e.target.value) })); } catch {} }} /><button className="save activeSave" onClick={onSave} disabled={busy}>{busy ? 'A guardar…' : 'Guardar configurações'}</button></section>; }
function Status({ value }: { value: string }) { return <span className="status">{value.replaceAll('_', ' ')}</span>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="panel empty"><h2>{title}</h2><p>{text}</p></div>; }
function Field({ label, value, onChange, full = false }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) { return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label><input value={value} onChange={e => onChange(e.target.value)} /></div>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="color"><div className="swatch" style={{ background: value }} /><span>{label}</span><input value={value} onChange={e => onChange(e.target.value)} /></div>; }
