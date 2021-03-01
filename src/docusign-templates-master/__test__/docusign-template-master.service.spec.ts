import { OperationResult } from 'src/app/common';
import { SAVE_TEMPLATE_MODE, SYSTEM_TYPE, TEMPLATE_STATUS } from '../constants';
import { DocusignTemplateMasterService } from '../docusign-template-master.service';
import { SaveContractCompositeTemplateDto, SaveTemplateDto } from '../res';

describe('Docusign Template Master Service', () => {
  let docusignTemplateMasterService: DocusignTemplateMasterService;

  describe('saveTemplate function', () => {
    test('should save successfully ', async () => {
      const mockSignerRoleMaster = {
        findById: jest
          .fn()
          .mockResolvedValue({ _id: 'id', role_name: 'role_name', role_description: 'role_description' }),
      } as any;
      const mockDocusignTemplateMaster = {
        findOneAndUpdate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({
            template_name: 'template_name',
            description: 'description',
            docusign_template_id: 'docusign_template_id',
            recipient_roles: ['recipient_roles'],
            template_status: TEMPLATE_STATUS.ACTIVE,
          }),
        }),
      } as any;

      const req = {
        mode: SAVE_TEMPLATE_MODE.NEW,
        templateData: {
          id: null,
          templateName: 'string',
          description: 'string',
          docusignTemplateId: 'string',
          templateStatus: TEMPLATE_STATUS.ACTIVE,
          recipientRoles: ['string'],
        },
      };

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        mockDocusignTemplateMaster,
        mockSignerRoleMaster,
        null,
        null,
        null,
        null,
        null,
      );
      const res = await docusignTemplateMasterService.saveTemplate(req);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SaveTemplateDto);
      expect(res.data.responseStatus).toBe('SUCCESS');
      expect(mockSignerRoleMaster.findById).toHaveBeenCalledTimes(1);
      expect(mockDocusignTemplateMaster.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    test('should return status: INVALID_MODE_PARAMETER ', async () => {
      const mockSignerRoleMaster = {
        findById: jest
          .fn()
          .mockResolvedValue({ _id: 'id', role_name: 'role_name', role_description: 'role_description' }),
      } as any;
      const mockDocusignTemplateMaster = {
        findOneAndUpdate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({
            template_name: 'template_name',
            description: 'description',
            docusign_template_id: 'docusign_template_id',
            recipient_roles: ['recipient_roles'],
            template_status: TEMPLATE_STATUS.ACTIVE,
          }),
        }),
      } as any;

      const req = {
        mode: SAVE_TEMPLATE_MODE.UPDATE,
        templateData: {
          id: null,
          templateName: 'string',
          description: 'string',
          docusignTemplateId: 'string',
          templateStatus: TEMPLATE_STATUS.ACTIVE,
          recipientRoles: ['string'],
        },
      };

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        mockDocusignTemplateMaster,
        mockSignerRoleMaster,
        null,
        null,
        null,
        null,
        null,
      );
      const res = await docusignTemplateMasterService.saveTemplate(req);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SaveTemplateDto);
      expect(res.data.responseStatus).toBe('INVALID_MODE_PARAMETER');
      expect(mockSignerRoleMaster.findById).toHaveBeenCalledTimes(0);
      expect(mockDocusignTemplateMaster.findOneAndUpdate).toHaveBeenCalledTimes(0);
    });
  });

  describe('saveContractCompositeTemplate function', () => {
    test('should save successfully ', async () => {
      const mockSignerRoleMaster = {
        findById: jest.fn().mockResolvedValue({
          _id: 'id',
          role_name: 'role_name',
          role_description: 'role_description',
          toObject: jest
            .fn()
            .mockReturnValue({ _id: 'id', role_name: 'role_name', role_description: 'role_description' }),
        }),
      } as any;
      const mockDocusignCompositeTemplateMaster = {
        findOneAndUpdate: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({
            template_name: 'template_name',
            description: 'description',
            docusign_template_id: 'docusign_template_id',
            recipient_roles: ['recipient_roles'],
            template_status: TEMPLATE_STATUS.ACTIVE,
          }),
        }),
      } as any;

      const mockDocusignTemplateMaster = {
        findById: jest.fn().mockResolvedValue({
          template_name: 'template_name',
          description: 'description',
          docusign_template_id: 'docusign_template_id',
          recipient_roles: ['recipient_roles'],
          template_status: TEMPLATE_STATUS.ACTIVE,
          toObject: jest.fn().mockReturnValue({
            template_name: 'template_name',
            description: 'description',
            docusign_template_id: 'docusign_template_id',
            recipient_roles: ['recipient_roles'],
            template_status: TEMPLATE_STATUS.ACTIVE,
          }),
        }),
      } as any;

      const req = {
        mode: SAVE_TEMPLATE_MODE.NEW,
        compositeTemplateData: {
          id: null,
          name: 'string',
          description: 'string',
          docusignTemplateIds: ['string'],
          isApplicableForChangeOrders: true,
          applicableFundingSources: ['string'],
          applicableUtilityPrograms: ['string'],
          applicableUtilities: ['string'],
          applicableStates: ['string'],
          applicableSystemTypes: [SYSTEM_TYPE.ALL],
          createdAt: new Date('1/19/2020'),
          updatedAt: new Date('1/19/2020'),
        },
      };

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        mockDocusignTemplateMaster,
        mockSignerRoleMaster,
        null,
        mockDocusignCompositeTemplateMaster,
        null,
        null,
        null,
      );
      const res = await docusignTemplateMasterService.saveContractCompositeTemplate(req);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SaveContractCompositeTemplateDto);
      expect(res.data.responseStatus).toBe('SUCCESS');
      expect(mockSignerRoleMaster.findById).toHaveBeenCalledTimes(1);
      expect(mockDocusignTemplateMaster.findById).toHaveBeenCalledTimes(1);
      expect(mockDocusignCompositeTemplateMaster.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    test('should return status: INVALID_MODE_PARAMETER ', async () => {
      const req = {
        mode: SAVE_TEMPLATE_MODE.UPDATE,
        compositeTemplateData: {
          id: null,
          name: 'string',
          description: 'string',
          docusignTemplateIds: ['string'],
          isApplicableForChangeOrders: true,
          applicableFundingSources: ['string'],
          applicableUtilityPrograms: ['string'],
          applicableUtilities: ['string'],
          applicableStates: ['string'],
          applicableSystemTypes: [SYSTEM_TYPE.ALL],
          createdAt: new Date('1/19/2020'),
          updatedAt: new Date('1/19/2020'),
        },
      };

      docusignTemplateMasterService = new DocusignTemplateMasterService(null, null, null, null, null, null, null);
      const res = await docusignTemplateMasterService.saveContractCompositeTemplate(req);

      expect(res).toMatchSnapshot();
      expect(res).toBeInstanceOf(OperationResult);
      expect(res.data).toBeInstanceOf(SaveContractCompositeTemplateDto);
      expect(res.data.responseStatus).toBe('INVALID_MODE_PARAMETER');
    });
  });

  describe('countByOpportunityId function', () => {
    test('should return 2 ', async () => {
      const mockDocusignTemplateMaster = {
        countDocuments: jest.fn().mockResolvedValue(2),
      } as any;

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        mockDocusignTemplateMaster,
        null,
        null,
        null,
        null,
        null,
        null,
      );

      const res = await docusignTemplateMasterService.countByOpportunityId('opportunityId');
      expect(res).toMatchSnapshot();
      expect(res).toBe(2);
      expect(mockDocusignTemplateMaster.countDocuments).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUtilityMaster function', () => {
    test('should return undefined ', async () => {
      const mockUtilityMaster = {
        findOne: jest.fn().mockResolvedValue(null),
      } as any;

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        null,
        null,
        mockUtilityMaster,
        null,
        null,
        null,
        null,
      );

      const res = await docusignTemplateMasterService.getUtilityMaster('utilityMaster');
      expect(res).toMatchSnapshot();
      expect(res).toBeUndefined();
      expect(mockUtilityMaster.findOne).toHaveBeenCalledTimes(1);
    });

    test('should return Utility Master model', async () => {
      const mockRes = {
        utility_name: 'utility_name',
        lse_id: 'lse_id',
      };
      const mockUtilityMaster = {
        findOne: jest.fn().mockResolvedValue({ ...mockRes, toObject: jest.fn().mockReturnValue(mockRes) }),
      } as any;

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        null,
        null,
        mockUtilityMaster,
        null,
        null,
        null,
        null,
      );

      const res = await docusignTemplateMasterService.getUtilityMaster('utilityMaster');
      expect(res).toMatchSnapshot();
      expect(mockUtilityMaster.findOne).toHaveBeenCalledTimes(1);
      expect(res).not.toBeUndefined();
      expect(res).toMatchObject(mockRes);
    });
  });

  describe('getDocusignCompositeTemplateMaster', () => {
    test('should work correctly', async () => {
      const mockDocusignCompositeTemplateMaster = {
        find: jest.fn().mockResolvedValue([
          {
            toObject: jest.fn().mockReturnValue({
              template_name: 'template_name',
              description: 'description',
              docusign_template_id: 'docusign_template_id',
              recipient_roles: ['recipient_roles'],
              template_status: TEMPLATE_STATUS.ACTIVE,
            }),
          },
        ]),
      } as any;
      docusignTemplateMasterService = new DocusignTemplateMasterService(
        null,
        null,
        null,
        mockDocusignCompositeTemplateMaster,
        null,
        null,
        null,
      );

      const res = await docusignTemplateMasterService.getDocusignCompositeTemplateMaster([], [], []);
      expect(res).toMatchSnapshot();
      expect(res).toEqual(expect.any(Array));
    });
  });

  describe('getCompositeTemplateById', () => {
    test('should work correctly', async () => {
      const mockDocusignCompositeTemplateMaster = {
        findById: jest.fn().mockResolvedValue(null),
      } as any;
      docusignTemplateMasterService = new DocusignTemplateMasterService(
        null,
        null,
        null,
        mockDocusignCompositeTemplateMaster,
        null,
        null,
        null,
      );

      const res = await docusignTemplateMasterService.getCompositeTemplateById('compositeTemplateId');
      expect(res).toMatchSnapshot();
      expect(mockDocusignCompositeTemplateMaster.findById).toHaveBeenCalledTimes(1);
      expect(res).toBeTruthy();
    });

    test('should work correctly', async () => {
      const mockRes = {
        id: '123',
        name: 'string',
        description: 'string',
        docusign_template_ids: ['string'],
        is_applicable_for_change_orders: true,
        applicable_funding_sources: ['string'],
        applicable_utility_programs: ['string'],
        applicable_utilities: ['string'],
        applicable_states: ['string'],
        applicable_system_types: [SYSTEM_TYPE.ALL],
        created_at: new Date('1/19/2020'),
        updated_at: new Date('1/19/2020'),
      };
      const mockDocusignCompositeTemplateMaster = {
        findById: jest.fn().mockResolvedValue({ ...mockRes, toObject: jest.fn().mockReturnValue(mockRes) }),
      } as any;
      const mockDocusignTemplateMaster = {
        findById: jest.fn().mockResolvedValue({
          template_name: 'template_name',
          description: 'description',
          docusign_template_id: 'docusign_template_id',
          recipient_roles: ['recipient_roles'],
          template_status: TEMPLATE_STATUS.ACTIVE,
          toObject: jest.fn().mockReturnValue({
            template_name: 'template_name',
            description: 'description',
            docusign_template_id: 'docusign_template_id',
            recipient_roles: ['recipient_roles'],
            template_status: TEMPLATE_STATUS.ACTIVE,
          }),
        }),
      } as any;
      const mockSignerRoleMaster = {
        findById: jest.fn().mockResolvedValue({
          _id: 'id',
          role_name: 'role_name',
          role_description: 'role_description',
          toObject: jest.fn(),
        }),
      } as any;

      docusignTemplateMasterService = new DocusignTemplateMasterService(
        mockDocusignTemplateMaster,
        mockSignerRoleMaster,
        null,
        mockDocusignCompositeTemplateMaster,
        null,
        null,
        null,
      );

      const res = await docusignTemplateMasterService.getCompositeTemplateById('compositeTemplateId');
      expect(res).toMatchSnapshot();
      expect(mockDocusignCompositeTemplateMaster.findById).toHaveBeenCalledTimes(1);
    });
  });
});
