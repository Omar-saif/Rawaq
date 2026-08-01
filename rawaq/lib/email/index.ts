import { Resend } from "resend";
import { env } from "../env";

const resend = new Resend(env.RESEND_API_KEY);
const fromEmail = env.EMAIL_FROM;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email not sent:", subject);
    return false;
  }
  
  try {
    const { error } = await resend.emails.send({
      from: `Rawaq <${fromEmail}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    return false;
  }
}

export function getOrderConfirmationEmail(order: any, locale: "en" | "ar" = "en") {
  const isAr = locale === "ar";
  const subject = isAr ? `تأكيد طلبك #${order.id.slice(-6)}` : `Order Confirmation #${order.id.slice(-6)}`;

  const itemsHtml = order.items
    .map(
      (item: any) =>
        `<li>${item.quantity}x ${item.product.title} - ${item.unitPrice} SAR</li>`
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; direction: ${isAr ? "rtl" : "ltr"}; text-align: ${isAr ? "right" : "left"};">
      <h1 style="color: #1a365d;">${isAr ? "شكراً لتسوقك معنا!" : "Thank you for your order!"}</h1>
      <p>${isAr ? `لقد تم استلام طلبك بنجاح. رقم الطلب:` : `Your order has been received successfully. Order ID:`} <strong>${order.id.slice(-6)}</strong></p>
      
      <h3>${isAr ? "تفاصيل الطلب:" : "Order Details:"}</h3>
      <ul>
        ${itemsHtml}
      </ul>
      
      <p><strong>${isAr ? "الإجمالي:" : "Total:"}</strong> ${order.total} SAR</p>
      
      <p style="margin-top: 24px; font-size: 14px; color: #666;">
        ${isAr ? "إذا كان لديك أي استفسار، يرجى التواصل معنا." : "If you have any questions, please contact us."}
      </p>
    </div>
  `;

  return { subject, html };
}

export function getOtpEmail(code: string, locale: "en" | "ar" = "en") {
  const isAr = locale === "ar";
  const subject = isAr ? "رمز التحقق من البريد الإلكتروني" : "Your Email Verification Code";
  
  const html = `
    <div style="font-family: sans-serif; direction: ${isAr ? "rtl" : "ltr"}; text-align: ${isAr ? "right" : "left"}; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d;">${isAr ? "التحقق من حسابك" : "Verify your account"}</h1>
      <p>${isAr ? "مرحباً،" : "Hello,"}</p>
      <p>${isAr ? "استخدم الرمز التالي للتحقق من بريدك الإلكتروني. هذا الرمز صالح لمدة 10 دقائق." : "Use the following code to verify your email address. This code is valid for 10 minutes."}</p>
      
      <div style="margin: 32px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #b89855;">${code}</span>
      </div>
      
      <p style="font-size: 14px; color: #64748b;">
        ${isAr ? "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة." : "If you did not request this code, you can safely ignore this email."}
      </p>
    </div>
  `;
  
  return { subject, html };
}

export function getPasswordResetEmail(resetUrl: string, locale: string = "en") {
  const isAr = locale === "ar";
  const title = isAr ? "إعادة تعيين كلمة المرور" : "Reset Your Password";
  
  return {
    subject: `Rawaq | ${title}`,
    html: `
      <div dir="${isAr ? "rtl" : "ltr"}" style="font-family: sans-serif; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0f172a;">${title}</h1>
        <p>${isAr ? "لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. يرجى النقر على الرابط أدناه:" : "You requested a password reset. Please click the link below:"}</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            ${isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </a>
        </div>
        <p style="color: #64748b; font-size: 0.875rem;">
          ${isAr ? "إذا لم تطلب ذلك، يرجى تجاهل هذا البريد الإلكتروني." : "If you didn't request this, you can safely ignore this email."}
        </p>
      </div>
    `,
  };
}

export function getWelcomeEmail(name: string, locale: string = "en") {
  const isAr = locale === "ar";
  const title = isAr ? "مرحباً بك في رواق" : "Welcome to Rawaq";
  
  return {
    subject: `Rawaq | ${title}`,
    html: `
      <div dir="${isAr ? "rtl" : "ltr"}" style="font-family: sans-serif; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0f172a;">${title}, ${name}!</h1>
        <p>${isAr ? "يسعدنا انضمامك إلى عائلة رواق." : "We're thrilled to have you join the Rawaq family."}</p>
        <p>${isAr ? "اكتشف أحدث تشكيلاتنا من الأزياء والعطور العربية." : "Discover our latest collections of Islamic fashion and Arabic perfumes."}</p>
      </div>
    `,
  };
}

export function getOrderStatusEmail(order: any, status: string, locale: string = "en") {
  const isAr = locale === "ar";
  
  let statusText = status;
  let statusTextAr = status;
  
  if (status === "SHIPPED") {
    statusText = "Shipped";
    statusTextAr = "تم الشحن";
  } else if (status === "DELIVERED") {
    statusText = "Delivered";
    statusTextAr = "تم التوصيل";
  }

  const title = isAr ? `تم تحديث حالة الطلب: ${statusTextAr}` : `Order Status Updated: ${statusText}`;
  
  return {
    subject: `Rawaq | ${title}`,
    html: `
      <div dir="${isAr ? "rtl" : "ltr"}" style="font-family: sans-serif; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #0f172a;">${title}</h1>
        <p>${isAr ? "تم تحديث حالة طلبك" : "The status of your order"} <strong>#${order.id.slice(-8).toUpperCase()}</strong> ${isAr ? "إلى" : "has been updated to"} <strong>${isAr ? statusTextAr : statusText}</strong>.</p>
        <p>${isAr ? "شكراً لتسوقك معنا!" : "Thank you for shopping with us!"}</p>
      </div>
    `,
  };
}
