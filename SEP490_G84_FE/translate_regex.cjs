const fs = require('fs');
const filePath = 'src/features/furniture/screens/FurnitureInventory.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace using regex patterns to handle encoding issues
content = content.replace(/Qu\?n l\? c\?c thi\?t b\? l\?i\/h\?ng trong kho\./g, 'Manage faulty and broken equipment in warehouse.');
content = content.replace(/M\? kho thi\?t b\? l\?i/g, 'Warehouse Fail');
content = content.replace(/S\? lu\?ng kh\?ng h\?p l\?!/g, 'Invalid quantity!');
content = content.replace(/Kh\?ng t\?m th\?y kho d\? h\?ng cho chi nh\?nh n\?y!/g, 'No warehouse fail room found for this branch!');
content = content.replace(/D\? chuy\?n d\? t\? Kho H\?ng v\? Kho th\?nh c\?ng!/g, 'Successfully moved items from warehouse fail to normal warehouse!');
content = content.replace(/D\? v\?t b\? d\? h\?ng!/g, 'Successfully discarded broken items!');
content = content.replace(/C\? l\?i x\?y ra khi x\? l\?!/g, 'Error occurred during processing!');
content = content.replace(/Lo\?i \(VD: D\? chi\?u s\?ng\.\.\.\)/g, 'Type (e.g. Lighting equipment...)');
content = content.replace(/\) d/g, ') VND');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Translations completed successfully');
