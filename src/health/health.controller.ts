import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness check (API is up)' })
  @ApiOkResponse({
    schema: {
      example: { ok: true, service: 'tga-backend' },
    },
  })
  liveness() {
    return { ok: true, service: 'tga-backend' };
  }

  @Public()
  @Get('health/db')
  @ApiOperation({ summary: 'MongoDB connection status' })
  @ApiOkResponse({
    schema: {
      example: { ok: true, state: 'connected', readyState: 1 },
    },
  })
  database() {
    const state = this.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return {
      ok: state === 1,
      state: states[state] ?? 'unknown',
      readyState: state,
    };
  }
}
