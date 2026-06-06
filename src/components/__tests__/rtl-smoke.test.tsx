import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { cn } from '../../lib/utils';

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p data-testid="count">计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={() => setCount(count - 1)}>减少</button>
    </div>
  );
};

const Button = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

describe('React Testing Library 环境验证', () => {
  describe('基础渲染', () => {
    it('渲染文本内容', () => {
      render(<div>Hello World</div>);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('通过 testid 查找元素', () => {
      render(<div data-testid="my-element">测试内容</div>);
      expect(screen.getByTestId('my-element')).toHaveTextContent('测试内容');
    });
  });

  describe('交互测试', () => {
    it('点击按钮增加计数', () => {
      render(<Counter />);
      expect(screen.getByTestId('count')).toHaveTextContent('计数: 0');

      fireEvent.click(screen.getByText('增加'));
      expect(screen.getByTestId('count')).toHaveTextContent('计数: 1');

      fireEvent.click(screen.getByText('增加'));
      fireEvent.click(screen.getByText('增加'));
      expect(screen.getByTestId('count')).toHaveTextContent('计数: 3');
    });

    it('点击按钮减少计数', () => {
      render(<Counter />);

      fireEvent.click(screen.getByText('增加'));
      fireEvent.click(screen.getByText('增加'));
      fireEvent.click(screen.getByText('减少'));

      expect(screen.getByTestId('count')).toHaveTextContent('计数: 1');
    });
  });

  describe('Button 组件', () => {
    it('渲染主按钮样式', () => {
      render(<Button variant="primary">提交</Button>);
      const button = screen.getByText('提交');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-500');
      expect(button).toHaveClass('text-white');
    });

    it('渲染次按钮样式', () => {
      render(<Button variant="secondary">取消</Button>);
      const button = screen.getByText('取消');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-gray-200');
      expect(button).toHaveClass('text-gray-800');
    });

    it('禁用状态', () => {
      render(<Button disabled>禁用按钮</Button>);
      const button = screen.getByText('禁用按钮');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
    });

    it('点击触发回调', () => {
      let clicked = false;
      render(<Button onClick={() => (clicked = true)}>点击我</Button>);

      fireEvent.click(screen.getByText('点击我'));
      expect(clicked).toBe(true);
    });

    it('禁用时点击不触发回调', () => {
      let clicked = false;
      render(
        <Button disabled onClick={() => (clicked = true)}>
          禁用按钮
        </Button>
      );

      fireEvent.click(screen.getByText('禁用按钮'));
      expect(clicked).toBe(false);
    });
  });

  describe('jest-dom matchers', () => {
    it('toBeInTheDocument', () => {
      render(<div>存在的元素</div>);
      expect(screen.getByText('存在的元素')).toBeInTheDocument();
    });

    it('toHaveClass', () => {
      render(<div className="foo bar baz">元素</div>);
      const el = screen.getByText('元素');
      expect(el).toHaveClass('foo');
      expect(el).toHaveClass('bar');
      expect(el).not.toHaveClass('qux');
    });

    it('toBeDisabled', () => {
      render(
        <div>
          <button disabled>禁用</button>
          <button>启用</button>
        </div>
      );
      expect(screen.getByText('禁用')).toBeDisabled();
      expect(screen.getByText('启用')).not.toBeDisabled();
    });

    it('toHaveTextContent', () => {
      render(<p>Hello Vitest</p>);
      expect(screen.getByText('Hello Vitest')).toHaveTextContent('Hello Vitest');
    });
  });
});
