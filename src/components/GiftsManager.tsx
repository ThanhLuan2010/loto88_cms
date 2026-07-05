import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://backend.vipmarts.com/api';

export default function GiftsManager() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/gifts`);
      const data = await res.json();
      if (data.success) setGifts(data.gifts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, points: Number(points), image })
      });
      setName(''); setPoints(''); setImage('');
      fetchGifts();
      alert("Đã thêm quà tặng!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa quà này?")) return;
    try {
      await fetch(`${API_BASE_URL}/gifts/${id}`, { method: 'DELETE' });
      fetchGifts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="tab-content">
      <div className="screen-header">
        <div className="screen-info">
          <h2>Quản Lý Quà Tặng</h2>
          <p>Thêm, sửa, xóa danh sách quà tặng đổi điểm.</p>
        </div>
      </div>

      <div className="card animate-fade-in" style={{ marginBottom: 20 }}>
        <form onSubmit={handleAddGift} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label>Tên Quà</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên quà tặng" />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Điểm Cần Đổi</label>
            <input required type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="Ví dụ: 50" />
          </div>
          <div className="form-group" style={{ flex: 3, marginBottom: 0 }}>
            <label>Link Ảnh</label>
            <input required type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </div>
          <button type="submit" className="btn-primary" style={{ height: 42 }}>Thêm Quà</button>
        </form>
      </div>

      <div className="card animate-fade-in">
        {loading ? <p>Đang tải...</p> : (
          <table className="calendar-table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên Quà</th>
                <th>Điểm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map(g => (
                <tr key={g._id}>
                  <td><img src={g.image} alt={g.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
                  <td>{g.name}</td>
                  <td style={{ color: '#ff4757', fontWeight: 'bold' }}>{g.points}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => handleDelete(g._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
