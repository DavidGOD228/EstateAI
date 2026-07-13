import { AiProvider } from '../../src/ai/ai-provider.interface';

export type FakeAiProvider = { generate: jest.Mock } & AiProvider;

export function makeFakeAiProvider(): FakeAiProvider {
  return { generate: jest.fn() } as unknown as FakeAiProvider;
}
