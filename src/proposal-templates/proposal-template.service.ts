import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { Quote } from 'src/quotes/quote.schema';
import { QuoteService } from 'src/quotes/quote.service';
import { assignToModel } from 'src/shared/transform/assignToModel';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { ProposalSectionMasterService } from '../proposal-section-masters/proposal-section-master.service';
import { EApplicableProducts, ProposalTemplate, PROPOSAL_TEMPLATE } from './proposal-template.schema';
import { CreateProposalTemplateDto } from './req/create-proposal-template.dto';
import { UpdateProposalTemplateDto } from './req/update-proposal-template.dto';
import { ProposalTemplateDto } from './res/proposal-template.dto';

@Injectable()
export class ProposalTemplateService {
  constructor(
    @InjectModel(PROPOSAL_TEMPLATE) private proposalTemplate: Model<ProposalTemplate>,
    private readonly proposalSectionMasterService: ProposalSectionMasterService,
    @Inject(forwardRef(() => QuoteService))
    private readonly quoteService: QuoteService,
    @Inject(forwardRef(() => SystemDesignService))
    private readonly systemDesignService: SystemDesignService,
  ) {}

  async create(proposalTemplateDto: CreateProposalTemplateDto): Promise<OperationResult<ProposalTemplateDto>> {
    const proposalSections = await this.proposalSectionMasterService.getProposalSectionMastersByIds(
      proposalTemplateDto.sections,
    );

    const model = new this.proposalTemplate({
      ...proposalTemplateDto,
      sections: proposalSections,
    });

    await model.save();
    return OperationResult.ok(strictPlainToClass(ProposalTemplateDto, model.toJSON()));
  }

  async update(
    id: ObjectId,
    proposalTemplateDto: UpdateProposalTemplateDto,
  ): Promise<OperationResult<ProposalTemplateDto>> {
    const foundProposalSectionMaster = await this.proposalTemplate.findOne({ _id: id });
    if (!foundProposalSectionMaster) {
      throw ApplicationException.EntityNotFound(id.toString());
    }

    const proposalSections = proposalTemplateDto.sections
      ? await this.proposalSectionMasterService.getProposalSectionMastersByIds(proposalTemplateDto.sections)
      : null;

    const { name, proposalSectionMaster, description } = proposalTemplateDto;

    if (name) foundProposalSectionMaster.name = name;

    if (proposalSectionMaster) (<any>foundProposalSectionMaster).proposalSectionMaster = proposalSectionMaster;

    if (proposalSections) (<any>foundProposalSectionMaster).sections = proposalSections;

    if (description) foundProposalSectionMaster.description = description;

    await foundProposalSectionMaster.save();

    return OperationResult.ok(strictPlainToClass(ProposalTemplateDto, foundProposalSectionMaster.toJSON()));
  }

  async getList(
    limit: number,
    skip: number,
    quoteId?: string,
  ): Promise<OperationResult<Pagination<ProposalTemplateDto>>> {
    let foundQuote: LeanDocument<Quote> | null;
    const query = {
      'proposal_section_master.applicable_financial_product': {
        $in: [] as string[],
      },
      'proposal_section_master.applicable_products': {
        $in: [] as string[],
      },
    };

    if (quoteId) {
      foundQuote = await this.quoteService.getOneFullQuoteDataById(quoteId);
      const foundSystemDesign = await this.systemDesignService.getOneById(foundQuote!!.systemDesignId);

      query['proposal_section_master.applicable_financial_product'].$in = [
        foundQuote!!.detailedQuote.quoteFinanceProduct.financeProduct.fundingSourceId,
      ];

      if (
        foundSystemDesign?.roofTopDesignData.panelArray?.length &&
        foundSystemDesign?.roofTopDesignData.storage?.length
      ) {
        query['proposal_section_master.applicable_products'].$in = [EApplicableProducts.PV_AND_STORAGE];
      } else if (foundSystemDesign?.roofTopDesignData.panelArray?.length) {
        query['proposal_section_master.applicable_products'].$in = [EApplicableProducts.PV];
      } else if (foundSystemDesign?.roofTopDesignData.storage?.length) {
        query['proposal_section_master.applicable_products'].$in = [EApplicableProducts.STORAGE];
      }
    }

    const [proposalTemplates, total] = await Promise.all([
      this.proposalTemplate
        .find(quoteId ? (query as any) : {})
        .limit(limit)
        .skip(skip)
        .lean(),
      this.proposalTemplate.estimatedDocumentCount(),
    ]);

    return OperationResult.ok(
      new Pagination({
        data: strictPlainToClass(ProposalTemplateDto, proposalTemplates),
        total,
      }),
    );
  }

  public async deleteProposal(id: ObjectId): Promise<void> {
    const found = await this.proposalTemplate.findOne({ _id: id }).lean();

    if (!found) {
      throw new NotFoundException(`No proposal template found with id ${id.toString()}`);
    }

    await this.proposalTemplate.deleteOne({ _id: id });
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getOneById(proposalTemplateId: string): Promise<LeanDocument<ProposalTemplate> | null> {
    const res = await this.proposalTemplate.findById(proposalTemplateId).lean();
    return res;
  }
}
