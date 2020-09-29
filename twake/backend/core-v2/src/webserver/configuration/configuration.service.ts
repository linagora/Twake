import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebConfigService {
  constructor(private configService: ConfigService) {}

  get url(): string {
    return this.configService.get<string>('http.url');
  }

  get port(): number {
    return Number(this.configService.get<number>('http.port'));
  }
}
