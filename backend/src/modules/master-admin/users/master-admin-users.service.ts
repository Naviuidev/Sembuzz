import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PendingUsersService } from '../../school-admin/pending-users/pending-users.service';
import { SchoolAdminStudentsService } from '../../school-admin/students/students.service';
import { SchoolAdminUserHelpService } from '../../school-admin/user-help/school-admin-user-help.service';

@Injectable()
export class MasterAdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pendingUsers: PendingUsersService,
    private readonly students: SchoolAdminStudentsService,
    private readonly userHelp: SchoolAdminUserHelpService,
  ) {}

  private async ensureSchool(schoolId: string): Promise<void> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
  }

  async listPending(schoolId: string) {
    await this.ensureSchool(schoolId);
    return this.pendingUsers.findPendingForSchool(schoolId);
  }

  async listApproved(schoolId: string) {
    await this.ensureSchool(schoolId);
    return this.students.findApprovedForSchool(schoolId);
  }

  async listAutomated(schoolId: string) {
    await this.ensureSchool(schoolId);
    return this.students.findAutomatedForSchool(schoolId);
  }

  async listHelp(schoolId: string) {
    await this.ensureSchool(schoolId);
    return this.userHelp.findAllForSchool(schoolId);
  }

  async ban(schoolId: string, userId: string) {
    await this.ensureSchool(schoolId);
    return this.students.ban(userId, schoolId);
  }

  async unban(schoolId: string, userId: string) {
    await this.ensureSchool(schoolId);
    return this.students.unban(userId, schoolId);
  }
}
