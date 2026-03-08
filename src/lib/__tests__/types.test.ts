import { describe, it, expect } from 'vitest';
import { getNodeLabel, getNodeType, getEdgeLabel, getNodeFields, getEdgeFields } from '../types';

describe('getNodeLabel', () => {
  it('returns label field', () => {
    expect(getNodeLabel({ id: 'a', label: 'Alpha' })).toBe('Alpha');
  });
  it('returns name field when no label', () => {
    expect(getNodeLabel({ id: 'a', name: 'Alpha' })).toBe('Alpha');
  });
  it('falls back to id', () => {
    expect(getNodeLabel({ id: 'a' })).toBe('a');
  });
  it('skips empty label, uses name', () => {
    expect(getNodeLabel({ id: 'a', label: '', name: 'Beta' })).toBe('Beta');
  });
  it('skips non-string label', () => {
    expect(getNodeLabel({ id: 'a', label: 42 })).toBe('a');
  });
});

describe('getNodeType', () => {
  it('returns type field', () => {
    expect(getNodeType({ id: 'a', type: 'Concept' })).toBe('Concept');
  });
  it('returns category field', () => {
    expect(getNodeType({ id: 'a', category: 'Concept' })).toBe('Concept');
  });
  it('falls back to default', () => {
    expect(getNodeType({ id: 'a' })).toBe('default');
  });
  it('skips empty type', () => {
    expect(getNodeType({ id: 'a', type: '' })).toBe('default');
  });
});

describe('getEdgeLabel', () => {
  it('returns label field', () => {
    expect(getEdgeLabel({ source: 'a', target: 'b', label: 'X' })).toBe('X');
  });
  it('returns type field when no label', () => {
    expect(getEdgeLabel({ source: 'a', target: 'b', type: 'Y' })).toBe('Y');
  });
  it('falls back to empty string', () => {
    expect(getEdgeLabel({ source: 'a', target: 'b' })).toBe('');
  });
});

describe('getNodeFields', () => {
  it('excludes id', () => {
    const result = getNodeFields({ id: 'a', label: 'X', extra: 1 });
    expect(result).toEqual({ label: 'X', extra: 1 });
    expect(result).not.toHaveProperty('id');
  });
});

describe('getEdgeFields', () => {
  it('excludes source and target', () => {
    const result = getEdgeFields({ source: 'a', target: 'b', type: 'X' });
    expect(result).toEqual({ type: 'X' });
    expect(result).not.toHaveProperty('source');
    expect(result).not.toHaveProperty('target');
  });
});
