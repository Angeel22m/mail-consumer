// mail-consumer/src/mail-consumer.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { SchedulerJobService } from './scheduler-job.services'; // ¡Necesario!
import { QueueListenerService } from './queue-listener.service'; // ¡Necesario!

@Module({
  // 1. ConfigModule.forRoot() se hace global para que ConfigService esté disponible 
  // en QueueListenerService sin tener que importarlo en cada módulo.
  imports: [ConfigModule.forRoot({ isGlobal: true })],

  // 2. ELIMINAMOS el controlador. La escucha se maneja por el servicio.
  controllers: [], 
  
  // 3. Proveedores: Registramos toda la lógica de negocio y el servicio de escucha
  providers: [
    MailService,             // Lógica del envío de correos
    SchedulerJobService,     // Lógica de los trabajos programados (ej. otros jobs)
    QueueListenerService,    // El motor que inicia las conexiones a ambas colas
  ], 
})
export class MailConsumerModule {}