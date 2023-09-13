import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export interface IGsSiteInfo extends Document {
  type: string;
  siteId: string;
}

export const GsSiteInfoSchema = new Schema<IGsSiteInfo>(
  {
    type: {
      type: String,
    },
    siteId: {
      type: String,
    },
  },
  { _id: false },
);

export interface IGsOpportunityDetail extends Document {
  backupGeneratorNumber?: string;
  signedAddFormDate?: Date;
  installDate?: Date;
  unenrollmentDate?: Date;
  siteExportLimitKw?: number;
  hasBatteryExportLimit?: boolean;
  canChargeFromGrid?: boolean;
  vppSldDesignReviewCompletedDate?: Date;
  obtainBuildingPermitDate?: Date;
  mechanicalReviewDate?: Date;
  projectStartDate?: Date;
  buildingPermitSignOffDate?: Date;
  has70512UpstreamComplianceForMaxExport?: boolean;
  vppDesignReviewNotes?: string;
  maxNetExport9to5?: number;
  maxNetExport5to9?: number;
  grossMinimumLoad9to5?: number;
  grossMinimumLoad5to9?: number;
  existingPvSystemSize?: number;
  totalPvSystemSize?: number;
  hasOnsiteBackupGenerator?: boolean;
  existingDRPProgram?: boolean;
  delayedReason?: string;
  delayedExplanation?: string;
  propertyTypeId?: string;
  gridAmpErrors?: string[];
  utilityEnrollmentErrors?: string[];
  programManagerControlApproved?: boolean;
  operatorControlApproved?: boolean;
  isControlled?: boolean;
}

export const GsOpportunityDetailSchema = new Schema<IGsOpportunityDetail>(
  {
    backupGeneratorNumber: {
      type: String,
      optional: true,
    },
    signedAddFormDate: {
      type: Date,
      optional: true,
    },
    installDate: {
      type: Date,
      optional: true,
    },
    unenrollmentDate: {
      type: Date,
      optional: true,
    },
    siteExportLimitKw: {
      type: Number,
      decimal: true,
      optional: true,
    },
    hasBatteryExportLimit: {
      type: Boolean,
      optional: true,
    },
    canChargeFromGrid: {
      type: Boolean,
      optional: true,
    },
    vppSldDesignReviewCompletedDate: {
      type: Date,
      optional: true,
    },
    obtainBuildingPermitDate: {
      type: Date,
      optional: true,
    },
    mechanicalReviewDate: {
      type: Date,
      optional: true,
    },
    projectStartDate: {
      type: Date,
      optional: true,
    },
    buildingPermitSignOffDate: {
      type: Date,
      optional: true,
    },
    has70512UpstreamComplianceForMaxExport: {
      type: Boolean,
      optional: true,
    },
    vppDesignReviewNotes: {
      type: String,
      optional: true,
    },
    maxNetExport9to5: {
      type: Number,
      decimal: true,
      optional: true,
    },
    maxNetExport5to9: {
      type: Number,
      decimal: true,
      optional: true,
    },
    grossMinimumLoad9to5: {
      type: Number,
      decimal: true,
      optional: true,
    },
    grossMinimumLoad5to9: {
      type: Number,
      decimal: true,
      optional: true,
    },
    existingPvSystemSize: {
      type: Number,
      decimal: true,
      optional: true,
    },
    totalPvSystemSize: {
      type: Number,
      decimal: true,
      optional: true,
    },
    hasOnsiteBackupGenerator: {
      type: Boolean,
      optional: true,
    },
    existingDRPProgram: {
      type: Boolean,
      optional: true,
    },
    delayedReason: {
      type: String,
      optional: true,
    },
    delayedExplanation: {
      type: String,
      optional: true,
    },
    propertyTypeId: {
      type: String,
      optional: true,
    },
    gridAmpErrors: {
      type: [String],
      optional: true,
    },
    utilityEnrollmentErrors: {
      type: [String],
      optional: true,
    },
    programManagerControlApproved: {
      type: Boolean,
      optional: true,
    },
    operatorControlApproved: {
      type: Boolean,
      optional: true,
    },
    isControlled: {
      type: Boolean,
      optional: true,
    },
  },
  { _id: false },
);

export interface IGridService extends Document {
  gridServiceId: string;
  name?: string;
  contractSignDate?: Date;
  capabilityStartDate?: Date;
  enrollmentStartDate?: Date;
  enrollmentEndDate?: Date;
  additionalIncentive?: Date;
  incentiveValue?: number;
  incentiveStartDate?: Date;
  capabilityAmount?: number;
  estimatedCapability?: number;
  utilityEnabledCapability?: number;
  incentiveAmount?: number;
  createdAt: Date;
  modifiedAt: Date;
  createdBy?: string;
  modifiedBy?: string;
}

