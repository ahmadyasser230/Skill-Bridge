const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, '') // إزالة المسافات تلقائياً
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

const sendVerificationCode = async (email, name, code) => {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"Skill Bridge" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'كود تفعيل حسابك - Skill Bridge',
        html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50;">مرحباً ${name} 👋</h2>
                <p style="color: #555; font-size: 16px;">شكراً لتسجيلك في <strong>Skill Bridge</strong>. لإتمام تفعيل حسابك، استخدم الكود التالي:</p>
                <div style="background-color: #2c3e50; color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    ${code}
                </div>
                <p style="color: #888; font-size: 14px;">⚠️ صلاحية الكود 10 دقائق فقط. إذا لم تطلب هذا الكود، تجاهل هذا البريد.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #aaa; font-size: 12px; text-align: center;">Skill Bridge - نتشارك المعرفة ونبني المستقبل</p>
            </div>
        `
    });
};

const sendPasswordResetCode = async (email, name, code) => {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"Skill Bridge" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'كود إعادة تعيين كلمة المرور - Skill Bridge',
        html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px; background-color: #f9f9f9;">
                <h2 style="color: #2c3e50;">مرحباً ${name} 👋</h2>
                <p style="color: #555; font-size: 16px;">استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بك في <strong>Skill Bridge</strong>. استخدم الكود التالي:</p>
                <div style="background-color: #e74c3c; color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    ${code}
                </div>
                <p style="color: #888; font-size: 14px;">⚠️ صلاحية الكود 10 دقائق فقط. إذا لم تطلب هذا الكود، تجاهل هذا البريد وحسابك بأمان.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #aaa; font-size: 12px; text-align: center;">Skill Bridge - نتشارك المعرفة ونبني المستقبل</p>
            </div>
        `
    });
};

module.exports = { sendVerificationCode, sendPasswordResetCode };