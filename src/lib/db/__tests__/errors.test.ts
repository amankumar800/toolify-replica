import { describe, it, expect } from 'vitest';
import { DatabaseError, NotFoundError, ValidationError } from '../errors';

describe('DatabaseError', () => {
  it('contains operation, table, message, and originalError', () => {
    const originalError = new Error('Connection refused');
    const error = new DatabaseError(
      'findById',
      'tools',
      'Connection failed',
      originalError
    );

    expect(error.operation).toBe('findById');
    expect(error.table).toBe('tools');
    expect(error.message).toContain('findById');
    expect(error.message).toContain('tools');
    expect(error.message).toContain('Connection failed');
    expect(error.originalError).toBe(originalError);
    expect(error.name).toBe('DatabaseError');
  });

  it('works without originalError', () => {
    const error = new DatabaseError('create', 'categories', 'Duplicate key');

    expect(error.operation).toBe('create');
    expect(error.table).toBe('categories');
    expect(error.originalError).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const error = new DatabaseError('update', 'tools', 'Failed');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('contains entity and identifier', () => {
    const error = new NotFoundError('Tool', 'my-tool-slug');

    expect(error.entity).toBe('Tool');
    expect(error.identifier).toBe('my-tool-slug');
    expect(error.message).toContain('Tool');
    expect(error.message).toContain('my-tool-slug');
    expect(error.name).toBe('NotFoundError');
  });

  it('is an instance of Error', () => {
    const error = new NotFoundError('Category', 'unknown-id');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ValidationError', () => {
  it('contains field and message', () => {
    const error = new ValidationError('email', 'must be a valid email address');

    expect(error.field).toBe('email');
    expect(error.message).toContain('email');
    expect(error.message).toContain('must be a valid email address');
    expect(error.name).toBe('ValidationError');
  });

  it('is an instance of Error', () => {
    const error = new ValidationError('name', 'is required');
    expect(error).toBeInstanceOf(Error);
  });
});