export const GridServiceSchema = new Schema<IGridService>(
  {
    gridServiceId: {
      type: String,
    },
    name: {
      type: String,
      optional: true,
    },
    contractSignDate: {
      type: Date,
      optional: true,
    },
    capabilityStartDate: {
      type: Date,
      optional: true,
    },
    enrollmentStartDate: {
      type: Date,
      optional: true,
    },
    enrollmentEndDate: {
      type: Date,
      optional: true,
    },
    additionalIncentive: {
      type: Number,
      optional: true,
    },
    incentiveValue: {
      type: Number,
      optional: true,
      decimal: true,
    },
    incentiveStartDate: {
      type: Date,
      optional: true,
    },
    capabilityAmount: {
      type: Number,
      optional: true,
      decimal: true,
    },
    estimatedCapability: {
      type: Number,
      optional: true,
      decimal: true,
    },
    utilityEnabledCapability: {
      type: Number,
      optional: true,
      decimal: true,
    },
    incentiveAmount: {
      type: Number,
      optional: true,
      decimal: true,
    },
    createdBy: {
      type: String,
      optional: true,
    },
    modifiedBy: {
      type: String,
      optional: true,
    },
  },
  { _id: false, timestamps: { createdAt: 'createdAt', updatedAt: 'modifiedAt' } },
);

export interface IGsOpportunity extends Document {
  name: string;
  type: string;
  stage: string;
  lastActiveStage?: string;
  utilityId: string;
  utilityProgramId: string;
  opportunityId?: string;
  projectId?: string;
  details?: IGsOpportunityDetail;
  homeownerId?: string;
  salesPartnerId?: string;
  salesPartnerUserId?: string;
  installationPartnerId?: string;
  installationPartnerUserId?: string;
  salesforceId?: string;
  gridServices?: string;
  lseId?: string;
  lseName?: string;
  masterTariffId?: string;
  masterTariffName?: string;
  ruleSetId?: string;
  enrollmentDisposition?: string;
  siteInfo?: IGsSiteInfo;
  gsOppId: string;
  movedIntoRegistrationAt?: Date;
  movedIntoCommissioningAt?: Date;
  movedIntoProgramOnboardingAt?: Date;
  movedIntoSiteAnalysisAt?: Date;
  movedIntoEnrollmentCompleteAt?: Date;
  movedIntoDelayedAt?: Date;
  movedIntoUnenrolledAt?: Date;
  movedIntoArchivedAt?: Date;
  propertyId: string;
  createdAt: Date;
  modifiedAt: Date;
  enrollmentStartDate?: Date;
}

export const GsOpportunitySchema = new Schema<IGsOpportunity>(
  {
    _id: Schema.Types.Mixed,
    name: {
      type: String,
    },
    type: {
      type: String,
    },
    stage: {
      type: String,
    },
    lastActiveStage: {
      type: String,
      optional: true,
    },
    utilityId: {
      type: String,
    },
    utilityProgramId: {
      type: String,
    },
    opportunityId: {
      type: String,
      optional: true,
    },
    projectId: {
      type: String,
      optional: true,
    },
    details: {
      type: GsOpportunityDetailSchema,
      optional: true,
    },
    homeownerId: {
      type: String,
      optional: true,
    },
    salesPartnerId: {
      type: String,
      optional: true,
    },
    salesPartnerUserId: {
      type: String,
      optional: true,
    },
    installationPartnerId: {
      type: String,
      optional: true,
    },
    installationPartnerUserId: {
      type: String,
      optional: true,
    },
    salesforceId: {
      type: String,
      optional: true,
    },
    gridServices: {
      type: [GridServiceSchema],
      optional: true,
    },
    lseId: {
      type: String,
      optional: true,
    },
    lseName: {
      type: String,
      optional: true,
    },
    masterTariffId: {
      type: String,
      optional: true,
    },
    masterTariffName: {
      type: String,
      optional: true,
    },
    ruleSetId: {
      type: String,
      optional: true,
    },
    enrollmentDisposition: {
      type: String,
      optional: true,
    },
    siteInfo: {
      type: GsSiteInfoSchema,
      optional: true,
    },
    gsOppId: {
      type: String,
    },
    movedIntoRegistrationAt: {
      type: Date,
      optional: true,
    },
    movedIntoCommissioningAt: {
      type: Date,
      optional: true,
    },
    movedIntoProgramOnboardingAt: {
      type: Date,
      optional: true,
    },
    movedIntoSiteAnalysisAt: {
      type: Date,
      optional: true,
    },
    movedIntoEnrollmentCompleteAt: {
      type: Date,
      optional: true,
    },
    movedIntoDelayedAt: {
      type: Date,
      optional: true,
    },
    movedIntoUnenrolledAt: {
      type: Date,
      optional: true,
    },
    movedIntoArchivedAt: {
      type: Date,
      optional: true,
    },
    propertyId: {
      type: String,
    },

    enrollmentStartDate: {
      type: String,
      optional: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'modifiedAt' },
  },
);

MongooseNamingStrategy.ExcludeOne(GsOpportunitySchema);
