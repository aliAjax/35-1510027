import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn 函数', () => {
  it('合并多个类名字符串', () => {
    const result = cn('foo', 'bar', 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('处理条件类名', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn('base', isActive && 'active', isDisabled && 'disabled');
    expect(result).toBe('base active');
  });

  it('处理对象形式的类名', () => {
    const result = cn('base', { active: true, disabled: false, hidden: true });
    expect(result).toBe('base active hidden');
  });

  it('处理数组形式的类名', () => {
    const result = cn('base', ['foo', 'bar']);
    expect(result).toBe('base foo bar');
  });

  it('去重合并 Tailwind 类名', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('处理空值和 undefined', () => {
    const result = cn('base', null, undefined, false, '');
    expect(result).toBe('base');
  });

  it('混合多种类型的输入', () => {
    const result = cn(
      'base',
      ['foo', 'bar'],
      { active: true, disabled: false },
      'extra'
    );
    expect(result).toBe('base foo bar active extra');
  });
});
