import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult, Pagination, ServiceResponse } from 'src/app/common';
import { ProposalSectionMasterModule } from 'src/proposal-section-masters/proposal-section-master.module';
import { PROPOSAL_SECTION_MASTER } from 'src/proposal-section-masters/proposal-section-master.schema';
import { ProposalTemplateController } from '../proposal-template.controller';
import { ProposalTemplateModule } from '../proposal-template.module';
import { PROPOSAL_TEMPLATE } from '../proposal-template.schema';
import { ProposalTemplateService } from '../proposal-template.service';
import { ProposalTemplateDto } from '../res/proposal-template.dto';

describe('Proposal Template Controller', () => {
  let proposalTemplateController: ProposalTemplateController;
  let proposalSectionMasterService: ProposalTemplateService;

  const mockRes = {
    id: 'string',
    name: 'string',
    sections: [
      {
        id: 'string',
        name: 'string',
        componentName: 'string',
      },
    ],
    proposalSectionMaster: {
      applicableFinancialProduct: 'string',
      applicableProducts: ['string'],
    },
  };

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            ...mockRes,
            toObject: jest.fn().mockReturnValue(mockRes),
          },
        ]),
      }),
    }),
    estimatedDocumentCount: jest.fn().mockReturnValueOnce(1),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ProposalTemplateModule,
        ProposalSectionMasterModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
      ],
    })
      .overrideProvider(getModelToken(PROPOSAL_TEMPLATE))
      .useValue(mockRepository)
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockRepository)
      .compile();

    proposalTemplateController = moduleRef.get<ProposalTemplateController>(ProposalTemplateController);
    proposalSectionMasterService = moduleRef.get<ProposalTemplateService>(ProposalTemplateService);
  });

  test('should createProposalSectionMaster work correctly', async () => {
    class mockProposalTemplate {
      data: any;
      constructor(data) {
        this.data = data;
      }
      save(data) {
        return data;
      }
      toObject() {
        return this.data;
      }
      static findOne = jest.fn().mockResolvedValue(null);
    }

    class mockProposalSectionMaster {
      static findOne = jest.fn().mockResolvedValue({
        _id: 'id',
        name: 'name',
        component_name: 'component_name',
        toObject: jest.fn().mockResolvedValue({ _id: 'id', name: 'name', component_name: 'component_name' }),
      });
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        ProposalTemplateModule,
        ProposalSectionMasterModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
      ],
    })
      .overrideProvider(getModelToken(PROPOSAL_TEMPLATE))
      .useValue(mockProposalTemplate)
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockProposalSectionMaster)
      .compile();

    const res = await moduleRef.get(ProposalTemplateController).createProposalTemplate({
      name: 'string',
      sections: ['string'],
      proposalSectionMaster: {
        applicableFinancialProduct: 'string',
        applicableProducts: ['string'],
      },
    });

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(ProposalTemplateDto);
    expect(res.status).toEqual(expect.any(String));
  });

  test('should updateProposalSectionMaster work correctly', async () => {
    class mockProposalTemplate {
      data: any;
      constructor(data) {
        this.data = data;
      }
      save(data) {
        return data;
      }
      toObject() {
        return this.data;
      }
      static findOne = jest.fn().mockResolvedValue({
        id: 'string',
        name: 'string',
        sections: [
          {
            id: 'string',
            name: 'string',
            componentName: 'string',
          },
        ],
        proposalSectionMaster: {
          applicableFinancialProduct: 'string',
          applicableProducts: ['string'],
        },
      });
      static findByIdAndUpdate = jest.fn().mockResolvedValue({
        id: 'string',
        name: 'string',
        sections: [
          {
            id: 'string',
            name: 'string',
            componentName: 'string',
          },
        ],
        proposalSectionMaster: {
          applicableFinancialProduct: 'string',
          applicableProducts: ['string'],
        },
        toObject: jest.fn().mockReturnValue({
          _id: 'string',
          name: 'string',
          sections: [
            {
              id: 'string',
              name: 'string',
              componentName: 'string',
            },
          ],
          proposalSectionMaster: {
            applicableFinancialProduct: 'string',
            applicableProducts: ['string'],
          },
        }),
      });
    }

    class mockProposalSectionMaster {
      static findOne = jest.fn().mockResolvedValue({
        _id: 'id',
        name: 'name',
        component_name: 'component_name',
        toObject: jest.fn().mockResolvedValue({ _id: 'id', name: 'name', component_name: 'component_name' }),
      });
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        ProposalTemplateModule,
        ProposalSectionMasterModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
      ],
    })
      .overrideProvider(getModelToken(PROPOSAL_TEMPLATE))
      .useValue(mockProposalTemplate)
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockProposalSectionMaster)
      .compile();

    const res = await moduleRef.get(ProposalTemplateController).updateProposalTemplate('id', {
      name: 'string',
      sections: ['string'],
      proposalSectionMaster: {
        applicableFinancialProduct: 'string',
        applicableProducts: ['string'],
      },
    });

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(ProposalTemplateDto);
  });

  test('should updateProposalSectionMaster throw Exeption', async () => {
    const mockProposalTemplateModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [
        ProposalTemplateModule,
        ProposalSectionMasterModule,
        MongooseModule.forRoot(process.env.MONGO_URL, { useFindAndModify: false }),
      ],
    })
      .overrideProvider(getModelToken(PROPOSAL_TEMPLATE))
      .useValue(mockProposalTemplateModel)
      .compile();

    try {
      await moduleRef.get(ProposalTemplateController).updateProposalTemplate('id', {
        name: 'string',
        sections: ['string'],
        proposalSectionMaster: {
          applicableFinancialProduct: 'string',
          applicableProducts: ['string'],
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationException);
    }
  });

  test('should getList work correctly', async () => {
    const res = await proposalTemplateController.getList({
      limit: '100',
      skip: '0',
    });

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.total).toEqual(expect.any(Number));
  });

  test('should getList work correctly without query', async () => {
    const result = OperationResult.ok(
      new Pagination({
        data: [],
        total: 0,
      }),
    );

    jest.spyOn(proposalSectionMasterService, 'getList').mockImplementation(async () => result);
    const res = await proposalTemplateController.getList({} as any);

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.total).toEqual(expect.any(Number));
  });
});
