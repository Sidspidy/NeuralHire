import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable Global Validation Pipe
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    // Enable CORS
    // app.enableCors();

    const port = process.env.PORT || 3003;
    await app.listen(port, '0.0.0.0');
    console.log(`Payment Service is running on port ${port}`);
}
bootstrap();
