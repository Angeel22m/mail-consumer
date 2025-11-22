// mail-consumer/src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MailConsumerModule } from './mail-consumer.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MailConsumerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
        queue: process.env.RABBITMQ_QUEUE || 'scheduler_jobs_queue',
        noAck: false,
        prefetchCount: 1,
        queueOptions: { durable: true },
      },
    },
  );

  // Usando ConfigService para validar variables críticas
  const config = app.get(ConfigService);

  const requiredEnvs = [
    'SENDGRID_API_KEY',
    'FROM_EMAIL', 
  ];

  requiredEnvs.forEach((key) => {
    if (!process.env[key]) {
      console.warn(` Variable de entorno ${key} NO está definida.`);
    } else {
      console.log(`${key} OK`);
    }
  });

  await app.listen();
  console.log('Microservicio Consumidor de Recordatorios iniciado y escuchando la cola...');
}

bootstrap();
