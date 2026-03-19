import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LeadModule } from './modules/lead/lead.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProjectModule } from './modules/project/project.module';
import { OpportunityModule } from './modules/opportunity/opportunity.module';
import { ContractModule } from './modules/contract/contract.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RoleModule } from './modules/role/role.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { AppController } from './app.controller';
import { SnakeNamingStrategy } from './common/snake-naming.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [databaseConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
        autoLoadEntities: true,
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    LeadModule,
    CustomerModule,
    ProjectModule,
    OpportunityModule,
    ContractModule,
    PaymentModule,
    RoleModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
