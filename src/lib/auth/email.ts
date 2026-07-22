import nodemailer from "nodemailer";

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export async function sendVerificationEmail({
  email,
  code
}: {
  email: string;
  code: string;
}) {
  const config = smtpConfig();

  if (!config) {
    console.info(`Development email code for ${email}: ${code}`);
    return { delivered: false };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "企业规划平台登录验证码",
    text: `你的验证码是 ${code}，10 分钟内有效。`
  });

  return { delivered: true };
}

function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (!host || !user || !pass || !from || !Number.isFinite(port)) {
    return null;
  }

  return { host, port, user, pass, from };
}
