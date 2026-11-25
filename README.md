# PULSE

ระบบลงทะเบียนอีเวนต์และคอนเสิร์ตฟรี พร้อมบัตร QR และการเช็กอิน พัฒนาด้วย React, Vite และ Supabase

| บทบาท | หน้าที่ |
| --- | --- |
| User | ค้นหางานสาธารณะ ลงทะเบียน เลือกที่นั่ง และดูหรือยกเลิกบัตรของบัญชีตัวเอง |
| Organizer | สร้างและเผยแพร่งานของตัวเอง กำหนดจำนวนหรือผังที่นั่ง ดูรายชื่อผู้ลงทะเบียน และเพิ่ม Staff ประจำงาน |
| Staff | สแกน QR หรือกรอกรหัสบัตรเพื่อเช็กอินให้กับงานที่ได้รับมอบหมาย |

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ใน Supabase และเปิด Data API สำหรับ schema `public`
2. รัน migration ตามลำดับใน SQL Editor ของโปรเจกต์ ครั้งละหนึ่งไฟล์ สำหรับฐานข้อมูลที่ตั้งค่า PULSE ไว้แล้ว ให้รัน migration ที่ยังไม่ได้ใช้ [ฐานข้อมูลเริ่มต้น](./supabase/migrations/20261125000000_pulse.sql) · [Staff ประจำงาน](./supabase/migrations/20261125000100_event_staff_workspace.sql) · [เปิดรับลงทะเบียนอีกครั้ง](./supabase/migrations/20261125000200_reopen_closed_events.sql) · [ตรวจบทบาท Staff](./supabase/migrations/20261126000000_require_staff_role_for_event_assignments.sql) · [คู่มือ migration ผ่าน CLI](https://supabase.com/docs/guides/local-development/database-migrations)
3. เปิด Email provider และอนุญาตการสมัครบัญชีใหม่ใน **Authentication → Sign In / Providers** เปิด Confirm email หากต้องการให้ผู้สมัครยืนยันอีเมล
4. ใน **Authentication → URL Configuration** ตั้ง **Site URL** เป็น origin ของเว็บ และเพิ่ม URL หน้าเข้าสู่ระบบที่อนุญาตใน **Redirect URLs** เช่น `http://localhost:5173/login` สำหรับเครื่องพัฒนา และ `https://your-app.example/login` โดยใช้โดเมนจริงสำหรับ Production
5. คัดลอก Project URL และ Publishable key จาก **Connect** ไปตั้งค่าในแอปตามด้านล่าง

[ตั้งค่า Supabase สำหรับ React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) · [ตั้งค่า Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

หากเปิดยืนยันอีเมลสำหรับผู้สมัครทั่วไป ให้กำหนด Custom SMTP ใน Supabase เพื่อให้ส่งเมลได้ถึงผู้รับนอกทีมโปรเจกต์ [ตั้งค่า SMTP สำหรับ Supabase Auth](https://supabase.com/docs/guides/auth/auth-smtp)

## รันเว็บ

ใช้ Node.js ที่รองรับ Vite 8 และตั้งค่าจาก `.env.example`

```powershell
npm ci
Copy-Item .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

โปรเจกต์ Supabase ที่ใช้คีย์แบบเดิมสามารถตั้ง `VITE_SUPABASE_ANON_KEY` ได้ เก็บคีย์ `service_role` และ Secret key ไว้ฝั่งเซิร์ฟเวอร์

```powershell
npm run dev
```

เปิด `http://localhost:5173` เพื่อดู Explore หรือไปที่ `/register` เพื่อสมัครสมาชิก ผู้สมัครใหม่ได้รับบทบาท User และยืนยันผ่านลิงก์ที่ส่งทางอีเมลเมื่อเปิดใช้ Confirm email ลิงก์พากลับมาที่ `/login` หลังเข้าสู่ระบบจากหน้า Login ระบบเปิดหน้าตามบทบาทหรือส่งกลับไปยังหน้าที่ขอเปิดก่อนเข้าสู่ระบบ

## ให้สิทธิ์ Organizer และ Staff

ให้ผู้ดูแล Supabase สร้างบัญชีผ่าน **Authentication → Users** สำหรับ Staff และ Organizer โดยตรวจสอบอีเมลกับเจ้าของบัญชีก่อน คัดลอก User UID จากบัญชีที่สร้าง แล้วกำหนดบทบาทใน SQL Editor ใช้ `staff` สำหรับ Staff หรือ `organizer` สำหรับ Organizer

```sql
update public.profiles
set role = 'staff'
where id = '<auth-user-uid>';
```

หากอีเมลถูกใช้สมัครไปแล้ว ให้ตรวจว่าใครควบคุมบัญชีเดิมก่อนพิจารณาให้สิทธิ์ หรือสร้างบัญชีทีมงานด้วยอีเมลอื่นที่ตรวจสอบแล้ว

Organizer เปิดงานของตัวเองจากรายการงาน แล้วไปที่แท็บ **Staff → เพิ่ม Staff** และกรอกอีเมลบัญชี Staff ที่แอดมินสร้างให้ ระบบจะตรวจอีเมลและบทบาท `staff` ก่อนมอบหมายงาน บัญชีที่เคยได้รับมอบหมายจะใช้สิทธิ์ได้เมื่อมีบทบาท `staff` เมื่อเผยแพร่งาน Staff จะพบงานที่เมนู **เช็กอิน** (`/staff`) หากเปิดเว็บอยู่ ให้โหลดหน้าใหม่เพื่ออัปเดตสิทธิ์

## Build และเผยแพร่เว็บ

```powershell
npm run build
npm run preview
```

เผยแพร่โฟลเดอร์ `dist` บนโฮสต์ที่รองรับ SPA fallback ไปยัง `index.html` ตั้งค่า Supabase environment variables ก่อน Build และใช้ HTTPS เพื่อให้เบราว์เซอร์เปิดกล้องสแกน QR ได้ ทีม Staff สามารถกรอกรหัสบัตรด้วยตนเองได้เช่นกัน

บนโฮสต์ Apache ที่รองรับ `mod_rewrite` ให้วาง `.htaccess` จาก `dist` ไว้ใน Document Root ของโดเมนเดียวกับ `index.html` หากมี `.htaccess` อยู่แล้ว ให้เพิ่มกฎ PULSE ลงในไฟล์เดิมก่อนกฎที่จับทุกเส้นทาง แล้วลองเปิดหรือรีเฟรช `/register` โดยตรง

[ข้อกำหนดผลิตภัณฑ์](./PULSE_Requirements_TH.md) · [สถาปัตยกรรมและข้อมูล](./PULSE_Technical_Spec_TH.md)
