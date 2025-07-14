// Mock implementation of @xenova/transformers for Jest testing

class MockPipeline {
  constructor(task, model) {
    this.task = task;
    this.model = model;
  }

  async process(input, options = {}) {
    // Mock different pipeline behaviors based on task
    switch (this.task) {
      case 'summarization':
        return [{
          summary_text: 'This is a mock summary of the input text. It contains the key points and main ideas from the original content.'
        }];
        
      case 'question-answering':
        return {
          answer: 'This is a mock answer to the question.',
          score: 0.9,
          start: 0,
          end: 10
        };
        
      case 'text-classification':
        return [{
          label: 'POSITIVE',
          score: 0.8
        }];
        
      case 'feature-extraction':
        return [[0.1, 0.2, 0.3, 0.4, 0.5]]; // Mock embeddings
        
      default:
        return { result: 'Mock result for ' + this.task };
    }
  }

  // Alias for different calling patterns
  async __call__(input, options = {}) {
    return this.process(input, options);
  }
}

// Mock pipeline function
const pipeline = jest.fn().mockImplementation(async (task, model, options = {}) => {
  // Simulate loading time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return new MockPipeline(task, model);
});

// Mock env object
const env = {
  backends: {
    onnx: {
      wasm: {
        numThreads: 1
      }
    }
  },
  allowLocalModels: false,
  allowRemoteModels: true
};

module.exports = {
  pipeline,
  env,
  Pipeline: MockPipeline
};
