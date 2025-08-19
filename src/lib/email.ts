import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Підтвердження email - Travel Planner',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Підтвердіть ваш email</h2>
        <p>Дякуємо за реєстрацію в Travel Planner!</p>
        <p>Для завершення реєстрації, будь ласка, натисніть на кнопку нижче:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Підтвердити Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Якщо кнопка не працює, скопіюйте це посилання у ваш браузер:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Це посилання діє протягом 24 годин.
        </p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Відновлення паролю - Travel Planner',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Відновлення паролю</h2>
        <p>Ви запросили відновлення паролю для вашого акаунту в Travel Planner.</p>
        <p>Для створення нового паролю, натисніть на кнопку нижче:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Відновити Пароль
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Якщо кнопка не працює, скопіюйте це посилання у ваш браузер:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Це посилання діє протягом 1 години. Якщо ви не запрошували відновлення паролю, проігноруйте цей лист.
        </p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

export const sendInvitationEmail = async (
  recipientEmail: string,
  senderName: string,
  tripTitle: string,
  token: string
) => {
  const invitationUrl = `${process.env.APP_URL}/invitations/accept?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `Запрошення до подорожі "${tripTitle}" - Travel Planner`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Запрошення до співпраці</h2>
        <p><strong>${senderName}</strong> запрошує вас співпрацювати над подорожжю <strong>"${tripTitle}"</strong>!</p>
        <p>Як співавтор, ви зможете:</p>
        <ul>
          <li>Додавати та редагувати місця в подорожі</li>
          <li>Переглядати деталі подорожі</li>
          <li>Співпрацювати з іншими учасниками</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}"
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Прийняти Запрошення
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Якщо кнопка не працює, скопіюйте це посилання у ваш браузер:<br>
          <a href="${invitationUrl}">${invitationUrl}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Це запрошення діє протягом 24 годин.
        </p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}
