const fs = require('fs');
let content = fs.readFileSync('src/features/roomManagement/components/ReplaceFromInventoryModal.jsx', 'utf8');

const reps = {
  'Thay tháº¿ tá»« kho': 'Thay thế từ kho',
  'Äang thay:': 'Đang thay:',
  'â€”': '—',
  'TÃ¬m trong kho...': 'Tìm trong kho...',
  'TÃ¬m': 'Tìm',
  'KhÃ´ng cÃ³ item trong kho.': 'Không có item trong kho.',
  'MÃ£ TB:': 'Mã TB:',
  'â€¢ Chi nhÃ¡nh:': '• Chi nhánh:',
  'ÄÃ£ chá»n': 'Đã chọn',
  'ChÆ°a chá»n': 'Chưa chọn',
  'Huá»·': 'Huỷ',
  'Äang thay...': 'Đang thay...',
  'Thay tháº¿': 'Thay thế'
};

for (let k in reps) {
  content = content.split(k).join(reps[k]);
}

fs.writeFileSync('src/features/roomManagement/components/ReplaceFromInventoryModal.jsx', content, 'utf8');
