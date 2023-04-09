import { expect, it } from 'vitest';
import { generatePath } from '.';

it('Replaces single segment from URL', () => {
  const category = 'science';
  const slug = 'blog-1';
  const categories = ['science', 'tech'];
  const slugs = ['blog-1', 'blog-2'];
  const PATHS = {
    one: 'posts/[[category]]/[slug]',
    two: 'posts/[[category]]',
    three: '[[category]]/[[slug]]',
    four: '[[category]]/[slug]',
    five: '[category]/posts/[[slug]]',
    six: 'posts/[[...categories]]/[...slugs]',
    seven: 'posts/[[...categories]]',
    eight: '[[...categories]]/[[...slugs]]',
    nine: '[[...categories]]/[...slugs]',
    ten: '[...categories]/posts/[[...slugs]]',
    eleven: '[[...categories]]/[slug]',
    twelve: '[...categories]/[slug]',
    thirteen: '[[...categories]]/[[slug]]',
    fourteen: '[...categories]/[[slug]]',
    fifteen: '[[category]]/posts/[[slug]]',
    sixteen: '[[...category]]/posts/[[...slug]]',
    seventeen: '[category]/posts/[category]',
  } as const;

  expect(
    generatePath(PATHS.one, {
      slug,
    })
  ).toBe(`posts/${slug}`);
  expect(
    generatePath(PATHS.one, {
      slug,
      category,
    })
  ).toBe(`posts/${category}/${slug}`);

  expect(
    generatePath(PATHS.two, {
      category,
    })
  ).toBe(`posts/${category}`);
  expect(generatePath(PATHS.two, {})).toBe(`posts/`);

  expect(generatePath(PATHS.three, {})).toBe('');
  expect(generatePath(PATHS.three, { category: null, slug })).toBe(slug);
  expect(generatePath(PATHS.three, { category })).toBe(`${category}/`);

  expect(generatePath(PATHS.four, { slug: 0 })).toBe('0');
  expect(generatePath(PATHS.four, { slug, category: 0 })).toBe(`0/${slug}`);

  expect(generatePath(PATHS.five, { category: 0, slug: 0 })).toBe('0/posts/0');
  expect(generatePath(PATHS.five, { category })).toBe(`${category}/posts/`);

  expect(() => generatePath(PATHS.six, { slugs: [null, undefined] })).toThrowError('slugs');
  expect(generatePath(PATHS.six, { slugs: [slug], categories: [null, undefined] })).toBe(`posts/${slug}`);
  expect(generatePath(PATHS.six, { slugs })).toBe(`posts/${slugs.join('/')}`);
  expect(generatePath(PATHS.six, { slugs, categories })).toBe(`posts/${categories.join('/')}/${slugs.join('/')}`);

  expect(generatePath(PATHS.seven, {})).toBe('posts/');
  expect(generatePath(PATHS.seven, { categories })).toBe(`posts/${categories.join('/')}`);
  expect(generatePath(PATHS.seven, { categories: [0, , null, undefined, category] })).toBe(`posts/0/${category}`);

  expect(generatePath(PATHS.eight, {})).toBe('');
  expect(generatePath(PATHS.eight, { slugs })).toBe(`${slugs.join('/')}`);
  expect(generatePath(PATHS.eight, { categories: [null, undefined, 0], slugs })).toBe(`0/${slugs.join('/')}`);

  expect(generatePath(PATHS.nine, { slugs })).toBe(slugs.join('/'));
  expect(generatePath(PATHS.nine, { categories, slugs })).toBe(`${categories.join('/')}/${slugs.join('/')}`);

  expect(() => generatePath(PATHS.ten, { categories: [] })).toThrowError('categories');
  expect(generatePath(PATHS.ten, { categories })).toBe(`${categories.join('/')}/posts/`);
  expect(generatePath(PATHS.ten, { categories, slugs })).toBe(`${categories.join('/')}/posts/${slugs.join('/')}`);

  expect(generatePath(PATHS.eleven, { slug })).toBe(slug);
  expect(generatePath(PATHS.eleven, { slug, categories: [0, category] })).toBe(`0/${category}/${slug}`);

  expect(generatePath(PATHS.twelve, { categories, slug })).toBe(`${categories.join('/')}/${slug}`);
  expect(() => generatePath(PATHS.twelve, { categories: [null], slug })).toThrowError('categories');

  expect(generatePath(PATHS.thirteen, {})).toBe('');
  expect(generatePath(PATHS.thirteen, { categories, slug })).toBe(`${categories.join('/')}/${slug}`);

  expect(generatePath(PATHS.fourteen, { categories })).toBe(`${categories.join('/')}/`);
  expect(generatePath(PATHS.fourteen, { categories: ['0'], slug })).toBe(`0/${slug}`);
  expect(() => generatePath(PATHS.fourteen, { categories: [''] })).toThrowError('categories');

  expect(generatePath(PATHS.sixteen, {})).toBe('posts/');

  expect(generatePath(PATHS.seventeen, { category })).toBe(`${category}/posts/${category}`);
});
