import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingPage from '../../pages/ReadingPage';

const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockStop = vi.fn();

vi.mock('../../hooks/useGoogleTTS', () => ({
  useGoogleTTS: vi.fn(() => ({
    status: 'idle',
    error: null,
    play: mockPlay,
    pause: mockPause,
    resume: mockResume,
    stop: mockStop,
  })),
}));

import { useGoogleTTS } from '../../hooks/useGoogleTTS';

const MOCK_CHANT = {
  id: '1',
  title: 'คำบูชาพระรัตนตรัย',
  category: 'บทนำ',
  content: 'อะระหัง สัมมาสัมพุทโธ ภะคะวา',
};

const defaultProps = {
  chant: MOCK_CHANT,
  onBack: vi.fn(),
  isInPlaylist: vi.fn().mockReturnValue(false),
  onTogglePlaylist: vi.fn().mockResolvedValue(undefined),
};

describe('ReadingPage', () => {
  describe('content rendering', () => {
    it('renders the chant title', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'คำบูชาพระรัตนตรัย' })).toBeInTheDocument();
    });

    it('renders the chant content', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('อะระหัง สัมมาสัมพุทโธ ภะคะวา')).toBeInTheDocument();
    });

    it('renders the category in the top bar', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('บทนำ')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('calls onBack when back button in top bar is clicked', async () => {
      const onBack = vi.fn();
      render(<ReadingPage {...defaultProps} onBack={onBack} />);
      await userEvent.click(screen.getByLabelText('กลับหน้ารายการ'));
      expect(onBack).toHaveBeenCalledOnce();
    });

    it('calls onBack when "← กลับ" button is clicked', async () => {
      const onBack = vi.fn();
      render(<ReadingPage {...defaultProps} onBack={onBack} />);
      await userEvent.click(screen.getByText('← กลับ'));
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  describe('TTS Controls — idle state', () => {
    it('shows "กดเพื่อเริ่มสวด" when idle', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('กดเพื่อเริ่มสวด')).toBeInTheDocument();
    });

    it('calls play() with chant content when play button is clicked', async () => {
      render(<ReadingPage {...defaultProps} />);
      await userEvent.click(screen.getByLabelText('เล่น'));
      expect(mockPlay).toHaveBeenCalledWith(MOCK_CHANT.content);
    });

    it('stop button is disabled when idle', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByLabelText('หยุด')).toBeDisabled();
    });
  });

  describe('TTS Controls — loading state', () => {
    beforeEach(() => {
      useGoogleTTS.mockReturnValue({
        status: 'loading', error: null,
        play: mockPlay, pause: mockPause, resume: mockResume, stop: mockStop,
      });
    });

    it('shows "กำลังโหลดเสียง..." while fetching', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('กำลังโหลดเสียง...')).toBeInTheDocument();
    });

    it('play button is disabled during loading', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByLabelText('กำลังโหลด')).toBeDisabled();
    });

    it('stop button is disabled during loading', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByLabelText('หยุด')).toBeDisabled();
    });
  });

  describe('TTS Controls — playing state', () => {
    beforeEach(() => {
      useGoogleTTS.mockReturnValue({
        status: 'playing', error: null,
        play: mockPlay, pause: mockPause, resume: mockResume, stop: mockStop,
      });
    });

    it('shows "กำลังสวด..." status', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('กำลังสวด...')).toBeInTheDocument();
    });

    it('calls pause() when pause button is clicked', async () => {
      render(<ReadingPage {...defaultProps} />);
      await userEvent.click(screen.getByLabelText('หยุดชั่วคราว'));
      expect(mockPause).toHaveBeenCalledOnce();
    });

    it('calls stop() when stop button is clicked', async () => {
      render(<ReadingPage {...defaultProps} />);
      await userEvent.click(screen.getByLabelText('หยุด'));
      expect(mockStop).toHaveBeenCalledOnce();
    });
  });

  describe('TTS Controls — paused state', () => {
    beforeEach(() => {
      useGoogleTTS.mockReturnValue({
        status: 'paused', error: null,
        play: mockPlay, pause: mockPause, resume: mockResume, stop: mockStop,
      });
    });

    it('shows "หยุดชั่วคราว" status', () => {
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('หยุดชั่วคราว')).toBeInTheDocument();
    });

    it('calls resume() when resume button is clicked', async () => {
      render(<ReadingPage {...defaultProps} />);
      await userEvent.click(screen.getByLabelText('เล่นต่อ'));
      expect(mockResume).toHaveBeenCalledOnce();
    });
  });

  describe('TTS Controls — error state', () => {
    it('shows error message when status is "error"', () => {
      useGoogleTTS.mockReturnValue({
        status: 'error', error: 'GCP TTS Error: 403',
        play: mockPlay, pause: mockPause, resume: mockResume, stop: mockStop,
      });
      render(<ReadingPage {...defaultProps} />);
      expect(screen.getByText('GCP TTS Error: 403')).toBeInTheDocument();
    });

    it('calls play() again when play button is clicked after error', async () => {
      useGoogleTTS.mockReturnValue({
        status: 'error', error: 'เกิดข้อผิดพลาด',
        play: mockPlay, pause: mockPause, resume: mockResume, stop: mockStop,
      });
      render(<ReadingPage {...defaultProps} />);
      await userEvent.click(screen.getByLabelText('เล่น'));
      expect(mockPlay).toHaveBeenCalledWith(MOCK_CHANT.content);
    });
  });

  describe('playlist toggle', () => {
    it('shows "+ เพลย์ลิสต์" when not in playlist', () => {
      render(<ReadingPage {...defaultProps} isInPlaylist={() => false} />);
      expect(screen.getByText('+ เพลย์ลิสต์')).toBeInTheDocument();
    });

    it('shows "นำออก" when already in playlist', () => {
      render(<ReadingPage {...defaultProps} isInPlaylist={() => true} />);
      expect(screen.getByText('นำออก')).toBeInTheDocument();
    });

    it('calls onTogglePlaylist when playlist button is clicked', async () => {
      const onTogglePlaylist = vi.fn().mockResolvedValue(undefined);
      render(<ReadingPage {...defaultProps} onTogglePlaylist={onTogglePlaylist} />);
      await userEvent.click(screen.getByText('+ เพลย์ลิสต์'));
      expect(onTogglePlaylist).toHaveBeenCalledWith(MOCK_CHANT);
    });
  });
});
