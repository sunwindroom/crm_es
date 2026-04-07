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
  Request,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { AddMembersBatchDto } from './dto/add-members-batch.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { EvaluateWorkloadDto } from './dto/evaluate-workload.dto';
import { ProjectStatus } from './entities/project.entity';
import { MilestoneStatus } from './entities/milestone.entity';
import { HandoverService } from '../handover/handover.service';
import { HandoverType } from '../handover/entities/handover.entity';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly handoverService: HandoverService,
  ) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return this.projectService.findAll(query, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateProjectDto>, @Request() req: any) {
    return this.projectService.update(id, updateDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.projectService.remove(id, req.user.userId);
    return { message: '删除成功' };
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: ProjectStatus, @Request() req: any) {
    return this.projectService.updateStatus(id, status, req.user.userId);
  }

  // ─── 里程碑管理 ───────────────────────────────────────────────

  @Post(':id/milestones')
  async addMilestone(@Param('id') id: string, @Body() milestoneData: any, @Request() req: any) {
    return this.projectService.addMilestone(id, milestoneData, req.user.userId);
  }

  @Get(':id/milestones')
  async getMilestones(@Param('id') id: string, @Request() req: any) {
    return this.projectService.getMilestones(id, req.user.userId);
  }

  @Put('milestones/:milestoneId')
  async updateMilestone(@Param('milestoneId') milestoneId: string, @Body() data: any, @Request() req: any) {
    return this.projectService.updateMilestone(milestoneId, data, req.user.userId);
  }

  @Delete('milestones/:milestoneId')
  @HttpCode(HttpStatus.OK)
  async deleteMilestone(@Param('milestoneId') milestoneId: string, @Request() req: any) {
    await this.projectService.deleteMilestone(milestoneId, req.user.userId);
    return { message: '删除成功' };
  }

  @Delete('milestones/batch')
  @HttpCode(HttpStatus.OK)
  async batchDeleteMilestones(@Body('ids') ids: string[], @Request() req: any) {
    await this.projectService.batchDeleteMilestones(ids, req.user.userId);
    return { message: '批量删除成功' };
  }

  @Post('milestones/:milestoneId/complete')
  async completeMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() data: { actualDate?: string; remark?: string },
    @Request() req: any
  ) {
    return this.projectService.completeMilestone(milestoneId, data, req.user.userId);
  }

  @Patch('milestones/:milestoneId/status')
  async updateMilestoneStatus(
    @Param('milestoneId') milestoneId: string,
    @Body() body: { status: MilestoneStatus; reason?: string },
    @Request() req: any
  ) {
    return this.projectService.updateMilestoneStatus(milestoneId, body.status, { reason: body.reason }, req.user.userId);
  }

  // ─── 项目经理指派 ───────────────────────────────────────────────

  @Put(':id/manager')
  async assignManager(
    @Param('id') id: string,
    @Body() assignManagerDto: AssignManagerDto,
    @Request() req: any
  ) {
    return this.projectService.assignManager(id, assignManagerDto.managerId, req.user.userId);
  }

  // ─── 客服经理分配 ───────────────────────────────────────────────

  @Put(':id/cs-manager')
  async assignCsManager(
    @Param('id') id: string,
    @Body() body: { csManagerId: string },
    @Request() req: any
  ) {
    return this.projectService.assignCsManager(id, body.csManagerId, req.user.userId);
  }

  // ─── 项目参与人员管理 ───────────────────────────────────────────────

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
    @Request() req: any
  ) {
    return this.projectService.addMember(id, addMemberDto.userId, addMemberDto.role || 'member', req.user.userId);
  }

  @Post(':id/members/batch')
  async addMembersBatch(
    @Param('id') id: string,
    @Body() addMembersBatchDto: AddMembersBatchDto,
    @Request() req: any
  ) {
    return this.projectService.addMembersBatch(id, addMembersBatchDto.userIds, req.user.userId);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @Request() req: any) {
    return this.projectService.getMembers(id, req.user.userId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req: any) {
    await this.projectService.removeMember(id, memberId, req.user.userId);
    return { message: '删除成功' };
  }

  // ─── 项目工时管理 ───────────────────────────────────────────────

  @Post(':id/timesheets')
  async addTimesheet(
    @Param('id') id: string,
    @Body() body: { date: string; hours: number; description?: string },
    @Request() req: any
  ) {
    return this.projectService.addTimesheet(id, body, req.user.userId);
  }

  @Get(':id/timesheets')
  async getTimesheets(@Param('id') id: string, @Query() query: any, @Request() req: any) {
    return this.projectService.getTimesheets(id, query, req.user.userId);
  }

  @Put(':id/timesheets/:timesheetId')
  async updateTimesheet(
    @Param('id') id: string,
    @Param('timesheetId') timesheetId: string,
    @Body() body: any,
    @Request() req: any
  ) {
    return this.projectService.updateTimesheet(id, timesheetId, body, req.user.userId);
  }

  @Delete(':id/timesheets/:timesheetId')
  @HttpCode(HttpStatus.OK)
  async deleteTimesheet(
    @Param('id') id: string,
    @Param('timesheetId') timesheetId: string,
    @Request() req: any
  ) {
    return this.projectService.deleteTimesheet(id, timesheetId, req.user.userId);
  }

  @Get(':id/stats')
  async getProjectStats(@Param('id') id: string, @Request() req: any) {
    return this.projectService.getProjectStats(id, req.user.userId);
  }

  @Get(':id/gantt')
  async getGanttData(@Param('id') id: string, @Request() req: any) {
    return this.projectService.getGanttData(id, req.user.userId);
  }

  // ─── 离职移交 ───────────────────────────────────────────────

  @Post(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() body: { toUserId: string; reason: string; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      HandoverType.PROJECT,
      id,
      req.user.userId,
      body.toUserId,
      body.reason,
      body.remark,
      req.user.userId,
    );
  }

  @Get(':id/handover-history')
  getHandoverHistory(@Param('id') id: string) {
    return this.handoverService.getHandoverHistory(id, HandoverType.PROJECT);
  }

  @Put(':id/evaluate-workload')
  evaluateWorkload(
    @Param('id') id: string,
    @Body() dto: EvaluateWorkloadDto,
    @Request() req: any,
  ) {
    return this.projectService.evaluateWorkload(id, dto, req.user.userId);
  }
}
