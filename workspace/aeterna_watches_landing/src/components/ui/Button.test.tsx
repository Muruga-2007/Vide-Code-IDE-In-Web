import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies the primary variant by default', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-secondary');
  });

  it('applies the secondary variant when specified', () => {
    render(<Button variant="secondary">Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');
    expect(button).toHaveClass('text-primary');
  });

  it('applies the accent variant when specified', () => {
    render(<Button variant="accent">Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-accent');
    expect(button).toHaveClass('text-primary');
  });

  it('applies custom class names', () => {
    render(<Button className="custom-class">Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});