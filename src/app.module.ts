import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { buildMongoUri } from './config/mongodb.util';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validate: (config) => {
        validateEnv({
          ...process.env,
          ...(config as Record<string, unknown>),
        });
        return config;
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('nodeEnv') === 'development';
        return {
          uri: buildMongoUri(config.getOrThrow<string>('mongodb.uri')),
          dbName: config.get<string>('mongodb.dbName'),
          family: 4,
          serverSelectionTimeoutMS: 15_000,
          retryAttempts: isDev ? 2 : 5,
          retryDelay: 2000,
          lazyConnection: isDev,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              // eslint-disable-next-line no-console
              console.log('[MongoDB] connected');
            });
            connection.on('error', (err: Error) => {
              // eslint-disable-next-line no-console
              console.error('[MongoDB] connection error:', err.message);
            });
            return connection;
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
