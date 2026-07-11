import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const API_BASE_URL = 'https://backend.vipmarts.com/api';

const CATEGORY_LIST = [
  { value: 'VOUCHER',      label: '🎫 Voucher' },
  { value: 'E-GIFTS',     label: '💳 E-Gifts' },
  { value: 'THẺ CÀO',    label: '📱 Thẻ Cào' },
  { value: 'NẠP GAME',   label: '🎮 Nạp Game' },
  { value: 'DU LỊCH',    label: '✈️ Du Lịch' },
  { value: 'VÉ MÁY BAY', label: '🛫 Vé Máy Bay' },
  { value: 'VẬT PHẨM',   label: '🎀 Vật Phẩm' },
];

const ALL_FILTER = [{ value: 'all', label: '🎁 Tất Cả' }, ...CATEGORY_LIST];

const colorMap: Record<string, string> = {
  'VOUCHER':      'linear-gradient(135deg,#f7971e,#ffd200)',
  'E-GIFTS':      'linear-gradient(135deg,#43e97b,#38f9d7)',
  'THẺ CÀO':     'linear-gradient(135deg,#4facfe,#00f2fe)',
  'NẠP GAME':    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'DU LỊCH':     'linear-gradient(135deg,#0ba360,#3cba92)',
  'VÉ MÁY BAY':  'linear-gradient(135deg,#667eea,#764ba2)',
  'VẬT PHẨM':   'linear-gradient(135deg,#f093fb,#f5576c)',
};

function CategoryBadge({ category }: { category: string }) {
  if (!category) {
    return (
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3 }}>--</span>
    );
  }
  const found = CATEGORY_LIST.find(c => c.value === category);
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: colorMap[category] || 'rgba(255,255,255,0.15)',
      color: '#fff',
      letterSpacing: 0.3,
      whiteSpace: 'nowrap',
    }}>
      {found ? found.label : category}
    </span>
  );
}

interface EditState {
  _id: string;
  name: string;
  points: string;
  image: string;
  category: string;
}

