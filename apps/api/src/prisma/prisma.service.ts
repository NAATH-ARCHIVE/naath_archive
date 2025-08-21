import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    const onShutdown = async () => {
      await app.close();
    };
    // Fallback shutdown handling without relying on Prisma beforeExit type
    process.on('SIGINT', onShutdown);
    process.on('SIGTERM', onShutdown);
  }
}


