import { ApiProperty } from '@nestjs/swagger';
import { ExposeProp } from 'src/shared/decorators';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

class TransactionDto {
    @ApiProperty()
    @IsNotEmpty()
    refnum: string;

    @ApiProperty()
    status: string;
}


class StipsElementDto {
    @ApiProperty()
    description: string;

    @ApiProperty()
    id: string;

    @ApiProperty()
    status: string;
}

class ApplicationElementDTO {
    @ApiProperty()
    dealerGroupId: string;

    @ApiProperty()
    externalTrackingNum: string;

    @ApiProperty()
    productId: string;

    @ApiProperty()
    currStatus: string;

    @ApiProperty()
    dealerLocationId: string;

    @ApiProperty()
    facilityGroupId: string;

    @ApiProperty()
    requestCrline: string;

    @ApiProperty()
    facilityLocationId: string;

    @ApiProperty()
    currCrline: string;

    @ApiProperty()
    currDecision: string;

    @ApiProperty()
    timeReceived: string;

    @ApiProperty()
    currQueueId: string;

    @ApiProperty()
    productType: string;

}

class ApprovedOffersElementDTO {

    @ApiProperty()
    minLoan: string;

    @ApiProperty()
    interestRate2: string;

    @ApiProperty()
    facilityLocationName: string;

    @ApiProperty()
    interestRate1: string;
    @ApiProperty()
    productName: string;
    @ApiProperty()
    paymentFactor1: string;
    @ApiProperty()
    paymentFactor2: string;
    @ApiProperty()
    zeroInterestMonths: string;
    @ApiProperty()
    rateType: string;
    @ApiProperty()
    repaymentType: string;
    @ApiProperty()
    totalPayment: string;
    @ApiProperty()
    term2: string;
    @ApiProperty()
    rateBand: string;
    @ApiProperty()
    term1: string;
    @ApiProperty()
    dealerFeeAmount: string;
    @ApiProperty()
    zeroPaymentMonths: string;
    @ApiProperty()
    approvedOfferId: string;
    @ApiProperty()
    apr: string;
    @ApiProperty()
    dealerFeeMethod: string;
    @ApiProperty()
    dealerFeePercent: string;
    @ApiProperty()
    loanAmount: string;
    @ApiProperty()
    additionalPaymentMonth: string;
    @ApiProperty()
    maxLoan: string;
    @ApiProperty()
    monthlyPayment2: string;
    @ApiProperty()
    monthlyPayment1: string;
    @ApiProperty()
    financeCharges: string;
}

class DecisionOfferElementDTO {

    @ApiProperty()
    decisionOfferId: string;
}

class DisbursementsDTO {

    @ApiProperty()
    amount: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    disburmentNumber: string;

    @ApiProperty()
    finalIndicator: string;

    @ApiProperty()
    status: string;
}

class Applicant2DTO {
    @ApiProperty()
    attn: string;
    @ApiProperty()
    prevAttn: string;
    @ApiProperty()
    city: string;
    @ApiProperty()
    prevAddr: string;
    @ApiProperty()
    eMail: string;
    @ApiProperty()
    socLast4: string;
    @ApiProperty()
    gen: string;
    @ApiProperty()
    dcsnReason1: string;
    @ApiProperty()
    mailAddr: string;
    @ApiProperty()
    dcsnReason3: string;
    @ApiProperty()
    dcsnReason2: string;
    @ApiProperty()
    dcsnReason4: string;
    @ApiProperty()
    housingCost: string;
    @ApiProperty()
    dti: string;
    @ApiProperty()
    mailCity: string;
    @ApiProperty()
    state: string;
    @ApiProperty()
    mi: string;
    @ApiProperty()
    addr: string;
    @ApiProperty()
    mailAttn: string;
    @ApiProperty()
    zip: string;
    @ApiProperty()
    last: string;
    @ApiProperty()
    addrLengthMos: string;
    @ApiProperty()
    prevZip: string;
    @ApiProperty()
    mailState: string;
    @ApiProperty()
    mailZip: string;
    @ApiProperty()
    prevState: string;
    @ApiProperty()
    phone: string;
    @ApiProperty()
    dob: Date;
    @ApiProperty()
    housingCode: string;
    @ApiProperty()
    altPhone: string;
    @ApiProperty()
    prevCity: string;
    @ApiProperty()
    first: string;
}

class ProductDecisionsDTO {

    @ApiProperty()
    productDecision: string;

    @ApiProperty()
    productName: string

}

