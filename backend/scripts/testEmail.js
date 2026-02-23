require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('📧 بدء اختبار الإيميل...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `[موجود - ${process.env.EMAIL_PASS.length} حرف]` : '[فارغ!]');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    debug: true,   // يطبع تفاصيل الاتصال
    logger: true   // يسجل كل الخطوات
});

async function testEmail() {
    try {
        // خطوة 1: تحقق من صحة الإعدادات
        console.log('\n🔍 جاري التحقق من الإعدادات...');
        await transporter.verify();
        console.log('✅ الإعدادات صحيحة! الاتصال بـ Gmail تم بنجاح');

        // خطوة 2: إرسال إيميل تجريبي
        console.log('\n📤 جاري إرسال إيميل تجريبي...');
        const info = await transporter.sendMail({
            from: `"اختبار" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // إرسال لنفس الإيميل
            subject: 'اختبار - كود التحقق: 123456',
            html: '<h2>اختبار ناجح! ✅</h2><p>الكود التجريبي: <strong>123456</strong></p>'
        });

        console.log('✅ تم إرسال الإيميل بنجاح!');
        console.log('Message ID:', info.messageId);

    } catch (error) {
        console.log('\n❌ فشل الإرسال!');
        console.log('رمز الخطأ:', error.code);
        console.log('سبب الخطأ:', error.message);

        // تشخيص الأخطاء الشائعة
        if (error.code === 'EAUTH') {
            console.log('\n💡 الحل: مشكلة في المصادقة - تحقق من:');
            console.log('   1. الـ App Password صحيح وبدون مسافات في الـ .env');
            console.log('   2. التحقق بخطوتين مفعّل على حساب Gmail');
            console.log('   3. روح على: myaccount.google.com/apppasswords واعمل App Password جديد');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            console.log('\n💡 الحل: مشكلة في الاتصال بالإنترنت أو Gmail محجوب');
        } else if (error.code === 'EENVELOPE') {
            console.log('\n💡 الحل: الإيميل المُرسَل إليه غير صحيح');
        }
    }
}

testEmail();