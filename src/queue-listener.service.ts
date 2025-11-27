//src/queue-listener.services.ts

import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { MailService } from './mail.service'; 
import * as amqp from 'amqplib';


// Reutilizamos las interfaces definidas en MailService
interface JobData {
    citaId: number;
    destinatario: string;
    nombrePaciente: string;
    fecha: string;
    hora: string;
}
interface VerificationPayload {
    correo: string;
    codigo: string;
    asunto: string;
}

//  NUEVA INTERFAZ: Representa el formato anidado real que llega de NestJS ClientProxy
interface RawMessagePayload<T> {
    pattern: string;
    data: T; // El objeto de datos real (JobData o VerificationPayload)
}

@Injectable()
export class QueueListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(QueueListenerService.name);
    private connection: amqp.Connection;
    private channel: amqp.Channel;

    // Colas a escuchar
    private readonly EMAIL_QUEUE = 'email_queue';
    private readonly SCHEDULER_QUEUE = 'scheduler_jobs_queue';
    
    // El constructor inyecta el MailService
    constructor(private readonly mailService: MailService) {}

    // ----------------------------------------------------
    // INICIALIZACIÓN (al iniciar el módulo)
    // ----------------------------------------------------

   async onModuleInit() {
        this.logger.log('Iniciando conexión con RabbitMQ...');
        try {
            await this.connectToRabbitMQ();
            await this.setupConsumers();
            this.logger.log('Consumidores de colas listos.'); 
        } catch (error) {
            this.logger.error('Error al iniciar el QueueListenerService. RabbitMQ inaccesible.', error.stack);
            throw error; 
        }
    }

    private async connectToRabbitMQ() {
        // ... (sin cambios)
        const amqpUrl = process.env.AMQP_URL || 'amqp://localhost';
        this.connection = await amqp.connect(amqpUrl);
        this.channel = await this.connection.createChannel();
    }

    private async setupConsumers() {
        // ... (sin cambios)
        await this.channel.assertQueue(this.EMAIL_QUEUE, { durable: true });
        this.channel.consume(this.EMAIL_QUEUE, (msg) => this.handleEmailMessage(msg));
        await this.channel.assertQueue(this.SCHEDULER_QUEUE, { durable: true });
        this.channel.consume(this.SCHEDULER_QUEUE, (msg) => this.handleSchedulerMessage(msg));
    }

    // ----------------------------------------------------
    // HANDLERS (Lógica de procesamiento de mensajes)
    // ----------------------------------------------------

    /**
     * Procesa mensajes de la cola 'email_queue' (Verificación de correo)
     */
    private async handleEmailMessage(msg: amqp.ConsumeMessage) {
        if (msg === null) return;
        try {
            // 1. Parseamos el mensaje crudo con el objeto anidado
            const rawPayload: RawMessagePayload<VerificationPayload> = JSON.parse(msg.content.toString());
            
            // 2. Extraemos el payload real (la propiedad 'data')
            const payload: VerificationPayload = rawPayload.data;
            
            this.logger.log(`[EMAIL] Recibido mensaje para verificar: ${payload.correo}`);
            
            // Llama al método del MailService
            await this.mailService.procesarVerificacionEmail(payload);
            
            // Confirmación exitosa: Retiramos el mensaje de la cola
            this.channel.ack(msg);
        } catch (error) {
            this.logger.error(`Error procesando email de verificación a ${msg.content.toString()}.`, error.stack);
            // Error en el procesamiento: Reintentamos (tercer parámetro 'true')
            this.channel.nack(msg, false, true); 
        }
    }

    /**
     * Procesa mensajes de la cola 'scheduler_jobs_queue' (Recordatorio de cita)
     */
    private async handleSchedulerMessage(msg: amqp.ConsumeMessage) {
        if (msg === null) return;
        try {
            // 1. Parseamos el mensaje crudo con el objeto anidado
            const rawPayload: RawMessagePayload<JobData> = JSON.parse(msg.content.toString());

            // 2. Extraemos el payload real (la propiedad 'data')
            const payload: JobData = rawPayload.data;
            
            this.logger.log(`[SCHEDULER] Recibido recordatorio para Cita ID: ${payload.citaId}`);
            
            // Llama al método del MailService
            await this.mailService.procesarTareaRecordatorio(payload);
            
            // Confirmación exitosa
            this.channel.ack(msg);
        } catch (error) {
            // Se debe volver a parsear para extraer el ID en caso de error, ya que rawPayload podría no existir si falla JSON.parse
            this.logger.error(`Error procesando recordatorio de cita ID ${JSON.parse(msg.content.toString()).data.citaId}.`, error.stack);
            // Error en el procesamiento: Reintentamos
            this.channel.nack(msg, false, true); 
        }
    }
    
    // ----------------------------------------------------
    // CIERRE (al destruir el módulo)
    // ----------------------------------------------------

    async onModuleDestroy() {
        // ... (sin cambios)
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
            this.logger.log('Conexión de RabbitMQ cerrada.');
        }
    }
}