class Applicant1DTO {
    @ApiProperty()
    attn: string;
    @ApiProperty()
    prevAttn: string;
    @ApiProperty()
    city: string;
    @ApiProperty()
    prevAddr: string;
    @ApiProperty()
    eMail: string;
    @ApiProperty()
    socLast4: string;
    @ApiProperty()
    gen: string;
    @ApiProperty()
    dcsnReason1: string;
    @ApiProperty()
    mailAddr: string;
    @ApiProperty()
    dcsnReason3: string;
    @ApiProperty()
    dcsnReason2: string;
    @ApiProperty()
    dcsnReason4: string;
    @ApiProperty()
    housingCost: string;
    @ApiProperty()
    dti: string;
    @ApiProperty()
    mailCity: string;
    @ApiProperty()
    state: string;
    @ApiProperty()
    mi: string;
    @ApiProperty()
    addr: string;
    @ApiProperty()
    mailAttn: string;
    @ApiProperty()
    zip: string;
    @ApiProperty()
    last: string;
    @ApiProperty()
    addrLengthMos: string;
    @ApiProperty()
    prevZip: string;
    @ApiProperty()
    mailState: string;
    @ApiProperty()
    mailZip: string;
    @ApiProperty()
    prevState: string;
    @ApiProperty()
    phone: string;
    @ApiProperty()
    dob: Date;
    @ApiProperty()
    housingCode: string;
    @ApiProperty()
    altPhone: string;
    @ApiProperty()
    prevCity: string;
    @ApiProperty()
    first: string;
}

class FieldDescriptionsDTO {
    @ApiProperty()
    coBureauStatus: string;
    @ApiProperty()
    currQueueName: string;
    @ApiProperty()
    dealerLocationName: string;
    @ApiProperty()
    facilityLocationName: string;
    @ApiProperty()
    dealerGroupName: string;
    @ApiProperty()
    facilityGroupName: string;
    @ApiProperty()
    productName: string;
    @ApiProperty()
    productType: string;
    @ApiProperty()
    primBureauStatus: string
}



class EmploymentDTO {
    @ApiProperty()
    empLengthMos: string;
    @ApiProperty()
    empChnum: string;
    @ApiProperty()
    empType: string;
    @ApiProperty()
    empAddr: string;
    @ApiProperty()
    empAttn: string;
    @ApiProperty()
    empPayBasis: string;
    @ApiProperty()
    empCity: string;
    @ApiProperty()
    empPay: string;
    @ApiProperty()
    empState: string;
    @ApiProperty()
    empOccupation: string;
    @ApiProperty()
    empPhone: string;
    @ApiProperty()
    empZip: string;
    @ApiProperty()
    empName: string
}

export class RecieveFniDecisionReqDto {

    @ApiProperty({ type: TransactionDto })
    @IsNotEmpty()
    @Type(() => TransactionDto)
    @ValidateNested()
    transaction: TransactionDto;

    @ApiProperty({ type: StipsElementDto })
    @IsNotEmpty()
    @Type(() => StipsElementDto)
    @ValidateNested()
    stips: StipsElementDto[];

    @ApiProperty({ type: ApplicationElementDTO })
    @IsNotEmpty()
    @Type(() => ApplicationElementDTO)
    @ValidateNested()
    application: ApplicationElementDTO;


    @ApiProperty({ type: ApprovedOffersElementDTO })
    @IsNotEmpty()
    @Type(() => ApprovedOffersElementDTO)
    @ValidateNested()
    approved_offers: ApprovedOffersElementDTO[];

    @ApiProperty({ type: DecisionOfferElementDTO })
    @IsNotEmpty()
    @Type(() => DecisionOfferElementDTO)
    @ValidateNested()
    decision_offer: DecisionOfferElementDTO[];

    @ApiProperty({ type: DisbursementsDTO })
    @IsNotEmpty()
    @Type(() => DisbursementsDTO)
    @ValidateNested()
    disbursements: DisbursementsDTO[];

    @ApiProperty({ type: Applicant2DTO })
    @Type(() => Applicant2DTO)
    applicant2: Applicant2DTO;

    @ApiProperty({ type: ProductDecisionsDTO })
    @Type(() => ProductDecisionsDTO)
    @ValidateNested()
    product_decisions: ProductDecisionsDTO[];

    @ApiProperty({ type: Applicant1DTO })
    @Type(() => Applicant1DTO)
    applicant1: Applicant1DTO;

    @ApiProperty({ type: FieldDescriptionsDTO })
    @Type(() => FieldDescriptionsDTO)
    @ValidateNested()
    field_descriptions: FieldDescriptionsDTO[];

    @ApiProperty({ type: EmploymentDTO })
    @Type(() => EmploymentDTO)
    @ValidateNested()
    employment: EmploymentDTO[];
}