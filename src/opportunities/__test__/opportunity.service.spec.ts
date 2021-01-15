import { OpportunityService } from '../opportunity.service';

describe('Opportunity Service', () => {
  let opportunityService: OpportunityService;

  describe('getDetailById function', () => {
    test(`should return undefined value `, async () => {
      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      opportunityService = new OpportunityService(mockFundingSource);
      const res = await opportunityService.getDetailById('oppId');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });

    test('should return opportunity model', async () => {
      const mockResponse = {
        contactId: 'contactId',
        utilityId: 'utilityId',
        fundingSourceId: 'fundingSourceId',
        contractorCompanyName: 'contractorCompanyName',
        contractorAddress1: 'contractorAddress1',
        contractorAddress2: 'contractorAddress2',
        contractorLicense: 'contractorLicense',
        amount: 'amount',
        isPrimeContractor: 'isPrimeContractor',
        contractorEmail: 'contractorEmail',
        contractorSigner: 'contractorSigner',
        recordOwner: 'recordOwner',
      };

      const mockModel = {
        ...mockResponse,
        toObject: jest.fn().mockReturnValueOnce(mockResponse),
      };

      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      opportunityService = new OpportunityService(mockFundingSource);
      const res = await opportunityService.getDetailById('oppId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toMatchObject(mockResponse);
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getContactIdById function', () => {
    test(`should return undefined value `, async () => {
      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      opportunityService = new OpportunityService(mockFundingSource);
      const res = await opportunityService.getContactIdById('oppId');

      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });

    test('should return contact id', async () => {
      const mockResponse = {
        contactId: 'contactId',
        utilityId: 'utilityId',
        fundingSourceId: 'fundingSourceId',
        contractorCompanyName: 'contractorCompanyName',
        contractorAddress1: 'contractorAddress1',
        contractorAddress2: 'contractorAddress2',
        contractorLicense: 'contractorLicense',
        amount: 'amount',
        isPrimeContractor: 'isPrimeContractor',
        contractorEmail: 'contractorEmail',
        contractorSigner: 'contractorSigner',
        recordOwner: 'recordOwner',
      };

      const mockModel = {
        ...mockResponse,
        toObject: jest.fn().mockReturnValueOnce(mockResponse),
      };

      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      opportunityService = new OpportunityService(mockFundingSource);
      const res = await opportunityService.getContactIdById('oppId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toEqual(expect.any(String));
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('isExistedOpportunity function', () => {
    test(`should return falsy value `, async () => {
      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;

      opportunityService = new OpportunityService(mockFundingSource);
      const res = await opportunityService.isExistedOpportunity('oppId');

      expect(res).toMatchSnapshot();
      expect(res).toBeFalsy();
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });

    test('should return truthy value', async () => {
      const mockResponse = {
        _id: '123',
        contactId: 'contactId',
        utilityId: 'utilityId',
        fundingSourceId: 'fundingSourceId',
        contractorCompanyName: 'contractorCompanyName',
        contractorAddress1: 'contractorAddress1',
        contractorAddress2: 'contractorAddress2',
        contractorLicense: 'contractorLicense',
        amount: 'amount',
        isPrimeContractor: 'isPrimeContractor',
        contractorEmail: 'contractorEmail',
        contractorSigner: 'contractorSigner',
        recordOwner: 'recordOwner',
      };

      const mockModel = {
        ...mockResponse,
        toObject: jest.fn().mockReturnValueOnce(mockResponse),
      };

      const mockFundingSource = {
        findById: jest.fn().mockResolvedValue(mockModel),
      } as any;

      opportunityService = new OpportunityService(mockFundingSource);
      const res = await opportunityService.isExistedOpportunity('oppId');

      expect(res).toMatchSnapshot();
      expect(res).not.toBeNull();
      expect(res).toBeTruthy();
      expect(mockFundingSource.findById).toHaveBeenCalledTimes(1);
    });
  });
});
