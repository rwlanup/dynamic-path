type SimplifyObj<Obj> = Obj extends object
  ? {
      [K in keyof Obj]: Obj[K];
    }
  : Obj;

export type SegmentKey<Path extends string> = Path extends `${string}[${infer Key}]${infer RestPath}`
  ? Key extends `...${string}` | `[...$${string}`
    ? SegmentKey<RestPath>
    : Key extends `[${infer _Key}`
    ? SegmentKey<`[${_Key}]`> | SegmentKey<RestPath>
    : Key | SegmentKey<RestPath>
  : never;

export type OptionalSegmentKey<Path extends string> = Path extends `${string}[[${infer Key}]]${infer RestPath}`
  ? Key extends `...${string}`
    ? OptionalSegmentKey<RestPath>
    : Key | OptionalSegmentKey<RestPath>
  : never;

export type CatchAllSegmentKey<Path extends string> = Path extends `${string}[...${infer Key}]${infer RestPath}`
  ? Key | CatchAllSegmentKey<RestPath>
  : never;

export type OptionalCatchAllSegmentKey<Path extends string> =
  Path extends `${string}[[...${infer Key}]]${infer RestPath}` ? Key | OptionalCatchAllSegmentKey<RestPath> : never;

export type SegmentReplacePath<Path extends string> = SimplifyObj<
  {
    [K in SegmentKey<Path> as K extends OptionalSegmentKey<Path> ? never : K]: string | number;
  } & {
    [K in SegmentKey<Path> as K extends OptionalSegmentKey<Path> ? K : never]?: string | number | null;
  }
>;

export type CatchAllSegmentReplacePath<Path extends string> = SimplifyObj<
  {
    [K in CatchAllSegmentKey<Path> as K extends OptionalCatchAllSegmentKey<Path> ? never : K]: (
      | string
      | number
      | null
      | undefined
    )[];
  } & {
    [K in CatchAllSegmentKey<Path> as K extends OptionalCatchAllSegmentKey<Path> ? K : never]?: (
      | string
      | number
      | null
      | undefined
    )[];
  }
>;

export type ReplacePath<Path extends string> = SimplifyObj<SegmentReplacePath<Path> & CatchAllSegmentReplacePath<Path>>;

// Regex to find single and catch all segment
const SINGLE_SEGMENT_REGEX = /\[[\w\d\s]+\]/gi;
const CATCH_ALL_SEGMENT_REGEX = /\[\.{3}[\w\d\s]+\]/gi;

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
      const isOptional = isOptionalSegment(segment, generatedPath);
      if (key in replace && !isEmptyValue(replace[key])) {
        const value = replace[key];
        if (typeof value === 'number' || typeof value === 'string') {
          generatedPath = generatedPath.replace(isOptional ? `[${segment}]` : segment, value.toString());
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
      const key = segment.slice(4, segment.length - 1); // 4 = length of '[...';
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
            generatedPath = generatedPath.replace(isOptional ? `[${segment}]` : segment, filteredValue.join('/'));
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

export const generatePath = <Path extends string>(path: Path, replace: ReplacePath<Path>): string => {
  let generatedPath: string = path;
  generatedPath = replaceSingleSegment(generatedPath, replace, path);
  generatedPath = replaceCatchAllSegment(generatedPath, replace, path);

  return generatedPath;
};
