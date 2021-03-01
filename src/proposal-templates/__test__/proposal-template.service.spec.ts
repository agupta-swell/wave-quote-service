import { ProposalTemplateService } from '../proposal-template.service';

describe('Proposal Template Service', () => {
  let proposalTemplateService: ProposalTemplateService;

  describe('getOneById function', () => {
    test('should return null ', async () => {
      const mockProposalTemplate = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      proposalTemplateService = new ProposalTemplateService(mockProposalTemplate, null);
      const res = await proposalTemplateService.getOneById('id');

      expect(res).toMatchSnapshot();
      expect(res).toMatchObject({});
      expect(mockProposalTemplate.findById).toHaveBeenCalledTimes(1);
    });

    test('should return Proposal Template model', async () => {
      const mockModelResponse = {
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
      };
      const mockModel = {
        ...mockModelResponse,
        toObject: jest.fn().mockReturnValue(mockModelResponse),
      };
      const mockProposalTemplate = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      proposalTemplateService = new ProposalTemplateService(mockProposalTemplate, null);
      const res = await proposalTemplateService.getOneById('id');

      expect(res).toMatchSnapshot();
      expect(res).toMatchObject(mockModelResponse);
      expect(mockProposalTemplate.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('update function', () => {
    test('should return work correctly', async () => {
      const mockProposalTemplate = {
        findOne: jest.fn().mockReturnValueOnce({
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
        }),
        findByIdAndUpdate: jest.fn().mockReturnValueOnce({
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
        }),
      } as any;

      const mockProposalSectionMaster = {
        getProposalSectionMasterById: jest.fn().mockResolvedValue({
          _id: 'id',
          name: 'name',
          component_name: 'component_name',
          toObject: jest.fn().mockResolvedValue({ _id: 'id', name: 'name', component_name: 'component_name' }),
        }),
      } as any;

      proposalTemplateService = new ProposalTemplateService(mockProposalTemplate, mockProposalSectionMaster);
      const res = await proposalTemplateService.update('id', {
        name: null,
        sections: null,
        proposalSectionMaster: null,
      });

      expect(res).toMatchSnapshot();
    });
  });
});
