import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

interface JobData {
  citaId: number;
  destinatario: string;
  nombrePaciente: string;
  fecha: string;
  hora: string;
}

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    // Configuración SMTP desde variables de entorno
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true si usas puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private generarMensajeHTML(data: JobData): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Recordatorio de Cita</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 20px !important; }
          .card { padding: 20px !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; font-family:Arial, sans-serif; background:#f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
        <tr>
          <td align="center">
            <table class="container" width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:10px; overflow:hidden;">
              <tr>
                <td style="background:#4CAF50; padding:25px; text-align:center; color:white;">
                  <h1 style="margin:0;">Clínica Odontológica Identiclinic</h1>
                </td>
              </tr>
              <tr>
                <td class="card" style="padding:30px; font-size:16px; color:#333;">
                  <p>Hola <strong>${data.nombrePaciente}</strong>,</p>
                  <p>Te recordamos que tienes una cita programada con nosotros.</p>
                  <div style="background:#f0f9f0; padding:20px; border-radius:8px; margin:20px 0; border-left:5px solid #4CAF50;">
                    <p><strong>📅 Fecha:</strong> ${data.fecha}</p>
                    <p><strong>⏰ Hora:</strong> ${data.hora}</p>
                  </div>
                  <p>Si necesitas reprogramar o cancelar tu cita, puedes comunicarte con nosotros.</p>
                  <p style="margin-top:30px;">Gracias por confiar en <strong>Identiclinic</strong> 🦷✨</p>
                </td>
              </tr>
              <tr>
                <td style="background:#eeeeee; padding:15px; text-align:center; font-size:12px; color:#555;">
                  Clínica Odontológica Identiclinic<br>
                  © 2025 Todos los derechos reservados
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"Clínica Odontológica Identiclinic" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`Correo enviado a: ${to}`);
    } catch (error) {
      console.error(`Error al enviar correo a ${to}:`, error);
      throw error;
    }
  }

  async procesarTareaRecordatorio(data: JobData) {
    console.log(`[Cita ${data.citaId}] Iniciando envío de correo.`);
    const html = this.generarMensajeHTML(data);
    await this.sendMail(data.destinatario, 'Recordatorio de cita', html);
    console.log(`[Cita ${data.citaId}] Tarea completada y ACK enviado.`);
  }
}
