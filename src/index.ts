type SimplifyObj<Obj> = Obj extends object
  ? {
      [K in keyof Obj]: Obj[K];
    }
  : Obj;

type Trim<T extends string> = T extends ''
  ? never
  : T extends ` ${infer R}`
  ? Trim<R>
  : T extends `${infer L} `
  ? Trim<L>
  : T;

export type SegmentKey<Path extends string> = Path extends `${string}[${infer Key}]${infer RestPath}`
  ? Trim<Key> extends `...${string}` | `[...$${string}`
    ? SegmentKey<RestPath>
    : Key extends `[${infer _Key}`
    ? SegmentKey<`[${_Key}]`> | SegmentKey<RestPath>
    : Trim<Key> | SegmentKey<RestPath>
  : never;

export type OptionalSegmentKey<Path extends string> = Path extends `${string}[[${infer Key}]]${infer RestPath}`
  ? Trim<Key> extends `...${string}`
    ? OptionalSegmentKey<RestPath>
    : Trim<Key> | OptionalSegmentKey<RestPath>
  : never;

export type CatchAllSegmentKey<Path extends string> = Path extends `${string}[${infer PossibleKey}]${infer RestPath}`
  ? Trim<PossibleKey> extends `...${infer Key}`
    ? Key | CatchAllSegmentKey<RestPath>
    : CatchAllSegmentKey<RestPath>
  : never;

export type OptionalCatchAllSegmentKey<Path extends string> =
  Path extends `${string}[[${infer PossibleKey}]]${infer RestPath}`
    ? Trim<PossibleKey> extends `...${infer Key}`
      ? Key | OptionalCatchAllSegmentKey<RestPath>
      : OptionalCatchAllSegmentKey<RestPath>
    : never;

export type SegmentReplacePath<Path extends string> = SimplifyObj<
  {
    [K in SegmentKey<Path> as K extends OptionalSegmentKey<Path> ? never : K]: string | number;
  } & {
    [K in SegmentKey<Path> as K extends OptionalSegmentKey<Path> ? K : never]?: string | number | null;
  }
>;

export type CatchAllSegmentReplacePath<Path extends string> = SimplifyObj<
  {
    [K in CatchAllSegmentKey<Path>]: (string | number | null | undefined)[];
  } & {
    [K in OptionalCatchAllSegmentKey<Path>]?: (string | number | null | undefined)[];
  }
>;

export type ReplacePath<Path extends string> = SimplifyObj<SegmentReplacePath<Path> & CatchAllSegmentReplacePath<Path>>;

// Regex to find single and catch all segment
const SINGLE_SEGMENT_REGEX = /\[[\w\d\s]+\]/gi;
const CATCH_ALL_SEGMENT_REGEX = /\[\s*\.{3}[\w\d\s]+\]/gi;

const isOptionalSegment = (segment: string, path: string): boolean => {
  const indexOfSegment = path.indexOf(segment);
  return path[indexOfSegment - 1] === '[' && path[indexOfSegment + segment.length] === ']';
};

const removeOptionalSegment = (segment: string, path: string): string => {
  const indexOfSegment = path.indexOf(segment);
  if (path[indexOfSegment + segment.length + 1] === '/') {
    path = path.replace(`[${segment}]/`, '');
  } else {
    path = path.replace(`[${segment}]`, '');
  }
  return path;
};

const isEmptyValue = <T>(value: T): boolean => {
  return typeof value === 'undefined' || value === null || (typeof value === 'string' && value.trim().length === 0);
};

const filterInvalidRouteValues = <T>(values: T[]): T[] => {
  return values.filter((value) => (typeof value === 'string' && value.trim().length > 0) || typeof value === 'number');
};

const replaceSingleSegment = (path: string, replace: Record<string, unknown>, originalPath: string): string => {
  let generatedPath = path;
  const singleSegments = path.match(SINGLE_SEGMENT_REGEX);
  if (singleSegments) {
    singleSegments.forEach((segment) => {
      const key = segment.slice(1, segment.length - 1);
      const trimKey = key.trim();
      const isOptional = isOptionalSegment(segment, generatedPath);
      if (trimKey in replace && !isEmptyValue(replace[trimKey])) {
        const value = replace[trimKey];
        if (typeof value === 'number' || typeof value === 'string') {
          const encodedValue = encodeURIComponent(value.toString());
          generatedPath = generatedPath.replace(isOptional ? `[${segment}]` : segment, encodedValue);
        } else {
          throw new TypeError(`Invalid value type of ${key} for path: ${originalPath}`);
        }
      } else {
        if (isOptional) {
          generatedPath = removeOptionalSegment(segment, generatedPath);
        } else {
          throw new TypeError(`Missing value of ${key} for path: ${originalPath}`);
        }
      }
    });
  }
  return generatedPath;
};

const replaceCatchAllSegment = (path: string, replace: Record<string, unknown>, originalPath: string): string => {
  let generatedPath = path;
  const catchAllSegments = path.match(CATCH_ALL_SEGMENT_REGEX);
  if (catchAllSegments) {
    catchAllSegments.forEach((segment) => {
      const isOptional = isOptionalSegment(segment, generatedPath);
      const spreadKey = segment.slice(1, segment.length - 1).trim();
      const key = spreadKey.slice(3);
      if (key in replace && !!replace[key]) {
        const value = replace[key];
        if (Array.isArray(value)) {
          const filteredValue = filterInvalidRouteValues(value);

          if (filteredValue.length === 0) {
            if (!isOptional) {
              throw new TypeError(`Invalid value type of ${key} for path: ${originalPath}`);
            }
            generatedPath = removeOptionalSegment(segment, generatedPath);
          } else {
            const encodedValue = filteredValue.map(encodeURIComponent).join('/');
            generatedPath = generatedPath.replace(isOptional ? `[${segment}]` : segment, encodedValue);
          }
        } else {
          throw new TypeError(`Invalid value type of ${key} for path: ${originalPath}`);
        }
      } else {
        if (!isOptional) {
          throw new TypeError(`Missing value of ${key} for path: ${originalPath}`);
        } else {
          generatedPath = removeOptionalSegment(segment, generatedPath);
        }
      }
    });
  }

  return generatedPath;
};

const trimKeyOfObj = <T extends Record<string, unknown>>(obj: T): T => {
  const newObj = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    newObj[key] = value;
  }
  return newObj as T;
};

export const generatePath = <Path extends string>(path: Path, replace: ReplacePath<Path>): string => {
  let generatedPath: string = path;
  replace = trimKeyOfObj(replace);
  generatedPath = replaceSingleSegment(generatedPath, replace, path);
  generatedPath = replaceCatchAllSegment(generatedPath, replace, path);

  return generatedPath;
};
