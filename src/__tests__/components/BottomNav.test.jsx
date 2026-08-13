import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomNav from '../../components/BottomNav';

const ANON_USER   = { isAnonymous: true,  photoURL: null };
const GOOGLE_USER = { isAnonymous: false, photoURL: null };
const PHOTO_USER  = { isAnonymous: false, photoURL: 'https://photo.url/avatar.jpg' };

const defaultProps = {
  currentTab: 'home',
  onTabChange: vi.fn(),
  playlistCount: 0,
  user: null,
};

describe('BottomNav', () => {
  describe('tab rendering', () => {
    it('renders all three tab labels', () => {
      render(<BottomNav {...defaultProps} />);
      expect(screen.getByText('คลังบทสวด')).toBeInTheDocument();
      expect(screen.getByText('เพลย์ลิสต์')).toBeInTheDocument();
      expect(screen.getByText('บัญชี')).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    it('calls onTabChange with "playlist" when playlist tab is clicked', async () => {
      const onTabChange = vi.fn();
      render(<BottomNav {...defaultProps} onTabChange={onTabChange} />);
      await userEvent.click(screen.getByText('เพลย์ลิสต์'));
      expect(onTabChange).toHaveBeenCalledWith('playlist');
    });

    it('calls onTabChange with "home" when home tab is clicked', async () => {
      const onTabChange = vi.fn();
      render(<BottomNav {...defaultProps} currentTab="playlist" onTabChange={onTabChange} />);
      await userEvent.click(screen.getByText('คลังบทสวด'));
      expect(onTabChange).toHaveBeenCalledWith('home');
    });

    it('calls onTabChange with "account" when account tab is clicked', async () => {
      const onTabChange = vi.fn();
      render(<BottomNav {...defaultProps} onTabChange={onTabChange} />);
      await userEvent.click(screen.getByLabelText('บัญชีของฉัน'));
      expect(onTabChange).toHaveBeenCalledWith('account');
    });
  });

  describe('playlist badge', () => {
    it('shows badge count when playlistCount > 0', () => {
      render(<BottomNav {...defaultProps} playlistCount={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not show badge when playlistCount is 0', () => {
      render(<BottomNav {...defaultProps} playlistCount={0} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows "99+" when playlistCount exceeds 99', () => {
      render(<BottomNav {...defaultProps} playlistCount={100} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  describe('account tab — logged-in indicator', () => {
    it('shows no green dot when user is anonymous', () => {
      render(<BottomNav {...defaultProps} user={ANON_USER} />);
      // Green dot is rendered as a span with specific classes — not present for anon
      const greenDot = document.querySelector('.bg-emerald-500');
      expect(greenDot).toBeNull();
    });

    it('shows green dot when user is logged in with Google', () => {
      render(<BottomNav {...defaultProps} user={GOOGLE_USER} />);
      const greenDot = document.querySelector('.bg-emerald-500');
      expect(greenDot).toBeInTheDocument();
    });

    it('renders avatar img when logged-in user has photoURL', () => {
      render(<BottomNav {...defaultProps} user={PHOTO_USER} />);
      expect(screen.getByAltText('avatar')).toHaveAttribute('src', 'https://photo.url/avatar.jpg');
    });
  });
});
