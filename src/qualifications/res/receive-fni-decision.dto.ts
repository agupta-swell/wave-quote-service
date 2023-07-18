import { ApiProperty } from '@nestjs/swagger';
import { ExposeProp } from 'src/shared/decorators';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

class TransactionResDto {

    @ExposeProp()
    status: string;

    @ExposeProp()
    @IsOptional()
    refnum: string;

    @ExposeProp()
    @IsOptional()
    errorMsgs: string[];

}

export class RecieveFniDecisionResDto {

    @ApiProperty({ type: TransactionResDto })
    @Type(() => TransactionResDto)
    transaction: TransactionResDto;
    
}