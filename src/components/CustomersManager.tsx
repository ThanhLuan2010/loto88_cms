import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://backend.vipmarts.com/api';

export default function CustomersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editDeposit, setEditDeposit] = useState('');
  const [editPoints, setEditPoints] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users?search=${search}`);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await fetch(`${API_BASE_URL}/users/${editUser._id}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: Number(editPoints),
          depositCurrentMonth: Number(editDeposit)
        })
      });
      setEditUser(null);
      fetchUsers();
      alert("Đã cập nhật điểm cho khách hàng!");
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (value: number) => {
    return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
  };

  return (
    <div className="tab-content">
      <div className="screen-header">
        <div className="screen-info">
          <h2>Quản Lý Khách Hàng</h2>
          <p>Tra cứu và nhập số tiền nạp, cộng điểm thủ công cho khách.</p>
        </div>
      </div>

      <div className="card animate-fade-in" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo tên, username hoặc Telegram ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
        />
      </div>

      <div className="card animate-fade-in">
        {loading ? <p>Đang tải...</p> : (
          <table className="calendar-table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Telegram ID</th>
                <th>Khách hàng</th>
                <th>Tổng nạp tháng</th>
                <th>Điểm tích lũy</th>
                <th>Ngày tham gia</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.telegramId}</td>
                  <td>
                    <strong>{u.firstName}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{u.username ? `@${u.username}` : ''}</span>
                  </td>
                  <td style={{ color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(u.depositCurrentMonth)} đ</td>
                  <td style={{ color: '#ff4757', fontWeight: 'bold' }}>{u.points}</td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(u.joinedAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <button className="btn-primary" onClick={() => {
                      setEditUser(u);
                      setEditDeposit(u.depositCurrentMonth?.toString() || '0');
                      setEditPoints(u.points?.toString() || '0');
                    }} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cộng điểm</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>Không tìm thấy khách hàng nào.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Cập nhật điểm: {editUser.firstName}</h3>
              <button className="modal-close-btn" onClick={() => setEditUser(null)}>×</button>
            </div>
            <form onSubmit={handleUpdate} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label>Tổng tiền nạp tháng (VNĐ)</label>
                <input
                  type="number"
                  value={editDeposit}
                  onChange={(e) => setEditDeposit(e.target.value)}
                  placeholder="Ví dụ: 10000000"
                  required
                />
              </div>
              <div>
                <label>Tổng điểm hiện có</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  placeholder="Ví dụ: 500"
                  required
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>*Lưu ý: Nếu số điểm tăng lên, hệ thống sẽ tự động gửi tin nhắn Telegram thông báo cho khách hàng.</p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
