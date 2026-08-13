import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaylistPage from '../../pages/PlaylistPage';

const MOCK_PLAYLIST = [
  { id: '1', title: 'คำบูชาพระรัตนตรัย', category: 'บทนำ' },
  { id: '3', title: 'คำอาราธนาศีล ๕', category: 'ศีล' },
];

describe('PlaylistPage', () => {
  it('shows loading spinner when authReady is false', () => {
    const { container } = render(
      <PlaylistPage playlist={[]} onSelectChant={vi.fn()} authReady={false} />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when authReady and playlist is empty', () => {
    render(<PlaylistPage playlist={[]} onSelectChant={vi.fn()} authReady={true} />);
    expect(screen.getByText('ยังไม่มีบทสวดในเพลย์ลิสต์')).toBeInTheDocument();
  });

  it('renders playlist items when playlist has chants', () => {
    render(<PlaylistPage playlist={MOCK_PLAYLIST} onSelectChant={vi.fn()} authReady={true} />);
    expect(screen.getByText('คำบูชาพระรัตนตรัย')).toBeInTheDocument();
    expect(screen.getByText('คำอาราธนาศีล ๕')).toBeInTheDocument();
  });

  it('shows item count in header', () => {
    render(<PlaylistPage playlist={MOCK_PLAYLIST} onSelectChant={vi.fn()} authReady={true} />);
    expect(screen.getByText('2 บทสวด')).toBeInTheDocument();
  });

  it('calls onSelectChant with the correct chant on card click', async () => {
    const onSelectChant = vi.fn();
    render(<PlaylistPage playlist={MOCK_PLAYLIST} onSelectChant={onSelectChant} authReady={true} />);
    await userEvent.click(screen.getByText('คำบูชาพระรัตนตรัย'));
    expect(onSelectChant).toHaveBeenCalledOnce();
    expect(onSelectChant.mock.calls[0][0]).toMatchObject({ id: '1' });
  });
});
