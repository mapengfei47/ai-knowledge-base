import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueWorkerService } from './queue-worker.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
  ],
  providers: [PrismaService, QueueWorkerService],
})
export class WorkerModule {}
