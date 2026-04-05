const fs = require('fs');
const filePath = 'src/features/furniture/screens/FurnitureInventory.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the directly encoded Vietnamese text in alert boxes (using any byte pattern)
content = content.replace(/alert\('Kh[^)]*kho d[^)]*h[^)]*ng cho chi nh[^)]*nh n[^)]*y!'\)/g, "alert('No warehouse fail room found for this branch!')");
content = content.replace(/const msg = e\?\.response\?\.data\?\.message \|\| 'C[^']*l[^']*i x[^']*y ra khi x[^']*l[^']*!'/g, "const msg = e?.response?.data?.message || 'Error occurred during processing!'");

// Check for type placeholder
content = content.replace(/placeholder="Lo[^"]*i \(VD: .*?\.\.\.\)"/g, 'placeholder="Type (e.g. Lighting equipment...)"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Remaining translations fixed');
