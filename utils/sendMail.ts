import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from "url"; // Import from 'url'
// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOption {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOption): Promise<void> => {
  const transport: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;

  //get the pdathe to the email file
  const templatePath = path.join(__dirname, "../mails", template);

  //Render the email template with ejs
  const html: string = await ejs.renderFile(templatePath, data);
  const mailOption = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  await transport.sendMail(mailOption);
};

export default sendMail;
