import { Multipart } from 'fastify-multipart';

import { FastifyAdapter } from '@nestjs/platform-fastify';

export type FastifyRequest = Parameters<FastifyAdapter['getRequestUrl']>[0];

export type FastifyResponse = Parameters<FastifyAdapter['setHeader']>[0];

export type FastifyFile = Multipart;
