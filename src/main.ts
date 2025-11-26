// mail-consumer/src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MailConsumerModule } from './mail-consumer.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(MailConsumerModule, {
        // Opción para ver menos logs internos y enfocarse en la conexión:
        logger: ['log', 'error', 'warn'], 
    });
    
    // Paso CRÍTICO: Forzar que NestJS espere la inicialización 
    // de todos los módulos, incluyendo QueueListenerService.onModuleInit().
    // Si la conexión falla allí (y se lanza el error), la ejecución se detendrá aquí.
    try {
        await app.init(); 
    } catch (error) {
        console.error(' ERROR FATAL: No se pudo completar la inicialización del sistema (posiblemente RabbitMQ).');
        await app.close();
        process.exit(1);
    }
    

    // --- Lógica de validación (Se mantiene igual) ---
    const config = app.get(ConfigService);
    const requiredEnvs = [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
    ];

    requiredEnvs.forEach((key) => {
        const value = config.get(key);
        if (!value) {
            console.warn(`Variable de entorno ${key} NO está definida.`);
        } else {
            console.log(`${key} OK`);
        }
    });

    // La conexión ya ocurrió. El mensaje de éxito debe ser más informativo.
    console.log('Microservicio Híbrido (Email/Scheduler) iniciado y escuchando ambas colas...');
    
    // Si tienes health checks, puedes usar app.listen(3000) aquí.
}

bootstrap();