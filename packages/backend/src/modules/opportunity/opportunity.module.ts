import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { Opportunity } from './entities/opportunity.entity';
@Module({ imports: [TypeOrmModule.forFeature([Opportunity])], controllers: [OpportunityController], providers: [OpportunityService], exports: [OpportunityService] })
export class OpportunityModule {}