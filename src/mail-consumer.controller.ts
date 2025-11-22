// mail-consumer/src/mail-consumer.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Ctx, RmqContext, Payload } from '@nestjs/microservices';
import { MailService } from './mail.service';

@Controller()
export class MailConsumerController {
  constructor(private readonly mailerService: MailService) {}

  // Escucha el patrón 'send_recordatorio' emitido por el Productor
  @EventPattern('send_recordatorio')
  
  async handleSendRecordatorio(
    
    @Payload() data: any, // Contiene citaId, destinatario, etc.
    @Ctx() context: RmqContext,
    
  ) {
    
    try {
      console.log('📨 Mensaje recibido del backend:', data);

      await this.mailerService.procesarTareaRecordatorio(data);

      // Si todo sale bien, hacemos ACK para eliminar el mensaje de la cola
      const channel = context.getChannelRef();
      const originalMessage = context.getMessage();
     await channel.ack(originalMessage); 
      console.log(`[Cita ${data.citaId}] Tarea completada y ACK enviado.`);

    } catch (error) {
      // Si MailerService lanza un error, no hacemos ACK. 
      // RabbitMQ retendrá el mensaje para un reintento posterior.
      console.error(`[Cita ${data.citaId}]Fallo al procesar. Reintentando después.`);
    }
  }
}