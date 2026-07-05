import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://backend.vipmarts.com/api';

const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm(`Xác nhận chuyển trạng thái thành ${status}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
      alert("Đã cập nhật trạng thái đơn!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="tab-content">
      <div className="screen-header">
        <div className="screen-info">
          <h2>Quản Lý Đơn Đổi Quà</h2>
          <p>Xem danh sách khách hàng đã đổi quà và chuyển trạng thái "Đã trao quà".</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders}>Tải lại dữ liệu</button>
      </div>

      <div className="card animate-fade-in">
        {loading ? <p>Đang tải...</p> : (
          <table className="calendar-table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Telegram ID</th>
                <th>Quà đã đổi</th>
                <th>Điểm trừ</th>
                <th>Ngày đổi</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>
                    <strong>{o.user?.firstName}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{o.user?.username ? `@${o.user?.username}` : ''}</span>
                  </td>
                  <td>{o.user?.telegramId}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={o.gift?.image} alt={o.gift?.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      <strong>{o.gift?.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: '#ff4757', fontWeight: 'bold' }}>-{o.gift?.points}</td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 'bold',
                      background: o.status === 'PENDING' ? 'rgba(245, 158, 11, 0.2)' : o.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: o.status === 'PENDING' ? '#f59e0b' : o.status === 'COMPLETED' ? '#10b981' : '#ef4444'
                    }}>
                      {o.status === 'PENDING' ? 'CHỜ XỬ LÝ' : o.status === 'COMPLETED' ? 'ĐÃ TRAO QUÀ' : 'ĐÃ HỦY'}
                    </span>
                  </td>
                  <td>
                    {o.status === 'PENDING' && (
                      <button className="btn-primary" onClick={() => handleUpdateStatus(o._id, 'COMPLETED')} style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981' }}>
                        Xác nhận Trao
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Chưa có đơn đổi quà nào.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
export default OrdersManager