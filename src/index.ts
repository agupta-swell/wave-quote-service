import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';
import { AppModule } from './app/app.module';
import { ValidationPipe } from './app/validation.pipe';

async function bootstrap() {
  const fAdapt = new FastifyAdapter();
  fAdapt.register(require('fastify-multipart'));
  fAdapt.enableCors({ origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE'] });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fAdapt);

  const options = new DocumentBuilder()
    .setTitle('Wave Solar Design Tool')
    .setDescription('Wave Solar Design Tool API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  app.use(
    morgan(
      `[:date[clf]] :remote-addr HTTP/:http-version :method :url HTTP-Code: :status Size: :res[content-length] bytes - Response-time: :response-time ms`,
    ),
  );
  // app.useLogger(app.get(MyLogger));
  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}

bootstrap().then(() => {
  console.log('Service listening 👍:', process.env.PORT);

  const {
    PORT,
    MONGO_URL,
    JWT_SECRET,
    JWT_EXPIRE_TIME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_S3_BUCKET,
  } = process.env;
  console.log('>>>>>>>>>>>>>>>>>>>', {
    PORT,
    MONGO_URL,
    JWT_SECRET,
    JWT_EXPIRE_TIME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_S3_BUCKET,
  });
});
