import { Injectable } from '@nestjs/common';
import { PROJECT, Project } from './project.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OperationResult } from 'src/app/common';
import { ApplicationException } from 'src/app/app.exception';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(PROJECT) private readonly projectModel: Model<Project>,
  ) {}

  async getProjectById(projectId: string): Promise<OperationResult<Project>> {
    const foundProject = await this.projectModel.findById(projectId);
    if (!foundProject) {
      throw ApplicationException.EntityNotFound(projectId);
    }
    return OperationResult.ok(foundProject);
  }

  async updateProjectAmountByQuery(query: any, update: {amount: number}): Promise<void> {
    await this.projectModel.findOneAndUpdate(
      query,
      {
        $set: update
      }
    );
  }
}
