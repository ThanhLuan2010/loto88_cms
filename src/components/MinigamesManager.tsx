import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://backend.vipmarts.com/api';

const MinigamesManager: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTelegram, setSearchTelegram] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/minigames`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (e) {
      console.error('Error fetching minigames data:', e);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lượt chơi này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/minigames/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Đã xóa lượt chơi thành công!');
        fetchSubmissions();
      } else {
        alert(data.message || 'Xóa thất bại.');
      }
    } catch (e) {
      console.error('Error deleting minigame entry:', e);
      alert('Đã xảy ra lỗi kết nối khi xóa.');
    }
  };

  // Filter & search logic
  const filteredSubmissions = submissions.filter((item) => {
    const matchesSearch = item.telegram
      ?.toLowerCase()
      .includes(searchTelegram.toLowerCase());
    const matchesType = filterType === '' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="tab-content">
      <div className="screen-header">
        <div className="screen-info">
          <h2>Quản Lý Minigame Trúng Thưởng</h2>
          <p>Xem danh sách người chơi tham gia Dự đoán Miền Bắc, Khớp đề MB, Vòng quay may mắn.</p>
        </div>
        <button className="btn-secondary" onClick={fetchSubmissions}>Tải lại dữ liệu</button>
      </div>

      {/* Filter and Search controls */}
      <div className="card animate-fade-in" style={{ marginBottom: 20, display: 'flex', gap: 15, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 2, minWidth: 250, marginBottom: 0 }}>
          <label>Tìm kiếm theo Nick Telegram</label>
          <input
            type="text"
            placeholder="🔍 Nhập nick Telegram để tìm..."
            value={searchTelegram}
            onChange={(e) => setSearchTelegram(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <label>Lọc theo loại hình</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#0d1527', border: '1px solid var(--border-color)', color: 'white', height: 42 }}
          >
            <option value="">Tất cả loại hình</option>
            <option value="Dự đoán Miền Bắc">Dự đoán Miền Bắc</option>
            <option value="Khớp đề MB">Khớp đề MB</option>
            <option value="Vòng quay may mắn">Vòng quay may mắn</option>
          </select>
        </div>
      </div>

      <div className="card animate-fade-in">
        {loading ? <p>Đang tải dữ liệu...</p> : (
          <table className="calendar-table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Nick Telegram</th>
                <th>Loại hình</th>
                <th>Số dự đoán</th>
                <th>Mã nạp / Mã giao dịch</th>
                <th>Thời gian tham gia</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong style={{ color: '#0088cc' }}>{item.telegram}</strong>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: item.type === 'Khớp đề MB' ? 'rgba(16, 185, 129, 0.15)' : (item.type === 'Vòng quay may mắn' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                      color: item.type === 'Khớp đề MB' ? '#10b981' : (item.type === 'Vòng quay may mắn' ? '#a78bfa' : '#60a5fa')
                    }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {item.number && item.number !== '--' ? item.number : <span style={{ color: '#444' }}>-</span>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#f59e0b', fontWeight: '600' }}>
                    {item.code && item.code !== '--' ? item.code : <span style={{ color: '#444' }}>-</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    <button className="btn-secondary" onClick={() => handleDelete(item._id)} style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid #ef4444', color: '#ef4444' }}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSubmissions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
                    Không có lượt chơi nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MinigamesManager;
