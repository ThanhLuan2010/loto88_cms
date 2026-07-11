import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'https://backend.vipmarts.com/api';
const PAGE_SIZES = [10, 25, 50];

const STATUS_FILTERS = [
  { value: 'ALL',       label: '📋 Tất Cả' },
  { value: 'PENDING',   label: '⏳ Chờ Xử Lý' },
  { value: 'COMPLETED', label: '✅ Đã Trao Quà' },
  { value: 'CANCELLED', label: '❌ Đã Hủy' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'CHỜ XỬ LÝ',   bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
    COMPLETED: { label: 'ĐÃ TRAO QUÀ', bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    CANCELLED: { label: 'ĐÃ HỦY',      bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  };
  const s = map[status] || { label: status, bg: 'rgba(255,255,255,0.08)', color: '#aaa' };
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem',
      fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

const OrdersManager: React.FC = () => {
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch khi filter/page thay đổi
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOrders();
    }, search ? 400 : 0); // debounce 400ms chỉ khi search
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, statusFilter, page, pageSize]);


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`${API_BASE_URL}/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setTotal(data.total ?? data.orders.length);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };


  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm(`Xác nhận chuyển trạng thái thành ${status}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
      alert('Đã cập nhật trạng thái đơn!');
    } catch (e) { console.error(e); }
  };

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Reset page khi thay filter/search
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(1); };
  const handlePageSize = (v: number) => { setPageSize(v); setPage(1); };

  return (
    <div className="tab-content">
      <div className="screen-header">
        <div className="screen-info">
          <h2>Quản Lý Đơn Đổi Quà</h2>
          <p>Xem danh sách khách hàng đã đổi quà và chuyển trạng thái "Đã trao quà".</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders}>
          Tải lại
        </button>
      </div>

      {/* ── SEARCH + FILTER ── */}
      <div className="card animate-fade-in" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm tên, @username, Telegram ID, tên quà..."
              style={{
                width: '100%',
                paddingLeft: 36, paddingRight: 32, paddingTop: 9, paddingBottom: 9,
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.03)',
                color: 'inherit', fontSize: 14,
              }}
            />
            {search && (
              <button onClick={() => handleSearch('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: 15, lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(sf => {
              const isActive = statusFilter === sf.value;
              return (
                <button
                  key={sf.value}
                  onClick={() => handleStatus(sf.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                    background: isActive ? 'linear-gradient(135deg,#ff4757,#ff6b81)' : 'rgba(255,255,255,0.07)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    boxShadow: isActive ? '0 4px 12px rgba(255,71,87,0.3)' : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {sf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result info */}
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
          Tổng <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> đơn
          {search && <> · Từ khóa: "<strong style={{ color: 'var(--text-primary)' }}>{search}</strong>"</>}
          {statusFilter !== 'ALL' && <> · Trạng thái: <strong style={{ color: 'var(--text-primary)' }}>{STATUS_FILTERS.find(s => s.value === statusFilter)?.label}</strong></>}
        </p>
      </div>

      {/* ── BẢNG ── */}
      <div className="card animate-fade-in">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            Đang tải...
          </div>
        ) : (
          <>
            <table className="calendar-table" style={{ width: '100%', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Telegram ID</th>
                  <th>Quà đã đổi</th>
                  <th>Điểm trừ</th>
                  <th>Ngày đổi</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                      Không tìm thấy đơn nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  orders.map(o => (
                    <tr key={o._id}>
                      <td>
                        <strong>{o.user?.firstName}</strong>
                        {o.user?.username && (
                          <><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{o.user.username}</span></>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>{o.user?.telegramId}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {o.gift?.image && (
                            <img src={o.gift.image} alt={o.gift?.name}
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <strong>{o.gift?.name || '—'}</strong>
                        </div>
                      </td>
                      <td style={{ color: '#ff4757', fontWeight: 'bold' }}>-{o.gift?.points}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td><StatusBadge status={o.status} /></td>
                      <td style={{ textAlign: 'center' }}>
                        {o.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              className="btn-primary"
                              onClick={() => handleUpdateStatus(o._id, 'COMPLETED')}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}
                            >✅ Xác nhận</button>
                            <button
                              className="btn-secondary"
                              onClick={() => handleUpdateStatus(o._id, 'CANCELLED')}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >❌ Hủy</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ── PAGINATION ── */}
            {total > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12, marginTop: 20, paddingTop: 16,
                borderTop: '1px solid var(--border-color)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Trang <strong style={{ color: 'var(--text-primary)' }}>{page}</strong> / {totalPages}
                  {' · '}
                  <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> đơn
                </span>

                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => goTo(page - 1)} disabled={page === 1}
                    className="btn-secondary"
                    style={{ padding: '5px 12px', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
                    ‹ Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`e-${idx}`} style={{ padding: '5px 4px', color: 'var(--text-muted)', fontSize: 13 }}>…</span>
                      ) : (
                        <button key={p} onClick={() => goTo(p as number)}
                          className={page === p ? 'btn-primary' : 'btn-secondary'}
                          style={{ padding: '5px 11px', fontSize: 13, minWidth: 34 }}>
                          {p}
                        </button>
                      )
                    )}
                  <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
                    className="btn-secondary"
                    style={{ padding: '5px 12px', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>
                    Sau ›
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                  Hiển thị
                  <select value={pageSize} onChange={e => handlePageSize(Number(e.target.value))}
                    style={{
                      padding: '5px 8px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'inherit', cursor: 'pointer',
                    }}>
                    {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  đơn / trang
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersManager;