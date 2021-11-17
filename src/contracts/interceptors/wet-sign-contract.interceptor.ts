import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ContractService } from '../contract.service';
import { FastifyFile, FastifyRequest } from '../../shared/fastify';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-objectid.pipe';
import { ApplicationException } from '../../app/app.exception';
import { KEYS } from '../constants';
import { QuoteService } from '../../quotes/quote.service';
import { Contract } from '../contract.schema';
import { IDetailedQuoteSchema } from '../../quotes/quote.schema';

export interface IContractWithDetailedQuote {
  contract: Contract;
  quote: IDetailedQuoteSchema;
}

@Injectable()
export class WetSignContractInterceptor implements NestInterceptor {
  private parseObjectId: ParseObjectIdPipe;

  constructor(
    private readonly reflector: Reflector,
    private readonly contractService: ContractService,
    private readonly quoteService: QuoteService,
  ) {
    this.parseObjectId = new ParseObjectIdPipe();
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const contractIdProp = this.reflector.get<string>(KEYS.CONTRACT_ID_PATH, context.getHandler());

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const contractId = (<Record<string, any>>request.params)[contractIdProp];

    const contractAndQuote = await this.validateContract(contractId);

    const file = await WetSignContractInterceptor.getMultipart(request);

    WetSignContractInterceptor.validateUploadedFile(file);

    Object.defineProperty(request, 'body', { value: file });
    Object.defineProperty(request.params, contractIdProp, { value: contractAndQuote });

    return next.handle();
  }

  private async validateContract(contractId: string): Promise<IContractWithDetailedQuote> {
    const id = this.parseObjectId.transform(contractId);

    if (!id) {
      throw ApplicationException.ValidationFailed('Must be a valid Mongo ObjectID String');
    }

    const foundContract = await this.contractService.getOneByContractId(id);

    const quote = await this.quoteService.getOneById(foundContract.associatedQuoteId);

    if (!quote?.quoteFinanceProduct.financeProduct.financialProductSnapshot.allowsWetSignedContracts) {
      throw new BadRequestException('This contract does not allow wet signing');
    }

    return { contract: foundContract, quote };
  }

  private static async getMultipart(req: FastifyRequest): Promise<FastifyFile> {
    try {
      const file = await req.file();

      return file;
    } catch (error) {
      throw ApplicationException.ValidationFailed('Invalid upload file');
    }
  }

  private static validateUploadedFile(file: FastifyFile) {
    const { mimetype } = file;

    if (mimetype !== 'application/pdf') {
      throw ApplicationException.ValidationFailed('Invalid upload file');
    }
  }
}
