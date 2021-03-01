import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { OperationResult, Pagination, ServiceResponse } from 'src/app/common';
import { ProposalSectionMasterController } from '../proposal-section-master.controller';
import { ProposalSectionMasterModule } from '../proposal-section-master.module';
import { PROPOSAL_SECTION_MASTER } from '../proposal-section-master.schema';
import { ProposalSectionMasterService } from '../proposal-section-master.service';
import { ApplicationException } from '../../app/app.exception';

describe('Proposal Section Master Controller', () => {
  let proposalSectionMasterController: ProposalSectionMasterController;
  let proposalSectionMasterService: ProposalSectionMasterService;

  const mockRepository = {
    find: jest.fn().mockReturnValueOnce({
      limit: jest.fn().mockReturnValueOnce({
        skip: jest.fn().mockReturnValueOnce([
          {
            name: 'name',
            component_name: 'componentName',
            applicable_products: ['applicableProducts'],
            applicable_financial_products: ['applicableFinancialProducts'],
            toObject: jest.fn().mockReturnValue({
              name: 'name',
              component_name: 'componentName',
              applicable_products: ['applicableProducts'],
              applicable_financial_products: ['applicableFinancialProducts'],
            }),
          },
        ]),
      }),
    }),
    countDocuments: jest.fn().mockReturnValueOnce(1),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProposalSectionMasterModule],
    })
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockRepository)
      .compile();

    proposalSectionMasterService = moduleRef.get<ProposalSectionMasterService>(ProposalSectionMasterService);
    proposalSectionMasterController = moduleRef.get<ProposalSectionMasterController>(ProposalSectionMasterController);
  });

  test('should createProposalSectionMaster work correctly', async () => {
    function mockProposalSectionMasterModel(dto: any) {
      this.data = dto;
      this.save = () => ({ ...this.data, _id: 'id' });
      this.toObject = jest.fn().mockReturnValueOnce({ ...this.data, _id: 'id' });
    }
    const moduleRef = await Test.createTestingModule({
      imports: [ProposalSectionMasterModule],
    })
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockProposalSectionMasterModel)
      .compile();

    const res = await moduleRef.get(ProposalSectionMasterController).createProposalSectionMaster({
      name: 'name',
      componentName: 'componentName',
      applicableProducts: ['applicableProducts'],
      applicableFinancialProducts: ['applicableFinancialProducts'],
    });

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toEqual(expect.any(Object));
    expect(res.status).toEqual(expect.any(String));
  });

  test('should not find entity when updateProposalSectionMaster work', async () => {
    const mockProposalSectionMasterModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [ProposalSectionMasterModule],
    })
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockProposalSectionMasterModel)
      .compile();

    try {
      await moduleRef.get(ProposalSectionMasterController).updateProposalSectionMaster('id', {
        name: 'name',
        componentName: 'componentName',
        applicableProducts: ['applicableProducts'],
        applicableFinancialProducts: ['applicableFinancialProducts'],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationException);
    }
  });

  test('should found entity when updateProposalSectionMaster work', async () => {
    const mockProposalSectionMasterModel = {
      findOne: jest.fn().mockResolvedValue({
        name: 'name',
        component_name: 'componentName',
        applicable_products: ['applicableProducts'],
        applicable_financial_products: ['applicableFinancialProducts'],
      }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({
        toObject: jest.fn().mockReturnValue({
          name: 'name',
          component_name: 'componentName',
          applicable_products: ['applicableProducts'],
          applicable_financial_products: ['applicableFinancialProducts'],
        }),
      }),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [ProposalSectionMasterModule],
    })
      .overrideProvider(getModelToken(PROPOSAL_SECTION_MASTER))
      .useValue(mockProposalSectionMasterModel)
      .compile();

    const res = await moduleRef.get(ProposalSectionMasterController).updateProposalSectionMaster('id', {
      name: 'name',
      componentName: 'componentName',
      applicableProducts: ['applicableProducts'],
      applicableFinancialProducts: ['applicableFinancialProducts'],
    });

    expect(res).toMatchSnapshot();
    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toMatchObject({
      name: 'name',
      componentName: 'componentName',
      applicableProducts: ['applicableProducts'],
      applicableFinancialProducts: ['applicableFinancialProducts'],
    });
    // expect(res.data).toEqual(expect.any(Object));
  });

  test('should getList work correctly', async () => {
    const res = await proposalSectionMasterController.getList({
      limit: '100',
      skip: '0',
      products: 'products',
      'financial-products': 'financial-products',
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

    const res = await proposalSectionMasterController.getList({} as any);

    expect(res).toBeInstanceOf(ServiceResponse);
    expect(res.data).toBeInstanceOf(Pagination);
    expect(res.data.total).toEqual(expect.any(Number));
  });
});
