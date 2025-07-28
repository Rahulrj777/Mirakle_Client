import nodemailer from "nodemailer"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { name, email, message } = req.body

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["name", "email", "message"],
    })
  }

  try {
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: "rahulsrinivasannkl@gmail.com",
        pass: "gvdj rqmu nrff cudu", // Your Gmail app password
      },
    })

    const mailOptions = {
      from: "rahulsrinivasannkl@gmail.com",
      to: "rahulsrinivasannkl@gmail.com",
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("📧 Email sent successfully")

    res.status(200).json({
      message: "Message sent successfully!",
    })
  } catch (error) {
    console.error("📧 Email error:", error)
    res.status(500).json({
      error: "Failed to send email",
      details: error.message,
    })
  }
}
