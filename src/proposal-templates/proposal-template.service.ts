import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Quote } from 'src/quotes/quote.schema';
import { QuoteService } from 'src/quotes/quote.service';
import { SystemDesignService } from 'src/system-designs/system-design.service';
import { ApplicationException } from '../app/app.exception';
import { OperationResult, Pagination } from '../app/common';
import { ProposalSectionMasterService } from '../proposal-section-masters/proposal-section-master.service';
import { toSnakeCase } from '../utils/transformProperties';
import { EApplicableProducts, ProposalTemplate, PROPOSAL_TEMPLATE } from './proposal-template.schema';
import { CreateProposalTemplateDto } from './req/create-proposal-template.dto';
import { UpdateProposalTemplateDto } from './req/update-proposal-template.dto';
import { ProposalTemplateDto } from './res/proposal-template.dto';

@Injectable()
export class ProposalTemplateService {
  constructor(
    @InjectModel(PROPOSAL_TEMPLATE) private proposalTemplate: Model<ProposalTemplate>,
    private readonly proposalSectionMasterService: ProposalSectionMasterService,
    private readonly quoteService: QuoteService,
    private readonly systemDesignService: SystemDesignService,
  ) {}

  async create(proposalTemplateDto: CreateProposalTemplateDto): Promise<OperationResult<ProposalTemplateDto>> {
    const proposalSections = await Promise.all(
      proposalTemplateDto.sections.map(id => this.proposalSectionMasterService.getProposalSectionMasterById(id)),
    );

    const model = new this.proposalTemplate({
      name: proposalTemplateDto.name,
      sections: proposalSections.map(item => ({
        id: item?._id,
        name: item?.name,
        component_name: item?.component_name,
      })),
      proposal_section_master: toSnakeCase(proposalTemplateDto.proposalSectionMaster),
    });
    await model.save();
    return OperationResult.ok(new ProposalTemplateDto(model.toObject()));
  }

  async update(
    id: string,
    proposalTemplateDto: UpdateProposalTemplateDto,
  ): Promise<OperationResult<ProposalTemplateDto>> {
    const foundProposalSectionMaster = await this.proposalTemplate.findOne({ _id: id });
    if (!foundProposalSectionMaster) {
      throw ApplicationException.EntityNotFound(id);
    }

    const proposalSections = proposalTemplateDto.sections
      ? await Promise.all(
          proposalTemplateDto.sections.map(id => this.proposalSectionMasterService.getProposalSectionMasterById(id)),
        )
      : [];

    const updatedModel = await this.proposalTemplate
      .findByIdAndUpdate(
        id,
        {
          name: proposalTemplateDto.name || foundProposalSectionMaster.name,
          sections: proposalSections.length
            ? proposalSections.map(item => ({
                id: item?._id || '',
                name: item?.name || '',
                component_name: item?.component_name || '',
              }))
            : foundProposalSectionMaster.sections,
          proposal_section_master: proposalTemplateDto.proposalSectionMaster
            ? toSnakeCase(proposalTemplateDto.proposalSectionMaster)
            : foundProposalSectionMaster.proposal_section_master,
        },
        { new: true },
      )
      .lean();

    return OperationResult.ok(new ProposalTemplateDto(updatedModel || ({} as any)));
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
      const foundSystemDesign = await this.systemDesignService.getOneById(foundQuote!!.system_design_id);

      query['proposal_section_master.applicable_financial_product'].$in = [
        foundQuote!!.detailed_quote.quote_finance_product.finance_product.funding_source_id,
      ];

      if (
        foundSystemDesign?.roof_top_design_data.panel_array?.length &&
        foundSystemDesign?.roof_top_design_data.storage?.length
      ) {
        query['proposal_section_master.applicable_products'].$in = [EApplicableProducts.PV_AND_STORAGE];
      } else if (foundSystemDesign?.roof_top_design_data.panel_array?.length) {
        query['proposal_section_master.applicable_products'].$in = [EApplicableProducts.PV];
      } else if (foundSystemDesign?.roof_top_design_data.storage?.length) {
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
        data: proposalTemplates.map(proposalTemplate => new ProposalTemplateDto(proposalTemplate)),
        total,
      }),
    );
  }

  // ->>>>>>>>> INTERNAL <<<<<<<<<<-

  async getOneById(proposalTemplateId: string): Promise<LeanDocument<ProposalTemplate> | null> {
    const res = await this.proposalTemplate.findById(proposalTemplateId).lean();
    return res;
  }
}
