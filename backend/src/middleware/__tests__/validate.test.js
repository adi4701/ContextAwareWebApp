'use strict';

const {
  validateFeatureVector,
  validateTelemetry,
  validateFeedback,
  ALLOWED_STATES,
} = require('../validate');

describe('validateFeatureVector', () => {
  test('passes on valid complete 8-feature vector', () => {
    const vector = {
      clicks_per_min: 24.5,
      unique_click_ratio: 0.8,
      repeat_click_ratio: 0.1,
      scroll_speed: 120.5,
      max_scroll_depth: 75.0,
      key_presses_per_min: 15.0,
      idle_ratio: 0.25,
      view_switches_per_min: 4.0,
    };
    const res = validateFeatureVector(vector);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  test('fails if ratio is outside [0, 1]', () => {
    const vector = {
      unique_click_ratio: 1.5,
    };
    const res = validateFeatureVector(vector);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('must be between 0 and 1');
  });

  test('fails if max_scroll_depth > 100', () => {
    const vector = {
      max_scroll_depth: 105,
    };
    const res = validateFeatureVector(vector);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('max_scroll_depth');
  });

  test('fails if value is NaN or Infinity', () => {
    expect(validateFeatureVector({ clicks_per_min: NaN }).valid).toBe(false);
    expect(validateFeatureVector({ clicks_per_min: Infinity }).valid).toBe(false);
    expect(validateFeatureVector({ clicks_per_min: 'not a number' }).valid).toBe(false);
  });

  test('fails if input is not an object', () => {
    expect(validateFeatureVector(null).valid).toBe(false);
    expect(validateFeatureVector('hello').valid).toBe(false);
  });
});

describe('validateTelemetry middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('calls next() for valid empty body', () => {
    validateTelemetry(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('calls next() for valid rawEvents', () => {
    mockReq.body.rawEvents = [
      { type: 'click', timestamp: Date.now(), elementId: 'btn-1' },
      { type: 'keypress', timestamp: Date.now() },
    ];
    validateTelemetry(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('rejects privacy violations: typed key value or text', () => {
    mockReq.body.rawEvents = [
      { type: 'keypress', timestamp: Date.now(), key: 'a' },
    ];
    validateTelemetry(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Privacy violation') })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('rejects rawEvents exceeding 1000 items', () => {
    mockReq.body.rawEvents = new Array(1001).fill({ type: 'scroll', timestamp: 123 });
    validateTelemetry(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('validates precomputed features object', () => {
    mockReq.body.features = { clicks_per_min: -10 };
    validateTelemetry(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('validateFeedback middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {
        chosenSetting: { state: 'fast_navigator' },
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  test('calls next() for valid feedback body', () => {
    validateFeedback(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  test('rejects missing chosenSetting', () => {
    mockReq.body.chosenSetting = null;
    validateFeedback(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('rejects invalid targetState', () => {
    mockReq.body.targetState = 'super_hacker_mode';
    validateFeedback(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('accepts all 5 canonical states', () => {
    for (const state of ALLOWED_STATES) {
      mockReq.body.targetState = state;
      mockNext.mockClear();
      validateFeedback(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    }
  });
});
