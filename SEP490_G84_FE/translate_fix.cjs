const fs = require('fs');
const filePath = 'src/features/furniture/screens/FurnitureInventory.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Qu') && lines[i].includes('thi') && lines[i].includes('trong kho')) {
        lines[i] = '                                Manage faulty and broken equipment in warehouse.';
    }
    if (lines[i].includes('alert("S?') && lines[i].includes('lu')) {
        lines[i] = '                alert("Invalid quantity!");';
    }
    if (lines[i].includes('alert(') && lines[i].includes('Kh?ng t?m')) {
        lines[i] = '                alert("No warehouse fail room found for this branch!");';
    }
    if (lines[i].includes('alert(') && lines[i].includes('chuy')) {
        lines[i] = '                alert("Successfully moved items from warehouse fail to normal warehouse!");';
    }
    if (lines[i].includes('alert(') && lines[i].includes('v?t b')) {
        lines[i] = '                alert("Successfully discarded broken items!");';
    }
    if (lines[i].includes('const msg =') && lines[i].includes('C?')) {
        lines[i] = "            const msg = e?.response?.data?.message || 'Error occurred during processing!';";
    }
    if (lines[i].includes('placeholder=') && lines[i].includes('Lo?i')) {
        lines[i] = '                                                  placeholder="Type (e.g. Lighting equipment...)"';
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Translations completed');
