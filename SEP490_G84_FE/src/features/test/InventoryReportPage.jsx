import React, { useState, useMemo } from 'react';

// --- MOCK DATA ---
const initialReportData = [
  { id: 1, name: 'Bàn chải', unit: 'Cái', opening: 937, importTotal: 0, closing: 716 },
  { id: 2, name: 'Bim Bim', unit: 'Gói', opening: 56, importTotal: 265, closing: 204 },
  { id: 3, name: 'Cafe gói G7', unit: 'Gói', opening: 50, importTotal: 100, closing: 0 },
];

const mockImportHistory = {
  2: [ // ID 2 là Bim Bim
    { date: '05/11/2024', qty: 49, price: 5000 },
    { date: '12/11/2024', qty: 96, price: 5000 },
    { date: '20/11/2024', qty: 120, price: 5000 },
  ],
  3: [ // ID 3 là Cafe
    { date: '10/11/2024', qty: 100, price: 2500 },
  ]
};

const InventoryReportPage = () => {
  // --- STATES ---
  const [reportData, setReportData] = useState(initialReportData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);

  // --- HANDLERS ---
  // Cập nhật số lượng tồn cuối khi user gõ
  const handleClosingChange = (id, value) => {
    const numValue = parseInt(value, 10) || 0;
    setReportData(prev =>
      prev.map(item => (item.id === id ? { ...item, closing: numValue } : item))
    );
  };

  // Mở modal xem chi tiết lịch sử nhập
  const openHistoryModal = (item) => {
    if (item.importTotal === 0) return; // Không có nhập thì không mở modal
    setSelectedItemForHistory({
      ...item,
      history: mockImportHistory[item.id] || []
    });
    setIsModalOpen(true);
  };

  // --- RENDER ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Bar */}
      <div className="bg-yellow-400 p-4 rounded-t-lg flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 uppercase">
          Tháng 11/2024 - Báo cáo nhập xuất tồn
        </h1>
        <button className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition flex items-center gap-2 text-sm font-semibold">
          <span>⬇</span> Xuất file Excel
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white shadow-md rounded-b-lg overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="p-4 font-semibold">Hạng mục khấu hao</th>
              <th className="p-4 font-semibold text-center">ĐVT</th>
              <th className="p-4 font-semibold text-center">Tồn kho đầu tháng<br/><span className="font-normal text-xs">(1)</span></th>
              <th className="p-4 font-semibold text-center">Hàng mua trong tháng<br/><span className="font-normal text-xs">(2)</span></th>
              <th className="p-4 font-semibold text-center">Tổng số lượng<br/><span className="font-normal text-xs">(1) + (2)</span></th>
              <th className="p-4 font-semibold text-center text-blue-600 bg-blue-50">TỒN KHO CUỐI THÁNG<br/><span className="font-normal text-xs text-gray-500">(Gõ số đếm thực tế)</span></th>
              <th className="p-4 font-semibold text-center text-green-700 bg-green-50">SỐ LƯỢNG SỬ DỤNG<br/><span className="font-normal text-xs">(Tự động tính)</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reportData.map((item) => {
              const total = item.opening + item.importTotal;
              const used = total - item.closing;

              return (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-900">{item.name}</td>
                  <td className="p-4 text-center text-gray-600">{item.unit}</td>
                  <td className="p-4 text-center">{item.opening}</td>
                  
                  {/* Cột Hàng mua trong tháng - Clickable */}
                  <td className="p-4 text-center">
                    {item.importTotal > 0 ? (
                      <span 
                        onClick={() => openHistoryModal(item)}
                        className="text-blue-600 font-semibold cursor-pointer hover:underline"
                        title="Click để xem chi tiết các lần nhập"
                      >
                        +{item.importTotal}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  <td className="p-4 text-center font-bold">{total}</td>
                  
                  {/* Cột Nhập Tồn Cuối */}
                  <td className="p-3 bg-blue-50/30">
                    <input
                      type="number"
                      min="0"
                      className="w-full text-center border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-gray-700"
                      value={item.closing}
                      onChange={(e) => handleClosingChange(item.id, e.target.value)}
                    />
                  </td>
                  
                  {/* Cột Sử Dụng */}
                  <td className={`p-4 text-center font-bold ${used < 0 ? 'text-red-500' : 'text-green-600'} bg-green-50/30`}>
                    {used}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Action Footer */}
        <div className="p-4 flex justify-end bg-gray-50 border-t">
          <button className="bg-emerald-700 text-white px-6 py-2 rounded hover:bg-emerald-800 transition font-semibold shadow-md">
            LƯU BÁO CÁO THÁNG
          </button>
        </div>
      </div>

      {/* --- MODAL LỊCH SỬ NHẬP --- */}
      {isModalOpen && selectedItemForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                Lịch sử nhập hàng: <span className="text-blue-600">{selectedItemForHistory.name}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 font-bold text-xl"
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <table className="w-full text-sm text-left border">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3">Ngày nhập</th>
                    <th className="p-3 text-right">Số lượng</th>
                    <th className="p-3 text-right">Đơn giá</th>
                    <th className="p-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedItemForHistory.history.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-3">{hist.date}</td>
                      <td className="p-3 text-right font-semibold">+{hist.qty}</td>
                      <td className="p-3 text-right">{hist.price.toLocaleString()} đ</td>
                      <td className="p-3 text-right font-bold text-gray-700">
                        {(hist.qty * hist.price).toLocaleString()} đ
                      </td>
                    </tr>
                  ))}
                  {/* Dòng tổng cộng */}
                  <tr className="bg-blue-50 font-bold">
                    <td className="p-3 text-right text-blue-800 uppercase">Tổng cộng:</td>
                    <td className="p-3 text-right text-blue-800">+{selectedItemForHistory.importTotal}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReportPage;