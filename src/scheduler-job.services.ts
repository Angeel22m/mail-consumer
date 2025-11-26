// mail-consumer/src/scheduler-job.service.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SchedulerJobService {
    private readonly logger = new Logger(SchedulerJobService.name);

    async processJob(jobPayload: any) {
        this.logger.log(`[SchedulerJobService] Recibido trabajo: ${jobPayload.jobName || 'Desconocido'}`);
        
        
        await new Promise(resolve => setTimeout(resolve, 50)); 
        this.logger.log(`[SchedulerJobService] Trabajo completado.`);
    }
}