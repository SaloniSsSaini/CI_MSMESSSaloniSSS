const { handlers: standardHandlers } = require('./handlers/standardHandlers');
const sectorProfilerAgent = require('./sectorProfilerAgent');
const processMachineryProfilerAgent = require('./processMachineryProfilerAgent');

const buildProfilerHandler = (type, profiler) => async (task) => {
  const { input } = task || {};
  if (!input || !input.msmeData) {
    return { error: `Invalid input for ${type} profiler` };
  }
  return profiler.analyzeProfile(input);
};

const sectorProfilerHandler = buildProfilerHandler('sector', sectorProfilerAgent);
const processMachineryProfilerHandler = buildProfilerHandler('process/machinery', processMachineryProfilerAgent);

const getHandler = (agentType) => {
  if (!agentType) return null;
  if (agentType.startsWith('sector_profiler_')) {
    return sectorProfilerHandler;
  }
  if (agentType.startsWith('process_machinery_profiler_')) {
    return processMachineryProfilerHandler;
  }
  return standardHandlers[agentType];
};

const getSupportedTypes = () => [
  ...Object.keys(standardHandlers),
  'sector_profiler_*',
  'process_machinery_profiler_*'
];

module.exports = {
  getHandler,
  getSupportedTypes
};
