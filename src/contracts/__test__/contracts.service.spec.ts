import { IContractSignerDetails } from "src/docusign-communications/typing";
import { ContractService } from "../contract.service";

describe('contract service tests', () => {
  let contractService: ContractService;
  const CUSTOMER_PAYMENT_AMOUNT = 1234.56
  
  class mockContractModel {
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

    static findOne = jest.fn().mockResolvedValue({});
    static findByIdAndUpdate = jest.fn().mockResolvedValue({});
    static updateOne = jest.fn().mockResolvedValue({});
  }
  mockContractModel.findOne.mockImplementationOnce(() => ({
      lean: jest.fn().mockReturnValue({'_id': '1b'}),
  }));
  class mockOpportunityService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
    static updateExistingOppDataById = jest.fn().mockResolvedValue(null);
  }
  class mockQuoteService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
    static getOneById = jest.fn().mockResolvedValue(null);
    static getDetailQuote = jest.fn().mockResolvedValue({
      data: {
        quoteCostBuildup: {
          projectGrandTotal: 12202.90
        }
      }
    });
  }
  class mockUtilityService {
    constructor() {

    }

    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockUtilityProgramMasterService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockDocusignTemplateMasterService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockDocusignCommunicationService {
    constructor() {

    }
    static voidEnvelope = jest.fn().mockResolvedValue(null)
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockUserService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockContactService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);      
  }
  class mockCustomerPaymentService {
    constructor() {

    }
    static getCustomerPaymentByContractId = jest.fn().mockResolvedValue({amount: CUSTOMER_PAYMENT_AMOUNT});
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockSystemDesignService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockJwtService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockGenabilityUtilityMapService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockSystemAttributeService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
    static updateSystemAttributeByQuery = jest.fn().mockResolvedValue(null);
  }
  class mockSystemProductionService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockInstalledProductService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }
  class mockInstalledProjectService {
    constructor() {

    }
    static findOne = jest.fn().mockResolvedValue(null);
  }

  describe('updateContractByDocusign', () => {
    beforeEach(() => {
      contractService = new ContractService(
        mockContractModel as any,
        mockOpportunityService as any,
        mockQuoteService as any,
        mockUtilityService as any,
        mockUtilityProgramMasterService as any,
        mockDocusignTemplateMasterService as any,
        mockDocusignCommunicationService as any,
        mockUserService as any,
        mockContactService as any,
        mockCustomerPaymentService as any,
        mockSystemDesignService as any,
        mockJwtService as any,
        mockGenabilityUtilityMapService as any,
        mockSystemAttributeService as any,
        mockSystemProductionService as any,
        mockInstalledProductService as any,
        mockInstalledProjectService as any,
      )
    });
    it('Test overallContractStatus = COMPLETED', async () => {
      const contractSignerDetails = {} as IContractSignerDetails;
      contractSignerDetails.contractSystemReferenceId = '1a';
      contractSignerDetails.statusesData = [];
      contractSignerDetails.overallContractStatus = 'COMPLETED';
      await contractService.updateContractByDocusign(contractSignerDetails);

      expect(mockContractModel.findOne).toHaveBeenCalled();
      expect(mockQuoteService.getOneById).toHaveBeenCalled();
      expect(mockContractModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockQuoteService.getDetailQuote).toHaveBeenCalled();
      expect(mockOpportunityService.updateExistingOppDataById).toHaveBeenCalled();
      expect(mockSystemAttributeService.updateSystemAttributeByQuery).toHaveBeenCalled();
    });
    it('Test overallContractStatus != COMPLETED', async () => {
      class _mockContractModel {
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
    
        static findOne = jest.fn().mockResolvedValue({});
        static findByIdAndUpdate = jest.fn().mockResolvedValue({});
        static updateOne = jest.fn().mockResolvedValue({});
      }
      _mockContractModel.findOne.mockImplementationOnce(() => ({
          lean: jest.fn().mockReturnValue({'_id': '1b'}),
      }));
      class _mockOpportunityService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
        static updateExistingOppDataById = jest.fn().mockResolvedValue(null);
      }
      class _mockQuoteService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
        static getOneById = jest.fn().mockResolvedValue(null);
        static getDetailQuote = jest.fn().mockResolvedValue({
          data: {
            quoteCostBuildup: {
              projectGrandTotal: 12202.90
            }
          }
        });
      }
      class _mockUtilityService {
        constructor() {
    
        }
    
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockUtilityProgramMasterService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockDocusignTemplateMasterService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockDocusignCommunicationService {
        constructor() {
    
        }
        static voidEnvelope = jest.fn().mockResolvedValue(null)
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockUserService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockContactService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);      
      }
      class _mockCustomerPaymentService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockSystemDesignService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      
      class _mockJwtService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockGenabilityUtilityMapService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockSystemAttributeService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
        static updateSystemAttributeByQuery = jest.fn().mockResolvedValue(null);
      }
      class _mockSystemProductionService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockInstalledProductService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockProjectService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      contractService = new ContractService(
        _mockContractModel as any,
        _mockOpportunityService as any,
        _mockQuoteService as any,
        _mockUtilityService as any,
        _mockUtilityProgramMasterService as any,
        _mockDocusignTemplateMasterService as any,
        _mockDocusignCommunicationService as any,
        _mockUserService as any,
        _mockContactService as any,
        _mockCustomerPaymentService as any,
        _mockSystemDesignService as any,
        _mockJwtService as any,
        _mockGenabilityUtilityMapService as any,
        _mockSystemAttributeService as any,
        _mockSystemProductionService as any,
        _mockInstalledProductService as any,
        _mockProjectService as any,
      )
      const contractSignerDetails = {} as IContractSignerDetails;
      contractSignerDetails.contractSystemReferenceId = '1a';
      contractSignerDetails.statusesData = [];
      contractSignerDetails.overallContractStatus = 'IN_PROGRESS';
      await contractService.updateContractByDocusign(contractSignerDetails);

      expect(_mockContractModel.findOne).toHaveBeenCalled();
      expect(_mockQuoteService.getOneById).toHaveBeenCalled();
      expect(_mockContractModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(_mockQuoteService.getDetailQuote).not.toHaveBeenCalled();
      expect(_mockOpportunityService.updateExistingOppDataById).not.toHaveBeenCalled();
      expect(_mockSystemAttributeService.updateSystemAttributeByQuery).not.toHaveBeenCalled();
    });
  });

  describe('voidContract', () => {

    test('voidContract', async () => {
      class _mockContractModel {
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
        
        static find = jest.fn().mockReturnValue({});
        static findOne = jest.fn().mockResolvedValue({});
        static findByIdAndUpdate = jest.fn().mockResolvedValue({});
        static updateOne = jest.fn().mockResolvedValue({});
      }
      _mockContractModel.find.mockImplementationOnce(() => ({
          sort: jest.fn().mockReturnValue([]),
      }));
      _mockContractModel.findOne.mockImplementationOnce(() => ({
          lean: jest.fn().mockReturnValue({'_id': '1b'}),
      }));
      _mockContractModel.find.mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnValue([{
          associatedQuoteId: '1a'
        }])
      }));
      class _mockOpportunityService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
        static updateExistingOppDataById = jest.fn().mockResolvedValue(null);
      }
      class _mockQuoteService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
        static getOneById = jest.fn().mockResolvedValue(null);
        static getDetailQuote = jest.fn().mockResolvedValue({
          data: {
            quoteCostBuildup: {
              projectGrandTotal: {
                netCost: 12202.90
              },
              panelQuoteDetails: [
                {
                  quantity: 1,
                  panelModelDataSnapshot: {
                    ratings: {
                      watts: 12000,
                    }
                  },
                  
                },
              ],
              storageQuoteDetails: [{
                quantity: 1,
                storageModelDataSnapshot: {
                  ratings: {
                    kilowatts: 12,
                    kilowattHours: 14,
                  }
                },
              }],
            },
          },
        });
      }
      class _mockUtilityService {
        constructor() {
    
        }
    
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockUtilityProgramMasterService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockDocusignTemplateMasterService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockDocusignCommunicationService {
        constructor() {
    
        }
        static voidEnvelope = jest.fn().mockResolvedValue(null)
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockUserService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockContactService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);      
      }
      class _mockCustomerPaymentService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockSystemDesignService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockJwtService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockGenabilityUtilityMapService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockSystemAttributeService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
        static updateSystemAttributeByQuery = jest.fn().mockResolvedValue(null);
      }
      class _mockSystemProductionService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockInstalledProductService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      class _mockProjectService {
        constructor() {
    
        }
        static findOne = jest.fn().mockResolvedValue(null);
      }
      contractService = new ContractService(
        _mockContractModel as any,
        _mockOpportunityService as any,
        _mockQuoteService as any,
        _mockUtilityService as any,
        _mockUtilityProgramMasterService as any,
        _mockDocusignTemplateMasterService as any,
        _mockDocusignCommunicationService as any,
        _mockUserService as any,
        _mockContactService as any,
        _mockCustomerPaymentService as any,
        _mockSystemDesignService as any,
        _mockJwtService as any,
        _mockGenabilityUtilityMapService as any,
        _mockSystemAttributeService as any,
        _mockSystemProductionService as any,
        _mockInstalledProductService as any,
        _mockProjectService as any
      )
      const contract: any = {};
      contract.opportunityId = '1a'
      contract.contractingSystemReferenceId = '1b';

      await contractService.voidContract(contract, false);
      expect(_mockDocusignCommunicationService.voidEnvelope).toHaveBeenCalledWith('1b');
      expect(_mockContractModel.updateOne).toHaveBeenCalled();
      expect(_mockContractModel.find).toHaveBeenCalled();
      expect(_mockOpportunityService.updateExistingOppDataById).toHaveBeenCalled();
      expect(_mockSystemAttributeService.updateSystemAttributeByQuery).toHaveBeenCalledWith(
        {
          "opportunityId": "1a",
        },
        {
          "$set": {
            "batteryKw": 0, "batteryKwh": 0, "pvKw": 0
          }
        }
      );
    });
  });
});