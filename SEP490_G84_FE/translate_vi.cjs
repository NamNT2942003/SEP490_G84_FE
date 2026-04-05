const fs = require('fs');
const path = require('path');

const filePath = 'src/features/furniture/screens/FurnitureInventory.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace Vietnamese text with English
const replacements = {
    'M? kho thi?t b? l?i': 'Warehouse Fail',
    'Qu?n l? c?c thi?t b? l?i/h?ng trong kho.': 'Manage faulty and broken equipment in warehouse.',
    'S? lu?ng kh?ng h?p l?!': 'Invalid quantity!',
    'Kh?ng t?m th?y kho d? h?ng cho chi nh?nh n?y!': 'No warehouse fail room found for this branch!',
    'D? chuy?n d? t? Kho H?ng v? Kho th?nh c?ng!': 'Successfully moved items from warehouse fail to normal warehouse!',
    'D? v?t b? d? h?ng!': 'Successfully discarded broken items!',
    'C? l?i x?y ra khi x? l?!': 'Error occurred during processing!',
    'Lo?i (VD: D? chi?u s?ng...)': 'Type (e.g. Lighting equipment...)',
    ') d': ') VND'
};

for (const [vi, en] of Object.entries(replacements)) {
    content = content.split(vi).join(en);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Translations completed');
