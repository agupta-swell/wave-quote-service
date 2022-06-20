import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  forwardRef,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EMPTY, Observable } from 'rxjs';
import { ApplicationException } from 'src/app/app.exception';
import { catchError } from 'rxjs/operators';
import { MultipartFile } from 'fastify-multipart';
import { FastifyRequest, FastifyResponse } from '../../shared/fastify';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-objectid.pipe';
import { KEYS } from '../constants';
import { SystemDesignService } from '../system-design.service';

export type BusBoyFileStream = MultipartFile['file'];

@Injectable()
export class ValidateUploadSystemDesignThumbnailInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const response = context.switchToHttp().getResponse<FastifyResponse>();

    this.validateRequest(request);

    const systemDesignIdProp = this.reflector.get<string>(KEYS.REQ_PARAM_ID, context.getHandler());

    await this.validateSystemDesign(request, systemDesignIdProp);

    await this.transformFile(request);

    return next.handle().pipe(
      catchError(err => {
        response.send(err);
        request.raw.destroy();

        return EMPTY;
      }),
    );
  }

  private async validateSystemDesign(request: FastifyRequest, systemDesignIdProp: string): Promise<void> {
    const systemDesignId = (<Record<string, any>>request.params)[systemDesignIdProp];

    const id = ParseObjectIdPipe.validate(systemDesignId);

    if (!id) throw ApplicationException.ValidationFailed('Must be a valid Mongo ObjectID String');

    const foundSystemDesign = await this.systemDesignService.getOneById(id);

    if (!foundSystemDesign) throw new NotFoundException(`No system design found with id ${systemDesignId}`);

    Object.defineProperty(request.params, systemDesignIdProp, { value: foundSystemDesign._id });
  }

  private validateRequest(req: FastifyRequest) {
    if (!req.isMultipart()) throw new BadRequestException('Must be a multipart request');
  }

  private async transformFile(req: FastifyRequest) {
    const file = await req.file();

    this.validateFile(file);

    Object.defineProperty(req, 'body', {
      value: file.file,
    });
  }

  private validateFile(file: MultipartFile) {
    const { mimetype, fieldname } = file;

    if (fieldname !== 'image') {
      throw new BadRequestException(`Must be a valid image file`);
    }

    if (mimetype !== 'image/png') {
      throw ApplicationException.ValidationFailed('File must be a PNG image');
    }
  }
}
