# منصة طلاب غزة - Gaza Students Platform

منصة تعليمية شاملة للتعاون والمساعدة بين طلاب الجامعات في غزة.

## المميزات

### 1. نظام طلب المساعدة
- الطلاب يمكنهم طلب مساعدة من طلاب آخرين
- نظام عروض المساعدة مع مكافآت نقطية
- قبول العروض وإنشاء محادثات مباشرة
- الطالب الطالب للمساعدة لا يخسر شيء
- المساعد يربح نقاط حسب حجم المساعدة

### 2. نظام الدورات التعليمية
- إنشاء دورات تعليمية مع فيديوهات
- شراء الدورات بالنقاط المكتسبة
- تتبع تقدم الطالب في الدورة
- نظام تقييمات ومراجعات
- المدرس يربح سعر الدورة والطالب يدفع بالنقاط

### 3. نظام المحادثات
- محادثات فورية بين الطلاب
- ربط المحادثات بطلبات المساعدة
- واجهة سهلة الاستخدام

### 4. نظام الإشعارات
- إشعارات لجميع الأنشطة المهمة
- عروض مساعدة جديدة
- رسائل جديدة
- تسجيلات في الدورات

### 5. لوحة التحكم الشخصية
- عرض المهارات والمشاريع
- إدارة الدورات المسجل بها
- عرض النقاط المكتسبة
- روابط سريعة للوظائف الرئيسية

## التقنيات المستخدمة

### Backend
- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل الخادم
- **MongoDB** - قاعدة البيانات
- **Mongoose** - مكتبة التعامل مع MongoDB
- **JWT** - المصادقة والتوثيق
- **Socket.io** - المحادثات الفورية
- **bcryptjs** - تشفير كلمات المرور

### Frontend
- **React.js** - مكتبة بناء واجهة المستخدم
- **React Router** - التنقل بين الصفحات
- **Axios** - التعامل مع API
- **Socket.io Client** - اتصال المحادثات الفورية
- **React Icons** - الأيقونات

## متطلبات التشغيل

- Node.js (الإصدار 14 أو أحدث)
- MongoDB (الإصدار 4 أو أحدث)
- npm أو yarn

## التثبيت والتشغيل

### 1. تثبيت MongoDB
```bash
# على Ubuntu/Debian
sudo apt-get install mongodb

# على macOS
brew install mongodb-community

# على Windows
# قم بتحميل وتثبيت MongoDB من الموقع الرسمي
```

### 2. تشغيل MongoDB
```bash
# تشغيل MongoDB
sudo systemctl start mongodb

# أو
mongod
```

### 3. إعداد Backend

```bash
# الانتقال إلى مجلد Backend
cd backend

# تثبيت المكتبات
npm install

# نسخ ملف البيئة
cp .env.example .env

# تعديل ملف .env بالإعدادات المناسبة
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/gaza-students-platform
# JWT_SECRET=your_secret_key_here

# تشغيل الخادم
npm start

# أو للتطوير مع إعادة التشغيل التلقائي
npm run dev
```

### 4. إعداد Frontend

```bash
# في نافذة Terminal جديدة، انتقل إلى مجلد Frontend
cd frontend

# تثبيت المكتبات
npm install

# تشغيل التطبيق
npm start
```

الآن يمكنك الوصول إلى:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## هيكل المشروع

