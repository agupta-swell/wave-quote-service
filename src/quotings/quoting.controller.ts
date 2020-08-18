import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Pagination, ServiceResponse } from 'src/app/common';
import { QuotingService } from './quoting.service';
import { CreateQuotingDto } from './req/create-quoting.dto';
import { UpdateQuotingDto } from './req/update-quoting.dto';
import { QuotingDto } from './res/quoting.dto';

@ApiTags('Quotings')
@Controller('/quotings')
export class QuotingController {
  constructor(private quotingService: QuotingService) {}

  @Post()
  @ApiOperation({ summary: 'Create quoting' })
  @ApiOkResponse({ type: ServiceResponse })
  async create(@Body() quoting: CreateQuotingDto): Promise<ServiceResponse<{ id: string }>> {
    const result = await this.quotingService.create(quoting);
    return ServiceResponse.fromResult(result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quoting' })
  @ApiOkResponse({ type: ServiceResponse })
  async update(@Param('id') id: string, @Body() quoting: UpdateQuotingDto): Promise<ServiceResponse<{ id: string }>> {
    const result = await this.quotingService.update(id, quoting);
    return ServiceResponse.fromResult(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quoting' })
  @ApiOkResponse({ type: ServiceResponse })
  async delete(@Param('id') id: string): Promise<ServiceResponse<string>> {
    const result = await this.quotingService.delete(id);
    return ServiceResponse.fromResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotings' })
  @ApiOkResponse({ type: Pagination })
  async getQuotings(): Promise<ServiceResponse<Pagination<{ id: string; name: string }>>> {
    const result = await this.quotingService.getAllQuotings();
    return ServiceResponse.fromResult(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details' })
  @ApiOkResponse({ type: QuotingDto })
  async getDetails(@Param('id') id: string): Promise<ServiceResponse<QuotingDto>> {
    const result = await this.quotingService.getDetails(id);
    return ServiceResponse.fromResult(result);
  }
}
