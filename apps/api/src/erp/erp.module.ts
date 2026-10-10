import { Global, Module } from '@nestjs/common';
import { ErpService } from './erp.service';
import { MockErpConnector } from './mock-erp.connector';

@Global()
@Module({
  providers: [MockErpConnector, ErpService],
  exports: [ErpService],
})
export class ErpModule {}