```
gaza-students-platform/
├── backend/
│   ├── models/           # نماذج قاعدة البيانات
│   │   ├── User.js
│   │   ├── HelpRequest.js
│   │   ├── Course.js
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── routes/           # مسارات API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── HelpRequests.js
│   │   ├── courses.js
│   │   ├── messages.js
│   │   └── notifications.js
│   ├── middleware/       # Middleware
│   │   └── auth.js
│   ├── Server.js        # ملف الخادم الرئيسي
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/   # المكونات المشتركة
    │   │   └── Navbar.js
    │   ├── pages/        # صفحات التطبيق
    │   │   ├── Welcome.js
    │   │   ├── Register.js
    │   │   ├── Login.js
    │   │   ├── Dashboard.js
    │   │   ├── HelpRequests.js
    │   │   ├── Courses.js
│   │   │   ├── CourseDetails.js
    │   │   ├── Messages.js
    │   │   └── Notifications.js
    │   ├── context/      # Context API
    │   │   └── AuthContext.js
    │   ├── utils/        # أدوات مساعدة
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## استخدام المنصة

### 1. التسجيل
- افتح الصفحة الرئيسية
- اضغط على "إنشاء حساب"
- أدخل البيانات المطلوبة:
  - الاسم الكامل
  - البريد الإلكتروني
  - كلمة المرور
  - الرقم الجامعي
  - الجامعة
  - التخصص
  - المهارات

### 2. طلب المساعدة
- اذهب إلى "طلبات المساعدة"
- اضغط على "طلب مساعدة جديد"
- أدخل تفاصيل الطلب
- انتظر عروض المساعدة من الطلاب الآخرين
- اقبل العرض المناسب
- ابدأ المحادثة مع المساعد

### 3. تقديم المساعدة
- تصفح طلبات المساعدة المتاحة
- اختر طلب مناسب لمهاراتك
- قدم عرضك مع اقتراح النقاط
- انتظر قبول العرض
- بعد إكمال المساعدة، ستحصل على النقاط

### 4. الدورات
- **إنشاء دورة:**
  - اضغط على "إنشاء دورة جديدة"
  - أدخل معلومات الدورة
  - أضف فيديوهات تعليمية
  
- **الالتحاق بدورة:**
  - تصفح الدورات المتاحة
  - اضغط على الدورة لعرض التفاصيل
  - اضغط "التسجيل في الدورة"
  - شاهد الفيديوهات وتابع تقدمك

## API Endpoints

### Authentication
- `POST /api/auth/register` - التسجيل
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - الحصول على بيانات المستخدم الحالي

### Users
- `GET /api/users/profile/:id` - عرض ملف المستخدم
- `PUT /api/users/profile` - تحديث الملف الشخصي
- `POST /api/users/projects` - إضافة مشروع
- `GET /api/users/dashboard` - بيانات لوحة التحكم

### Help Requests
- `POST /api/help-requests` - إنشاء طلب مساعدة
- `GET /api/help-requests` - عرض جميع الطلبات المفتوحة
- `GET /api/help-requests/my-requests` - طلبات المستخدم
- `POST /api/help-requests/:id/offers` - تقديم عرض
- `POST /api/help-requests/:requestId/offers/:offerId/accept` - قبول عرض
- `POST /api/help-requests/:id/complete` - إكمال طلب

### Courses
- `POST /api/courses` - إنشاء دورة
- `GET /api/courses` - عرض جميع الدورات
- `GET /api/courses/:id` - عرض دورة محددة
- `POST /api/courses/:id/enroll` - التسجيل في دورة
- `PUT /api/courses/:id/progress` - تحديث التقدم
- `POST /api/courses/:id/reviews` - إضافة تقييم
- `POST /api/courses/:id/videos` - إضافة فيديو

### Messages
- `GET /api/messages` - عرض غرف المحادثة
- `GET /api/messages/:id` - عرض محادثة محددة
- `POST /api/messages/:id/messages` - إرسال رسالة

### Notifications
- `GET /api/notifications` - عرض الإشعارات
- `PUT /api/notifications/:id/read` - تحديد كمقروء
- `PUT /api/notifications/read-all` - تحديد الكل كمقروء
- `DELETE /api/notifications/:id` - حذف إشعار
- `GET /api/notifications/unread-count` - عدد الإشعارات غير المقروءة

## الأمان

- كلمات المرور مشفرة باستخدام bcrypt
- المصادقة عبر JWT tokens
- حماية المسارات بـ Authentication Middleware
- التحقق من البيانات المدخلة

## التطوير المستقبلي

- [ ] نظام تقييم للمساعدين
- [ ] دعم رفع الملفات
- [ ] نظام بحث متقدم
- [ ] إشعارات push
- [ ] نظام badges وإنجازات
- [ ] تطبيق موبايل
- [ ] نظام دفع حقيقي

## المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء branch جديد للميزة
3. Commit التغييرات
4. Push إلى Branch
5. فتح Pull Request

## الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام التعليمي والشخصي.

## الدعم

للأسئلة والدعم، يرجى فتح issue في GitHub أو التواصل عبر البريد الإلكتروني.

---

**ملاحظة**: هذا المشروع تم تطويره لأغراض تعليمية ويهدف لمساعدة طلاب غزة في التعاون والتعلم المشترك.