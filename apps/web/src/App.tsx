import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Activity, Database, Pencil, Plus, RefreshCw, Server, Trash2, X, Zap } from 'lucide-react';
import { api, ItemInput, KnowledgeItem } from './api';

const emptyForm: ItemInput = { title: '', content: '', tag: 'general' };

export default function App() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [form, setForm] = useState<ItemInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState('—');
  const [healthy, setHealthy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.list();
      setItems(result.data);
      setCache(result.cache ?? '—');
      setHealthy(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '载入失败');
      setHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => void api.health().then(() => setHealthy(true)).catch(() => setHealthy(false)), 15000);
    return () => window.clearInterval(timer);
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(item: KnowledgeItem) {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content, tag: item.tag });
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      if (editingId) await api.update(editingId, form);
      else await api.create(form);
      setOpen(false);
      setNotice(editingId ? '条目已更新，缓存已失效' : '条目已入库，缓存已失效');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '保存失败');
    }
  }

  async function remove(item: KnowledgeItem) {
    if (!window.confirm(`确认删除「${item.title}」？`)) return;
    try {
      await api.remove(item.id);
      setNotice('条目已删除，缓存已失效');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '删除失败');
    }
  }

  return (
    <main>
      <div className="grain" />
      <header className="masthead">
        <div className="brand"><span>K</span><div>KNOWLEDGE<br />RELAY</div></div>
        <div className="status"><i className={healthy ? 'online' : ''} /> {healthy ? '系统在线' : '连接中断'}</div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">MINIMAL PRODUCTION DEMO · 001</p>
          <h1>知识，<br /><em>即刻中转。</em></h1>
          <p className="lede">一个真正跑通数据库、API 与缓存链路的最小 CRUD。写入 PostgreSQL，读取由 Redis 加速。</p>
        </div>
        <button className="new-button" onClick={startCreate}><Plus size={20} /> 新建条目</button>
      </section>

      <section className="telemetry" aria-label="运行状态">
        <div><Database /><span>DATA STORE</span><strong>POSTGRESQL</strong></div>
        <div><Zap /><span>LAST RESPONSE</span><strong className={cache === 'HIT' ? 'hit' : ''}>CACHE {cache}</strong></div>
        <div><Server /><span>API LAYER</span><strong>NESTJS</strong></div>
        <button onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} /> REFRESH</button>
      </section>

      {notice && <div className="notice" role="status"><Activity size={16} /> {notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}

      <section className="inventory">
        <div className="section-title"><span>LIVE INVENTORY</span><span>{String(items.length).padStart(2, '0')} ITEMS</span></div>
        {loading && !items.length ? <div className="empty">正在接通数据链路…</div> : items.length === 0 ? (
          <div className="empty"><b>库存为空</b><span>建立第一条知识记录，完整链路会在这里显现。</span><button onClick={startCreate}>建立首条记录 →</button></div>
        ) : (
          <div className="cards">
            {items.map((item, index) => (
              <article className="card" key={item.id} style={{ animationDelay: `${index * 70}ms` }}>
                <div className="card-top"><span>#{String(index + 1).padStart(2, '0')}</span><span className="tag">{item.tag}</span></div>
                <h2>{item.title}</h2>
                <p>{item.content}</p>
                <footer><time>{new Date(item.updatedAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}</time><div><button aria-label="编辑" onClick={() => startEdit(item)}><Pencil /></button><button aria-label="删除" onClick={() => void remove(item)}><Trash2 /></button></div></footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form className="dialog" onSubmit={(event) => void save(event)}>
            <div className="dialog-head"><div><span>{editingId ? 'MODIFY RECORD' : 'NEW RECORD'}</span><h2>{editingId ? '修订知识条目' : '登记知识条目'}</h2></div><button type="button" onClick={() => setOpen(false)}><X /></button></div>
            <label>标题<input autoFocus minLength={2} maxLength={120} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：Redis 缓存失效策略" /></label>
            <label>标签<input maxLength={40} required value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="operations" /></label>
            <label>内容<textarea maxLength={10000} required rows={7} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="记录关键步骤、判断依据或操作结论…" /></label>
            <div className="form-actions"><button type="button" onClick={() => setOpen(false)}>取消</button><button type="submit">{editingId ? '保存修订' : '写入数据库'} <span>↗</span></button></div>
          </form>
        </div>
      )}
    </main>
  );
}

