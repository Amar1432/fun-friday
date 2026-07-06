import { LoggingMiddleware } from './logging.middleware';
import { Request, Response, NextFunction } from 'express';

describe('LoggingMiddleware', () => {
  let middleware: LoggingMiddleware;

  beforeEach(() => {
    middleware = new LoggingMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should assign a request ID if none is present', () => {
    const req = {
      headers: {},
      method: 'GET',
      url: '/test',
    } as unknown as Request;

    const setHeaderSpy = jest.fn();
    const onSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
      on: onSpy,
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    const reqId = req.headers['x-request-id'] as string;
    expect(reqId).toBeDefined();
    expect(typeof reqId).toBe('string');
    expect(reqId.length).toBeGreaterThan(0);
    expect(setHeaderSpy).toHaveBeenCalledWith('x-request-id', reqId);
    expect(onSpy).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalled();
  });

  it('should reuse an existing request ID if present', () => {
    const existingId = 'existing-id-123';
    const req = {
      headers: {
        'x-request-id': existingId,
      },
      method: 'GET',
      url: '/test',
    } as unknown as Request;

    const setHeaderSpy = jest.fn();
    const onSpy = jest.fn();
    const res = {
      setHeader: setHeaderSpy,
      on: onSpy,
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect(setHeaderSpy).toHaveBeenCalledWith('x-request-id', existingId);
    expect(onSpy).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalled();
  });
});
