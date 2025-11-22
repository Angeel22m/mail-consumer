// mail-consumer/src/mail-consumer.module.ts
import 'dotenv/config';
import { Module } from '@nestjs/common';
import { MailConsumerController } from './mail-consumer.controller';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  // Cargamos la configuración para leer las variables de entorno
  imports: [ConfigModule.forRoot()],


  // El controlador que escuchará los mensajes de RabbitMQ
  controllers: [MailConsumerController],
  // El servicio que ejecutará la lógica de envío (SendGrid/Twilio)
  providers: [MailService], 
})
export class MailConsumerModule {}