export default function GiftsManager() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Add form
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('VOUCHER');

  // Filter
  const [filterCategory, setFilterCategory] = useState('all');

  // Edit modal
  const [editGift, setEditGift] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-fetch khi category filter thay đổi
  useEffect(() => { fetchGifts(); }, [filterCategory]);

  // Lấy count từng danh mục (cho badge)
  useEffect(() => { fetchCategoryCounts(); }, []);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.set('category', filterCategory);
      const res = await fetch(`${API_BASE_URL}/gifts?${params}`);
      const data = await res.json();
      if (data.success) {
        setGifts(data.gifts);
        setTotal(data.total ?? data.gifts.length);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCategoryCounts = async () => {
    try {
      const allCats = ['all', ...CATEGORY_LIST.map(c => c.value)];
      const results = await Promise.all(allCats.map(async cat => {
        const params = new URLSearchParams({ limit: '1', page: '1' });
        if (cat !== 'all') params.set('category', cat);
        const res = await fetch(`${API_BASE_URL}/gifts?${params}`);
        const data = await res.json();
        return [cat, data.total ?? 0] as [string, number];
      }));
      setCategoryCounts(Object.fromEntries(results));
    } catch (e) { console.error(e); }
  };

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, points: Number(points), image, category }),
      });
      setName(''); setPoints(''); setImage(''); setCategory('VOUCHER');
      fetchGifts();
      fetchCategoryCounts();
      alert('Đã thêm quà tặng!');
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa quà này?')) return;
    try {
      await fetch(`${API_BASE_URL}/gifts/${id}`, { method: 'DELETE' });
      fetchGifts();
      fetchCategoryCounts();
    } catch (e) { console.error(e); }
  };

  const openEdit = (g: any) => {
    setEditGift({ _id: g._id, name: g.name, points: String(g.points), image: g.image, category: g.category || '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGift) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/gifts/${editGift._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editGift.name, points: Number(editGift.points), image: editGift.image, category: editGift.category }),
      });
      setEditGift(null);
      fetchGifts();
      fetchCategoryCounts();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="tab-content">
      <div className="screen-header">
        <div className="screen-info">
          <h2>Quản Lý Quà Tặng</h2>
          <p>Thêm, sửa, xóa danh sách quà tặng đổi điểm theo từng danh mục.</p>
        </div>
      </div>

      {/* ── FORM THÊM ── */}
      <div className="card animate-fade-in" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAddGift} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 2, minWidth: 140, marginBottom: 0 }}>
            <label>Tên Quà</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên quà tặng" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 110, marginBottom: 0 }}>
            <label>Điểm Cần Đổi</label>
            <input required type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="Ví dụ: 50" />
          </div>
          <div className="form-group" style={{ flex: 3, minWidth: 200, marginBottom: 0 }}>
            <label>Link Ảnh</label>
            <input required type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
            <label>Danh Mục</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORY_LIST.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ height: 42 }}>Thêm Quà</button>
        </form>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {ALL_FILTER.map(cat => {
          const count = categoryCounts[cat.value] ?? '…';
          const isActive = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                background: isActive ? 'linear-gradient(135deg,#ff4757,#ff6b81)' : 'rgba(255,255,255,0.08)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                boxShadow: isActive ? '0 4px 12px rgba(255,71,87,0.35)' : 'none',
                transform: isActive ? 'translateY(-1px)' : 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {cat.label}
              <span style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── BẢNG DANH SÁCH ── */}
      <div className="card animate-fade-in">
        {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Đang tải...
            </div>
        ) : gifts.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 32 }}>
            Chưa có quà nào trong danh mục này.
          </p>
        ) : (
          <table className="calendar-table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên Quà</th>
                <th>Điểm</th>
                <th>Danh Mục</th>
                <th style={{ textAlign: 'center' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map(g => (
                <tr key={g._id}>
                  <td>
                    <img src={g.image} alt={g.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{g.name}</td>
                  <td style={{ color: '#ff4757', fontWeight: 'bold' }}>{g.points}</td>
                  <td><CategoryBadge category={g.category} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 16px', fontSize: 13 }}
                        onClick={() => openEdit(g)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 16px', fontSize: 13 }}
                        onClick={() => handleDelete(g._id)}
                      >
                        🗑 Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── EDIT MODAL (portal → thoát khỏi overflow:hidden) ── */}
      {editGift && ReactDOM.createPortal(
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditGift(null); }}>
          <div className="modal-card" style={{ maxWidth: 520 }}>

            <div className="modal-header">
              <h3>✏️ Chỉnh Sửa Quà Tặng</h3>
              <button className="modal-close-btn" onClick={() => setEditGift(null)} style={{ fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {/* Preview ảnh */}
              {editGift.image && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <img
                    src={editGift.image}
                    alt="preview"
                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--glass-border)' }}
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tên Quà</label>
                <input
                  required
                  type="text"
                  value={editGift.name}
                  onChange={e => setEditGift({ ...editGift, name: e.target.value })}
                  placeholder="Tên quà tặng"
                />
              </div>

              <div style={{ display: 'flex', gap: 14 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Điểm Cần Đổi</label>
                  <input
                    required
                    type="number"
                    value={editGift.points}
                    onChange={e => setEditGift({ ...editGift, points: e.target.value })}
                    placeholder="Ví dụ: 50"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Danh Mục</label>
                  <select
                    value={editGift.category}
                    onChange={e => setEditGift({ ...editGift, category: e.target.value })}
                  >
                    <option value="">-- Chưa phân loại --</option>
                    {CATEGORY_LIST.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Link Ảnh</label>
                <input
                  required
                  type="url"
                  value={editGift.image}
                  onChange={e => setEditGift({ ...editGift, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Live badge preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Danh mục hiện tại:</span>
                <CategoryBadge category={editGift.category} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditGift(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Đang lưu...' : '💾 Lưu Thay Đổi'}
                </button>
              </div>
            </form>

          </div>
        </div>
      , document.body)}
    </div>
  );
}
