import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { AppModule } from './app/app.module';
import { ValidationPipe } from './app/validation.pipe';
import { IDocusignContextRouteMapper, IDocusignContextStore } from './shared/docusign';
import { KEYS } from './shared/docusign/constants';

async function bootstrap() {
  const fAdapt = new FastifyAdapter();
  // eslint-disable-next-line
  fAdapt.register(require('fastify-multipart'), {
    limits: {
      fileSize: 1024 * 1024 * 15,
    },
  });

  fAdapt.enableCors({ origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE'] });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fAdapt);

  const docusignContextStore = app.get<IDocusignContextRouteMapper & IDocusignContextStore>(KEYS.CONTEXT);

  docusignContextStore.initRoutesMapper();

  fAdapt.getInstance().addHook('preHandler', (req, _rep, done) => {
    if (docusignContextStore.checkRoute(req.routerMethod, req.routerPath)) {
      docusignContextStore.run(() => {
        done();
      });

      return;
    }

    done();
  });

  const options = new DocumentBuilder()
    .setTitle('Wave Solar Design Tool')
    .setDescription('Wave Solar Design Tool API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  app.use(
    morgan(
      '[:date[iso]] :remote-addr HTTP/:http-version :method :url HTTP-Code: :status Size: :res[content-length] bytes - Response-time: :response-time ms',
    ),
  );
  // app.useLogger(app.get(MyLogger));
  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}

bootstrap().then(() => {
  console.log('Service listening 👍:', process.env.PORT);
});
