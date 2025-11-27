import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

// DTOs (Data Transfer Objects)
interface JobData {
    citaId: number;
    destinatario: string;
    nombrePaciente: string;
    fecha: string;
    hora: string;
}

interface VerificationPayload {
    correo: string; // Destinatario
    codigo: string;  // Código OTP
    asunto: string;
}

@Injectable()
export class MailService {
    private transporter;
    private readonly logger = new Logger(MailService.name);

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

        // Verificación de conexión asíncrona
        this.verifySmtpConnection();
    }
    
    // Método para verificar la conexión SMTP y forzar fallo si es crítica
    private async verifySmtpConnection() {
        try {
            await this.transporter.verify();
            this.logger.log('Conexión SMTP verificada con éxito.');
        } catch (error) {
            this.logger.error(' Error al conectar con el servidor SMTP. Revisar credenciales o host/puerto.', error.stack);
            // Lanzamos el error para que NestJS detenga la aplicación si la dependencia es vital
            throw new Error(`Fallo de conexión SMTP: ${error.message}`);
        }
    }

    /**
     * Genera la estructura HTML base del correo, inyectando el contenido principal.
     * Es la plantilla principal con encabezado y pie de página.
     */
    private generateBaseTemplate(title: string, bodyHtml: string, accentColor: string): string {
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${title}</title>
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
                                <td style="background:${accentColor}; padding:25px; text-align:center; color:white;">
                                    <h1 style="margin:0;">Clínica Odontológica Identiclinic</h1>
                                </td>
                            </tr>
                            <tr>
                                <td class="card" style="padding:30px; font-size:16px; color:#333;">
                                    ${bodyHtml}
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

    /**
     * Genera el HTML específico para Recordatorios de Cita.
     */
    private generarMensajeHTML(data: JobData): string {
        const mainContent = `
            <p>Hola <strong>${data.nombrePaciente}</strong>,</p>
            <p>Te recordamos que tienes una cita programada con nosotros.</p>
            <div style="background:#f0f9f0; padding:20px; border-radius:8px; margin:20px 0; border-left:5px solid #4CAF50;">
                <p><strong>📅 Fecha:</strong> ${data.fecha}</p>
                <p><strong>⏰ Hora:</strong> ${data.hora}</p>
            </div>
            <p>Si necesitas reprogramar o cancelar tu cita, puedes comunicarte con nosotros.</p>
            <p style="margin-top:30px;">Gracias por confiar en <strong>Identiclinic</strong> 🦷✨</p>
        `;
        // Usamos el color verde principal para los recordatorios
        return this.generateBaseTemplate('Recordatorio de Cita', mainContent, '#4CAF50');
    }

    /**
     * Genera el HTML específico para Verificación de Cuenta (Verde).
     */
    private generarHtmlVerificacion(codigo: string): string {
        const mainContent = `
            <p>Hola,</p>
            <p>Has solicitado un código de verificación para acceder a tu cuenta en **Identiclinic**.</p>
            <p style="text-align:center;">Tu código es:</p>
            <div style="background:#f0f9f0; padding:20px; border-radius:8px; margin:20px 0; border-left:5px solid #4CAF50;">
                <h2 style="color:#4CAF50; text-align:center; font-size:28px; letter-spacing: 5px; margin: 0;">${codigo}</h2>
            </div>
            <p>Este código es **válido por 15 minutos**. Por motivos de seguridad, no lo compartas con nadie.</p>
            <p style="margin-top:30px;">Gracias por usar nuestros servicios. 🦷✨</p>
        `;
        return this.generateBaseTemplate('Código de Verificación', mainContent, '#4CAF50');
    }

    /**
     * Genera el HTML específico para Restablecimiento de Contraseña (Naranja).
     */
    private generarHtmlRestablecimiento(codigo: string): string {
        const accentColor = '#ff9800'; // Naranja/Ámbar para seguridad
        const mainContent = `
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para **restablecer tu contraseña**. Utiliza el siguiente código temporal para proceder con el cambio:</p>
            <p style="text-align:center;">Código de Restablecimiento:</p>
            <div style="background:#fff3e0; padding:20px; border-radius:8px; margin:20px 0; border-left:5px solid ${accentColor};">
                <h2 style="color:${accentColor}; text-align:center; font-size:28px; letter-spacing: 5px; margin: 0;">${codigo}</h2>
            </div>
            <p>Si tú no solicitaste este cambio, por favor **ignora** este correo. Tu contraseña actual no será modificada hasta que uses este código.</p>
            <p style="margin-top:30px;">Equipo de Soporte 🛡️</p>
        `;
        return this.generateBaseTemplate('Restablecimiento de Contraseña', mainContent, accentColor);
    }

    /**
     * Función central para el envío de correos.
     */
    async sendMail(to: string, subject: string, html: string) {
        try {
            await this.transporter.sendMail({
                from: `"Clínica Odontológica Identiclinic" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
            });
            this.logger.log(`Correo enviado a: ${to}`);
        } catch (error) {
            this.logger.error(`Error al enviar correo a ${to}:`, error.stack);
            // Lanzar error para que RabbitMQ NACK el mensaje y lo reintente
            throw error;
        }
    }

    /**
     * Lógica para procesar el envío de Recordatorios de Cita.
     */
    async procesarTareaRecordatorio(data: JobData) {
        this.logger.log(`[Cita ${data.citaId}] Procesando envío de recordatorio.`);
        const html = this.generarMensajeHTML(data);
        await this.sendMail(data.destinatario, 'Recordatorio de cita', html);
        this.logger.log(`[Cita ${data.citaId}] Recordatorio enviado a ${data.destinatario}.`);
    }

    /**
     * Lógica para procesar el envío de códigos OTP y correos de seguridad.
     */
    async procesarVerificacionEmail(data: VerificationPayload) {
        this.logger.log(`[Verificación] Iniciando envío de correo con asunto: ${data.asunto}`);
        
        let subject = data.asunto || 'Código de Seguridad Identiclinic';
        let emailHtml = '';

        // --- Lógica Dinámica de Plantillas (switch) ---
        switch (subject) {
            case 'Restablecimiento de Contraseña Temporal':
                emailHtml = this.generarHtmlRestablecimiento(data.codigo);
                break;
                
            case 'Código de Verificación de Cuenta':
            default:
                // Usamos la plantilla predeterminada (Verificación de Cuenta)
                emailHtml = this.generarHtmlVerificacion(data.codigo);
                subject = 'Código de Verificación de Identiclinic'; // Asegura un título estándar
                break;
        }
        // ----------------------------------------------

        await this.sendMail(
            data.correo, 
            subject, 
            emailHtml // Usamos la plantilla seleccionada
        );
        this.logger.log(`[Verificación] Correo enviado a ${data.correo}.`);
    }
}