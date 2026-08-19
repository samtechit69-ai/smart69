/*************************************************************
 * CONFIG — แก้ไขค่าเหล่านี้ก่อน deploy ขึ้น GitHub Pages
 *************************************************************/
const CONFIG = {
  // LIFF ID จาก LINE Developers Console (LIFF app ต้องตั้ง Endpoint URL
  // เป็น URL ของ GitHub Pages นี้ เช่น https://yourname.github.io/repo/)
  LIFF_ID: '2011096373-ztYJQ1v9',

  // URL ของ Google Apps Script Web App ที่ deploy แล้ว
  // (Deploy > New deployment > Web app > Who has access: Anyone)
  // รูปแบบ: https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
  API_URL: 'https://script.google.com/macros/s/AKfycbz-O0ScTAfDl_956FKnMzJSA4vVRwa4aeVIul2MTyh0TC02gt0FdyjfkJcro__0v9HHGQ/exec',

  // รายชื่อ LINE UserId ของผู้ที่มีสิทธิ์เข้าแท็บ Admin (ใส่ได้หลายคน)
  // วิธีหา LINE UserId ของตัวเอง: เข้าระบบผ่าน LIFF แล้วลองแจ้งซ่อม 1 ครั้ง
  // จากนั้นเปิด Google Sheet ชีต "Requests" ดูคอลัมน์ "LINE UserId" ในแถวของตัวเอง
  // ⚠️ ต้องตั้งค่าชุดเดียวกันนี้ใน ADMIN_LINE_IDS ของ Code.gs ด้วย (ฝั่ง Backend)
  ADMIN_LINE_IDS: [
    'Ufa6024ec02c572e7a805a08dc3868729'
  ]
};
