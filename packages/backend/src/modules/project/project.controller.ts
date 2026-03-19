import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectStatus } from './entities/project.entity';
import { MilestoneStatus } from './entities/milestone.entity';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.projectService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateProjectDto>) {
    return this.projectService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.projectService.remove(id);
    return { message: '删除成功' };
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: ProjectStatus) {
    return this.projectService.updateStatus(id, status);
  }

  // ─── 里程碑管理 ───────────────────────────────────────────────

  @Post(':id/milestones')
  async addMilestone(@Param('id') id: string, @Body() milestoneData: any) {
    return this.projectService.addMilestone(id, milestoneData);
  }

  @Get(':id/milestones')
  async getMilestones(@Param('id') id: string) {
    return this.projectService.getMilestones(id);
  }

  @Put('milestones/:milestoneId')
  async updateMilestone(@Param('milestoneId') milestoneId: string, @Body() data: any) {
    return this.projectService.updateMilestone(milestoneId, data);
  }

  @Delete('milestones/:milestoneId')
  @HttpCode(HttpStatus.OK)
  async deleteMilestone(@Param('milestoneId') milestoneId: string) {
    await this.projectService.deleteMilestone(milestoneId);
    return { message: '删除成功' };
  }

  @Delete('milestones/batch')
  @HttpCode(HttpStatus.OK)
  async batchDeleteMilestones(@Body('ids') ids: string[]) {
    await this.projectService.batchDeleteMilestones(ids);
    return { message: '批量删除成功' };
  }

  @Post('milestones/:milestoneId/complete')
  async completeMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() data?: { actualDate?: string; remark?: string }
  ) {
    return this.projectService.completeMilestone(milestoneId, data);
  }

  @Patch('milestones/:milestoneId/status')
  async updateMilestoneStatus(
    @Param('milestoneId') milestoneId: string,
    @Body() body: { status: MilestoneStatus; reason?: string }
  ) {
    return this.projectService.updateMilestoneStatus(milestoneId, body.status, { reason: body.reason });
  }
}
