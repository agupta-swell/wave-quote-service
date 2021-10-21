import { ExposeProp } from 'src/shared/decorators';

export class HealthCheckRes {
    @ExposeProp()
    status: string;
}