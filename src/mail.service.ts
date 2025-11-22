// mail-consumer/src/mailer.service.ts
import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

interface JobData {
  citaId: number;
  destinatario: string;
  nombrePaciente: string;
  fecha: string;
  hora: string;
}

@Injectable()
export class MailService {
  private fromEmail: string;

  constructor() {
    // Leer variables de entorno críticas
    const sendgridKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || '';

    // Validación rápida de entorno
    if (!sendgridKey) {
      throw new Error('SENDGRID_API_KEY no definida en el entorno.');
    }
    if (!this.fromEmail) {
      throw new Error('FROM_EMAIL no definida en el entorno.');
    }

    // Configurar SendGrid
    sgMail.setApiKey(sendgridKey);
  }

  private generarMensajeHTML(data: JobData): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Recordatorio de Cita</title>
<style>
@media only screen and (max-width: 600px) {
  .container { width: 100% !important; padding: 20px !important; }
  .card { padding: 20px !important; }
}
</style>
</head>
<body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5; padding:30px 0;">
<tr><td align="center">
<table class="container" width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:10px; overflow:hidden;">
<tr><td style="background:#4CAF50; padding:25px; text-align:center; color:white;">
<h1 style="margin:0; font-size:24px;">Clínica Odontológica Identiclinic</h1>
</td></tr>
<tr><td class="card" style="padding:30px; font-size:16px; color:#333;">
<p>Hola <strong>${data.nombrePaciente}</strong>,</p>
<p>Te recordamos que tienes una cita programada con nosotros.</p>
<div style="background:#f0f9f0; padding:20px; border-radius:8px; margin:20px 0; border-left:5px solid #4CAF50;">
<p style="margin:0;"><strong>📅 Fecha:</strong> ${data.fecha}</p>
<p style="margin:5px 0 0;"><strong>⏰ Hora:</strong> ${data.hora}</p>
</div>
<p>Si necesitas reprogramar o cancelar tu cita, puedes comunicarte con nosotros.</p>
<p style="margin-top:30px;">Gracias por confiar en <strong>Identiclinic</strong> 🦷✨</p>
</td></tr>
<tr><td style="background:#eeeeee; padding:15px; text-align:center; font-size:12px; color:#555;">
Clínica Odontológica Identiclinic<br>© 2025 Todos los derechos reservados
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  async sendMail(to: string, subject: string, html: string) {
    const msg = {
      to,
      from: { name: 'Clínica Odontológica Identiclini', email: this.fromEmail },
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      console.log(`Correo enviado a: ${to}`);
    } catch (error) {
      console.error(`Error al enviar correo a ${to}:`, error);
      throw error; // No hacer ACK si falla
    }
  }

  async procesarTareaRecordatorio(data: JobData) {
    console.log(`[Cita ${data.citaId}] Iniciando envío de correo.`);
    const mensajeHtml = this.generarMensajeHTML(data);
    await this.sendMail(data.destinatario, 'Recordatorio de cita', mensajeHtml);
  }
}
