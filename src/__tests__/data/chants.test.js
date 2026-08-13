import { describe, it, expect } from 'vitest';
import chants from '../../data/chants';

describe('chants mock data', () => {
  it('exports an array with 4 chants', () => {
    expect(Array.isArray(chants)).toBe(true);
    expect(chants).toHaveLength(4);
  });

  it('every chant has required fields: id, title, category, content', () => {
    chants.forEach((chant) => {
      expect(chant).toHaveProperty('id');
      expect(chant).toHaveProperty('title');
      expect(chant).toHaveProperty('category');
      expect(chant).toHaveProperty('content');
    });
  });

  it('all ids are unique strings', () => {
    const ids = chants.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(chants.length);
    ids.forEach((id) => expect(typeof id).toBe('string'));
  });

  it('categories are "บทนำ" and "ศีล"', () => {
    const categories = [...new Set(chants.map((c) => c.category))];
    expect(categories).toContain('บทนำ');
    expect(categories).toContain('ศีล');
  });

  it('all content strings are non-empty', () => {
    chants.forEach((chant) => {
      expect(chant.content.trim().length).toBeGreaterThan(0);
    });
  });

  it('contains expected chant titles', () => {
    const titles = chants.map((c) => c.title);
    expect(titles).toContain('คำบูชาพระรัตนตรัย');
    expect(titles).toContain('คำนมัสการพระพุทธเจ้า');
    expect(titles).toContain('คำอาราธนาศีล ๕');
    expect(titles).toContain('คำอาราธนาศีล ๘');
  });
});
