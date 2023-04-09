# dynamic-path

## Overview

Generate pathname for dynamic routes in your javascript application. It can run on NodeJS and Browser. Its goal is to replace dynamic segment of your route with your provided values. Included:

- Full typescript support
- Square brackets pattern followed for Next.js route patterns
- Built primarily for Next.js routes, but can be used for any javascript application that uses square brackets to define pathname

---

## Installation

With npm

```bash
npm install dynamic-path
```

or with yarn

```bash
yarn add dynamic-path
```

or with pnpm

```bash
pnpm add dynamic-path
```

---

## Usage

- **Catch required route**

  Use `[variableName]` to catch required route.

  ```ts
  import { generatePath } from 'dynamic-path';

  // Directly using url template to function
  const path = generatePath('/posts/[slug]', {
    slug: 'blog-1',
  });
  console.log(path); // Returns '/posts/blog-1'
  ```

  ```ts
  import { generatePath } from 'dynamic-path';

  // Using url template object variable
  const API_PATHS = {
    post: '/posts/[slug]',
  } as const;

  const path = generatePath(API_PATHS.post, {
    slug: 'blog-1',
  });
  console.log(path); // Returns '/posts/blog-1'
  ```

- **Catch optional route**
  Use `[[variableName]]` to catch required route.

  ```ts
  import { generatePath } from 'dynamic-path';

  // Directly using url template to function
  const path = generatePath('/posts/[slug]', {});
  console.log(path); // Returns '/posts'
  ```

  When is it helpful?

  ```ts
  import { generatePath } from 'dynamic-path';

  // May be your data depends on some value, that might return undefined
  const category: string | undefined = getCategory();
  const path = generatePath('/posts/[[category]]/[slug]', {
    slug: 'blog-1',
    category,
  });
  console.log(path); // Returns '/posts/blog-1'
  ```

- **Using catch all routes**

  Catch all routes requires array values for parameters. It requires at least one value. Path is generated based on the provided order. To catch all routes you can use `[...variableName]` format.

  ```ts
  import { generatePath } from 'dynamic-path';

  const path = generatePath('/posts/[...categories]', {
    categories: ['tech', 'science'], // Mind the order of the value
  });
  console.log(path); // Returns '/posts/tech/science'
  ```

  You can also combine multiple paths

  ```ts
  import { generatePath } from 'dynamic-path';

  const path = generatePath('/posts/[...categories]/[...authors]/[slug]', {
    categories: ['tech', 'science'],
    authors: ['james'],
    slug: 'blog-1',
  });
  console.log(path); // Returns '/posts/tech/science/james/blog-1'
  ```

  We allow `null`, `undefined` and `''` values in array, but these values will be removed and validated.

  ```ts
  import { generatePath } from 'dynamic-path';

  generatePath('/posts/[...categories]', {
    categories: [],
  }); // This will throw a TypeError for missing values

  generatePath('/posts/[...categories]', {
    categories: [null],
  }); // This will throw a TypeError for missing values
  ```

- **Using optional catch all routes**

  ```ts
  import { generatePath } from 'dynamic-path';

  const path = generatePath('/posts/[[...categories]]', {});
  console.log(path); // Returns '/posts'
  ```

  When is it helpful?

  ```ts
  import { generatePath } from 'dynamic-path';
  /**
   * In case value is received from some other dependencies.
   * Here 'getCategories' may return string[] | null
   */
  const postCategories: string[] | null = getCategories();

  const path = generatePath('/posts/[[...categories]]', {
    categories: postCategories,
  });
  console.log(path); // Returns '/posts'
  ```

---

## Gotchas

- **TypeError: Invalid or missing value**

  This library only supports `string | number` values for route parameters. In case of catch all routes, it can be `(string | number)[]`. If you provide other values then, it will throw a `TypeError`.
