const smsService = require('../services/smsService');
const { SECTOR_MODELS } = require('../services/sectorModelRegistry');
const { generateMsmeSmsTestData, TRANSACTION_TYPES } = require('../utils/smsTestDataGenerator');

describe('MSME SMS test data generator', () => {
  test('creates 10000 messages with sector/process coverage', () => {
    const { messages, summary } = generateMsmeSmsTestData();
    const sectorKeys = Object.keys(SECTOR_MODELS);

    expect(messages).toHaveLength(10000);

    const expectedPerSector = Math.floor(messages.length / sectorKeys.length);
    sectorKeys.forEach((sectorKey) => {
      expect(summary.sectorCounts[sectorKey]).toBe(expectedPerSector);
      const processes = SECTOR_MODELS[sectorKey].processes || [];
      processes.forEach((process) => {
        expect(summary.processCounts[sectorKey][process]).toBeGreaterThan(0);
      });
    });

    const minPerType = Math.floor(messages.length / TRANSACTION_TYPES.length);
    TRANSACTION_TYPES.forEach((type) => {
      expect(summary.transactionTypeCounts[type]).toBeGreaterThanOrEqual(minPerType);
    });

    const messageIds = new Set(messages.map((message) => message.messageId));
    expect(messageIds.size).toBe(messages.length);
  });

  test('SMS service processes representative MSME messages', async () => {
    const { messages } = generateMsmeSmsTestData();
    const sectorKeys = Object.keys(SECTOR_MODELS);
    const expectedSamples = sectorKeys.length * TRANSACTION_TYPES.length;

    const samples = [];
    const seen = new Set();

    for (const message of messages) {
      const key = `${message.metadata.sector}:${message.metadata.transactionType}`;
      if (!seen.has(key)) {
        seen.add(key);
        samples.push(message);
      }
      if (seen.size === expectedSamples) {
        break;
      }
    }

    expect(samples).toHaveLength(expectedSamples);

    const results = await Promise.all(samples.map((sample) => smsService.processSMS({
      body: sample.body,
      sender: sample.sender,
      timestamp: sample.timestamp,
      messageId: sample.messageId
    }, sample.msmeProfile)));

    results.forEach((result, index) => {
      const sample = samples[index];
      expect(result.success).toBe(true);
      expect(result.transaction.transactionType).toBe(sample.metadata.transactionType);
      expect(result.transaction.classificationContext).toBeDefined();
      expect(result.transaction.classificationContext.sector).toBe(sample.metadata.sector);
      expect(result.transaction.classificationContext.matchedProcess).toBe(sample.metadata.process);
    });
  });
});
