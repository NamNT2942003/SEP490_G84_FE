const fs = require('fs');
const txt = fs.readFileSync('D:/Program Files/SEP490_G84_FE/SEP490_G84_FE/src/features/booking/components/BookingSummary.jsx', 'utf-8');
for (let i = 0; i < txt.length; i++) {
  if (txt.charCodeAt(i) > 127) {
    console.log(i, txt.charAt(i), txt.charCodeAt(i).toString(16));
  }
}
