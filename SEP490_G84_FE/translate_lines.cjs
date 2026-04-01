const fs = require('fs');
const filePath = 'src/features/furniture/screens/FurnitureInventory.jsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find and replace specific lines based on content patterns
for (let i = 0; i < lines.length; i++) {
    // Line with "Manage faulty..."
    if (lines[i].includes('Qu') && lines[i].includes('thi') && lines[i].includes('trong kho')) {
        lines[i] = '                                Manage faulty and broken equipment in warehouse.';
    }
    // Alert messages
    if (lines[i].includes('alert(\"S?') && lines[i].includes('lu')) {
        lines[i] = lines[i].replace(/alert\([^)]*\)/, 'alert(\"Invalid quantity!\")');
    }
    if (lines[i].includes('alert(\'Kh') && lines[i].includes('kho d')) {
        lines[i] = lines[i].replace(/alert\([^)]*\)/, \"alert('No warehouse fail room found for this branch!')\");
    }
    if (lines[i].includes('chuy') && lines[i].includes('H'))  {
        lines[i] = lines[i].replace(/alert\([^)]*\)/, 'alert(\"Successfully moved items from warehouse fail to normal warehouse!\")');
    }
    if (lines[i].includes('v?t b') && lines[i].includes('h?ng')) {
        lines[i] = lines[i].replace(/alert\([^)]*\)/, 'alert(\"Successfully discarded broken items!\")');
    }
    if (lines[i].includes('C? l?i') || lines[i].includes('x? l')) {
        lines[i] = lines[i].replace(/alert\([^)]*\)/, 'alert(\"Error occurred during processing!\")');
    }
    // Placeholder text
    if (lines[i].includes('Lo?i') && lines[i].includes('VD:')) {
        lines[i] = lines[i].replace(/placeholder="[^"]*"/, 'placeholder="Type (e.g. Lighting equipment...)"');
    }
    // Currency symbols
    if (lines[i].includes(') d') && !lines[i].includes('VND')) {
        lines[i] = lines[i].replace(/\) d/g, ') VND');
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Line-by-line translations completed');
