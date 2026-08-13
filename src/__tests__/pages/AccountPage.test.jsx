import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountPage from '../../pages/AccountPage';

const ANON_USER   = { uid: 'anon-uid',   isAnonymous: true,  displayName: null,  email: null,             photoURL: null };
const GOOGLE_USER = { uid: 'google-uid', isAnonymous: false, displayName: 'Jek', email: 'jek@gmail.com',  photoURL: null };
const PHOTO_USER  = { uid: 'photo-uid',  isAnonymous: false, displayName: 'Jek', email: 'jek@gmail.com',  photoURL: 'https://photo.url/avatar.jpg' };

const defaultProps = {
  user: ANON_USER,
  isAuthLoading: false,
  authError: null,
  onSignIn: vi.fn(),
  onSignOut: vi.fn(),
};

describe('AccountPage', () => {
  describe('header', () => {
    it('renders page title', () => {
      render(<AccountPage {...defaultProps} />);
      expect(screen.getByText('บัญชีของฉัน')).toBeInTheDocument();
    });
  });

  describe('Guest state (anonymous user)', () => {
    it('shows guest greeting', () => {
      render(<AccountPage {...defaultProps} />);
      expect(screen.getByText('สวัสดี, ผู้เยี่ยมชม')).toBeInTheDocument();
    });

    it('shows sign-in button', () => {
      render(<AccountPage {...defaultProps} />);
      expect(screen.getByLabelText('เข้าสู่ระบบด้วย Google')).toBeInTheDocument();
    });

    it('calls onSignIn when button is clicked', async () => {
      const onSignIn = vi.fn();
      render(<AccountPage {...defaultProps} onSignIn={onSignIn} />);
      await userEvent.click(screen.getByLabelText('เข้าสู่ระบบด้วย Google'));
      expect(onSignIn).toHaveBeenCalledOnce();
    });

    it('shows loading text when isAuthLoading=true', () => {
      render(<AccountPage {...defaultProps} isAuthLoading />);
      expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument();
    });

    it('disables sign-in button when loading', () => {
      render(<AccountPage {...defaultProps} isAuthLoading />);
      expect(screen.getByLabelText('เข้าสู่ระบบด้วย Google')).toBeDisabled();
    });

    it('shows error message when authError is set', () => {
      render(<AccountPage {...defaultProps} authError="เข้าสู่ระบบไม่สำเร็จ" />);
      expect(screen.getByText('เข้าสู่ระบบไม่สำเร็จ')).toBeInTheDocument();
    });

    it('also treats null user as guest', () => {
      render(<AccountPage {...defaultProps} user={null} />);
      expect(screen.getByText('สวัสดี, ผู้เยี่ยมชม')).toBeInTheDocument();
    });
  });

  describe('Logged-in state (Google user)', () => {
    it('shows display name', () => {
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} />);
      expect(screen.getByText('Jek')).toBeInTheDocument();
    });

    it('shows email address', () => {
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} />);
      expect(screen.getByText('jek@gmail.com')).toBeInTheDocument();
    });

    it('shows sign-out button', () => {
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} />);
      expect(screen.getByLabelText('ออกจากระบบ')).toBeInTheDocument();
    });

    it('calls onSignOut when sign-out button is clicked', async () => {
      const onSignOut = vi.fn();
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} onSignOut={onSignOut} />);
      await userEvent.click(screen.getByLabelText('ออกจากระบบ'));
      expect(onSignOut).toHaveBeenCalledOnce();
    });

    it('disables sign-out button when loading', () => {
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} isAuthLoading />);
      expect(screen.getByLabelText('ออกจากระบบ')).toBeDisabled();
    });

    it('renders avatar img when user has photoURL', () => {
      render(<AccountPage {...defaultProps} user={PHOTO_USER} />);
      const avatar = screen.getByAltText(PHOTO_USER.displayName);
      expect(avatar).toHaveAttribute('src', 'https://photo.url/avatar.jpg');
    });

    it('renders initial letter avatar when user has no photoURL', () => {
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('shows error message when authError is set', () => {
      render(<AccountPage {...defaultProps} user={GOOGLE_USER} authError="ออกจากระบบไม่สำเร็จ" />);
      expect(screen.getByText('ออกจากระบบไม่สำเร็จ')).toBeInTheDocument();
    });
  });
});
