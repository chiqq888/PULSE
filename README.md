# PULSE

ระบบลงทะเบียนอีเวนต์และคอนเสิร์ตฟรี พร้อมบัตร QR และการเช็กอิน พัฒนาด้วย React, Vite และ Supabase

| บทบาท | หน้าที่ |
| --- | --- |
| User | ค้นหางานสาธารณะ ลงทะเบียน เลือกที่นั่ง และดูหรือยกเลิกบัตรของบัญชีตัวเอง |
| Organizer | สร้างและเผยแพร่งานของตัวเอง กำหนดจำนวนหรือผังที่นั่ง และดูรายชื่อผู้ลงทะเบียน |
| Staff | สแกน QR หรือกรอกรหัสบัตรเพื่อเช็กอินให้กับงานที่ได้รับมอบหมาย |

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ใน Supabase และเปิด Data API สำหรับ schema `public`
2. รัน migration ทั้งไฟล์ใน SQL Editor ของโปรเจกต์หนึ่งครั้ง ฐานข้อมูลเริ่มต้นพร้อมหมวดหมู่ให้ผู้จัดใช้สร้างงาน สำหรับโปรเจกต์ที่จัดการ migration ผ่าน CLI ให้ใช้คำสั่ง push ตามคู่มือ Supabase [ไฟล์ migration](./supabase/migrations/20261125000000_pulse.sql) · [คู่มือ migration ผ่าน CLI](https://supabase.com/docs/guides/local-development/database-migrations)
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

ให้บุคคลที่จะใช้งานสมัครผ่าน `/register` ก่อน จากนั้นผู้ดูแล Supabase กำหนดบทบาทใน SQL Editor โดยระบุอีเมลของแต่ละบัญชี

```sql
update public.profiles
set role = 'organizer'
where id = (select id from auth.users where email = '<organizer-email>');

update public.profiles
set role = 'staff'
where id = (select id from auth.users where email = '<staff-email>');
```

Organizer เข้าหน้า `/org` เพื่อสร้างงาน ส่วน Staff เข้าหน้า `/staff` หลังผู้ดูแลมอบหมายงานโดยใช้รหัสงานจริง

```sql
insert into public.staff_event_assignments (event_id, staff_id)
select '<event-id>', id
from auth.users
where email = '<staff-email>';
```

หากบัญชีเข้าสู่ระบบอยู่แล้ว ให้ออกจากระบบแล้วเข้าสู่ระบบอีกครั้งเพื่อโหลดสิทธิ์ล่าสุด

## Build และเผยแพร่เว็บ

```powershell
npm run build
npm run preview
```

เผยแพร่โฟลเดอร์ `dist` บนโฮสต์ที่รองรับ SPA fallback ไปยัง `index.html` ตั้งค่า Supabase environment variables ก่อน Build และใช้ HTTPS เพื่อให้เบราว์เซอร์เปิดกล้องสแกน QR ได้ ทีม Staff สามารถกรอกรหัสบัตรด้วยตนเองได้เช่นกัน

[ข้อกำหนดผลิตภัณฑ์](./PULSE_Requirements_TH.md) · [สถาปัตยกรรมและข้อมูล](./PULSE_Technical_Spec_TH.md)
