import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../../pages/HomePage';

describe('HomePage', () => {
  it('renders the app header and title', () => {
    render(<HomePage onSelectChant={vi.fn()} />);
    expect(screen.getByText('สวดป่ะ')).toBeInTheDocument();
    expect(screen.getByText('SUADPA')).toBeInTheDocument();
  });

  it('renders category section headers', () => {
    render(<HomePage onSelectChant={vi.fn()} />);
    expect(screen.getByText('บทนำ')).toBeInTheDocument();
    expect(screen.getByText('ศีล')).toBeInTheDocument();
  });

  it('renders all 4 chant titles', () => {
    render(<HomePage onSelectChant={vi.fn()} />);
    expect(screen.getByText('คำบูชาพระรัตนตรัย')).toBeInTheDocument();
    expect(screen.getByText('คำนมัสการพระพุทธเจ้า')).toBeInTheDocument();
    expect(screen.getByText('คำอาราธนาศีล ๕')).toBeInTheDocument();
    expect(screen.getByText('คำอาราธนาศีล ๘')).toBeInTheDocument();
  });

  it('calls onSelectChant with the correct chant when a card is clicked', async () => {
    const onSelectChant = vi.fn();
    render(<HomePage onSelectChant={onSelectChant} />);
    await userEvent.click(screen.getByText('คำบูชาพระรัตนตรัย'));
    expect(onSelectChant).toHaveBeenCalledOnce();
    expect(onSelectChant.mock.calls[0][0]).toMatchObject({
      id: '1',
      title: 'คำบูชาพระรัตนตรัย',
      category: 'บทนำ',
    });
  });
});
