import { Test, TestingModule } from '@nestjs/testing';
import { JobsGateway } from './jobs.gateway';

describe('JobsGateway', () => {
  let gateway: JobsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsGateway],
    }).compile();

    gateway = module.get<JobsGateway>(JobsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
