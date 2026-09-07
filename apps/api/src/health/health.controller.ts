import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('system')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ description: 'Current API, PostgreSQL, and Redis status' })
  check() {
    return this.healthService.check();
  }
}

