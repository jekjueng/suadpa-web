import { describe, it, expect, vi } from 'vitest';

// vi.hoisted ensures mocks are available before vi.mock factory is called
const {
  mockDoc,
  mockSetDoc,
  mockDeleteDoc,
  mockOnSnapshot,
  mockServerTimestamp,
  mockCollection,
} = vi.hoisted(() => ({
  mockDoc: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockDeleteDoc: vi.fn().mockResolvedValue(undefined),
  mockOnSnapshot: vi.fn().mockReturnValue(vi.fn()),
  mockServerTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
  mockCollection: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  collection: mockCollection,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
}));

vi.mock('../../firebase/config', () => ({ db: {} }));

import { addToPlaylist, removeFromPlaylist, subscribeToPlaylist } from '../../firebase/playlist';

const MOCK_UID = 'user-uid-123';
const MOCK_CHANT = { id: '1', title: 'คำบูชาพระรัตนตรัย', category: 'บทนำ' };

describe('firebase/playlist', () => {
  describe('addToPlaylist()', () => {
    it('calls setDoc with correct Firestore path', async () => {
      await addToPlaylist(MOCK_UID, MOCK_CHANT);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users', MOCK_UID, 'playlist', MOCK_CHANT.id
      );
      expect(mockSetDoc).toHaveBeenCalledOnce();
    });

    it('saves id, title, category, and addedAt timestamp', async () => {
      await addToPlaylist(MOCK_UID, MOCK_CHANT);
      const savedData = mockSetDoc.mock.calls[0][1];
      expect(savedData.id).toBe(MOCK_CHANT.id);
      expect(savedData.title).toBe(MOCK_CHANT.title);
      expect(savedData.category).toBe(MOCK_CHANT.category);
      expect(savedData.addedAt).toBe('mock-timestamp');
    });
  });

  describe('removeFromPlaylist()', () => {
    it('calls deleteDoc with correct Firestore path', async () => {
      await removeFromPlaylist(MOCK_UID, MOCK_CHANT.id);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users', MOCK_UID, 'playlist', MOCK_CHANT.id
      );
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  describe('subscribeToPlaylist()', () => {
    it('calls onSnapshot on the correct collection path', () => {
      subscribeToPlaylist(MOCK_UID, vi.fn());
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'users', MOCK_UID, 'playlist'
      );
      expect(mockOnSnapshot).toHaveBeenCalledOnce();
    });

    it('returns the unsubscribe function from onSnapshot', () => {
      const unsubscribe = vi.fn();
      mockOnSnapshot.mockReturnValueOnce(unsubscribe);
      const result = subscribeToPlaylist(MOCK_UID, vi.fn());
      expect(result).toBe(unsubscribe);
    });

    it('maps snapshot docs to data objects and calls callback', () => {
      const callback = vi.fn();
      mockOnSnapshot.mockImplementationOnce((_ref, cb) => {
        cb({ docs: [{ data: () => ({ id: '1', title: 'test', addedAt: null }) }] });
        return vi.fn();
      });
      subscribeToPlaylist(MOCK_UID, callback);
      expect(callback).toHaveBeenCalledWith([{ id: '1', title: 'test', addedAt: null }]);
    });
  });
});
