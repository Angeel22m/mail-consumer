// mail-consumer/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MailConsumerModule } from './mail-consumer.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MailConsumerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'scheduler_jobs_queue',

        // 👇 NECESARIO: desactiva el ACK automático
        noAck: false,

        // Mantener prefetch
        prefetchCount: 1,
        isGlobal: true,

        queueOptions: {
          durable: true,   // ⚠️ RECOMENDADO — evita perder mensajes
        },
      },
    },
  );

  await app.listen();
  console.log('Microservicio Consumidor de Recordatorios iniciado y escuchando la cola...');
}
bootstrap();
