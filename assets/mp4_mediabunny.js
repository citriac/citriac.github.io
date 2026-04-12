// ../node_modules/mediabunny/dist/modules/src/misc.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
function assert(x) {
  if (!x) {
    throw new Error("Assertion failed.");
  }
}
var last = (arr) => {
  return arr && arr[arr.length - 1];
};
var isU32 = (value) => {
  return value >= 0 && value < 2 ** 32;
};

class Bitstream {
  constructor(bytes) {
    this.bytes = bytes;
    this.pos = 0;
  }
  seekToByte(byteOffset) {
    this.pos = 8 * byteOffset;
  }
  readBit() {
    const byteIndex = Math.floor(this.pos / 8);
    const byte = this.bytes[byteIndex] ?? 0;
    const bitIndex = 7 - (this.pos & 7);
    const bit = (byte & 1 << bitIndex) >> bitIndex;
    this.pos++;
    return bit;
  }
  readBits(n) {
    if (n === 1) {
      return this.readBit();
    }
    let result = 0;
    for (let i = 0;i < n; i++) {
      result <<= 1;
      result |= this.readBit();
    }
    return result;
  }
  writeBits(n, value) {
    const end = this.pos + n;
    for (let i = this.pos;i < end; i++) {
      const byteIndex = Math.floor(i / 8);
      let byte = this.bytes[byteIndex];
      const bitIndex = 7 - (i & 7);
      byte &= ~(1 << bitIndex);
      byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
      this.bytes[byteIndex] = byte;
    }
    this.pos = end;
  }
  readAlignedByte() {
    if (this.pos % 8 !== 0) {
      throw new Error("Bitstream is not byte-aligned.");
    }
    const byteIndex = this.pos / 8;
    const byte = this.bytes[byteIndex] ?? 0;
    this.pos += 8;
    return byte;
  }
  skipBits(n) {
    this.pos += n;
  }
  getBitsLeft() {
    return this.bytes.length * 8 - this.pos;
  }
  clone() {
    const clone = new Bitstream(this.bytes);
    clone.pos = this.pos;
    return clone;
  }
}
var readExpGolomb = (bitstream) => {
  let leadingZeroBits = 0;
  while (bitstream.readBits(1) === 0 && leadingZeroBits < 32) {
    leadingZeroBits++;
  }
  if (leadingZeroBits >= 32) {
    throw new Error("Invalid exponential-Golomb code.");
  }
  const result = (1 << leadingZeroBits) - 1 + bitstream.readBits(leadingZeroBits);
  return result;
};
var readSignedExpGolomb = (bitstream) => {
  const codeNum = readExpGolomb(bitstream);
  return (codeNum & 1) === 0 ? -(codeNum >> 1) : codeNum + 1 >> 1;
};
var toUint8Array = (source) => {
  if (source.constructor === Uint8Array) {
    return source;
  } else if (ArrayBuffer.isView(source)) {
    return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  } else {
    return new Uint8Array(source);
  }
};
var toDataView = (source) => {
  if (source.constructor === DataView) {
    return source;
  } else if (ArrayBuffer.isView(source)) {
    return new DataView(source.buffer, source.byteOffset, source.byteLength);
  } else {
    return new DataView(source);
  }
};
var textEncoder = /* @__PURE__ */ new TextEncoder;
var COLOR_PRIMARIES_MAP = {
  bt709: 1,
  bt470bg: 5,
  smpte170m: 6,
  bt2020: 9,
  smpte432: 12
};
var TRANSFER_CHARACTERISTICS_MAP = {
  bt709: 1,
  smpte170m: 6,
  linear: 8,
  "iec61966-2-1": 13,
  pq: 16,
  hlg: 18
};
var MATRIX_COEFFICIENTS_MAP = {
  rgb: 0,
  bt709: 1,
  bt470bg: 5,
  smpte170m: 6,
  "bt2020-ncl": 9
};
var colorSpaceIsComplete = (colorSpace) => {
  return !!colorSpace && !!colorSpace.primaries && !!colorSpace.transfer && !!colorSpace.matrix && colorSpace.fullRange !== undefined;
};
var isAllowSharedBufferSource = (x) => {
  return x instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && x instanceof SharedArrayBuffer || ArrayBuffer.isView(x);
};

class AsyncMutex {
  constructor() {
    this.currentPromise = Promise.resolve();
    this.pending = 0;
  }
  async acquire() {
    let resolver;
    const nextPromise = new Promise((resolve) => {
      let resolved = false;
      resolver = () => {
        if (resolved) {
          return;
        }
        resolve();
        this.pending--;
        resolved = true;
      };
    });
    const currentPromiseAlias = this.currentPromise;
    this.currentPromise = nextPromise;
    this.pending++;
    await currentPromiseAlias;
    return resolver;
  }
}
var promiseWithResolvers = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
var assertNever = (x) => {
  throw new Error(`Unexpected value: ${x}`);
};
var setUint24 = (view, byteOffset, value, littleEndian) => {
  value = value >>> 0;
  value = value & 16777215;
  if (littleEndian) {
    view.setUint8(byteOffset, value & 255);
    view.setUint8(byteOffset + 1, value >>> 8 & 255);
    view.setUint8(byteOffset + 2, value >>> 16 & 255);
  } else {
    view.setUint8(byteOffset, value >>> 16 & 255);
    view.setUint8(byteOffset + 1, value >>> 8 & 255);
    view.setUint8(byteOffset + 2, value & 255);
  }
};
var setInt24 = (view, byteOffset, value, littleEndian) => {
  value = clamp(value, -8388608, 8388607);
  if (value < 0) {
    value = value + 16777216 & 16777215;
  }
  setUint24(view, byteOffset, value, littleEndian);
};
var clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};
var UNDETERMINED_LANGUAGE = "und";
var ISO_639_2_REGEX = /^[a-z]{3}$/;
var isIso639Dash2LanguageCode = (x) => {
  return ISO_639_2_REGEX.test(x);
};
var SECOND_TO_MICROSECOND_FACTOR = 1e6 * (1 + Number.EPSILON);
var computeRationalApproximation = (x, maxDenominator) => {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  let prevNumerator = 0, prevDenominator = 1;
  let currNumerator = 1, currDenominator = 0;
  let remainder = x;
  while (true) {
    const integer = Math.floor(remainder);
    const nextNumerator = integer * currNumerator + prevNumerator;
    const nextDenominator = integer * currDenominator + prevDenominator;
    if (nextDenominator > maxDenominator) {
      return {
        numerator: sign * currNumerator,
        denominator: currDenominator
      };
    }
    prevNumerator = currNumerator;
    prevDenominator = currDenominator;
    currNumerator = nextNumerator;
    currDenominator = nextDenominator;
    remainder = 1 / (remainder - integer);
    if (!isFinite(remainder)) {
      break;
    }
  }
  return {
    numerator: sign * currNumerator,
    denominator: currDenominator
  };
};

class CallSerializer {
  constructor() {
    this.currentPromise = Promise.resolve();
  }
  call(fn) {
    return this.currentPromise = this.currentPromise.then(fn);
  }
}
var isWebKitCache = null;
var isWebKit = () => {
  if (isWebKitCache !== null) {
    return isWebKitCache;
  }
  return isWebKitCache = !!(typeof navigator !== "undefined" && (navigator.vendor?.match(/apple/i) || /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) || /\b(iPad|iPhone|iPod)\b/.test(navigator.userAgent)));
};
var isFirefoxCache = null;
var isFirefox = () => {
  if (isFirefoxCache !== null) {
    return isFirefoxCache;
  }
  return isFirefoxCache = typeof navigator !== "undefined" && navigator.userAgent?.includes("Firefox");
};
var keyValueIterator = function* (object) {
  for (const key in object) {
    const value = object[key];
    if (value === undefined) {
      continue;
    }
    yield { key, value };
  }
};
var polyfillSymbolDispose = () => {
  Symbol.dispose ??= Symbol("Symbol.dispose");
};

// ../node_modules/mediabunny/dist/modules/src/metadata.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class RichImageData {
  constructor(data, mimeType) {
    this.data = data;
    this.mimeType = mimeType;
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("data must be a Uint8Array.");
    }
    if (typeof mimeType !== "string") {
      throw new TypeError("mimeType must be a string.");
    }
  }
}

class AttachedFile {
  constructor(data, mimeType, name, description) {
    this.data = data;
    this.mimeType = mimeType;
    this.name = name;
    this.description = description;
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("data must be a Uint8Array.");
    }
    if (mimeType !== undefined && typeof mimeType !== "string") {
      throw new TypeError("mimeType, when provided, must be a string.");
    }
    if (name !== undefined && typeof name !== "string") {
      throw new TypeError("name, when provided, must be a string.");
    }
    if (description !== undefined && typeof description !== "string") {
      throw new TypeError("description, when provided, must be a string.");
    }
  }
}
var validateMetadataTags = (tags) => {
  if (!tags || typeof tags !== "object") {
    throw new TypeError("tags must be an object.");
  }
  if (tags.title !== undefined && typeof tags.title !== "string") {
    throw new TypeError("tags.title, when provided, must be a string.");
  }
  if (tags.description !== undefined && typeof tags.description !== "string") {
    throw new TypeError("tags.description, when provided, must be a string.");
  }
  if (tags.artist !== undefined && typeof tags.artist !== "string") {
    throw new TypeError("tags.artist, when provided, must be a string.");
  }
  if (tags.album !== undefined && typeof tags.album !== "string") {
    throw new TypeError("tags.album, when provided, must be a string.");
  }
  if (tags.albumArtist !== undefined && typeof tags.albumArtist !== "string") {
    throw new TypeError("tags.albumArtist, when provided, must be a string.");
  }
  if (tags.trackNumber !== undefined && (!Number.isInteger(tags.trackNumber) || tags.trackNumber <= 0)) {
    throw new TypeError("tags.trackNumber, when provided, must be a positive integer.");
  }
  if (tags.tracksTotal !== undefined && (!Number.isInteger(tags.tracksTotal) || tags.tracksTotal <= 0)) {
    throw new TypeError("tags.tracksTotal, when provided, must be a positive integer.");
  }
  if (tags.discNumber !== undefined && (!Number.isInteger(tags.discNumber) || tags.discNumber <= 0)) {
    throw new TypeError("tags.discNumber, when provided, must be a positive integer.");
  }
  if (tags.discsTotal !== undefined && (!Number.isInteger(tags.discsTotal) || tags.discsTotal <= 0)) {
    throw new TypeError("tags.discsTotal, when provided, must be a positive integer.");
  }
  if (tags.genre !== undefined && typeof tags.genre !== "string") {
    throw new TypeError("tags.genre, when provided, must be a string.");
  }
  if (tags.date !== undefined && (!(tags.date instanceof Date) || Number.isNaN(tags.date.getTime()))) {
    throw new TypeError("tags.date, when provided, must be a valid Date.");
  }
  if (tags.lyrics !== undefined && typeof tags.lyrics !== "string") {
    throw new TypeError("tags.lyrics, when provided, must be a string.");
  }
  if (tags.images !== undefined) {
    if (!Array.isArray(tags.images)) {
      throw new TypeError("tags.images, when provided, must be an array.");
    }
    for (const image of tags.images) {
      if (!image || typeof image !== "object") {
        throw new TypeError("Each image in tags.images must be an object.");
      }
      if (!(image.data instanceof Uint8Array)) {
        throw new TypeError("Each image.data must be a Uint8Array.");
      }
      if (typeof image.mimeType !== "string") {
        throw new TypeError("Each image.mimeType must be a string.");
      }
      if (!["coverFront", "coverBack", "unknown"].includes(image.kind)) {
        throw new TypeError("Each image.kind must be 'coverFront', 'coverBack', or 'unknown'.");
      }
    }
  }
  if (tags.comment !== undefined && typeof tags.comment !== "string") {
    throw new TypeError("tags.comment, when provided, must be a string.");
  }
  if (tags.raw !== undefined) {
    if (!tags.raw || typeof tags.raw !== "object") {
      throw new TypeError("tags.raw, when provided, must be an object.");
    }
    for (const value of Object.values(tags.raw)) {
      if (value !== null && typeof value !== "string" && !(value instanceof Uint8Array) && !(value instanceof RichImageData) && !(value instanceof AttachedFile)) {
        throw new TypeError("Each value in tags.raw must be a string, Uint8Array, RichImageData, AttachedFile, or null.");
      }
    }
  }
};
var validateTrackDisposition = (disposition) => {
  if (!disposition || typeof disposition !== "object") {
    throw new TypeError("disposition must be an object.");
  }
  if (disposition.default !== undefined && typeof disposition.default !== "boolean") {
    throw new TypeError("disposition.default must be a boolean.");
  }
  if (disposition.forced !== undefined && typeof disposition.forced !== "boolean") {
    throw new TypeError("disposition.forced must be a boolean.");
  }
  if (disposition.original !== undefined && typeof disposition.original !== "boolean") {
    throw new TypeError("disposition.original must be a boolean.");
  }
  if (disposition.commentary !== undefined && typeof disposition.commentary !== "boolean") {
    throw new TypeError("disposition.commentary must be a boolean.");
  }
  if (disposition.hearingImpaired !== undefined && typeof disposition.hearingImpaired !== "boolean") {
    throw new TypeError("disposition.hearingImpaired must be a boolean.");
  }
  if (disposition.visuallyImpaired !== undefined && typeof disposition.visuallyImpaired !== "boolean") {
    throw new TypeError("disposition.visuallyImpaired must be a boolean.");
  }
};

// ../node_modules/mediabunny/dist/modules/src/codec.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var VIDEO_CODECS = [
  "avc",
  "hevc",
  "vp9",
  "av1",
  "vp8"
];
var PCM_AUDIO_CODECS = [
  "pcm-s16",
  "pcm-s16be",
  "pcm-s24",
  "pcm-s24be",
  "pcm-s32",
  "pcm-s32be",
  "pcm-f32",
  "pcm-f32be",
  "pcm-f64",
  "pcm-f64be",
  "pcm-u8",
  "pcm-s8",
  "ulaw",
  "alaw"
];
var NON_PCM_AUDIO_CODECS = [
  "aac",
  "opus",
  "mp3",
  "vorbis",
  "flac"
];
var AUDIO_CODECS = [
  ...NON_PCM_AUDIO_CODECS,
  ...PCM_AUDIO_CODECS
];
var SUBTITLE_CODECS = [
  "webvtt"
];
var AVC_LEVEL_TABLE = [
  { maxMacroblocks: 99, maxBitrate: 64000, maxDpbMbs: 396, level: 10 },
  { maxMacroblocks: 396, maxBitrate: 192000, maxDpbMbs: 900, level: 11 },
  { maxMacroblocks: 396, maxBitrate: 384000, maxDpbMbs: 2376, level: 12 },
  { maxMacroblocks: 396, maxBitrate: 768000, maxDpbMbs: 2376, level: 13 },
  { maxMacroblocks: 396, maxBitrate: 2000000, maxDpbMbs: 2376, level: 20 },
  { maxMacroblocks: 792, maxBitrate: 4000000, maxDpbMbs: 4752, level: 21 },
  { maxMacroblocks: 1620, maxBitrate: 4000000, maxDpbMbs: 8100, level: 22 },
  { maxMacroblocks: 1620, maxBitrate: 1e7, maxDpbMbs: 8100, level: 30 },
  { maxMacroblocks: 3600, maxBitrate: 14000000, maxDpbMbs: 18000, level: 31 },
  { maxMacroblocks: 5120, maxBitrate: 20000000, maxDpbMbs: 20480, level: 32 },
  { maxMacroblocks: 8192, maxBitrate: 20000000, maxDpbMbs: 32768, level: 40 },
  { maxMacroblocks: 8192, maxBitrate: 50000000, maxDpbMbs: 32768, level: 41 },
  { maxMacroblocks: 8704, maxBitrate: 50000000, maxDpbMbs: 34816, level: 42 },
  { maxMacroblocks: 22080, maxBitrate: 135000000, maxDpbMbs: 110400, level: 50 },
  { maxMacroblocks: 36864, maxBitrate: 240000000, maxDpbMbs: 184320, level: 51 },
  { maxMacroblocks: 36864, maxBitrate: 240000000, maxDpbMbs: 184320, level: 52 },
  { maxMacroblocks: 139264, maxBitrate: 240000000, maxDpbMbs: 696320, level: 60 },
  { maxMacroblocks: 139264, maxBitrate: 480000000, maxDpbMbs: 696320, level: 61 },
  { maxMacroblocks: 139264, maxBitrate: 800000000, maxDpbMbs: 696320, level: 62 }
];
var HEVC_LEVEL_TABLE = [
  { maxPictureSize: 36864, maxBitrate: 128000, tier: "L", level: 30 },
  { maxPictureSize: 122880, maxBitrate: 1500000, tier: "L", level: 60 },
  { maxPictureSize: 245760, maxBitrate: 3000000, tier: "L", level: 63 },
  { maxPictureSize: 552960, maxBitrate: 6000000, tier: "L", level: 90 },
  { maxPictureSize: 983040, maxBitrate: 1e7, tier: "L", level: 93 },
  { maxPictureSize: 2228224, maxBitrate: 12000000, tier: "L", level: 120 },
  { maxPictureSize: 2228224, maxBitrate: 30000000, tier: "H", level: 120 },
  { maxPictureSize: 2228224, maxBitrate: 20000000, tier: "L", level: 123 },
  { maxPictureSize: 2228224, maxBitrate: 50000000, tier: "H", level: 123 },
  { maxPictureSize: 8912896, maxBitrate: 25000000, tier: "L", level: 150 },
  { maxPictureSize: 8912896, maxBitrate: 1e8, tier: "H", level: 150 },
  { maxPictureSize: 8912896, maxBitrate: 40000000, tier: "L", level: 153 },
  { maxPictureSize: 8912896, maxBitrate: 160000000, tier: "H", level: 153 },
  { maxPictureSize: 8912896, maxBitrate: 60000000, tier: "L", level: 156 },
  { maxPictureSize: 8912896, maxBitrate: 240000000, tier: "H", level: 156 },
  { maxPictureSize: 35651584, maxBitrate: 60000000, tier: "L", level: 180 },
  { maxPictureSize: 35651584, maxBitrate: 240000000, tier: "H", level: 180 },
  { maxPictureSize: 35651584, maxBitrate: 120000000, tier: "L", level: 183 },
  { maxPictureSize: 35651584, maxBitrate: 480000000, tier: "H", level: 183 },
  { maxPictureSize: 35651584, maxBitrate: 240000000, tier: "L", level: 186 },
  { maxPictureSize: 35651584, maxBitrate: 800000000, tier: "H", level: 186 }
];
var VP9_LEVEL_TABLE = [
  { maxPictureSize: 36864, maxBitrate: 200000, level: 10 },
  { maxPictureSize: 73728, maxBitrate: 800000, level: 11 },
  { maxPictureSize: 122880, maxBitrate: 1800000, level: 20 },
  { maxPictureSize: 245760, maxBitrate: 3600000, level: 21 },
  { maxPictureSize: 552960, maxBitrate: 7200000, level: 30 },
  { maxPictureSize: 983040, maxBitrate: 12000000, level: 31 },
  { maxPictureSize: 2228224, maxBitrate: 18000000, level: 40 },
  { maxPictureSize: 2228224, maxBitrate: 30000000, level: 41 },
  { maxPictureSize: 8912896, maxBitrate: 60000000, level: 50 },
  { maxPictureSize: 8912896, maxBitrate: 120000000, level: 51 },
  { maxPictureSize: 8912896, maxBitrate: 180000000, level: 52 },
  { maxPictureSize: 35651584, maxBitrate: 180000000, level: 60 },
  { maxPictureSize: 35651584, maxBitrate: 240000000, level: 61 },
  { maxPictureSize: 35651584, maxBitrate: 480000000, level: 62 }
];
var AV1_LEVEL_TABLE = [
  { maxPictureSize: 147456, maxBitrate: 1500000, tier: "M", level: 0 },
  { maxPictureSize: 278784, maxBitrate: 3000000, tier: "M", level: 1 },
  { maxPictureSize: 665856, maxBitrate: 6000000, tier: "M", level: 4 },
  { maxPictureSize: 1065024, maxBitrate: 1e7, tier: "M", level: 5 },
  { maxPictureSize: 2359296, maxBitrate: 12000000, tier: "M", level: 8 },
  { maxPictureSize: 2359296, maxBitrate: 30000000, tier: "H", level: 8 },
  { maxPictureSize: 2359296, maxBitrate: 20000000, tier: "M", level: 9 },
  { maxPictureSize: 2359296, maxBitrate: 50000000, tier: "H", level: 9 },
  { maxPictureSize: 8912896, maxBitrate: 30000000, tier: "M", level: 12 },
  { maxPictureSize: 8912896, maxBitrate: 1e8, tier: "H", level: 12 },
  { maxPictureSize: 8912896, maxBitrate: 40000000, tier: "M", level: 13 },
  { maxPictureSize: 8912896, maxBitrate: 160000000, tier: "H", level: 13 },
  { maxPictureSize: 8912896, maxBitrate: 60000000, tier: "M", level: 14 },
  { maxPictureSize: 8912896, maxBitrate: 240000000, tier: "H", level: 14 },
  { maxPictureSize: 35651584, maxBitrate: 60000000, tier: "M", level: 15 },
  { maxPictureSize: 35651584, maxBitrate: 240000000, tier: "H", level: 15 },
  { maxPictureSize: 35651584, maxBitrate: 60000000, tier: "M", level: 16 },
  { maxPictureSize: 35651584, maxBitrate: 240000000, tier: "H", level: 16 },
  { maxPictureSize: 35651584, maxBitrate: 1e8, tier: "M", level: 17 },
  { maxPictureSize: 35651584, maxBitrate: 480000000, tier: "H", level: 17 },
  { maxPictureSize: 35651584, maxBitrate: 160000000, tier: "M", level: 18 },
  { maxPictureSize: 35651584, maxBitrate: 800000000, tier: "H", level: 18 },
  { maxPictureSize: 35651584, maxBitrate: 160000000, tier: "M", level: 19 },
  { maxPictureSize: 35651584, maxBitrate: 800000000, tier: "H", level: 19 }
];
var buildVideoCodecString = (codec, width, height, bitrate) => {
  if (codec === "avc") {
    const profileIndication = 100;
    const totalMacroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
    const levelInfo = AVC_LEVEL_TABLE.find((level) => totalMacroblocks <= level.maxMacroblocks && bitrate <= level.maxBitrate) ?? last(AVC_LEVEL_TABLE);
    const levelIndication = levelInfo ? levelInfo.level : 0;
    const hexProfileIndication = profileIndication.toString(16).padStart(2, "0");
    const hexProfileCompatibility = "00";
    const hexLevelIndication = levelIndication.toString(16).padStart(2, "0");
    return `avc1.${hexProfileIndication}${hexProfileCompatibility}${hexLevelIndication}`;
  } else if (codec === "hevc") {
    const profilePrefix = "";
    const profileIdc = 1;
    const compatibilityFlags = "6";
    const pictureSize = width * height;
    const levelInfo = HEVC_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(HEVC_LEVEL_TABLE);
    const constraintFlags = "B0";
    return "hev1." + `${profilePrefix}${profileIdc}.` + `${compatibilityFlags}.` + `${levelInfo.tier}${levelInfo.level}.` + `${constraintFlags}`;
  } else if (codec === "vp8") {
    return "vp8";
  } else if (codec === "vp9") {
    const profile = "00";
    const pictureSize = width * height;
    const levelInfo = VP9_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(VP9_LEVEL_TABLE);
    const bitDepth = "08";
    return `vp09.${profile}.${levelInfo.level.toString().padStart(2, "0")}.${bitDepth}`;
  } else if (codec === "av1") {
    const profile = 0;
    const pictureSize = width * height;
    const levelInfo = AV1_LEVEL_TABLE.find((level2) => pictureSize <= level2.maxPictureSize && bitrate <= level2.maxBitrate) ?? last(AV1_LEVEL_TABLE);
    const level = levelInfo.level.toString().padStart(2, "0");
    const bitDepth = "08";
    return `av01.${profile}.${level}${levelInfo.tier}.${bitDepth}`;
  }
  throw new TypeError(`Unhandled codec '${codec}'.`);
};
var generateAv1CodecConfigurationFromCodecString = (codecString) => {
  const parts = codecString.split(".");
  const marker = 1;
  const version = 1;
  const firstByte = (marker << 7) + version;
  const profile = Number(parts[1]);
  const levelAndTier = parts[2];
  const level = Number(levelAndTier.slice(0, -1));
  const secondByte = (profile << 5) + level;
  const tier = levelAndTier.slice(-1) === "H" ? 1 : 0;
  const bitDepth = Number(parts[3]);
  const highBitDepth = bitDepth === 8 ? 0 : 1;
  const twelveBit = 0;
  const monochrome = parts[4] ? Number(parts[4]) : 0;
  const chromaSubsamplingX = parts[5] ? Number(parts[5][0]) : 1;
  const chromaSubsamplingY = parts[5] ? Number(parts[5][1]) : 1;
  const chromaSamplePosition = parts[5] ? Number(parts[5][2]) : 0;
  const thirdByte = (tier << 7) + (highBitDepth << 6) + (twelveBit << 5) + (monochrome << 4) + (chromaSubsamplingX << 3) + (chromaSubsamplingY << 2) + chromaSamplePosition;
  const initialPresentationDelayPresent = 0;
  const fourthByte = initialPresentationDelayPresent;
  return [firstByte, secondByte, thirdByte, fourthByte];
};
var buildAudioCodecString = (codec, numberOfChannels, sampleRate) => {
  if (codec === "aac") {
    if (numberOfChannels >= 2 && sampleRate <= 24000) {
      return "mp4a.40.29";
    }
    if (sampleRate <= 24000) {
      return "mp4a.40.5";
    }
    return "mp4a.40.2";
  } else if (codec === "mp3") {
    return "mp3";
  } else if (codec === "opus") {
    return "opus";
  } else if (codec === "vorbis") {
    return "vorbis";
  } else if (codec === "flac") {
    return "flac";
  } else if (PCM_AUDIO_CODECS.includes(codec)) {
    return codec;
  }
  throw new TypeError(`Unhandled codec '${codec}'.`);
};
var aacFrequencyTable = [
  96000,
  88200,
  64000,
  48000,
  44100,
  32000,
  24000,
  22050,
  16000,
  12000,
  11025,
  8000,
  7350
];
var aacChannelMap = [-1, 1, 2, 3, 4, 5, 6, 8];
var parseAacAudioSpecificConfig = (bytes) => {
  if (!bytes || bytes.byteLength < 2) {
    throw new TypeError("AAC description must be at least 2 bytes long.");
  }
  const bitstream = new Bitstream(bytes);
  let objectType = bitstream.readBits(5);
  if (objectType === 31) {
    objectType = 32 + bitstream.readBits(6);
  }
  const frequencyIndex = bitstream.readBits(4);
  let sampleRate = null;
  if (frequencyIndex === 15) {
    sampleRate = bitstream.readBits(24);
  } else {
    if (frequencyIndex < aacFrequencyTable.length) {
      sampleRate = aacFrequencyTable[frequencyIndex];
    }
  }
  const channelConfiguration = bitstream.readBits(4);
  let numberOfChannels = null;
  if (channelConfiguration >= 1 && channelConfiguration <= 7) {
    numberOfChannels = aacChannelMap[channelConfiguration];
  }
  return {
    objectType,
    frequencyIndex,
    sampleRate,
    channelConfiguration,
    numberOfChannels
  };
};
var buildAacAudioSpecificConfig = (config) => {
  let frequencyIndex = aacFrequencyTable.indexOf(config.sampleRate);
  let customSampleRate = null;
  if (frequencyIndex === -1) {
    frequencyIndex = 15;
    customSampleRate = config.sampleRate;
  }
  const channelConfiguration = aacChannelMap.indexOf(config.numberOfChannels);
  if (channelConfiguration === -1) {
    throw new TypeError(`Unsupported number of channels: ${config.numberOfChannels}`);
  }
  let bitCount = 5 + 4 + 4;
  if (config.objectType >= 32) {
    bitCount += 6;
  }
  if (frequencyIndex === 15) {
    bitCount += 24;
  }
  const byteCount = Math.ceil(bitCount / 8);
  const bytes = new Uint8Array(byteCount);
  const bitstream = new Bitstream(bytes);
  if (config.objectType < 32) {
    bitstream.writeBits(5, config.objectType);
  } else {
    bitstream.writeBits(5, 31);
    bitstream.writeBits(6, config.objectType - 32);
  }
  bitstream.writeBits(4, frequencyIndex);
  if (frequencyIndex === 15) {
    bitstream.writeBits(24, customSampleRate);
  }
  bitstream.writeBits(4, channelConfiguration);
  return bytes;
};
var PCM_CODEC_REGEX = /^pcm-([usf])(\d+)+(be)?$/;
var parsePcmCodec = (codec) => {
  assert(PCM_AUDIO_CODECS.includes(codec));
  if (codec === "ulaw") {
    return { dataType: "ulaw", sampleSize: 1, littleEndian: true, silentValue: 255 };
  } else if (codec === "alaw") {
    return { dataType: "alaw", sampleSize: 1, littleEndian: true, silentValue: 213 };
  }
  const match = PCM_CODEC_REGEX.exec(codec);
  assert(match);
  let dataType;
  if (match[1] === "u") {
    dataType = "unsigned";
  } else if (match[1] === "s") {
    dataType = "signed";
  } else {
    dataType = "float";
  }
  const sampleSize = Number(match[2]) / 8;
  const littleEndian = match[3] !== "be";
  const silentValue = codec === "pcm-u8" ? 2 ** 7 : 0;
  return { dataType, sampleSize, littleEndian, silentValue };
};
var inferCodecFromCodecString = (codecString) => {
  if (codecString.startsWith("avc1") || codecString.startsWith("avc3")) {
    return "avc";
  } else if (codecString.startsWith("hev1") || codecString.startsWith("hvc1")) {
    return "hevc";
  } else if (codecString === "vp8") {
    return "vp8";
  } else if (codecString.startsWith("vp09")) {
    return "vp9";
  } else if (codecString.startsWith("av01")) {
    return "av1";
  }
  if (codecString.startsWith("mp4a.40") || codecString === "mp4a.67") {
    return "aac";
  } else if (codecString === "mp3" || codecString === "mp4a.69" || codecString === "mp4a.6B" || codecString === "mp4a.6b") {
    return "mp3";
  } else if (codecString === "opus") {
    return "opus";
  } else if (codecString === "vorbis") {
    return "vorbis";
  } else if (codecString === "flac") {
    return "flac";
  } else if (codecString === "ulaw") {
    return "ulaw";
  } else if (codecString === "alaw") {
    return "alaw";
  } else if (PCM_CODEC_REGEX.test(codecString)) {
    return codecString;
  }
  if (codecString === "webvtt") {
    return "webvtt";
  }
  return null;
};
var getVideoEncoderConfigExtension = (codec) => {
  if (codec === "avc") {
    return {
      avc: {
        format: "avc"
      }
    };
  } else if (codec === "hevc") {
    return {
      hevc: {
        format: "hevc"
      }
    };
  }
  return {};
};
var getAudioEncoderConfigExtension = (codec) => {
  if (codec === "aac") {
    return {
      aac: {
        format: "aac"
      }
    };
  } else if (codec === "opus") {
    return {
      opus: {
        format: "opus"
      }
    };
  }
  return {};
};
var VALID_VIDEO_CODEC_STRING_PREFIXES = ["avc1", "avc3", "hev1", "hvc1", "vp8", "vp09", "av01"];
var AVC_CODEC_STRING_REGEX = /^(avc1|avc3)\.[0-9a-fA-F]{6}$/;
var HEVC_CODEC_STRING_REGEX = /^(hev1|hvc1)\.(?:[ABC]?\d+)\.[0-9a-fA-F]{1,8}\.[LH]\d+(?:\.[0-9a-fA-F]{1,2}){0,6}$/;
var VP9_CODEC_STRING_REGEX = /^vp09(?:\.\d{2}){3}(?:(?:\.\d{2}){5})?$/;
var AV1_CODEC_STRING_REGEX = /^av01\.\d\.\d{2}[MH]\.\d{2}(?:\.\d\.\d{3}\.\d{2}\.\d{2}\.\d{2}\.\d)?$/;
var validateVideoChunkMetadata = (metadata) => {
  if (!metadata) {
    throw new TypeError("Video chunk metadata must be provided.");
  }
  if (typeof metadata !== "object") {
    throw new TypeError("Video chunk metadata must be an object.");
  }
  if (!metadata.decoderConfig) {
    throw new TypeError("Video chunk metadata must include a decoder configuration.");
  }
  if (typeof metadata.decoderConfig !== "object") {
    throw new TypeError("Video chunk metadata decoder configuration must be an object.");
  }
  if (typeof metadata.decoderConfig.codec !== "string") {
    throw new TypeError("Video chunk metadata decoder configuration must specify a codec string.");
  }
  if (!VALID_VIDEO_CODEC_STRING_PREFIXES.some((prefix) => metadata.decoderConfig.codec.startsWith(prefix))) {
    throw new TypeError("Video chunk metadata decoder configuration codec string must be a valid video codec string as specified in" + " the WebCodecs Codec Registry.");
  }
  if (!Number.isInteger(metadata.decoderConfig.codedWidth) || metadata.decoderConfig.codedWidth <= 0) {
    throw new TypeError("Video chunk metadata decoder configuration must specify a valid codedWidth (positive integer).");
  }
  if (!Number.isInteger(metadata.decoderConfig.codedHeight) || metadata.decoderConfig.codedHeight <= 0) {
    throw new TypeError("Video chunk metadata decoder configuration must specify a valid codedHeight (positive integer).");
  }
  if (metadata.decoderConfig.description !== undefined) {
    if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) {
      throw new TypeError("Video chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an" + " ArrayBuffer view.");
    }
  }
  if (metadata.decoderConfig.colorSpace !== undefined) {
    const { colorSpace } = metadata.decoderConfig;
    if (typeof colorSpace !== "object") {
      throw new TypeError("Video chunk metadata decoder configuration colorSpace, when provided, must be an object.");
    }
    const primariesValues = Object.keys(COLOR_PRIMARIES_MAP);
    if (colorSpace.primaries != null && !primariesValues.includes(colorSpace.primaries)) {
      throw new TypeError(`Video chunk metadata decoder configuration colorSpace primaries, when defined, must be one of` + ` ${primariesValues.join(", ")}.`);
    }
    const transferValues = Object.keys(TRANSFER_CHARACTERISTICS_MAP);
    if (colorSpace.transfer != null && !transferValues.includes(colorSpace.transfer)) {
      throw new TypeError(`Video chunk metadata decoder configuration colorSpace transfer, when defined, must be one of` + ` ${transferValues.join(", ")}.`);
    }
    const matrixValues = Object.keys(MATRIX_COEFFICIENTS_MAP);
    if (colorSpace.matrix != null && !matrixValues.includes(colorSpace.matrix)) {
      throw new TypeError(`Video chunk metadata decoder configuration colorSpace matrix, when defined, must be one of` + ` ${matrixValues.join(", ")}.`);
    }
    if (colorSpace.fullRange != null && typeof colorSpace.fullRange !== "boolean") {
      throw new TypeError("Video chunk metadata decoder configuration colorSpace fullRange, when defined, must be a boolean.");
    }
  }
  if (metadata.decoderConfig.codec.startsWith("avc1") || metadata.decoderConfig.codec.startsWith("avc3")) {
    if (!AVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
      throw new TypeError("Video chunk metadata decoder configuration codec string for AVC must be a valid AVC codec string as" + " specified in Section 3.4 of RFC 6381.");
    }
  } else if (metadata.decoderConfig.codec.startsWith("hev1") || metadata.decoderConfig.codec.startsWith("hvc1")) {
    if (!HEVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
      throw new TypeError("Video chunk metadata decoder configuration codec string for HEVC must be a valid HEVC codec string as" + " specified in Section E.3 of ISO 14496-15.");
    }
  } else if (metadata.decoderConfig.codec.startsWith("vp8")) {
    if (metadata.decoderConfig.codec !== "vp8") {
      throw new TypeError('Video chunk metadata decoder configuration codec string for VP8 must be "vp8".');
    }
  } else if (metadata.decoderConfig.codec.startsWith("vp09")) {
    if (!VP9_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
      throw new TypeError("Video chunk metadata decoder configuration codec string for VP9 must be a valid VP9 codec string as" + ' specified in Section "Codecs Parameter String" of https://www.webmproject.org/vp9/mp4/.');
    }
  } else if (metadata.decoderConfig.codec.startsWith("av01")) {
    if (!AV1_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
      throw new TypeError("Video chunk metadata decoder configuration codec string for AV1 must be a valid AV1 codec string as" + ' specified in Section "Codecs Parameter String" of https://aomediacodec.github.io/av1-isobmff/.');
    }
  }
};
var VALID_AUDIO_CODEC_STRING_PREFIXES = ["mp4a", "mp3", "opus", "vorbis", "flac", "ulaw", "alaw", "pcm"];
var validateAudioChunkMetadata = (metadata) => {
  if (!metadata) {
    throw new TypeError("Audio chunk metadata must be provided.");
  }
  if (typeof metadata !== "object") {
    throw new TypeError("Audio chunk metadata must be an object.");
  }
  if (!metadata.decoderConfig) {
    throw new TypeError("Audio chunk metadata must include a decoder configuration.");
  }
  if (typeof metadata.decoderConfig !== "object") {
    throw new TypeError("Audio chunk metadata decoder configuration must be an object.");
  }
  if (typeof metadata.decoderConfig.codec !== "string") {
    throw new TypeError("Audio chunk metadata decoder configuration must specify a codec string.");
  }
  if (!VALID_AUDIO_CODEC_STRING_PREFIXES.some((prefix) => metadata.decoderConfig.codec.startsWith(prefix))) {
    throw new TypeError("Audio chunk metadata decoder configuration codec string must be a valid audio codec string as specified in" + " the WebCodecs Codec Registry.");
  }
  if (!Number.isInteger(metadata.decoderConfig.sampleRate) || metadata.decoderConfig.sampleRate <= 0) {
    throw new TypeError("Audio chunk metadata decoder configuration must specify a valid sampleRate (positive integer).");
  }
  if (!Number.isInteger(metadata.decoderConfig.numberOfChannels) || metadata.decoderConfig.numberOfChannels <= 0) {
    throw new TypeError("Audio chunk metadata decoder configuration must specify a valid numberOfChannels (positive integer).");
  }
  if (metadata.decoderConfig.description !== undefined) {
    if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) {
      throw new TypeError("Audio chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an" + " ArrayBuffer view.");
    }
  }
  if (metadata.decoderConfig.codec.startsWith("mp4a") && metadata.decoderConfig.codec !== "mp4a.69" && metadata.decoderConfig.codec !== "mp4a.6B" && metadata.decoderConfig.codec !== "mp4a.6b") {
    const validStrings = ["mp4a.40.2", "mp4a.40.02", "mp4a.40.5", "mp4a.40.05", "mp4a.40.29", "mp4a.67"];
    if (!validStrings.includes(metadata.decoderConfig.codec)) {
      throw new TypeError("Audio chunk metadata decoder configuration codec string for AAC must be a valid AAC codec string as" + " specified in https://www.w3.org/TR/webcodecs-aac-codec-registration/.");
    }
  } else if (metadata.decoderConfig.codec.startsWith("mp3") || metadata.decoderConfig.codec.startsWith("mp4a")) {
    if (metadata.decoderConfig.codec !== "mp3" && metadata.decoderConfig.codec !== "mp4a.69" && metadata.decoderConfig.codec !== "mp4a.6B" && metadata.decoderConfig.codec !== "mp4a.6b") {
      throw new TypeError('Audio chunk metadata decoder configuration codec string for MP3 must be "mp3", "mp4a.69" or' + ' "mp4a.6B".');
    }
  } else if (metadata.decoderConfig.codec.startsWith("opus")) {
    if (metadata.decoderConfig.codec !== "opus") {
      throw new TypeError('Audio chunk metadata decoder configuration codec string for Opus must be "opus".');
    }
    if (metadata.decoderConfig.description && metadata.decoderConfig.description.byteLength < 18) {
      throw new TypeError("Audio chunk metadata decoder configuration description, when specified, is expected to be an" + " Identification Header as specified in Section 5.1 of RFC 7845.");
    }
  } else if (metadata.decoderConfig.codec.startsWith("vorbis")) {
    if (metadata.decoderConfig.codec !== "vorbis") {
      throw new TypeError('Audio chunk metadata decoder configuration codec string for Vorbis must be "vorbis".');
    }
    if (!metadata.decoderConfig.description) {
      throw new TypeError("Audio chunk metadata decoder configuration for Vorbis must include a description, which is expected to" + " adhere to the format described in https://www.w3.org/TR/webcodecs-vorbis-codec-registration/.");
    }
  } else if (metadata.decoderConfig.codec.startsWith("flac")) {
    if (metadata.decoderConfig.codec !== "flac") {
      throw new TypeError('Audio chunk metadata decoder configuration codec string for FLAC must be "flac".');
    }
    const minDescriptionSize = 4 + 4 + 34;
    if (!metadata.decoderConfig.description || metadata.decoderConfig.description.byteLength < minDescriptionSize) {
      throw new TypeError("Audio chunk metadata decoder configuration for FLAC must include a description, which is expected to" + " adhere to the format described in https://www.w3.org/TR/webcodecs-flac-codec-registration/.");
    }
  } else if (metadata.decoderConfig.codec.startsWith("pcm") || metadata.decoderConfig.codec.startsWith("ulaw") || metadata.decoderConfig.codec.startsWith("alaw")) {
    if (!PCM_AUDIO_CODECS.includes(metadata.decoderConfig.codec)) {
      throw new TypeError("Audio chunk metadata decoder configuration codec string for PCM must be one of the supported PCM" + ` codecs (${PCM_AUDIO_CODECS.join(", ")}).`);
    }
  }
};
var validateSubtitleMetadata = (metadata) => {
  if (!metadata) {
    throw new TypeError("Subtitle metadata must be provided.");
  }
  if (typeof metadata !== "object") {
    throw new TypeError("Subtitle metadata must be an object.");
  }
  if (!metadata.config) {
    throw new TypeError("Subtitle metadata must include a config object.");
  }
  if (typeof metadata.config !== "object") {
    throw new TypeError("Subtitle metadata config must be an object.");
  }
  if (typeof metadata.config.description !== "string") {
    throw new TypeError("Subtitle metadata config description must be a string.");
  }
};

// ../node_modules/mediabunny/dist/modules/src/muxer.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class Muxer {
  constructor(output) {
    this.mutex = new AsyncMutex;
    this.firstMediaStreamTimestamp = null;
    this.trackTimestampInfo = new WeakMap;
    this.output = output;
  }
  onTrackClose(track) {}
  validateAndNormalizeTimestamp(track, timestampInSeconds, isKeyPacket) {
    timestampInSeconds += track.source._timestampOffset;
    let timestampInfo = this.trackTimestampInfo.get(track);
    if (!timestampInfo) {
      if (!isKeyPacket) {
        throw new Error("First packet must be a key packet.");
      }
      timestampInfo = {
        maxTimestamp: timestampInSeconds,
        maxTimestampBeforeLastKeyPacket: timestampInSeconds
      };
      this.trackTimestampInfo.set(track, timestampInfo);
    }
    if (timestampInSeconds < 0) {
      throw new Error(`Timestamps must be non-negative (got ${timestampInSeconds}s).`);
    }
    if (isKeyPacket) {
      timestampInfo.maxTimestampBeforeLastKeyPacket = timestampInfo.maxTimestamp;
    }
    if (timestampInSeconds < timestampInfo.maxTimestampBeforeLastKeyPacket) {
      throw new Error(`Timestamps cannot be smaller than the largest timestamp of the previous GOP (a GOP begins with a key` + ` packet and ends right before the next key packet). Got ${timestampInSeconds}s, but largest` + ` timestamp is ${timestampInfo.maxTimestampBeforeLastKeyPacket}s.`);
    }
    timestampInfo.maxTimestamp = Math.max(timestampInfo.maxTimestamp, timestampInSeconds);
    return timestampInSeconds;
  }
}

// ../node_modules/mediabunny/dist/modules/src/codec-data.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var AvcNalUnitType;
(function(AvcNalUnitType2) {
  AvcNalUnitType2[AvcNalUnitType2["NON_IDR_SLICE"] = 1] = "NON_IDR_SLICE";
  AvcNalUnitType2[AvcNalUnitType2["SLICE_DPA"] = 2] = "SLICE_DPA";
  AvcNalUnitType2[AvcNalUnitType2["SLICE_DPB"] = 3] = "SLICE_DPB";
  AvcNalUnitType2[AvcNalUnitType2["SLICE_DPC"] = 4] = "SLICE_DPC";
  AvcNalUnitType2[AvcNalUnitType2["IDR"] = 5] = "IDR";
  AvcNalUnitType2[AvcNalUnitType2["SEI"] = 6] = "SEI";
  AvcNalUnitType2[AvcNalUnitType2["SPS"] = 7] = "SPS";
  AvcNalUnitType2[AvcNalUnitType2["PPS"] = 8] = "PPS";
  AvcNalUnitType2[AvcNalUnitType2["AUD"] = 9] = "AUD";
  AvcNalUnitType2[AvcNalUnitType2["SPS_EXT"] = 13] = "SPS_EXT";
})(AvcNalUnitType || (AvcNalUnitType = {}));
var HevcNalUnitType;
(function(HevcNalUnitType2) {
  HevcNalUnitType2[HevcNalUnitType2["RASL_N"] = 8] = "RASL_N";
  HevcNalUnitType2[HevcNalUnitType2["RASL_R"] = 9] = "RASL_R";
  HevcNalUnitType2[HevcNalUnitType2["BLA_W_LP"] = 16] = "BLA_W_LP";
  HevcNalUnitType2[HevcNalUnitType2["RSV_IRAP_VCL23"] = 23] = "RSV_IRAP_VCL23";
  HevcNalUnitType2[HevcNalUnitType2["VPS_NUT"] = 32] = "VPS_NUT";
  HevcNalUnitType2[HevcNalUnitType2["SPS_NUT"] = 33] = "SPS_NUT";
  HevcNalUnitType2[HevcNalUnitType2["PPS_NUT"] = 34] = "PPS_NUT";
  HevcNalUnitType2[HevcNalUnitType2["AUD_NUT"] = 35] = "AUD_NUT";
  HevcNalUnitType2[HevcNalUnitType2["PREFIX_SEI_NUT"] = 39] = "PREFIX_SEI_NUT";
  HevcNalUnitType2[HevcNalUnitType2["SUFFIX_SEI_NUT"] = 40] = "SUFFIX_SEI_NUT";
})(HevcNalUnitType || (HevcNalUnitType = {}));
var iterateNalUnitsInAnnexB = function* (packetData) {
  let i = 0;
  let nalStart = -1;
  while (i < packetData.length - 2) {
    const zeroIndex = packetData.indexOf(0, i);
    if (zeroIndex === -1 || zeroIndex >= packetData.length - 2) {
      break;
    }
    i = zeroIndex;
    let startCodeLength = 0;
    if (i + 3 < packetData.length && packetData[i + 1] === 0 && packetData[i + 2] === 0 && packetData[i + 3] === 1) {
      startCodeLength = 4;
    } else if (packetData[i + 1] === 0 && packetData[i + 2] === 1) {
      startCodeLength = 3;
    }
    if (startCodeLength === 0) {
      i++;
      continue;
    }
    if (nalStart !== -1 && i > nalStart) {
      yield {
        offset: nalStart,
        length: i - nalStart
      };
    }
    nalStart = i + startCodeLength;
    i = nalStart;
  }
  if (nalStart !== -1 && nalStart < packetData.length) {
    yield {
      offset: nalStart,
      length: packetData.length - nalStart
    };
  }
};
var iterateAvcNalUnitsAnnexB = function* (packetData) {
  yield* iterateNalUnitsInAnnexB(packetData);
};
var extractNalUnitTypeForAvc = (byte) => {
  return byte & 31;
};
var removeEmulationPreventionBytes = (data) => {
  const result = [];
  const len = data.length;
  for (let i = 0;i < len; i++) {
    if (i + 2 < len && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 3) {
      result.push(0, 0);
      i += 2;
    } else {
      result.push(data[i]);
    }
  }
  return new Uint8Array(result);
};
var ANNEX_B_START_CODE = new Uint8Array([0, 0, 0, 1]);
var concatNalUnitsInLengthPrefixed = (nalUnits, lengthSize) => {
  const totalLength = nalUnits.reduce((a, b) => a + lengthSize + b.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const nalUnit of nalUnits) {
    const dataView = new DataView(result.buffer, result.byteOffset, result.byteLength);
    switch (lengthSize) {
      case 1:
        dataView.setUint8(offset, nalUnit.byteLength);
        break;
      case 2:
        dataView.setUint16(offset, nalUnit.byteLength, false);
        break;
      case 3:
        setUint24(dataView, offset, nalUnit.byteLength, false);
        break;
      case 4:
        dataView.setUint32(offset, nalUnit.byteLength, false);
        break;
    }
    offset += lengthSize;
    result.set(nalUnit, offset);
    offset += nalUnit.byteLength;
  }
  return result;
};
var extractAvcDecoderConfigurationRecord = (packetData) => {
  try {
    const spsUnits = [];
    const ppsUnits = [];
    const spsExtUnits = [];
    for (const loc of iterateAvcNalUnitsAnnexB(packetData)) {
      const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
      const type = extractNalUnitTypeForAvc(nalUnit[0]);
      if (type === AvcNalUnitType.SPS) {
        spsUnits.push(nalUnit);
      } else if (type === AvcNalUnitType.PPS) {
        ppsUnits.push(nalUnit);
      } else if (type === AvcNalUnitType.SPS_EXT) {
        spsExtUnits.push(nalUnit);
      }
    }
    if (spsUnits.length === 0) {
      return null;
    }
    if (ppsUnits.length === 0) {
      return null;
    }
    const spsData = spsUnits[0];
    const spsInfo = parseAvcSps(spsData);
    assert(spsInfo !== null);
    const hasExtendedData = spsInfo.profileIdc === 100 || spsInfo.profileIdc === 110 || spsInfo.profileIdc === 122 || spsInfo.profileIdc === 144;
    return {
      configurationVersion: 1,
      avcProfileIndication: spsInfo.profileIdc,
      profileCompatibility: spsInfo.constraintFlags,
      avcLevelIndication: spsInfo.levelIdc,
      lengthSizeMinusOne: 3,
      sequenceParameterSets: spsUnits,
      pictureParameterSets: ppsUnits,
      chromaFormat: hasExtendedData ? spsInfo.chromaFormatIdc : null,
      bitDepthLumaMinus8: hasExtendedData ? spsInfo.bitDepthLumaMinus8 : null,
      bitDepthChromaMinus8: hasExtendedData ? spsInfo.bitDepthChromaMinus8 : null,
      sequenceParameterSetExt: hasExtendedData ? spsExtUnits : null
    };
  } catch (error) {
    console.error("Error building AVC Decoder Configuration Record:", error);
    return null;
  }
};
var serializeAvcDecoderConfigurationRecord = (record) => {
  const bytes = [];
  bytes.push(record.configurationVersion);
  bytes.push(record.avcProfileIndication);
  bytes.push(record.profileCompatibility);
  bytes.push(record.avcLevelIndication);
  bytes.push(252 | record.lengthSizeMinusOne & 3);
  bytes.push(224 | record.sequenceParameterSets.length & 31);
  for (const sps of record.sequenceParameterSets) {
    const length = sps.byteLength;
    bytes.push(length >> 8);
    bytes.push(length & 255);
    for (let i = 0;i < length; i++) {
      bytes.push(sps[i]);
    }
  }
  bytes.push(record.pictureParameterSets.length);
  for (const pps of record.pictureParameterSets) {
    const length = pps.byteLength;
    bytes.push(length >> 8);
    bytes.push(length & 255);
    for (let i = 0;i < length; i++) {
      bytes.push(pps[i]);
    }
  }
  if (record.avcProfileIndication === 100 || record.avcProfileIndication === 110 || record.avcProfileIndication === 122 || record.avcProfileIndication === 144) {
    assert(record.chromaFormat !== null);
    assert(record.bitDepthLumaMinus8 !== null);
    assert(record.bitDepthChromaMinus8 !== null);
    assert(record.sequenceParameterSetExt !== null);
    bytes.push(252 | record.chromaFormat & 3);
    bytes.push(248 | record.bitDepthLumaMinus8 & 7);
    bytes.push(248 | record.bitDepthChromaMinus8 & 7);
    bytes.push(record.sequenceParameterSetExt.length);
    for (const spsExt of record.sequenceParameterSetExt) {
      const length = spsExt.byteLength;
      bytes.push(length >> 8);
      bytes.push(length & 255);
      for (let i = 0;i < length; i++) {
        bytes.push(spsExt[i]);
      }
    }
  }
  return new Uint8Array(bytes);
};
var parseAvcSps = (sps) => {
  try {
    const bitstream = new Bitstream(removeEmulationPreventionBytes(sps));
    bitstream.skipBits(1);
    bitstream.skipBits(2);
    const nalUnitType = bitstream.readBits(5);
    if (nalUnitType !== 7) {
      return null;
    }
    const profileIdc = bitstream.readAlignedByte();
    const constraintFlags = bitstream.readAlignedByte();
    const levelIdc = bitstream.readAlignedByte();
    readExpGolomb(bitstream);
    let chromaFormatIdc = 1;
    let bitDepthLumaMinus8 = 0;
    let bitDepthChromaMinus8 = 0;
    let separateColourPlaneFlag = 0;
    if (profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244 || profileIdc === 44 || profileIdc === 83 || profileIdc === 86 || profileIdc === 118 || profileIdc === 128) {
      chromaFormatIdc = readExpGolomb(bitstream);
      if (chromaFormatIdc === 3) {
        separateColourPlaneFlag = bitstream.readBits(1);
      }
      bitDepthLumaMinus8 = readExpGolomb(bitstream);
      bitDepthChromaMinus8 = readExpGolomb(bitstream);
      bitstream.skipBits(1);
      const seqScalingMatrixPresentFlag = bitstream.readBits(1);
      if (seqScalingMatrixPresentFlag) {
        for (let i = 0;i < (chromaFormatIdc !== 3 ? 8 : 12); i++) {
          const seqScalingListPresentFlag = bitstream.readBits(1);
          if (seqScalingListPresentFlag) {
            const sizeOfScalingList = i < 6 ? 16 : 64;
            let lastScale = 8;
            let nextScale = 8;
            for (let j = 0;j < sizeOfScalingList; j++) {
              if (nextScale !== 0) {
                const deltaScale = readSignedExpGolomb(bitstream);
                nextScale = (lastScale + deltaScale + 256) % 256;
              }
              lastScale = nextScale === 0 ? lastScale : nextScale;
            }
          }
        }
      }
    }
    readExpGolomb(bitstream);
    const picOrderCntType = readExpGolomb(bitstream);
    if (picOrderCntType === 0) {
      readExpGolomb(bitstream);
    } else if (picOrderCntType === 1) {
      bitstream.skipBits(1);
      readSignedExpGolomb(bitstream);
      readSignedExpGolomb(bitstream);
      const numRefFramesInPicOrderCntCycle = readExpGolomb(bitstream);
      for (let i = 0;i < numRefFramesInPicOrderCntCycle; i++) {
        readSignedExpGolomb(bitstream);
      }
    }
    readExpGolomb(bitstream);
    bitstream.skipBits(1);
    const picWidthInMbsMinus1 = readExpGolomb(bitstream);
    const picHeightInMapUnitsMinus1 = readExpGolomb(bitstream);
    const codedWidth = 16 * (picWidthInMbsMinus1 + 1);
    const codedHeight = 16 * (picHeightInMapUnitsMinus1 + 1);
    let displayWidth = codedWidth;
    let displayHeight = codedHeight;
    const frameMbsOnlyFlag = bitstream.readBits(1);
    if (!frameMbsOnlyFlag) {
      bitstream.skipBits(1);
    }
    bitstream.skipBits(1);
    const frameCroppingFlag = bitstream.readBits(1);
    if (frameCroppingFlag) {
      const frameCropLeftOffset = readExpGolomb(bitstream);
      const frameCropRightOffset = readExpGolomb(bitstream);
      const frameCropTopOffset = readExpGolomb(bitstream);
      const frameCropBottomOffset = readExpGolomb(bitstream);
      let cropUnitX;
      let cropUnitY;
      const chromaArrayType = separateColourPlaneFlag === 0 ? chromaFormatIdc : 0;
      if (chromaArrayType === 0) {
        cropUnitX = 1;
        cropUnitY = 2 - frameMbsOnlyFlag;
      } else {
        const subWidthC = chromaFormatIdc === 3 ? 1 : 2;
        const subHeightC = chromaFormatIdc === 1 ? 2 : 1;
        cropUnitX = subWidthC;
        cropUnitY = subHeightC * (2 - frameMbsOnlyFlag);
      }
      displayWidth -= cropUnitX * (frameCropLeftOffset + frameCropRightOffset);
      displayHeight -= cropUnitY * (frameCropTopOffset + frameCropBottomOffset);
    }
    let colourPrimaries = 2;
    let transferCharacteristics = 2;
    let matrixCoefficients = 2;
    let fullRangeFlag = 0;
    let numReorderFrames = null;
    let maxDecFrameBuffering = null;
    const vuiParametersPresentFlag = bitstream.readBits(1);
    if (vuiParametersPresentFlag) {
      const aspectRatioInfoPresentFlag = bitstream.readBits(1);
      if (aspectRatioInfoPresentFlag) {
        const aspectRatioIdc = bitstream.readBits(8);
        if (aspectRatioIdc === 255) {
          bitstream.skipBits(16);
          bitstream.skipBits(16);
        }
      }
      const overscanInfoPresentFlag = bitstream.readBits(1);
      if (overscanInfoPresentFlag) {
        bitstream.skipBits(1);
      }
      const videoSignalTypePresentFlag = bitstream.readBits(1);
      if (videoSignalTypePresentFlag) {
        bitstream.skipBits(3);
        fullRangeFlag = bitstream.readBits(1);
        const colourDescriptionPresentFlag = bitstream.readBits(1);
        if (colourDescriptionPresentFlag) {
          colourPrimaries = bitstream.readBits(8);
          transferCharacteristics = bitstream.readBits(8);
          matrixCoefficients = bitstream.readBits(8);
        }
      }
      const chromaLocInfoPresentFlag = bitstream.readBits(1);
      if (chromaLocInfoPresentFlag) {
        readExpGolomb(bitstream);
        readExpGolomb(bitstream);
      }
      const timingInfoPresentFlag = bitstream.readBits(1);
      if (timingInfoPresentFlag) {
        bitstream.skipBits(32);
        bitstream.skipBits(32);
        bitstream.skipBits(1);
      }
      const nalHrdParametersPresentFlag = bitstream.readBits(1);
      if (nalHrdParametersPresentFlag) {
        skipAvcHrdParameters(bitstream);
      }
      const vclHrdParametersPresentFlag = bitstream.readBits(1);
      if (vclHrdParametersPresentFlag) {
        skipAvcHrdParameters(bitstream);
      }
      if (nalHrdParametersPresentFlag || vclHrdParametersPresentFlag) {
        bitstream.skipBits(1);
      }
      bitstream.skipBits(1);
      const bitstreamRestrictionFlag = bitstream.readBits(1);
      if (bitstreamRestrictionFlag) {
        bitstream.skipBits(1);
        readExpGolomb(bitstream);
        readExpGolomb(bitstream);
        readExpGolomb(bitstream);
        readExpGolomb(bitstream);
        numReorderFrames = readExpGolomb(bitstream);
        maxDecFrameBuffering = readExpGolomb(bitstream);
      }
    }
    if (numReorderFrames === null) {
      assert(maxDecFrameBuffering === null);
      const constraintSet3Flag = constraintFlags & 16;
      if ((profileIdc === 44 || profileIdc === 86 || profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244) && constraintSet3Flag) {
        numReorderFrames = 0;
        maxDecFrameBuffering = 0;
      } else {
        const picWidthInMbs = picWidthInMbsMinus1 + 1;
        const picHeightInMapUnits = picHeightInMapUnitsMinus1 + 1;
        const frameHeightInMbs = (2 - frameMbsOnlyFlag) * picHeightInMapUnits;
        const levelInfo = AVC_LEVEL_TABLE.find((x) => x.level >= levelIdc) ?? last(AVC_LEVEL_TABLE);
        const maxDpbFrames = Math.min(Math.floor(levelInfo.maxDpbMbs / (picWidthInMbs * frameHeightInMbs)), 16);
        numReorderFrames = maxDpbFrames;
        maxDecFrameBuffering = maxDpbFrames;
      }
    }
    assert(maxDecFrameBuffering !== null);
    return {
      profileIdc,
      constraintFlags,
      levelIdc,
      frameMbsOnlyFlag,
      chromaFormatIdc,
      bitDepthLumaMinus8,
      bitDepthChromaMinus8,
      codedWidth,
      codedHeight,
      displayWidth,
      displayHeight,
      colourPrimaries,
      matrixCoefficients,
      transferCharacteristics,
      fullRangeFlag,
      numReorderFrames,
      maxDecFrameBuffering
    };
  } catch (error) {
    console.error("Error parsing AVC SPS:", error);
    return null;
  }
};
var skipAvcHrdParameters = (bitstream) => {
  const cpb_cnt_minus1 = readExpGolomb(bitstream);
  bitstream.skipBits(4);
  bitstream.skipBits(4);
  for (let i = 0;i <= cpb_cnt_minus1; i++) {
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    bitstream.skipBits(1);
  }
  bitstream.skipBits(5);
  bitstream.skipBits(5);
  bitstream.skipBits(5);
  bitstream.skipBits(5);
};
var iterateHevcNalUnitsAnnexB = function* (packetData) {
  yield* iterateNalUnitsInAnnexB(packetData);
};
var extractNalUnitTypeForHevc = (byte) => {
  return byte >> 1 & 63;
};
var parseHevcSps = (sps) => {
  try {
    const bitstream = new Bitstream(removeEmulationPreventionBytes(sps));
    bitstream.skipBits(16);
    bitstream.readBits(4);
    const spsMaxSubLayersMinus1 = bitstream.readBits(3);
    const spsTemporalIdNestingFlag = bitstream.readBits(1);
    const { general_profile_space, general_tier_flag, general_profile_idc, general_profile_compatibility_flags, general_constraint_indicator_flags, general_level_idc } = parseProfileTierLevel(bitstream, spsMaxSubLayersMinus1);
    readExpGolomb(bitstream);
    const chromaFormatIdc = readExpGolomb(bitstream);
    let separateColourPlaneFlag = 0;
    if (chromaFormatIdc === 3) {
      separateColourPlaneFlag = bitstream.readBits(1);
    }
    const picWidthInLumaSamples = readExpGolomb(bitstream);
    const picHeightInLumaSamples = readExpGolomb(bitstream);
    let displayWidth = picWidthInLumaSamples;
    let displayHeight = picHeightInLumaSamples;
    if (bitstream.readBits(1)) {
      const confWinLeftOffset = readExpGolomb(bitstream);
      const confWinRightOffset = readExpGolomb(bitstream);
      const confWinTopOffset = readExpGolomb(bitstream);
      const confWinBottomOffset = readExpGolomb(bitstream);
      let subWidthC = 1;
      let subHeightC = 1;
      const chromaArrayType = separateColourPlaneFlag === 0 ? chromaFormatIdc : 0;
      if (chromaArrayType === 1) {
        subWidthC = 2;
        subHeightC = 2;
      } else if (chromaArrayType === 2) {
        subWidthC = 2;
        subHeightC = 1;
      }
      displayWidth -= (confWinLeftOffset + confWinRightOffset) * subWidthC;
      displayHeight -= (confWinTopOffset + confWinBottomOffset) * subHeightC;
    }
    const bitDepthLumaMinus8 = readExpGolomb(bitstream);
    const bitDepthChromaMinus8 = readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    const spsSubLayerOrderingInfoPresentFlag = bitstream.readBits(1);
    const startI = spsSubLayerOrderingInfoPresentFlag ? 0 : spsMaxSubLayersMinus1;
    let spsMaxNumReorderPics = 0;
    for (let i = startI;i <= spsMaxSubLayersMinus1; i++) {
      readExpGolomb(bitstream);
      spsMaxNumReorderPics = readExpGolomb(bitstream);
      readExpGolomb(bitstream);
    }
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    if (bitstream.readBits(1)) {
      if (bitstream.readBits(1)) {
        skipScalingListData(bitstream);
      }
    }
    bitstream.skipBits(1);
    bitstream.skipBits(1);
    if (bitstream.readBits(1)) {
      bitstream.skipBits(4);
      bitstream.skipBits(4);
      readExpGolomb(bitstream);
      readExpGolomb(bitstream);
      bitstream.skipBits(1);
    }
    const numShortTermRefPicSets = readExpGolomb(bitstream);
    skipAllStRefPicSets(bitstream, numShortTermRefPicSets);
    if (bitstream.readBits(1)) {
      const numLongTermRefPicsSps = readExpGolomb(bitstream);
      for (let i = 0;i < numLongTermRefPicsSps; i++) {
        readExpGolomb(bitstream);
        bitstream.skipBits(1);
      }
    }
    bitstream.skipBits(1);
    bitstream.skipBits(1);
    let colourPrimaries = 2;
    let transferCharacteristics = 2;
    let matrixCoefficients = 2;
    let fullRangeFlag = 0;
    let minSpatialSegmentationIdc = 0;
    if (bitstream.readBits(1)) {
      const vui = parseHevcVui(bitstream, spsMaxSubLayersMinus1);
      colourPrimaries = vui.colourPrimaries;
      transferCharacteristics = vui.transferCharacteristics;
      matrixCoefficients = vui.matrixCoefficients;
      fullRangeFlag = vui.fullRangeFlag;
      minSpatialSegmentationIdc = vui.minSpatialSegmentationIdc;
    }
    return {
      displayWidth,
      displayHeight,
      colourPrimaries,
      transferCharacteristics,
      matrixCoefficients,
      fullRangeFlag,
      maxDecFrameBuffering: spsMaxNumReorderPics + 1,
      spsMaxSubLayersMinus1,
      spsTemporalIdNestingFlag,
      generalProfileSpace: general_profile_space,
      generalTierFlag: general_tier_flag,
      generalProfileIdc: general_profile_idc,
      generalProfileCompatibilityFlags: general_profile_compatibility_flags,
      generalConstraintIndicatorFlags: general_constraint_indicator_flags,
      generalLevelIdc: general_level_idc,
      chromaFormatIdc,
      bitDepthLumaMinus8,
      bitDepthChromaMinus8,
      minSpatialSegmentationIdc
    };
  } catch (error) {
    console.error("Error parsing HEVC SPS:", error);
    return null;
  }
};
var extractHevcDecoderConfigurationRecord = (packetData) => {
  try {
    const vpsUnits = [];
    const spsUnits = [];
    const ppsUnits = [];
    const seiUnits = [];
    for (const loc of iterateHevcNalUnitsAnnexB(packetData)) {
      const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
      const type = extractNalUnitTypeForHevc(nalUnit[0]);
      if (type === HevcNalUnitType.VPS_NUT) {
        vpsUnits.push(nalUnit);
      } else if (type === HevcNalUnitType.SPS_NUT) {
        spsUnits.push(nalUnit);
      } else if (type === HevcNalUnitType.PPS_NUT) {
        ppsUnits.push(nalUnit);
      } else if (type === HevcNalUnitType.PREFIX_SEI_NUT || type === HevcNalUnitType.SUFFIX_SEI_NUT) {
        seiUnits.push(nalUnit);
      }
    }
    if (spsUnits.length === 0 || ppsUnits.length === 0)
      return null;
    const spsInfo = parseHevcSps(spsUnits[0]);
    if (!spsInfo)
      return null;
    let parallelismType = 0;
    if (ppsUnits.length > 0) {
      const pps = ppsUnits[0];
      const ppsBitstream = new Bitstream(removeEmulationPreventionBytes(pps));
      ppsBitstream.skipBits(16);
      readExpGolomb(ppsBitstream);
      readExpGolomb(ppsBitstream);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(3);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(1);
      readExpGolomb(ppsBitstream);
      readExpGolomb(ppsBitstream);
      readSignedExpGolomb(ppsBitstream);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(1);
      if (ppsBitstream.readBits(1)) {
        readExpGolomb(ppsBitstream);
      }
      readSignedExpGolomb(ppsBitstream);
      readSignedExpGolomb(ppsBitstream);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(1);
      ppsBitstream.skipBits(1);
      const tiles_enabled_flag = ppsBitstream.readBits(1);
      const entropy_coding_sync_enabled_flag = ppsBitstream.readBits(1);
      if (!tiles_enabled_flag && !entropy_coding_sync_enabled_flag)
        parallelismType = 0;
      else if (tiles_enabled_flag && !entropy_coding_sync_enabled_flag)
        parallelismType = 2;
      else if (!tiles_enabled_flag && entropy_coding_sync_enabled_flag)
        parallelismType = 3;
      else
        parallelismType = 0;
    }
    const arrays = [
      ...vpsUnits.length ? [
        {
          arrayCompleteness: 1,
          nalUnitType: HevcNalUnitType.VPS_NUT,
          nalUnits: vpsUnits
        }
      ] : [],
      ...spsUnits.length ? [
        {
          arrayCompleteness: 1,
          nalUnitType: HevcNalUnitType.SPS_NUT,
          nalUnits: spsUnits
        }
      ] : [],
      ...ppsUnits.length ? [
        {
          arrayCompleteness: 1,
          nalUnitType: HevcNalUnitType.PPS_NUT,
          nalUnits: ppsUnits
        }
      ] : [],
      ...seiUnits.length ? [
        {
          arrayCompleteness: 1,
          nalUnitType: extractNalUnitTypeForHevc(seiUnits[0][0]),
          nalUnits: seiUnits
        }
      ] : []
    ];
    const record = {
      configurationVersion: 1,
      generalProfileSpace: spsInfo.generalProfileSpace,
      generalTierFlag: spsInfo.generalTierFlag,
      generalProfileIdc: spsInfo.generalProfileIdc,
      generalProfileCompatibilityFlags: spsInfo.generalProfileCompatibilityFlags,
      generalConstraintIndicatorFlags: spsInfo.generalConstraintIndicatorFlags,
      generalLevelIdc: spsInfo.generalLevelIdc,
      minSpatialSegmentationIdc: spsInfo.minSpatialSegmentationIdc,
      parallelismType,
      chromaFormatIdc: spsInfo.chromaFormatIdc,
      bitDepthLumaMinus8: spsInfo.bitDepthLumaMinus8,
      bitDepthChromaMinus8: spsInfo.bitDepthChromaMinus8,
      avgFrameRate: 0,
      constantFrameRate: 0,
      numTemporalLayers: spsInfo.spsMaxSubLayersMinus1 + 1,
      temporalIdNested: spsInfo.spsTemporalIdNestingFlag,
      lengthSizeMinusOne: 3,
      arrays
    };
    return record;
  } catch (error) {
    console.error("Error building HEVC Decoder Configuration Record:", error);
    return null;
  }
};
var parseProfileTierLevel = (bitstream, maxNumSubLayersMinus1) => {
  const general_profile_space = bitstream.readBits(2);
  const general_tier_flag = bitstream.readBits(1);
  const general_profile_idc = bitstream.readBits(5);
  let general_profile_compatibility_flags = 0;
  for (let i = 0;i < 32; i++) {
    general_profile_compatibility_flags = general_profile_compatibility_flags << 1 | bitstream.readBits(1);
  }
  const general_constraint_indicator_flags = new Uint8Array(6);
  for (let i = 0;i < 6; i++) {
    general_constraint_indicator_flags[i] = bitstream.readBits(8);
  }
  const general_level_idc = bitstream.readBits(8);
  const sub_layer_profile_present_flag = [];
  const sub_layer_level_present_flag = [];
  for (let i = 0;i < maxNumSubLayersMinus1; i++) {
    sub_layer_profile_present_flag.push(bitstream.readBits(1));
    sub_layer_level_present_flag.push(bitstream.readBits(1));
  }
  if (maxNumSubLayersMinus1 > 0) {
    for (let i = maxNumSubLayersMinus1;i < 8; i++) {
      bitstream.skipBits(2);
    }
  }
  for (let i = 0;i < maxNumSubLayersMinus1; i++) {
    if (sub_layer_profile_present_flag[i])
      bitstream.skipBits(88);
    if (sub_layer_level_present_flag[i])
      bitstream.skipBits(8);
  }
  return {
    general_profile_space,
    general_tier_flag,
    general_profile_idc,
    general_profile_compatibility_flags,
    general_constraint_indicator_flags,
    general_level_idc
  };
};
var skipScalingListData = (bitstream) => {
  for (let sizeId = 0;sizeId < 4; sizeId++) {
    for (let matrixId = 0;matrixId < (sizeId === 3 ? 2 : 6); matrixId++) {
      const scaling_list_pred_mode_flag = bitstream.readBits(1);
      if (!scaling_list_pred_mode_flag) {
        readExpGolomb(bitstream);
      } else {
        const coefNum = Math.min(64, 1 << 4 + (sizeId << 1));
        if (sizeId > 1) {
          readSignedExpGolomb(bitstream);
        }
        for (let i = 0;i < coefNum; i++) {
          readSignedExpGolomb(bitstream);
        }
      }
    }
  }
};
var skipAllStRefPicSets = (bitstream, num_short_term_ref_pic_sets) => {
  const NumDeltaPocs = [];
  for (let stRpsIdx = 0;stRpsIdx < num_short_term_ref_pic_sets; stRpsIdx++) {
    NumDeltaPocs[stRpsIdx] = skipStRefPicSet(bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs);
  }
};
var skipStRefPicSet = (bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs) => {
  let NumDeltaPocsThis = 0;
  let inter_ref_pic_set_prediction_flag = 0;
  let RefRpsIdx = 0;
  if (stRpsIdx !== 0) {
    inter_ref_pic_set_prediction_flag = bitstream.readBits(1);
  }
  if (inter_ref_pic_set_prediction_flag) {
    if (stRpsIdx === num_short_term_ref_pic_sets) {
      const delta_idx_minus1 = readExpGolomb(bitstream);
      RefRpsIdx = stRpsIdx - (delta_idx_minus1 + 1);
    } else {
      RefRpsIdx = stRpsIdx - 1;
    }
    bitstream.readBits(1);
    readExpGolomb(bitstream);
    const numDelta = NumDeltaPocs[RefRpsIdx] ?? 0;
    for (let j = 0;j <= numDelta; j++) {
      const used_by_curr_pic_flag = bitstream.readBits(1);
      if (!used_by_curr_pic_flag) {
        bitstream.readBits(1);
      }
    }
    NumDeltaPocsThis = NumDeltaPocs[RefRpsIdx];
  } else {
    const num_negative_pics = readExpGolomb(bitstream);
    const num_positive_pics = readExpGolomb(bitstream);
    for (let i = 0;i < num_negative_pics; i++) {
      readExpGolomb(bitstream);
      bitstream.readBits(1);
    }
    for (let i = 0;i < num_positive_pics; i++) {
      readExpGolomb(bitstream);
      bitstream.readBits(1);
    }
    NumDeltaPocsThis = num_negative_pics + num_positive_pics;
  }
  return NumDeltaPocsThis;
};
var parseHevcVui = (bitstream, sps_max_sub_layers_minus1) => {
  let colourPrimaries = 2;
  let transferCharacteristics = 2;
  let matrixCoefficients = 2;
  let fullRangeFlag = 0;
  let minSpatialSegmentationIdc = 0;
  if (bitstream.readBits(1)) {
    const aspect_ratio_idc = bitstream.readBits(8);
    if (aspect_ratio_idc === 255) {
      bitstream.readBits(16);
      bitstream.readBits(16);
    }
  }
  if (bitstream.readBits(1)) {
    bitstream.readBits(1);
  }
  if (bitstream.readBits(1)) {
    bitstream.readBits(3);
    fullRangeFlag = bitstream.readBits(1);
    if (bitstream.readBits(1)) {
      colourPrimaries = bitstream.readBits(8);
      transferCharacteristics = bitstream.readBits(8);
      matrixCoefficients = bitstream.readBits(8);
    }
  }
  if (bitstream.readBits(1)) {
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
  }
  bitstream.readBits(1);
  bitstream.readBits(1);
  bitstream.readBits(1);
  if (bitstream.readBits(1)) {
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
  }
  if (bitstream.readBits(1)) {
    bitstream.readBits(32);
    bitstream.readBits(32);
    if (bitstream.readBits(1)) {
      readExpGolomb(bitstream);
    }
    if (bitstream.readBits(1)) {
      skipHevcHrdParameters(bitstream, true, sps_max_sub_layers_minus1);
    }
  }
  if (bitstream.readBits(1)) {
    bitstream.readBits(1);
    bitstream.readBits(1);
    bitstream.readBits(1);
    minSpatialSegmentationIdc = readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
  }
  return {
    colourPrimaries,
    transferCharacteristics,
    matrixCoefficients,
    fullRangeFlag,
    minSpatialSegmentationIdc
  };
};
var skipHevcHrdParameters = (bitstream, commonInfPresentFlag, maxNumSubLayersMinus1) => {
  let nal_hrd_parameters_present_flag = false;
  let vcl_hrd_parameters_present_flag = false;
  let sub_pic_hrd_params_present_flag = false;
  if (commonInfPresentFlag) {
    nal_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
    vcl_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
    if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
      sub_pic_hrd_params_present_flag = bitstream.readBits(1) === 1;
      if (sub_pic_hrd_params_present_flag) {
        bitstream.readBits(8);
        bitstream.readBits(5);
        bitstream.readBits(1);
        bitstream.readBits(5);
      }
      bitstream.readBits(4);
      bitstream.readBits(4);
      if (sub_pic_hrd_params_present_flag) {
        bitstream.readBits(4);
      }
      bitstream.readBits(5);
      bitstream.readBits(5);
      bitstream.readBits(5);
    }
  }
  for (let i = 0;i <= maxNumSubLayersMinus1; i++) {
    const fixed_pic_rate_general_flag = bitstream.readBits(1) === 1;
    let fixed_pic_rate_within_cvs_flag = true;
    if (!fixed_pic_rate_general_flag) {
      fixed_pic_rate_within_cvs_flag = bitstream.readBits(1) === 1;
    }
    let low_delay_hrd_flag = false;
    if (fixed_pic_rate_within_cvs_flag) {
      readExpGolomb(bitstream);
    } else {
      low_delay_hrd_flag = bitstream.readBits(1) === 1;
    }
    let CpbCnt = 1;
    if (!low_delay_hrd_flag) {
      const cpb_cnt_minus1 = readExpGolomb(bitstream);
      CpbCnt = cpb_cnt_minus1 + 1;
    }
    if (nal_hrd_parameters_present_flag) {
      skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
    }
    if (vcl_hrd_parameters_present_flag) {
      skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
    }
  }
};
var skipSubLayerHrdParameters = (bitstream, CpbCnt, sub_pic_hrd_params_present_flag) => {
  for (let i = 0;i < CpbCnt; i++) {
    readExpGolomb(bitstream);
    readExpGolomb(bitstream);
    if (sub_pic_hrd_params_present_flag) {
      readExpGolomb(bitstream);
      readExpGolomb(bitstream);
    }
    bitstream.readBits(1);
  }
};
var serializeHevcDecoderConfigurationRecord = (record) => {
  const bytes = [];
  bytes.push(record.configurationVersion);
  bytes.push((record.generalProfileSpace & 3) << 6 | (record.generalTierFlag & 1) << 5 | record.generalProfileIdc & 31);
  bytes.push(record.generalProfileCompatibilityFlags >>> 24 & 255);
  bytes.push(record.generalProfileCompatibilityFlags >>> 16 & 255);
  bytes.push(record.generalProfileCompatibilityFlags >>> 8 & 255);
  bytes.push(record.generalProfileCompatibilityFlags & 255);
  bytes.push(...record.generalConstraintIndicatorFlags);
  bytes.push(record.generalLevelIdc & 255);
  bytes.push(240 | record.minSpatialSegmentationIdc >> 8 & 15);
  bytes.push(record.minSpatialSegmentationIdc & 255);
  bytes.push(252 | record.parallelismType & 3);
  bytes.push(252 | record.chromaFormatIdc & 3);
  bytes.push(248 | record.bitDepthLumaMinus8 & 7);
  bytes.push(248 | record.bitDepthChromaMinus8 & 7);
  bytes.push(record.avgFrameRate >> 8 & 255);
  bytes.push(record.avgFrameRate & 255);
  bytes.push((record.constantFrameRate & 3) << 6 | (record.numTemporalLayers & 7) << 3 | (record.temporalIdNested & 1) << 2 | record.lengthSizeMinusOne & 3);
  bytes.push(record.arrays.length & 255);
  for (const arr of record.arrays) {
    bytes.push((arr.arrayCompleteness & 1) << 7 | 0 << 6 | arr.nalUnitType & 63);
    bytes.push(arr.nalUnits.length >> 8 & 255);
    bytes.push(arr.nalUnits.length & 255);
    for (const nal of arr.nalUnits) {
      bytes.push(nal.length >> 8 & 255);
      bytes.push(nal.length & 255);
      for (let i = 0;i < nal.length; i++) {
        bytes.push(nal[i]);
      }
    }
  }
  return new Uint8Array(bytes);
};
var parseOpusIdentificationHeader = (bytes) => {
  const view = toDataView(bytes);
  const outputChannelCount = view.getUint8(9);
  const preSkip = view.getUint16(10, true);
  const inputSampleRate = view.getUint32(12, true);
  const outputGain = view.getInt16(16, true);
  const channelMappingFamily = view.getUint8(18);
  let channelMappingTable = null;
  if (channelMappingFamily) {
    channelMappingTable = bytes.subarray(19, 19 + 2 + outputChannelCount);
  }
  return {
    outputChannelCount,
    preSkip,
    inputSampleRate,
    outputGain,
    channelMappingFamily,
    channelMappingTable
  };
};
var FlacBlockType;
(function(FlacBlockType2) {
  FlacBlockType2[FlacBlockType2["STREAMINFO"] = 0] = "STREAMINFO";
  FlacBlockType2[FlacBlockType2["VORBIS_COMMENT"] = 4] = "VORBIS_COMMENT";
  FlacBlockType2[FlacBlockType2["PICTURE"] = 6] = "PICTURE";
})(FlacBlockType || (FlacBlockType = {}));

// ../node_modules/mediabunny/dist/modules/src/custom-coder.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var customVideoEncoders = [];
var customAudioEncoders = [];

// ../node_modules/mediabunny/dist/modules/src/packet.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var PLACEHOLDER_DATA = /* @__PURE__ */ new Uint8Array(0);

class EncodedPacket {
  constructor(data, type, timestamp, duration, sequenceNumber = -1, byteLength, sideData) {
    this.data = data;
    this.type = type;
    this.timestamp = timestamp;
    this.duration = duration;
    this.sequenceNumber = sequenceNumber;
    if (data === PLACEHOLDER_DATA && byteLength === undefined) {
      throw new Error("Internal error: byteLength must be explicitly provided when constructing metadata-only packets.");
    }
    if (byteLength === undefined) {
      byteLength = data.byteLength;
    }
    if (!(data instanceof Uint8Array)) {
      throw new TypeError("data must be a Uint8Array.");
    }
    if (type !== "key" && type !== "delta") {
      throw new TypeError('type must be either "key" or "delta".');
    }
    if (!Number.isFinite(timestamp)) {
      throw new TypeError("timestamp must be a number.");
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("duration must be a non-negative number.");
    }
    if (!Number.isFinite(sequenceNumber)) {
      throw new TypeError("sequenceNumber must be a number.");
    }
    if (!Number.isInteger(byteLength) || byteLength < 0) {
      throw new TypeError("byteLength must be a non-negative integer.");
    }
    if (sideData !== undefined && (typeof sideData !== "object" || !sideData)) {
      throw new TypeError("sideData, when provided, must be an object.");
    }
    if (sideData?.alpha !== undefined && !(sideData.alpha instanceof Uint8Array)) {
      throw new TypeError("sideData.alpha, when provided, must be a Uint8Array.");
    }
    if (sideData?.alphaByteLength !== undefined && (!Number.isInteger(sideData.alphaByteLength) || sideData.alphaByteLength < 0)) {
      throw new TypeError("sideData.alphaByteLength, when provided, must be a non-negative integer.");
    }
    this.byteLength = byteLength;
    this.sideData = sideData ?? {};
    if (this.sideData.alpha && this.sideData.alphaByteLength === undefined) {
      this.sideData.alphaByteLength = this.sideData.alpha.byteLength;
    }
  }
  get isMetadataOnly() {
    return this.data === PLACEHOLDER_DATA;
  }
  get microsecondTimestamp() {
    return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
  }
  get microsecondDuration() {
    return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
  }
  toEncodedVideoChunk() {
    if (this.isMetadataOnly) {
      throw new TypeError("Metadata-only packets cannot be converted to a video chunk.");
    }
    if (typeof EncodedVideoChunk === "undefined") {
      throw new Error("Your browser does not support EncodedVideoChunk.");
    }
    return new EncodedVideoChunk({
      data: this.data,
      type: this.type,
      timestamp: this.microsecondTimestamp,
      duration: this.microsecondDuration
    });
  }
  alphaToEncodedVideoChunk(type = this.type) {
    if (!this.sideData.alpha) {
      throw new TypeError("This packet does not contain alpha side data.");
    }
    if (this.isMetadataOnly) {
      throw new TypeError("Metadata-only packets cannot be converted to a video chunk.");
    }
    if (typeof EncodedVideoChunk === "undefined") {
      throw new Error("Your browser does not support EncodedVideoChunk.");
    }
    return new EncodedVideoChunk({
      data: this.sideData.alpha,
      type,
      timestamp: this.microsecondTimestamp,
      duration: this.microsecondDuration
    });
  }
  toEncodedAudioChunk() {
    if (this.isMetadataOnly) {
      throw new TypeError("Metadata-only packets cannot be converted to an audio chunk.");
    }
    if (typeof EncodedAudioChunk === "undefined") {
      throw new Error("Your browser does not support EncodedAudioChunk.");
    }
    return new EncodedAudioChunk({
      data: this.data,
      type: this.type,
      timestamp: this.microsecondTimestamp,
      duration: this.microsecondDuration
    });
  }
  static fromEncodedChunk(chunk, sideData) {
    if (!(chunk instanceof EncodedVideoChunk || chunk instanceof EncodedAudioChunk)) {
      throw new TypeError("chunk must be an EncodedVideoChunk or EncodedAudioChunk.");
    }
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    return new EncodedPacket(data, chunk.type, chunk.timestamp / 1e6, (chunk.duration ?? 0) / 1e6, undefined, undefined, sideData);
  }
  clone(options) {
    if (options !== undefined && (typeof options !== "object" || options === null)) {
      throw new TypeError("options, when provided, must be an object.");
    }
    if (options?.data !== undefined && !(options.data instanceof Uint8Array)) {
      throw new TypeError("options.data, when provided, must be a Uint8Array.");
    }
    if (options?.type !== undefined && options.type !== "key" && options.type !== "delta") {
      throw new TypeError('options.type, when provided, must be either "key" or "delta".');
    }
    if (options?.timestamp !== undefined && !Number.isFinite(options.timestamp)) {
      throw new TypeError("options.timestamp, when provided, must be a number.");
    }
    if (options?.duration !== undefined && !Number.isFinite(options.duration)) {
      throw new TypeError("options.duration, when provided, must be a number.");
    }
    if (options?.sequenceNumber !== undefined && !Number.isFinite(options.sequenceNumber)) {
      throw new TypeError("options.sequenceNumber, when provided, must be a number.");
    }
    if (options?.sideData !== undefined && (typeof options.sideData !== "object" || options.sideData === null)) {
      throw new TypeError("options.sideData, when provided, must be an object.");
    }
    return new EncodedPacket(options?.data ?? this.data, options?.type ?? this.type, options?.timestamp ?? this.timestamp, options?.duration ?? this.duration, options?.sequenceNumber ?? this.sequenceNumber, this.byteLength, options?.sideData ?? this.sideData);
  }
}

// ../node_modules/mediabunny/dist/modules/src/pcm.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var toUlaw = (s16) => {
  const MULAW_MAX = 8191;
  const MULAW_BIAS = 33;
  let number = s16;
  let mask = 4096;
  let sign = 0;
  let position = 12;
  let lsb = 0;
  if (number < 0) {
    number = -number;
    sign = 128;
  }
  number += MULAW_BIAS;
  if (number > MULAW_MAX) {
    number = MULAW_MAX;
  }
  while ((number & mask) !== mask && position >= 5) {
    mask >>= 1;
    position--;
  }
  lsb = number >> position - 4 & 15;
  return ~(sign | position - 5 << 4 | lsb) & 255;
};
var toAlaw = (s16) => {
  const ALAW_MAX = 4095;
  let mask = 2048;
  let sign = 0;
  let position = 11;
  let lsb = 0;
  let number = s16;
  if (number < 0) {
    number = -number;
    sign = 128;
  }
  if (number > ALAW_MAX) {
    number = ALAW_MAX;
  }
  while ((number & mask) !== mask && position >= 5) {
    mask >>= 1;
    position--;
  }
  lsb = number >> (position === 4 ? 1 : position - 4) & 15;
  return (sign | position - 4 << 4 | lsb) ^ 85;
};

// ../node_modules/mediabunny/dist/modules/src/sample.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
polyfillSymbolDispose();
var lastVideoGcErrorLog = -Infinity;
var lastAudioGcErrorLog = -Infinity;
var finalizationRegistry = null;
if (typeof FinalizationRegistry !== "undefined") {
  finalizationRegistry = new FinalizationRegistry((value) => {
    const now = Date.now();
    if (value.type === "video") {
      if (now - lastVideoGcErrorLog >= 1000) {
        console.error(`A VideoSample was garbage collected without first being closed. For proper resource management,` + ` make sure to call close() on all your VideoSamples as soon as you're done using them.`);
        lastVideoGcErrorLog = now;
      }
      if (typeof VideoFrame !== "undefined" && value.data instanceof VideoFrame) {
        value.data.close();
      }
    } else {
      if (now - lastAudioGcErrorLog >= 1000) {
        console.error(`An AudioSample was garbage collected without first being closed. For proper resource management,` + ` make sure to call close() on all your AudioSamples as soon as you're done using them.`);
        lastAudioGcErrorLog = now;
      }
      if (typeof AudioData !== "undefined" && value.data instanceof AudioData) {
        value.data.close();
      }
    }
  });
}
var VIDEO_SAMPLE_PIXEL_FORMATS = [
  "I420",
  "I420P10",
  "I420P12",
  "I420A",
  "I420AP10",
  "I420AP12",
  "I422",
  "I422P10",
  "I422P12",
  "I422A",
  "I422AP10",
  "I422AP12",
  "I444",
  "I444P10",
  "I444P12",
  "I444A",
  "I444AP10",
  "I444AP12",
  "NV12",
  "RGBA",
  "RGBX",
  "BGRA",
  "BGRX"
];
var VIDEO_SAMPLE_PIXEL_FORMATS_SET = new Set(VIDEO_SAMPLE_PIXEL_FORMATS);

class VideoSample {
  get displayWidth() {
    return this.rotation % 180 === 0 ? this.codedWidth : this.codedHeight;
  }
  get displayHeight() {
    return this.rotation % 180 === 0 ? this.codedHeight : this.codedWidth;
  }
  get microsecondTimestamp() {
    return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
  }
  get microsecondDuration() {
    return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
  }
  get hasAlpha() {
    return this.format && this.format.includes("A");
  }
  constructor(data, init) {
    this._closed = false;
    if (data instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && data instanceof SharedArrayBuffer || ArrayBuffer.isView(data)) {
      if (!init || typeof init !== "object") {
        throw new TypeError("init must be an object.");
      }
      if (init.format === undefined || !VIDEO_SAMPLE_PIXEL_FORMATS_SET.has(init.format)) {
        throw new TypeError("init.format must be one of: " + VIDEO_SAMPLE_PIXEL_FORMATS.join(", "));
      }
      if (!Number.isInteger(init.codedWidth) || init.codedWidth <= 0) {
        throw new TypeError("init.codedWidth must be a positive integer.");
      }
      if (!Number.isInteger(init.codedHeight) || init.codedHeight <= 0) {
        throw new TypeError("init.codedHeight must be a positive integer.");
      }
      if (init.rotation !== undefined && ![0, 90, 180, 270].includes(init.rotation)) {
        throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
      }
      if (!Number.isFinite(init.timestamp)) {
        throw new TypeError("init.timestamp must be a number.");
      }
      if (init.duration !== undefined && (!Number.isFinite(init.duration) || init.duration < 0)) {
        throw new TypeError("init.duration, when provided, must be a non-negative number.");
      }
      this._data = toUint8Array(data).slice();
      this._layout = init.layout ?? createDefaultPlaneLayout(init.format, init.codedWidth, init.codedHeight);
      this.format = init.format;
      this.codedWidth = init.codedWidth;
      this.codedHeight = init.codedHeight;
      this.rotation = init.rotation ?? 0;
      this.timestamp = init.timestamp;
      this.duration = init.duration ?? 0;
      this.colorSpace = new VideoSampleColorSpace(init.colorSpace);
    } else if (typeof VideoFrame !== "undefined" && data instanceof VideoFrame) {
      if (init?.rotation !== undefined && ![0, 90, 180, 270].includes(init.rotation)) {
        throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
      }
      if (init?.timestamp !== undefined && !Number.isFinite(init?.timestamp)) {
        throw new TypeError("init.timestamp, when provided, must be a number.");
      }
      if (init?.duration !== undefined && (!Number.isFinite(init.duration) || init.duration < 0)) {
        throw new TypeError("init.duration, when provided, must be a non-negative number.");
      }
      this._data = data;
      this._layout = null;
      this.format = data.format;
      this.codedWidth = data.displayWidth;
      this.codedHeight = data.displayHeight;
      this.rotation = init?.rotation ?? 0;
      this.timestamp = init?.timestamp ?? data.timestamp / 1e6;
      this.duration = init?.duration ?? (data.duration ?? 0) / 1e6;
      this.colorSpace = new VideoSampleColorSpace(data.colorSpace);
    } else if (typeof HTMLImageElement !== "undefined" && data instanceof HTMLImageElement || typeof SVGImageElement !== "undefined" && data instanceof SVGImageElement || typeof ImageBitmap !== "undefined" && data instanceof ImageBitmap || typeof HTMLVideoElement !== "undefined" && data instanceof HTMLVideoElement || typeof HTMLCanvasElement !== "undefined" && data instanceof HTMLCanvasElement || typeof OffscreenCanvas !== "undefined" && data instanceof OffscreenCanvas) {
      if (!init || typeof init !== "object") {
        throw new TypeError("init must be an object.");
      }
      if (init.rotation !== undefined && ![0, 90, 180, 270].includes(init.rotation)) {
        throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
      }
      if (!Number.isFinite(init.timestamp)) {
        throw new TypeError("init.timestamp must be a number.");
      }
      if (init.duration !== undefined && (!Number.isFinite(init.duration) || init.duration < 0)) {
        throw new TypeError("init.duration, when provided, must be a non-negative number.");
      }
      if (typeof VideoFrame !== "undefined") {
        return new VideoSample(new VideoFrame(data, {
          timestamp: Math.trunc(init.timestamp * SECOND_TO_MICROSECOND_FACTOR),
          duration: Math.trunc((init.duration ?? 0) * SECOND_TO_MICROSECOND_FACTOR) || undefined
        }), init);
      }
      let width = 0;
      let height = 0;
      if ("naturalWidth" in data) {
        width = data.naturalWidth;
        height = data.naturalHeight;
      } else if ("videoWidth" in data) {
        width = data.videoWidth;
        height = data.videoHeight;
      } else if ("width" in data) {
        width = Number(data.width);
        height = Number(data.height);
      }
      if (!width || !height) {
        throw new TypeError("Could not determine dimensions.");
      }
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext("2d", {
        alpha: isFirefox(),
        willReadFrequently: true
      });
      assert(context);
      context.drawImage(data, 0, 0);
      this._data = canvas;
      this._layout = null;
      this.format = "RGBX";
      this.codedWidth = width;
      this.codedHeight = height;
      this.rotation = init.rotation ?? 0;
      this.timestamp = init.timestamp;
      this.duration = init.duration ?? 0;
      this.colorSpace = new VideoSampleColorSpace({
        matrix: "rgb",
        primaries: "bt709",
        transfer: "iec61966-2-1",
        fullRange: true
      });
    } else {
      throw new TypeError("Invalid data type: Must be a BufferSource or CanvasImageSource.");
    }
    finalizationRegistry?.register(this, { type: "video", data: this._data }, this);
  }
  clone() {
    if (this._closed) {
      throw new Error("VideoSample is closed.");
    }
    assert(this._data !== null);
    if (isVideoFrame(this._data)) {
      return new VideoSample(this._data.clone(), {
        timestamp: this.timestamp,
        duration: this.duration,
        rotation: this.rotation
      });
    } else if (this._data instanceof Uint8Array) {
      assert(this._layout);
      return new VideoSample(this._data, {
        format: this.format,
        layout: this._layout,
        codedWidth: this.codedWidth,
        codedHeight: this.codedHeight,
        timestamp: this.timestamp,
        duration: this.duration,
        colorSpace: this.colorSpace,
        rotation: this.rotation
      });
    } else {
      return new VideoSample(this._data, {
        format: this.format,
        codedWidth: this.codedWidth,
        codedHeight: this.codedHeight,
        timestamp: this.timestamp,
        duration: this.duration,
        colorSpace: this.colorSpace,
        rotation: this.rotation
      });
    }
  }
  close() {
    if (this._closed) {
      return;
    }
    finalizationRegistry?.unregister(this);
    if (isVideoFrame(this._data)) {
      this._data.close();
    } else {
      this._data = null;
    }
    this._closed = true;
  }
  allocationSize(options = {}) {
    validateVideoFrameCopyToOptions(options);
    if (this._closed) {
      throw new Error("VideoSample is closed.");
    }
    if (this.format === null) {
      throw new Error("Cannot get allocation size when format is null. Sorry!");
    }
    assert(this._data !== null);
    if (!isVideoFrame(this._data)) {
      if (options.colorSpace || options.format && options.format !== this.format || options.layout || options.rect) {
        const videoFrame = this.toVideoFrame();
        const size = videoFrame.allocationSize(options);
        videoFrame.close();
        return size;
      }
    }
    if (isVideoFrame(this._data)) {
      return this._data.allocationSize(options);
    } else if (this._data instanceof Uint8Array) {
      return this._data.byteLength;
    } else {
      return this.codedWidth * this.codedHeight * 4;
    }
  }
  async copyTo(destination, options = {}) {
    if (!isAllowSharedBufferSource(destination)) {
      throw new TypeError("destination must be an ArrayBuffer or an ArrayBuffer view.");
    }
    validateVideoFrameCopyToOptions(options);
    if (this._closed) {
      throw new Error("VideoSample is closed.");
    }
    if (this.format === null) {
      throw new Error("Cannot copy video sample data when format is null. Sorry!");
    }
    assert(this._data !== null);
    if (!isVideoFrame(this._data)) {
      if (options.colorSpace || options.format && options.format !== this.format || options.layout || options.rect) {
        const videoFrame = this.toVideoFrame();
        const layout = await videoFrame.copyTo(destination, options);
        videoFrame.close();
        return layout;
      }
    }
    if (isVideoFrame(this._data)) {
      return this._data.copyTo(destination, options);
    } else if (this._data instanceof Uint8Array) {
      assert(this._layout);
      const dest = toUint8Array(destination);
      dest.set(this._data);
      return this._layout;
    } else {
      const canvas = this._data;
      const context = canvas.getContext("2d");
      assert(context);
      const imageData = context.getImageData(0, 0, this.codedWidth, this.codedHeight);
      const dest = toUint8Array(destination);
      dest.set(imageData.data);
      return [{
        offset: 0,
        stride: 4 * this.codedWidth
      }];
    }
  }
  toVideoFrame() {
    if (this._closed) {
      throw new Error("VideoSample is closed.");
    }
    assert(this._data !== null);
    if (isVideoFrame(this._data)) {
      return new VideoFrame(this._data, {
        timestamp: this.microsecondTimestamp,
        duration: this.microsecondDuration || undefined
      });
    } else if (this._data instanceof Uint8Array) {
      return new VideoFrame(this._data, {
        format: this.format,
        codedWidth: this.codedWidth,
        codedHeight: this.codedHeight,
        timestamp: this.microsecondTimestamp,
        duration: this.microsecondDuration || undefined,
        colorSpace: this.colorSpace
      });
    } else {
      return new VideoFrame(this._data, {
        timestamp: this.microsecondTimestamp,
        duration: this.microsecondDuration || undefined
      });
    }
  }
  draw(context, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    let sx = 0;
    let sy = 0;
    let sWidth = this.displayWidth;
    let sHeight = this.displayHeight;
    let dx = 0;
    let dy = 0;
    let dWidth = this.displayWidth;
    let dHeight = this.displayHeight;
    if (arg5 !== undefined) {
      sx = arg1;
      sy = arg2;
      sWidth = arg3;
      sHeight = arg4;
      dx = arg5;
      dy = arg6;
      if (arg7 !== undefined) {
        dWidth = arg7;
        dHeight = arg8;
      } else {
        dWidth = sWidth;
        dHeight = sHeight;
      }
    } else {
      dx = arg1;
      dy = arg2;
      if (arg3 !== undefined) {
        dWidth = arg3;
        dHeight = arg4;
      }
    }
    if (!(typeof CanvasRenderingContext2D !== "undefined" && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== "undefined" && context instanceof OffscreenCanvasRenderingContext2D)) {
      throw new TypeError("context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.");
    }
    if (!Number.isFinite(sx)) {
      throw new TypeError("sx must be a number.");
    }
    if (!Number.isFinite(sy)) {
      throw new TypeError("sy must be a number.");
    }
    if (!Number.isFinite(sWidth) || sWidth < 0) {
      throw new TypeError("sWidth must be a non-negative number.");
    }
    if (!Number.isFinite(sHeight) || sHeight < 0) {
      throw new TypeError("sHeight must be a non-negative number.");
    }
    if (!Number.isFinite(dx)) {
      throw new TypeError("dx must be a number.");
    }
    if (!Number.isFinite(dy)) {
      throw new TypeError("dy must be a number.");
    }
    if (!Number.isFinite(dWidth) || dWidth < 0) {
      throw new TypeError("dWidth must be a non-negative number.");
    }
    if (!Number.isFinite(dHeight) || dHeight < 0) {
      throw new TypeError("dHeight must be a non-negative number.");
    }
    if (this._closed) {
      throw new Error("VideoSample is closed.");
    }
    ({ sx, sy, sWidth, sHeight } = this._rotateSourceRegion(sx, sy, sWidth, sHeight, this.rotation));
    const source = this.toCanvasImageSource();
    context.save();
    const centerX = dx + dWidth / 2;
    const centerY = dy + dHeight / 2;
    context.translate(centerX, centerY);
    context.rotate(this.rotation * Math.PI / 180);
    const aspectRatioChange = this.rotation % 180 === 0 ? 1 : dWidth / dHeight;
    context.scale(1 / aspectRatioChange, aspectRatioChange);
    context.drawImage(source, sx, sy, sWidth, sHeight, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
    context.restore();
  }
  drawWithFit(context, options) {
    if (!(typeof CanvasRenderingContext2D !== "undefined" && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== "undefined" && context instanceof OffscreenCanvasRenderingContext2D)) {
      throw new TypeError("context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.");
    }
    if (!options || typeof options !== "object") {
      throw new TypeError("options must be an object.");
    }
    if (!["fill", "contain", "cover"].includes(options.fit)) {
      throw new TypeError("options.fit must be 'fill', 'contain', or 'cover'.");
    }
    if (options.rotation !== undefined && ![0, 90, 180, 270].includes(options.rotation)) {
      throw new TypeError("options.rotation, when provided, must be 0, 90, 180, or 270.");
    }
    if (options.crop !== undefined) {
      validateCropRectangle(options.crop, "options.");
    }
    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;
    const rotation = options.rotation ?? this.rotation;
    const [rotatedWidth, rotatedHeight] = rotation % 180 === 0 ? [this.codedWidth, this.codedHeight] : [this.codedHeight, this.codedWidth];
    if (options.crop) {
      clampCropRectangle(options.crop, rotatedWidth, rotatedHeight);
    }
    let dx;
    let dy;
    let newWidth;
    let newHeight;
    const { sx, sy, sWidth, sHeight } = this._rotateSourceRegion(options.crop?.left ?? 0, options.crop?.top ?? 0, options.crop?.width ?? rotatedWidth, options.crop?.height ?? rotatedHeight, rotation);
    if (options.fit === "fill") {
      dx = 0;
      dy = 0;
      newWidth = canvasWidth;
      newHeight = canvasHeight;
    } else {
      const [sampleWidth, sampleHeight] = options.crop ? [options.crop.width, options.crop.height] : [rotatedWidth, rotatedHeight];
      const scale = options.fit === "contain" ? Math.min(canvasWidth / sampleWidth, canvasHeight / sampleHeight) : Math.max(canvasWidth / sampleWidth, canvasHeight / sampleHeight);
      newWidth = sampleWidth * scale;
      newHeight = sampleHeight * scale;
      dx = (canvasWidth - newWidth) / 2;
      dy = (canvasHeight - newHeight) / 2;
    }
    context.save();
    const aspectRatioChange = rotation % 180 === 0 ? 1 : newWidth / newHeight;
    context.translate(canvasWidth / 2, canvasHeight / 2);
    context.rotate(rotation * Math.PI / 180);
    context.scale(1 / aspectRatioChange, aspectRatioChange);
    context.translate(-canvasWidth / 2, -canvasHeight / 2);
    context.drawImage(this.toCanvasImageSource(), sx, sy, sWidth, sHeight, dx, dy, newWidth, newHeight);
    context.restore();
  }
  _rotateSourceRegion(sx, sy, sWidth, sHeight, rotation) {
    if (rotation === 90) {
      [sx, sy, sWidth, sHeight] = [
        sy,
        this.codedHeight - sx - sWidth,
        sHeight,
        sWidth
      ];
    } else if (rotation === 180) {
      [sx, sy] = [
        this.codedWidth - sx - sWidth,
        this.codedHeight - sy - sHeight
      ];
    } else if (rotation === 270) {
      [sx, sy, sWidth, sHeight] = [
        this.codedWidth - sy - sHeight,
        sx,
        sHeight,
        sWidth
      ];
    }
    return { sx, sy, sWidth, sHeight };
  }
  toCanvasImageSource() {
    if (this._closed) {
      throw new Error("VideoSample is closed.");
    }
    assert(this._data !== null);
    if (this._data instanceof Uint8Array) {
      const videoFrame = this.toVideoFrame();
      queueMicrotask(() => videoFrame.close());
      return videoFrame;
    } else {
      return this._data;
    }
  }
  setRotation(newRotation) {
    if (![0, 90, 180, 270].includes(newRotation)) {
      throw new TypeError("newRotation must be 0, 90, 180, or 270.");
    }
    this.rotation = newRotation;
  }
  setTimestamp(newTimestamp) {
    if (!Number.isFinite(newTimestamp)) {
      throw new TypeError("newTimestamp must be a number.");
    }
    this.timestamp = newTimestamp;
  }
  setDuration(newDuration) {
    if (!Number.isFinite(newDuration) || newDuration < 0) {
      throw new TypeError("newDuration must be a non-negative number.");
    }
    this.duration = newDuration;
  }
  [Symbol.dispose]() {
    this.close();
  }
}

class VideoSampleColorSpace {
  constructor(init) {
    this.primaries = init?.primaries ?? null;
    this.transfer = init?.transfer ?? null;
    this.matrix = init?.matrix ?? null;
    this.fullRange = init?.fullRange ?? null;
  }
  toJSON() {
    return {
      primaries: this.primaries,
      transfer: this.transfer,
      matrix: this.matrix,
      fullRange: this.fullRange
    };
  }
}
var isVideoFrame = (x) => {
  return typeof VideoFrame !== "undefined" && x instanceof VideoFrame;
};
var clampCropRectangle = (crop, outerWidth, outerHeight) => {
  crop.left = Math.min(crop.left, outerWidth);
  crop.top = Math.min(crop.top, outerHeight);
  crop.width = Math.min(crop.width, outerWidth - crop.left);
  crop.height = Math.min(crop.height, outerHeight - crop.top);
  assert(crop.width >= 0);
  assert(crop.height >= 0);
};
var validateCropRectangle = (crop, prefix) => {
  if (!crop || typeof crop !== "object") {
    throw new TypeError(prefix + "crop, when provided, must be an object.");
  }
  if (!Number.isInteger(crop.left) || crop.left < 0) {
    throw new TypeError(prefix + "crop.left must be a non-negative integer.");
  }
  if (!Number.isInteger(crop.top) || crop.top < 0) {
    throw new TypeError(prefix + "crop.top must be a non-negative integer.");
  }
  if (!Number.isInteger(crop.width) || crop.width < 0) {
    throw new TypeError(prefix + "crop.width must be a non-negative integer.");
  }
  if (!Number.isInteger(crop.height) || crop.height < 0) {
    throw new TypeError(prefix + "crop.height must be a non-negative integer.");
  }
};
var validateVideoFrameCopyToOptions = (options) => {
  if (!options || typeof options !== "object") {
    throw new TypeError("options must be an object.");
  }
  if (options.colorSpace !== undefined && !["display-p3", "srgb"].includes(options.colorSpace)) {
    throw new TypeError("options.colorSpace, when provided, must be 'display-p3' or 'srgb'.");
  }
  if (options.format !== undefined && typeof options.format !== "string") {
    throw new TypeError("options.format, when provided, must be a string.");
  }
  if (options.layout !== undefined) {
    if (!Array.isArray(options.layout)) {
      throw new TypeError("options.layout, when provided, must be an array.");
    }
    for (const plane of options.layout) {
      if (!plane || typeof plane !== "object") {
        throw new TypeError("Each entry in options.layout must be an object.");
      }
      if (!Number.isInteger(plane.offset) || plane.offset < 0) {
        throw new TypeError("plane.offset must be a non-negative integer.");
      }
      if (!Number.isInteger(plane.stride) || plane.stride < 0) {
        throw new TypeError("plane.stride must be a non-negative integer.");
      }
    }
  }
  if (options.rect !== undefined) {
    if (!options.rect || typeof options.rect !== "object") {
      throw new TypeError("options.rect, when provided, must be an object.");
    }
    if (options.rect.x !== undefined && (!Number.isInteger(options.rect.x) || options.rect.x < 0)) {
      throw new TypeError("options.rect.x, when provided, must be a non-negative integer.");
    }
    if (options.rect.y !== undefined && (!Number.isInteger(options.rect.y) || options.rect.y < 0)) {
      throw new TypeError("options.rect.y, when provided, must be a non-negative integer.");
    }
    if (options.rect.width !== undefined && (!Number.isInteger(options.rect.width) || options.rect.width < 0)) {
      throw new TypeError("options.rect.width, when provided, must be a non-negative integer.");
    }
    if (options.rect.height !== undefined && (!Number.isInteger(options.rect.height) || options.rect.height < 0)) {
      throw new TypeError("options.rect.height, when provided, must be a non-negative integer.");
    }
  }
};
var createDefaultPlaneLayout = (format, codedWidth, codedHeight) => {
  const planes = getPlaneConfigs(format);
  const layouts = [];
  let currentOffset = 0;
  for (const plane of planes) {
    const planeWidth = Math.ceil(codedWidth / plane.widthDivisor);
    const planeHeight = Math.ceil(codedHeight / plane.heightDivisor);
    const stride = planeWidth * plane.sampleBytes;
    const planeSize = stride * planeHeight;
    layouts.push({
      offset: currentOffset,
      stride
    });
    currentOffset += planeSize;
  }
  return layouts;
};
var getPlaneConfigs = (format) => {
  const yuv = (yBytes, uvBytes, subX, subY, hasAlpha) => {
    const configs = [
      { sampleBytes: yBytes, widthDivisor: 1, heightDivisor: 1 },
      { sampleBytes: uvBytes, widthDivisor: subX, heightDivisor: subY },
      { sampleBytes: uvBytes, widthDivisor: subX, heightDivisor: subY }
    ];
    if (hasAlpha) {
      configs.push({ sampleBytes: yBytes, widthDivisor: 1, heightDivisor: 1 });
    }
    return configs;
  };
  switch (format) {
    case "I420":
      return yuv(1, 1, 2, 2, false);
    case "I420P10":
    case "I420P12":
      return yuv(2, 2, 2, 2, false);
    case "I420A":
      return yuv(1, 1, 2, 2, true);
    case "I420AP10":
    case "I420AP12":
      return yuv(2, 2, 2, 2, true);
    case "I422":
      return yuv(1, 1, 2, 1, false);
    case "I422P10":
    case "I422P12":
      return yuv(2, 2, 2, 1, false);
    case "I422A":
      return yuv(1, 1, 2, 1, true);
    case "I422AP10":
    case "I422AP12":
      return yuv(2, 2, 2, 1, true);
    case "I444":
      return yuv(1, 1, 1, 1, false);
    case "I444P10":
    case "I444P12":
      return yuv(2, 2, 1, 1, false);
    case "I444A":
      return yuv(1, 1, 1, 1, true);
    case "I444AP10":
    case "I444AP12":
      return yuv(2, 2, 1, 1, true);
    case "NV12":
      return [
        { sampleBytes: 1, widthDivisor: 1, heightDivisor: 1 },
        { sampleBytes: 2, widthDivisor: 2, heightDivisor: 2 }
      ];
    case "RGBA":
    case "RGBX":
    case "BGRA":
    case "BGRX":
      return [
        { sampleBytes: 4, widthDivisor: 1, heightDivisor: 1 }
      ];
    default:
      assertNever(format);
      assert(false);
  }
};
var AUDIO_SAMPLE_FORMATS = new Set(["f32", "f32-planar", "s16", "s16-planar", "s32", "s32-planar", "u8", "u8-planar"]);

class AudioSample {
  get microsecondTimestamp() {
    return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
  }
  get microsecondDuration() {
    return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
  }
  constructor(init) {
    this._closed = false;
    if (isAudioData(init)) {
      if (init.format === null) {
        throw new TypeError("AudioData with null format is not supported.");
      }
      this._data = init;
      this.format = init.format;
      this.sampleRate = init.sampleRate;
      this.numberOfFrames = init.numberOfFrames;
      this.numberOfChannels = init.numberOfChannels;
      this.timestamp = init.timestamp / 1e6;
      this.duration = init.numberOfFrames / init.sampleRate;
    } else {
      if (!init || typeof init !== "object") {
        throw new TypeError("Invalid AudioDataInit: must be an object.");
      }
      if (!AUDIO_SAMPLE_FORMATS.has(init.format)) {
        throw new TypeError("Invalid AudioDataInit: invalid format.");
      }
      if (!Number.isFinite(init.sampleRate) || init.sampleRate <= 0) {
        throw new TypeError("Invalid AudioDataInit: sampleRate must be > 0.");
      }
      if (!Number.isInteger(init.numberOfChannels) || init.numberOfChannels === 0) {
        throw new TypeError("Invalid AudioDataInit: numberOfChannels must be an integer > 0.");
      }
      if (!Number.isFinite(init?.timestamp)) {
        throw new TypeError("init.timestamp must be a number.");
      }
      const numberOfFrames = init.data.byteLength / (getBytesPerSample(init.format) * init.numberOfChannels);
      if (!Number.isInteger(numberOfFrames)) {
        throw new TypeError("Invalid AudioDataInit: data size is not a multiple of frame size.");
      }
      this.format = init.format;
      this.sampleRate = init.sampleRate;
      this.numberOfFrames = numberOfFrames;
      this.numberOfChannels = init.numberOfChannels;
      this.timestamp = init.timestamp;
      this.duration = numberOfFrames / init.sampleRate;
      let dataBuffer;
      if (init.data instanceof ArrayBuffer) {
        dataBuffer = new Uint8Array(init.data);
      } else if (ArrayBuffer.isView(init.data)) {
        dataBuffer = new Uint8Array(init.data.buffer, init.data.byteOffset, init.data.byteLength);
      } else {
        throw new TypeError("Invalid AudioDataInit: data is not a BufferSource.");
      }
      const expectedSize = this.numberOfFrames * this.numberOfChannels * getBytesPerSample(this.format);
      if (dataBuffer.byteLength < expectedSize) {
        throw new TypeError("Invalid AudioDataInit: insufficient data size.");
      }
      this._data = dataBuffer;
    }
    finalizationRegistry?.register(this, { type: "audio", data: this._data }, this);
  }
  allocationSize(options) {
    if (!options || typeof options !== "object") {
      throw new TypeError("options must be an object.");
    }
    if (!Number.isInteger(options.planeIndex) || options.planeIndex < 0) {
      throw new TypeError("planeIndex must be a non-negative integer.");
    }
    if (options.format !== undefined && !AUDIO_SAMPLE_FORMATS.has(options.format)) {
      throw new TypeError("Invalid format.");
    }
    if (options.frameOffset !== undefined && (!Number.isInteger(options.frameOffset) || options.frameOffset < 0)) {
      throw new TypeError("frameOffset must be a non-negative integer.");
    }
    if (options.frameCount !== undefined && (!Number.isInteger(options.frameCount) || options.frameCount < 0)) {
      throw new TypeError("frameCount must be a non-negative integer.");
    }
    if (this._closed) {
      throw new Error("AudioSample is closed.");
    }
    const destFormat = options.format ?? this.format;
    const frameOffset = options.frameOffset ?? 0;
    if (frameOffset >= this.numberOfFrames) {
      throw new RangeError("frameOffset out of range");
    }
    const copyFrameCount = options.frameCount !== undefined ? options.frameCount : this.numberOfFrames - frameOffset;
    if (copyFrameCount > this.numberOfFrames - frameOffset) {
      throw new RangeError("frameCount out of range");
    }
    const bytesPerSample = getBytesPerSample(destFormat);
    const isPlanar = formatIsPlanar(destFormat);
    if (isPlanar && options.planeIndex >= this.numberOfChannels) {
      throw new RangeError("planeIndex out of range");
    }
    if (!isPlanar && options.planeIndex !== 0) {
      throw new RangeError("planeIndex out of range");
    }
    const elementCount = isPlanar ? copyFrameCount : copyFrameCount * this.numberOfChannels;
    return elementCount * bytesPerSample;
  }
  copyTo(destination, options) {
    if (!isAllowSharedBufferSource(destination)) {
      throw new TypeError("destination must be an ArrayBuffer or an ArrayBuffer view.");
    }
    if (!options || typeof options !== "object") {
      throw new TypeError("options must be an object.");
    }
    if (!Number.isInteger(options.planeIndex) || options.planeIndex < 0) {
      throw new TypeError("planeIndex must be a non-negative integer.");
    }
    if (options.format !== undefined && !AUDIO_SAMPLE_FORMATS.has(options.format)) {
      throw new TypeError("Invalid format.");
    }
    if (options.frameOffset !== undefined && (!Number.isInteger(options.frameOffset) || options.frameOffset < 0)) {
      throw new TypeError("frameOffset must be a non-negative integer.");
    }
    if (options.frameCount !== undefined && (!Number.isInteger(options.frameCount) || options.frameCount < 0)) {
      throw new TypeError("frameCount must be a non-negative integer.");
    }
    if (this._closed) {
      throw new Error("AudioSample is closed.");
    }
    const { planeIndex, format, frameCount: optFrameCount, frameOffset: optFrameOffset } = options;
    const srcFormat = this.format;
    const destFormat = format ?? this.format;
    if (!destFormat)
      throw new Error("Destination format not determined");
    const numFrames = this.numberOfFrames;
    const numChannels = this.numberOfChannels;
    const frameOffset = optFrameOffset ?? 0;
    if (frameOffset >= numFrames) {
      throw new RangeError("frameOffset out of range");
    }
    const copyFrameCount = optFrameCount !== undefined ? optFrameCount : numFrames - frameOffset;
    if (copyFrameCount > numFrames - frameOffset) {
      throw new RangeError("frameCount out of range");
    }
    const destBytesPerSample = getBytesPerSample(destFormat);
    const destIsPlanar = formatIsPlanar(destFormat);
    if (destIsPlanar && planeIndex >= numChannels) {
      throw new RangeError("planeIndex out of range");
    }
    if (!destIsPlanar && planeIndex !== 0) {
      throw new RangeError("planeIndex out of range");
    }
    const destElementCount = destIsPlanar ? copyFrameCount : copyFrameCount * numChannels;
    const requiredSize = destElementCount * destBytesPerSample;
    if (destination.byteLength < requiredSize) {
      throw new RangeError("Destination buffer is too small");
    }
    const destView = toDataView(destination);
    const writeFn = getWriteFunction(destFormat);
    if (isAudioData(this._data)) {
      if (isWebKit() && numChannels > 2 && destFormat !== srcFormat) {
        doAudioDataCopyToWebKitWorkaround(this._data, destView, srcFormat, destFormat, numChannels, planeIndex, frameOffset, copyFrameCount);
      } else {
        this._data.copyTo(destination, {
          planeIndex,
          frameOffset,
          frameCount: copyFrameCount,
          format: destFormat
        });
      }
    } else {
      const uint8Data = this._data;
      const srcView = toDataView(uint8Data);
      const readFn = getReadFunction(srcFormat);
      const srcBytesPerSample = getBytesPerSample(srcFormat);
      const srcIsPlanar = formatIsPlanar(srcFormat);
      for (let i = 0;i < copyFrameCount; i++) {
        if (destIsPlanar) {
          const destOffset = i * destBytesPerSample;
          let srcOffset;
          if (srcIsPlanar) {
            srcOffset = (planeIndex * numFrames + (i + frameOffset)) * srcBytesPerSample;
          } else {
            srcOffset = ((i + frameOffset) * numChannels + planeIndex) * srcBytesPerSample;
          }
          const normalized = readFn(srcView, srcOffset);
          writeFn(destView, destOffset, normalized);
        } else {
          for (let ch = 0;ch < numChannels; ch++) {
            const destIndex = i * numChannels + ch;
            const destOffset = destIndex * destBytesPerSample;
            let srcOffset;
            if (srcIsPlanar) {
              srcOffset = (ch * numFrames + (i + frameOffset)) * srcBytesPerSample;
            } else {
              srcOffset = ((i + frameOffset) * numChannels + ch) * srcBytesPerSample;
            }
            const normalized = readFn(srcView, srcOffset);
            writeFn(destView, destOffset, normalized);
          }
        }
      }
    }
  }
  clone() {
    if (this._closed) {
      throw new Error("AudioSample is closed.");
    }
    if (isAudioData(this._data)) {
      const sample = new AudioSample(this._data.clone());
      sample.setTimestamp(this.timestamp);
      return sample;
    } else {
      return new AudioSample({
        format: this.format,
        sampleRate: this.sampleRate,
        numberOfFrames: this.numberOfFrames,
        numberOfChannels: this.numberOfChannels,
        timestamp: this.timestamp,
        data: this._data
      });
    }
  }
  close() {
    if (this._closed) {
      return;
    }
    finalizationRegistry?.unregister(this);
    if (isAudioData(this._data)) {
      this._data.close();
    } else {
      this._data = new Uint8Array(0);
    }
    this._closed = true;
  }
  toAudioData() {
    if (this._closed) {
      throw new Error("AudioSample is closed.");
    }
    if (isAudioData(this._data)) {
      if (this._data.timestamp === this.microsecondTimestamp) {
        return this._data.clone();
      } else {
        if (formatIsPlanar(this.format)) {
          const size = this.allocationSize({ planeIndex: 0, format: this.format });
          const data = new ArrayBuffer(size * this.numberOfChannels);
          for (let i = 0;i < this.numberOfChannels; i++) {
            this.copyTo(new Uint8Array(data, i * size, size), { planeIndex: i, format: this.format });
          }
          return new AudioData({
            format: this.format,
            sampleRate: this.sampleRate,
            numberOfFrames: this.numberOfFrames,
            numberOfChannels: this.numberOfChannels,
            timestamp: this.microsecondTimestamp,
            data
          });
        } else {
          const data = new ArrayBuffer(this.allocationSize({ planeIndex: 0, format: this.format }));
          this.copyTo(data, { planeIndex: 0, format: this.format });
          return new AudioData({
            format: this.format,
            sampleRate: this.sampleRate,
            numberOfFrames: this.numberOfFrames,
            numberOfChannels: this.numberOfChannels,
            timestamp: this.microsecondTimestamp,
            data
          });
        }
      }
    } else {
      return new AudioData({
        format: this.format,
        sampleRate: this.sampleRate,
        numberOfFrames: this.numberOfFrames,
        numberOfChannels: this.numberOfChannels,
        timestamp: this.microsecondTimestamp,
        data: this._data.buffer instanceof ArrayBuffer ? this._data.buffer : this._data.slice()
      });
    }
  }
  toAudioBuffer() {
    if (this._closed) {
      throw new Error("AudioSample is closed.");
    }
    const audioBuffer = new AudioBuffer({
      numberOfChannels: this.numberOfChannels,
      length: this.numberOfFrames,
      sampleRate: this.sampleRate
    });
    const dataBytes = new Float32Array(this.allocationSize({ planeIndex: 0, format: "f32-planar" }) / 4);
    for (let i = 0;i < this.numberOfChannels; i++) {
      this.copyTo(dataBytes, { planeIndex: i, format: "f32-planar" });
      audioBuffer.copyToChannel(dataBytes, i);
    }
    return audioBuffer;
  }
  setTimestamp(newTimestamp) {
    if (!Number.isFinite(newTimestamp)) {
      throw new TypeError("newTimestamp must be a number.");
    }
    this.timestamp = newTimestamp;
  }
  [Symbol.dispose]() {
    this.close();
  }
  static *_fromAudioBuffer(audioBuffer, timestamp) {
    if (!(audioBuffer instanceof AudioBuffer)) {
      throw new TypeError("audioBuffer must be an AudioBuffer.");
    }
    const MAX_FLOAT_COUNT = 48000 * 5;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const totalFrames = audioBuffer.length;
    const maxFramesPerChunk = Math.floor(MAX_FLOAT_COUNT / numberOfChannels);
    let currentRelativeFrame = 0;
    let remainingFrames = totalFrames;
    while (remainingFrames > 0) {
      const framesToCopy = Math.min(maxFramesPerChunk, remainingFrames);
      const chunkData = new Float32Array(numberOfChannels * framesToCopy);
      for (let channel = 0;channel < numberOfChannels; channel++) {
        audioBuffer.copyFromChannel(chunkData.subarray(channel * framesToCopy, (channel + 1) * framesToCopy), channel, currentRelativeFrame);
      }
      yield new AudioSample({
        format: "f32-planar",
        sampleRate,
        numberOfFrames: framesToCopy,
        numberOfChannels,
        timestamp: timestamp + currentRelativeFrame / sampleRate,
        data: chunkData
      });
      currentRelativeFrame += framesToCopy;
      remainingFrames -= framesToCopy;
    }
  }
  static fromAudioBuffer(audioBuffer, timestamp) {
    if (!(audioBuffer instanceof AudioBuffer)) {
      throw new TypeError("audioBuffer must be an AudioBuffer.");
    }
    const MAX_FLOAT_COUNT = 48000 * 5;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const totalFrames = audioBuffer.length;
    const maxFramesPerChunk = Math.floor(MAX_FLOAT_COUNT / numberOfChannels);
    let currentRelativeFrame = 0;
    let remainingFrames = totalFrames;
    const result = [];
    while (remainingFrames > 0) {
      const framesToCopy = Math.min(maxFramesPerChunk, remainingFrames);
      const chunkData = new Float32Array(numberOfChannels * framesToCopy);
      for (let channel = 0;channel < numberOfChannels; channel++) {
        audioBuffer.copyFromChannel(chunkData.subarray(channel * framesToCopy, (channel + 1) * framesToCopy), channel, currentRelativeFrame);
      }
      const audioSample = new AudioSample({
        format: "f32-planar",
        sampleRate,
        numberOfFrames: framesToCopy,
        numberOfChannels,
        timestamp: timestamp + currentRelativeFrame / sampleRate,
        data: chunkData
      });
      result.push(audioSample);
      currentRelativeFrame += framesToCopy;
      remainingFrames -= framesToCopy;
    }
    return result;
  }
}
var getBytesPerSample = (format) => {
  switch (format) {
    case "u8":
    case "u8-planar":
      return 1;
    case "s16":
    case "s16-planar":
      return 2;
    case "s32":
    case "s32-planar":
      return 4;
    case "f32":
    case "f32-planar":
      return 4;
    default:
      throw new Error("Unknown AudioSampleFormat");
  }
};
var formatIsPlanar = (format) => {
  switch (format) {
    case "u8-planar":
    case "s16-planar":
    case "s32-planar":
    case "f32-planar":
      return true;
    default:
      return false;
  }
};
var getReadFunction = (format) => {
  switch (format) {
    case "u8":
    case "u8-planar":
      return (view, offset) => (view.getUint8(offset) - 128) / 128;
    case "s16":
    case "s16-planar":
      return (view, offset) => view.getInt16(offset, true) / 32768;
    case "s32":
    case "s32-planar":
      return (view, offset) => view.getInt32(offset, true) / 2147483648;
    case "f32":
    case "f32-planar":
      return (view, offset) => view.getFloat32(offset, true);
  }
};
var getWriteFunction = (format) => {
  switch (format) {
    case "u8":
    case "u8-planar":
      return (view, offset, value) => view.setUint8(offset, clamp((value + 1) * 127.5, 0, 255));
    case "s16":
    case "s16-planar":
      return (view, offset, value) => view.setInt16(offset, clamp(Math.round(value * 32767), -32768, 32767), true);
    case "s32":
    case "s32-planar":
      return (view, offset, value) => view.setInt32(offset, clamp(Math.round(value * 2147483647), -2147483648, 2147483647), true);
    case "f32":
    case "f32-planar":
      return (view, offset, value) => view.setFloat32(offset, value, true);
  }
};
var isAudioData = (x) => {
  return typeof AudioData !== "undefined" && x instanceof AudioData;
};
var doAudioDataCopyToWebKitWorkaround = (audioData, destView, srcFormat, destFormat, numChannels, planeIndex, frameOffset, copyFrameCount) => {
  const readFn = getReadFunction(srcFormat);
  const writeFn = getWriteFunction(destFormat);
  const srcBytesPerSample = getBytesPerSample(srcFormat);
  const destBytesPerSample = getBytesPerSample(destFormat);
  const srcIsPlanar = formatIsPlanar(srcFormat);
  const destIsPlanar = formatIsPlanar(destFormat);
  if (destIsPlanar) {
    if (srcIsPlanar) {
      const data = new ArrayBuffer(copyFrameCount * srcBytesPerSample);
      const dataView = toDataView(data);
      audioData.copyTo(data, {
        planeIndex,
        frameOffset,
        frameCount: copyFrameCount,
        format: srcFormat
      });
      for (let i = 0;i < copyFrameCount; i++) {
        const srcOffset = i * srcBytesPerSample;
        const destOffset = i * destBytesPerSample;
        const sample = readFn(dataView, srcOffset);
        writeFn(destView, destOffset, sample);
      }
    } else {
      const data = new ArrayBuffer(copyFrameCount * numChannels * srcBytesPerSample);
      const dataView = toDataView(data);
      audioData.copyTo(data, {
        planeIndex: 0,
        frameOffset,
        frameCount: copyFrameCount,
        format: srcFormat
      });
      for (let i = 0;i < copyFrameCount; i++) {
        const srcOffset = (i * numChannels + planeIndex) * srcBytesPerSample;
        const destOffset = i * destBytesPerSample;
        const sample = readFn(dataView, srcOffset);
        writeFn(destView, destOffset, sample);
      }
    }
  } else {
    if (srcIsPlanar) {
      const planeSize = copyFrameCount * srcBytesPerSample;
      const data = new ArrayBuffer(planeSize);
      const dataView = toDataView(data);
      for (let ch = 0;ch < numChannels; ch++) {
        audioData.copyTo(data, {
          planeIndex: ch,
          frameOffset,
          frameCount: copyFrameCount,
          format: srcFormat
        });
        for (let i = 0;i < copyFrameCount; i++) {
          const srcOffset = i * srcBytesPerSample;
          const destOffset = (i * numChannels + ch) * destBytesPerSample;
          const sample = readFn(dataView, srcOffset);
          writeFn(destView, destOffset, sample);
        }
      }
    } else {
      const data = new ArrayBuffer(copyFrameCount * numChannels * srcBytesPerSample);
      const dataView = toDataView(data);
      audioData.copyTo(data, {
        planeIndex: 0,
        frameOffset,
        frameCount: copyFrameCount,
        format: srcFormat
      });
      for (let i = 0;i < copyFrameCount; i++) {
        for (let ch = 0;ch < numChannels; ch++) {
          const idx = i * numChannels + ch;
          const srcOffset = idx * srcBytesPerSample;
          const destOffset = idx * destBytesPerSample;
          const sample = readFn(dataView, srcOffset);
          writeFn(destView, destOffset, sample);
        }
      }
    }
  }
};

// ../node_modules/mediabunny/dist/modules/src/isobmff/isobmff-misc.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var buildIsobmffMimeType = (info) => {
  const base = info.hasVideo ? "video/" : info.hasAudio ? "audio/" : "application/";
  let string = base + (info.isQuickTime ? "quicktime" : "mp4");
  if (info.codecStrings.length > 0) {
    const uniqueCodecMimeTypes = [...new Set(info.codecStrings)];
    string += `; codecs="${uniqueCodecMimeTypes.join(", ")}"`;
  }
  return string;
};

// ../node_modules/mediabunny/dist/modules/src/isobmff/isobmff-reader.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var MIN_BOX_HEADER_SIZE = 8;
var MAX_BOX_HEADER_SIZE = 16;

// ../node_modules/mediabunny/dist/modules/src/adts/adts-reader.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var MIN_ADTS_FRAME_HEADER_SIZE = 7;
var MAX_ADTS_FRAME_HEADER_SIZE = 9;
var readAdtsFrameHeader = (slice) => {
  const startPos = slice.filePos;
  const bytes = readBytes(slice, 9);
  const bitstream = new Bitstream(bytes);
  const syncword = bitstream.readBits(12);
  if (syncword !== 4095) {
    return null;
  }
  bitstream.skipBits(1);
  const layer = bitstream.readBits(2);
  if (layer !== 0) {
    return null;
  }
  const protectionAbsence = bitstream.readBits(1);
  const objectType = bitstream.readBits(2) + 1;
  const samplingFrequencyIndex = bitstream.readBits(4);
  if (samplingFrequencyIndex === 15) {
    return null;
  }
  bitstream.skipBits(1);
  const channelConfiguration = bitstream.readBits(3);
  if (channelConfiguration === 0) {
    throw new Error("ADTS frames with channel configuration 0 are not supported.");
  }
  bitstream.skipBits(1);
  bitstream.skipBits(1);
  bitstream.skipBits(1);
  bitstream.skipBits(1);
  const frameLength = bitstream.readBits(13);
  bitstream.skipBits(11);
  const numberOfAacFrames = bitstream.readBits(2) + 1;
  if (numberOfAacFrames !== 1) {
    throw new Error("ADTS frames with more than one AAC frame are not supported.");
  }
  let crcCheck = null;
  if (protectionAbsence === 1) {
    slice.filePos -= 2;
  } else {
    crcCheck = bitstream.readBits(16);
  }
  return {
    objectType,
    samplingFrequencyIndex,
    channelConfiguration,
    frameLength,
    numberOfAacFrames,
    crcCheck,
    startPos
  };
};

// ../node_modules/mediabunny/dist/modules/src/reader.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
class FileSlice {
  constructor(bytes, view, offset, start, end) {
    this.bytes = bytes;
    this.view = view;
    this.offset = offset;
    this.start = start;
    this.end = end;
    this.bufferPos = start - offset;
  }
  static tempFromBytes(bytes) {
    return new FileSlice(bytes, toDataView(bytes), 0, 0, bytes.length);
  }
  get length() {
    return this.end - this.start;
  }
  get filePos() {
    return this.offset + this.bufferPos;
  }
  set filePos(value) {
    this.bufferPos = value - this.offset;
  }
  get remainingLength() {
    return Math.max(this.end - this.filePos, 0);
  }
  skip(byteCount) {
    this.bufferPos += byteCount;
  }
  slice(filePos, length = this.end - filePos) {
    if (filePos < this.start || filePos + length > this.end) {
      throw new RangeError("Slicing outside of original slice.");
    }
    return new FileSlice(this.bytes, this.view, this.offset, filePos, filePos + length);
  }
}
var checkIsInRange = (slice, bytesToRead) => {
  if (slice.filePos < slice.start || slice.filePos + bytesToRead > slice.end) {
    throw new RangeError(`Tried reading [${slice.filePos}, ${slice.filePos + bytesToRead}), but slice is` + ` [${slice.start}, ${slice.end}). This is likely an internal error, please report it alongside the file` + ` that caused it.`);
  }
};
var readBytes = (slice, length) => {
  checkIsInRange(slice, length);
  const bytes = slice.bytes.subarray(slice.bufferPos, slice.bufferPos + length);
  slice.bufferPos += length;
  return bytes;
};

// ../node_modules/mediabunny/dist/modules/src/subtitles.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var inlineTimestampRegex = /<(?:(\d{2}):)?(\d{2}):(\d{2}).(\d{3})>/g;
var formatSubtitleTimestamp = (timestamp) => {
  const hours = Math.floor(timestamp / (60 * 60 * 1000));
  const minutes = Math.floor(timestamp % (60 * 60 * 1000) / (60 * 1000));
  const seconds = Math.floor(timestamp % (60 * 1000) / 1000);
  const milliseconds = timestamp % 1000;
  return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + "." + milliseconds.toString().padStart(3, "0");
};

// ../node_modules/mediabunny/dist/modules/src/isobmff/isobmff-boxes.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class IsobmffBoxWriter {
  constructor(writer) {
    this.writer = writer;
    this.helper = new Uint8Array(8);
    this.helperView = new DataView(this.helper.buffer);
    this.offsets = new WeakMap;
  }
  writeU32(value) {
    this.helperView.setUint32(0, value, false);
    this.writer.write(this.helper.subarray(0, 4));
  }
  writeU64(value) {
    this.helperView.setUint32(0, Math.floor(value / 2 ** 32), false);
    this.helperView.setUint32(4, value, false);
    this.writer.write(this.helper.subarray(0, 8));
  }
  writeAscii(text) {
    for (let i = 0;i < text.length; i++) {
      this.helperView.setUint8(i % 8, text.charCodeAt(i));
      if (i % 8 === 7)
        this.writer.write(this.helper);
    }
    if (text.length % 8 !== 0) {
      this.writer.write(this.helper.subarray(0, text.length % 8));
    }
  }
  writeBox(box) {
    this.offsets.set(box, this.writer.getPos());
    if (box.contents && !box.children) {
      this.writeBoxHeader(box, box.size ?? box.contents.byteLength + 8);
      this.writer.write(box.contents);
    } else {
      const startPos = this.writer.getPos();
      this.writeBoxHeader(box, 0);
      if (box.contents)
        this.writer.write(box.contents);
      if (box.children) {
        for (const child of box.children)
          if (child)
            this.writeBox(child);
      }
      const endPos = this.writer.getPos();
      const size = box.size ?? endPos - startPos;
      this.writer.seek(startPos);
      this.writeBoxHeader(box, size);
      this.writer.seek(endPos);
    }
  }
  writeBoxHeader(box, size) {
    this.writeU32(box.largeSize ? 1 : size);
    this.writeAscii(box.type);
    if (box.largeSize)
      this.writeU64(size);
  }
  measureBoxHeader(box) {
    return 8 + (box.largeSize ? 8 : 0);
  }
  patchBox(box) {
    const boxOffset = this.offsets.get(box);
    assert(boxOffset !== undefined);
    const endPos = this.writer.getPos();
    this.writer.seek(boxOffset);
    this.writeBox(box);
    this.writer.seek(endPos);
  }
  measureBox(box) {
    if (box.contents && !box.children) {
      const headerSize = this.measureBoxHeader(box);
      return headerSize + box.contents.byteLength;
    } else {
      let result = this.measureBoxHeader(box);
      if (box.contents)
        result += box.contents.byteLength;
      if (box.children) {
        for (const child of box.children)
          if (child)
            result += this.measureBox(child);
      }
      return result;
    }
  }
}
var bytes = /* @__PURE__ */ new Uint8Array(8);
var view = /* @__PURE__ */ new DataView(bytes.buffer);
var u8 = (value) => {
  return [(value % 256 + 256) % 256];
};
var u16 = (value) => {
  view.setUint16(0, value, false);
  return [bytes[0], bytes[1]];
};
var i16 = (value) => {
  view.setInt16(0, value, false);
  return [bytes[0], bytes[1]];
};
var u24 = (value) => {
  view.setUint32(0, value, false);
  return [bytes[1], bytes[2], bytes[3]];
};
var u32 = (value) => {
  view.setUint32(0, value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var i32 = (value) => {
  view.setInt32(0, value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var u64 = (value) => {
  view.setUint32(0, Math.floor(value / 2 ** 32), false);
  view.setUint32(4, value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]];
};
var fixed_8_8 = (value) => {
  view.setInt16(0, 2 ** 8 * value, false);
  return [bytes[0], bytes[1]];
};
var fixed_16_16 = (value) => {
  view.setInt32(0, 2 ** 16 * value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var fixed_2_30 = (value) => {
  view.setInt32(0, 2 ** 30 * value, false);
  return [bytes[0], bytes[1], bytes[2], bytes[3]];
};
var variableUnsignedInt = (value, byteLength) => {
  const bytes2 = [];
  let remaining = value;
  do {
    let byte = remaining & 127;
    remaining >>= 7;
    if (bytes2.length > 0) {
      byte |= 128;
    }
    bytes2.push(byte);
    if (byteLength !== undefined) {
      byteLength--;
    }
  } while (remaining > 0 || byteLength);
  return bytes2.reverse();
};
var ascii = (text, nullTerminated = false) => {
  const bytes2 = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
  if (nullTerminated)
    bytes2.push(0);
  return bytes2;
};
var lastPresentedSample = (samples) => {
  let result = null;
  for (const sample of samples) {
    if (!result || sample.timestamp > result.timestamp) {
      result = sample;
    }
  }
  return result;
};
var rotationMatrix = (rotationInDegrees) => {
  const theta = rotationInDegrees * (Math.PI / 180);
  const cosTheta = Math.round(Math.cos(theta));
  const sinTheta = Math.round(Math.sin(theta));
  return [
    cosTheta,
    sinTheta,
    0,
    -sinTheta,
    cosTheta,
    0,
    0,
    0,
    1
  ];
};
var IDENTITY_MATRIX = /* @__PURE__ */ rotationMatrix(0);
var matrixToBytes = (matrix) => {
  return [
    fixed_16_16(matrix[0]),
    fixed_16_16(matrix[1]),
    fixed_2_30(matrix[2]),
    fixed_16_16(matrix[3]),
    fixed_16_16(matrix[4]),
    fixed_2_30(matrix[5]),
    fixed_16_16(matrix[6]),
    fixed_16_16(matrix[7]),
    fixed_2_30(matrix[8])
  ];
};
var box = (type, contents, children) => ({
  type,
  contents: contents && new Uint8Array(contents.flat(10)),
  children
});
var fullBox = (type, version, flags, contents, children) => box(type, [u8(version), u24(flags), contents ?? []], children);
var ftyp = (details) => {
  const minorVersion = 512;
  if (details.isQuickTime) {
    return box("ftyp", [
      ascii("qt  "),
      u32(minorVersion),
      ascii("qt  ")
    ]);
  }
  if (details.fragmented) {
    return box("ftyp", [
      ascii("iso5"),
      u32(minorVersion),
      ascii("iso5"),
      ascii("iso6"),
      ascii("mp41")
    ]);
  }
  return box("ftyp", [
    ascii("isom"),
    u32(minorVersion),
    ascii("isom"),
    details.holdsAvc ? ascii("avc1") : [],
    ascii("mp41")
  ]);
};
var mdat = (reserveLargeSize) => ({ type: "mdat", largeSize: reserveLargeSize });
var free = (size) => ({ type: "free", size });
var moov = (muxer) => box("moov", undefined, [
  mvhd(muxer.creationTime, muxer.trackDatas),
  ...muxer.trackDatas.map((x) => trak(x, muxer.creationTime)),
  muxer.isFragmented ? mvex(muxer.trackDatas) : null,
  udta(muxer)
]);
var mvhd = (creationTime, trackDatas) => {
  const duration = intoTimescale(Math.max(0, ...trackDatas.filter((x) => x.samples.length > 0).map((x) => {
    const lastSample = lastPresentedSample(x.samples);
    return lastSample.timestamp + lastSample.duration;
  })), GLOBAL_TIMESCALE);
  const nextTrackId = Math.max(0, ...trackDatas.map((x) => x.track.id)) + 1;
  const needsU64 = !isU32(creationTime) || !isU32(duration);
  const u32OrU64 = needsU64 ? u64 : u32;
  return fullBox("mvhd", +needsU64, 0, [
    u32OrU64(creationTime),
    u32OrU64(creationTime),
    u32(GLOBAL_TIMESCALE),
    u32OrU64(duration),
    fixed_16_16(1),
    fixed_8_8(1),
    Array(10).fill(0),
    matrixToBytes(IDENTITY_MATRIX),
    Array(24).fill(0),
    u32(nextTrackId)
  ]);
};
var trak = (trackData, creationTime) => {
  const trackMetadata = getTrackMetadata(trackData);
  return box("trak", undefined, [
    tkhd(trackData, creationTime),
    mdia(trackData, creationTime),
    trackMetadata.name !== undefined ? box("udta", undefined, [
      box("name", [
        ...textEncoder.encode(trackMetadata.name)
      ])
    ]) : null
  ]);
};
var tkhd = (trackData, creationTime) => {
  const lastSample = lastPresentedSample(trackData.samples);
  const durationInGlobalTimescale = intoTimescale(lastSample ? lastSample.timestamp + lastSample.duration : 0, GLOBAL_TIMESCALE);
  const needsU64 = !isU32(creationTime) || !isU32(durationInGlobalTimescale);
  const u32OrU64 = needsU64 ? u64 : u32;
  let matrix;
  if (trackData.type === "video") {
    const rotation = trackData.track.metadata.rotation;
    matrix = rotationMatrix(rotation ?? 0);
  } else {
    matrix = IDENTITY_MATRIX;
  }
  let flags = 2;
  if (trackData.track.metadata.disposition?.default !== false) {
    flags |= 1;
  }
  return fullBox("tkhd", +needsU64, flags, [
    u32OrU64(creationTime),
    u32OrU64(creationTime),
    u32(trackData.track.id),
    u32(0),
    u32OrU64(durationInGlobalTimescale),
    Array(8).fill(0),
    u16(0),
    u16(trackData.track.id),
    fixed_8_8(trackData.type === "audio" ? 1 : 0),
    u16(0),
    matrixToBytes(matrix),
    fixed_16_16(trackData.type === "video" ? trackData.info.width : 0),
    fixed_16_16(trackData.type === "video" ? trackData.info.height : 0)
  ]);
};
var mdia = (trackData, creationTime) => box("mdia", undefined, [
  mdhd(trackData, creationTime),
  hdlr(true, TRACK_TYPE_TO_COMPONENT_SUBTYPE[trackData.type], TRACK_TYPE_TO_HANDLER_NAME[trackData.type]),
  minf(trackData)
]);
var mdhd = (trackData, creationTime) => {
  const lastSample = lastPresentedSample(trackData.samples);
  const localDuration = intoTimescale(lastSample ? lastSample.timestamp + lastSample.duration : 0, trackData.timescale);
  const needsU64 = !isU32(creationTime) || !isU32(localDuration);
  const u32OrU64 = needsU64 ? u64 : u32;
  return fullBox("mdhd", +needsU64, 0, [
    u32OrU64(creationTime),
    u32OrU64(creationTime),
    u32(trackData.timescale),
    u32OrU64(localDuration),
    u16(getLanguageCodeInt(trackData.track.metadata.languageCode ?? UNDETERMINED_LANGUAGE)),
    u16(0)
  ]);
};
var TRACK_TYPE_TO_COMPONENT_SUBTYPE = {
  video: "vide",
  audio: "soun",
  subtitle: "text"
};
var TRACK_TYPE_TO_HANDLER_NAME = {
  video: "MediabunnyVideoHandler",
  audio: "MediabunnySoundHandler",
  subtitle: "MediabunnyTextHandler"
};
var hdlr = (hasComponentType, handlerType, name, manufacturer = "\x00\x00\x00\x00") => fullBox("hdlr", 0, 0, [
  hasComponentType ? ascii("mhlr") : u32(0),
  ascii(handlerType),
  ascii(manufacturer),
  u32(0),
  u32(0),
  ascii(name, true)
]);
var minf = (trackData) => box("minf", undefined, [
  TRACK_TYPE_TO_HEADER_BOX[trackData.type](),
  dinf(),
  stbl(trackData)
]);
var vmhd = () => fullBox("vmhd", 0, 1, [
  u16(0),
  u16(0),
  u16(0),
  u16(0)
]);
var smhd = () => fullBox("smhd", 0, 0, [
  u16(0),
  u16(0)
]);
var nmhd = () => fullBox("nmhd", 0, 0);
var TRACK_TYPE_TO_HEADER_BOX = {
  video: vmhd,
  audio: smhd,
  subtitle: nmhd
};
var dinf = () => box("dinf", undefined, [
  dref()
]);
var dref = () => fullBox("dref", 0, 0, [
  u32(1)
], [
  url()
]);
var url = () => fullBox("url ", 0, 1);
var stbl = (trackData) => {
  const needsCtts = trackData.compositionTimeOffsetTable.length > 1 || trackData.compositionTimeOffsetTable.some((x) => x.sampleCompositionTimeOffset !== 0);
  return box("stbl", undefined, [
    stsd(trackData),
    stts(trackData),
    needsCtts ? ctts(trackData) : null,
    needsCtts ? cslg(trackData) : null,
    stsc(trackData),
    stsz(trackData),
    stco(trackData),
    stss(trackData)
  ]);
};
var stsd = (trackData) => {
  let sampleDescription;
  if (trackData.type === "video") {
    sampleDescription = videoSampleDescription(videoCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec), trackData);
  } else if (trackData.type === "audio") {
    const boxName = audioCodecToBoxName(trackData.track.source._codec, trackData.muxer.isQuickTime);
    assert(boxName);
    sampleDescription = soundSampleDescription(boxName, trackData);
  } else if (trackData.type === "subtitle") {
    sampleDescription = subtitleSampleDescription(SUBTITLE_CODEC_TO_BOX_NAME[trackData.track.source._codec], trackData);
  }
  assert(sampleDescription);
  return fullBox("stsd", 0, 0, [
    u32(1)
  ], [
    sampleDescription
  ]);
};
var videoSampleDescription = (compressionType, trackData) => box(compressionType, [
  Array(6).fill(0),
  u16(1),
  u16(0),
  u16(0),
  Array(12).fill(0),
  u16(trackData.info.width),
  u16(trackData.info.height),
  u32(4718592),
  u32(4718592),
  u32(0),
  u16(1),
  Array(32).fill(0),
  u16(24),
  i16(65535)
], [
  VIDEO_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData),
  colorSpaceIsComplete(trackData.info.decoderConfig.colorSpace) ? colr(trackData) : null
]);
var colr = (trackData) => box("colr", [
  ascii("nclx"),
  u16(COLOR_PRIMARIES_MAP[trackData.info.decoderConfig.colorSpace.primaries]),
  u16(TRANSFER_CHARACTERISTICS_MAP[trackData.info.decoderConfig.colorSpace.transfer]),
  u16(MATRIX_COEFFICIENTS_MAP[trackData.info.decoderConfig.colorSpace.matrix]),
  u8((trackData.info.decoderConfig.colorSpace.fullRange ? 1 : 0) << 7)
]);
var avcC = (trackData) => trackData.info.decoderConfig && box("avcC", [
  ...toUint8Array(trackData.info.decoderConfig.description)
]);
var hvcC = (trackData) => trackData.info.decoderConfig && box("hvcC", [
  ...toUint8Array(trackData.info.decoderConfig.description)
]);
var vpcC = (trackData) => {
  if (!trackData.info.decoderConfig) {
    return null;
  }
  const decoderConfig = trackData.info.decoderConfig;
  const parts = decoderConfig.codec.split(".");
  const profile = Number(parts[1]);
  const level = Number(parts[2]);
  const bitDepth = Number(parts[3]);
  const chromaSubsampling = parts[4] ? Number(parts[4]) : 1;
  const videoFullRangeFlag = parts[8] ? Number(parts[8]) : Number(decoderConfig.colorSpace?.fullRange ?? 0);
  const thirdByte = (bitDepth << 4) + (chromaSubsampling << 1) + videoFullRangeFlag;
  const colourPrimaries = parts[5] ? Number(parts[5]) : decoderConfig.colorSpace?.primaries ? COLOR_PRIMARIES_MAP[decoderConfig.colorSpace.primaries] : 2;
  const transferCharacteristics = parts[6] ? Number(parts[6]) : decoderConfig.colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[decoderConfig.colorSpace.transfer] : 2;
  const matrixCoefficients = parts[7] ? Number(parts[7]) : decoderConfig.colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[decoderConfig.colorSpace.matrix] : 2;
  return fullBox("vpcC", 1, 0, [
    u8(profile),
    u8(level),
    u8(thirdByte),
    u8(colourPrimaries),
    u8(transferCharacteristics),
    u8(matrixCoefficients),
    u16(0)
  ]);
};
var av1C = (trackData) => {
  return box("av1C", generateAv1CodecConfigurationFromCodecString(trackData.info.decoderConfig.codec));
};
var soundSampleDescription = (compressionType, trackData) => {
  let version = 0;
  let contents;
  let sampleSizeInBits = 16;
  if (PCM_AUDIO_CODECS.includes(trackData.track.source._codec)) {
    const codec = trackData.track.source._codec;
    const { sampleSize } = parsePcmCodec(codec);
    sampleSizeInBits = 8 * sampleSize;
    if (sampleSizeInBits > 16) {
      version = 1;
    }
  }
  if (version === 0) {
    contents = [
      Array(6).fill(0),
      u16(1),
      u16(version),
      u16(0),
      u32(0),
      u16(trackData.info.numberOfChannels),
      u16(sampleSizeInBits),
      u16(0),
      u16(0),
      u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
      u16(0)
    ];
  } else {
    contents = [
      Array(6).fill(0),
      u16(1),
      u16(version),
      u16(0),
      u32(0),
      u16(trackData.info.numberOfChannels),
      u16(Math.min(sampleSizeInBits, 16)),
      u16(0),
      u16(0),
      u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
      u16(0),
      u32(1),
      u32(sampleSizeInBits / 8),
      u32(trackData.info.numberOfChannels * sampleSizeInBits / 8),
      u32(2)
    ];
  }
  return box(compressionType, contents, [
    audioCodecToConfigurationBox(trackData.track.source._codec, trackData.muxer.isQuickTime)?.(trackData) ?? null
  ]);
};
var esds = (trackData) => {
  let objectTypeIndication;
  switch (trackData.track.source._codec) {
    case "aac":
      {
        objectTypeIndication = 64;
      }
      ;
      break;
    case "mp3":
      {
        objectTypeIndication = 107;
      }
      ;
      break;
    case "vorbis":
      {
        objectTypeIndication = 221;
      }
      ;
      break;
    default:
      throw new Error(`Unhandled audio codec: ${trackData.track.source._codec}`);
  }
  let bytes2 = [
    ...u8(objectTypeIndication),
    ...u8(21),
    ...u24(0),
    ...u32(0),
    ...u32(0)
  ];
  if (trackData.info.decoderConfig.description) {
    const description = toUint8Array(trackData.info.decoderConfig.description);
    bytes2 = [
      ...bytes2,
      ...u8(5),
      ...variableUnsignedInt(description.byteLength),
      ...description
    ];
  }
  bytes2 = [
    ...u16(1),
    ...u8(0),
    ...u8(4),
    ...variableUnsignedInt(bytes2.length),
    ...bytes2,
    ...u8(6),
    ...u8(1),
    ...u8(2)
  ];
  bytes2 = [
    ...u8(3),
    ...variableUnsignedInt(bytes2.length),
    ...bytes2
  ];
  return fullBox("esds", 0, 0, bytes2);
};
var wave = (trackData) => {
  return box("wave", undefined, [
    frma(trackData),
    enda(trackData),
    box("\x00\x00\x00\x00")
  ]);
};
var frma = (trackData) => {
  return box("frma", [
    ascii(audioCodecToBoxName(trackData.track.source._codec, trackData.muxer.isQuickTime))
  ]);
};
var enda = (trackData) => {
  const { littleEndian } = parsePcmCodec(trackData.track.source._codec);
  return box("enda", [
    u16(+littleEndian)
  ]);
};
var dOps = (trackData) => {
  let outputChannelCount = trackData.info.numberOfChannels;
  let preSkip = 3840;
  let inputSampleRate = trackData.info.sampleRate;
  let outputGain = 0;
  let channelMappingFamily = 0;
  let channelMappingTable = new Uint8Array(0);
  const description = trackData.info.decoderConfig?.description;
  if (description) {
    assert(description.byteLength >= 18);
    const bytes2 = toUint8Array(description);
    const header = parseOpusIdentificationHeader(bytes2);
    outputChannelCount = header.outputChannelCount;
    preSkip = header.preSkip;
    inputSampleRate = header.inputSampleRate;
    outputGain = header.outputGain;
    channelMappingFamily = header.channelMappingFamily;
    if (header.channelMappingTable) {
      channelMappingTable = header.channelMappingTable;
    }
  }
  return box("dOps", [
    u8(0),
    u8(outputChannelCount),
    u16(preSkip),
    u32(inputSampleRate),
    i16(outputGain),
    u8(channelMappingFamily),
    ...channelMappingTable
  ]);
};
var dfLa = (trackData) => {
  const description = trackData.info.decoderConfig?.description;
  assert(description);
  const bytes2 = toUint8Array(description);
  return fullBox("dfLa", 0, 0, [
    ...bytes2.subarray(4)
  ]);
};
var pcmC = (trackData) => {
  const { littleEndian, sampleSize } = parsePcmCodec(trackData.track.source._codec);
  const formatFlags = +littleEndian;
  return fullBox("pcmC", 0, 0, [
    u8(formatFlags),
    u8(8 * sampleSize)
  ]);
};
var subtitleSampleDescription = (compressionType, trackData) => box(compressionType, [
  Array(6).fill(0),
  u16(1)
], [
  SUBTITLE_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData)
]);
var vttC = (trackData) => box("vttC", [
  ...textEncoder.encode(trackData.info.config.description)
]);
var stts = (trackData) => {
  return fullBox("stts", 0, 0, [
    u32(trackData.timeToSampleTable.length),
    trackData.timeToSampleTable.map((x) => [
      u32(x.sampleCount),
      u32(x.sampleDelta)
    ])
  ]);
};
var stss = (trackData) => {
  if (trackData.samples.every((x) => x.type === "key"))
    return null;
  const keySamples = [...trackData.samples.entries()].filter(([, sample]) => sample.type === "key");
  return fullBox("stss", 0, 0, [
    u32(keySamples.length),
    keySamples.map(([index]) => u32(index + 1))
  ]);
};
var stsc = (trackData) => {
  return fullBox("stsc", 0, 0, [
    u32(trackData.compactlyCodedChunkTable.length),
    trackData.compactlyCodedChunkTable.map((x) => [
      u32(x.firstChunk),
      u32(x.samplesPerChunk),
      u32(1)
    ])
  ]);
};
var stsz = (trackData) => {
  if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
    const { sampleSize } = parsePcmCodec(trackData.track.source._codec);
    return fullBox("stsz", 0, 0, [
      u32(sampleSize * trackData.info.numberOfChannels),
      u32(trackData.samples.reduce((acc, x) => acc + intoTimescale(x.duration, trackData.timescale), 0))
    ]);
  }
  return fullBox("stsz", 0, 0, [
    u32(0),
    u32(trackData.samples.length),
    trackData.samples.map((x) => u32(x.size))
  ]);
};
var stco = (trackData) => {
  if (trackData.finalizedChunks.length > 0 && last(trackData.finalizedChunks).offset >= 2 ** 32) {
    return fullBox("co64", 0, 0, [
      u32(trackData.finalizedChunks.length),
      trackData.finalizedChunks.map((x) => u64(x.offset))
    ]);
  }
  return fullBox("stco", 0, 0, [
    u32(trackData.finalizedChunks.length),
    trackData.finalizedChunks.map((x) => u32(x.offset))
  ]);
};
var ctts = (trackData) => {
  return fullBox("ctts", 1, 0, [
    u32(trackData.compositionTimeOffsetTable.length),
    trackData.compositionTimeOffsetTable.map((x) => [
      u32(x.sampleCount),
      i32(x.sampleCompositionTimeOffset)
    ])
  ]);
};
var cslg = (trackData) => {
  let leastDecodeToDisplayDelta = Infinity;
  let greatestDecodeToDisplayDelta = -Infinity;
  let compositionStartTime = Infinity;
  let compositionEndTime = -Infinity;
  assert(trackData.compositionTimeOffsetTable.length > 0);
  assert(trackData.samples.length > 0);
  for (let i = 0;i < trackData.compositionTimeOffsetTable.length; i++) {
    const entry = trackData.compositionTimeOffsetTable[i];
    leastDecodeToDisplayDelta = Math.min(leastDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
    greatestDecodeToDisplayDelta = Math.max(greatestDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
  }
  for (let i = 0;i < trackData.samples.length; i++) {
    const sample = trackData.samples[i];
    compositionStartTime = Math.min(compositionStartTime, intoTimescale(sample.timestamp, trackData.timescale));
    compositionEndTime = Math.max(compositionEndTime, intoTimescale(sample.timestamp + sample.duration, trackData.timescale));
  }
  const compositionToDtsShift = Math.max(-leastDecodeToDisplayDelta, 0);
  if (compositionEndTime >= 2 ** 31) {
    return null;
  }
  return fullBox("cslg", 0, 0, [
    i32(compositionToDtsShift),
    i32(leastDecodeToDisplayDelta),
    i32(greatestDecodeToDisplayDelta),
    i32(compositionStartTime),
    i32(compositionEndTime)
  ]);
};
var mvex = (trackDatas) => {
  return box("mvex", undefined, trackDatas.map(trex));
};
var trex = (trackData) => {
  return fullBox("trex", 0, 0, [
    u32(trackData.track.id),
    u32(1),
    u32(0),
    u32(0),
    u32(0)
  ]);
};
var moof = (sequenceNumber, trackDatas) => {
  return box("moof", undefined, [
    mfhd(sequenceNumber),
    ...trackDatas.map(traf)
  ]);
};
var mfhd = (sequenceNumber) => {
  return fullBox("mfhd", 0, 0, [
    u32(sequenceNumber)
  ]);
};
var fragmentSampleFlags = (sample) => {
  let byte1 = 0;
  let byte2 = 0;
  const byte3 = 0;
  const byte4 = 0;
  const sampleIsDifferenceSample = sample.type === "delta";
  byte2 |= +sampleIsDifferenceSample;
  if (sampleIsDifferenceSample) {
    byte1 |= 1;
  } else {
    byte1 |= 2;
  }
  return byte1 << 24 | byte2 << 16 | byte3 << 8 | byte4;
};
var traf = (trackData) => {
  return box("traf", undefined, [
    tfhd(trackData),
    tfdt(trackData),
    trun(trackData)
  ]);
};
var tfhd = (trackData) => {
  assert(trackData.currentChunk);
  let tfFlags = 0;
  tfFlags |= 8;
  tfFlags |= 16;
  tfFlags |= 32;
  tfFlags |= 131072;
  const referenceSample = trackData.currentChunk.samples[1] ?? trackData.currentChunk.samples[0];
  const referenceSampleInfo = {
    duration: referenceSample.timescaleUnitsToNextSample,
    size: referenceSample.size,
    flags: fragmentSampleFlags(referenceSample)
  };
  return fullBox("tfhd", 0, tfFlags, [
    u32(trackData.track.id),
    u32(referenceSampleInfo.duration),
    u32(referenceSampleInfo.size),
    u32(referenceSampleInfo.flags)
  ]);
};
var tfdt = (trackData) => {
  assert(trackData.currentChunk);
  return fullBox("tfdt", 1, 0, [
    u64(intoTimescale(trackData.currentChunk.startTimestamp, trackData.timescale))
  ]);
};
var trun = (trackData) => {
  assert(trackData.currentChunk);
  const allSampleDurations = trackData.currentChunk.samples.map((x) => x.timescaleUnitsToNextSample);
  const allSampleSizes = trackData.currentChunk.samples.map((x) => x.size);
  const allSampleFlags = trackData.currentChunk.samples.map(fragmentSampleFlags);
  const allSampleCompositionTimeOffsets = trackData.currentChunk.samples.map((x) => intoTimescale(x.timestamp - x.decodeTimestamp, trackData.timescale));
  const uniqueSampleDurations = new Set(allSampleDurations);
  const uniqueSampleSizes = new Set(allSampleSizes);
  const uniqueSampleFlags = new Set(allSampleFlags);
  const uniqueSampleCompositionTimeOffsets = new Set(allSampleCompositionTimeOffsets);
  const firstSampleFlagsPresent = uniqueSampleFlags.size === 2 && allSampleFlags[0] !== allSampleFlags[1];
  const sampleDurationPresent = uniqueSampleDurations.size > 1;
  const sampleSizePresent = uniqueSampleSizes.size > 1;
  const sampleFlagsPresent = !firstSampleFlagsPresent && uniqueSampleFlags.size > 1;
  const sampleCompositionTimeOffsetsPresent = uniqueSampleCompositionTimeOffsets.size > 1 || [...uniqueSampleCompositionTimeOffsets].some((x) => x !== 0);
  let flags = 0;
  flags |= 1;
  flags |= 4 * +firstSampleFlagsPresent;
  flags |= 256 * +sampleDurationPresent;
  flags |= 512 * +sampleSizePresent;
  flags |= 1024 * +sampleFlagsPresent;
  flags |= 2048 * +sampleCompositionTimeOffsetsPresent;
  return fullBox("trun", 1, flags, [
    u32(trackData.currentChunk.samples.length),
    u32(trackData.currentChunk.offset - trackData.currentChunk.moofOffset || 0),
    firstSampleFlagsPresent ? u32(allSampleFlags[0]) : [],
    trackData.currentChunk.samples.map((_, i) => [
      sampleDurationPresent ? u32(allSampleDurations[i]) : [],
      sampleSizePresent ? u32(allSampleSizes[i]) : [],
      sampleFlagsPresent ? u32(allSampleFlags[i]) : [],
      sampleCompositionTimeOffsetsPresent ? i32(allSampleCompositionTimeOffsets[i]) : []
    ])
  ]);
};
var mfra = (trackDatas) => {
  return box("mfra", undefined, [
    ...trackDatas.map(tfra),
    mfro()
  ]);
};
var tfra = (trackData, trackIndex) => {
  const version = 1;
  return fullBox("tfra", version, 0, [
    u32(trackData.track.id),
    u32(63),
    u32(trackData.finalizedChunks.length),
    trackData.finalizedChunks.map((chunk) => [
      u64(intoTimescale(chunk.samples[0].timestamp, trackData.timescale)),
      u64(chunk.moofOffset),
      u32(trackIndex + 1),
      u32(1),
      u32(1)
    ])
  ]);
};
var mfro = () => {
  return fullBox("mfro", 0, 0, [
    u32(0)
  ]);
};
var vtte = () => box("vtte");
var vttc = (payload, timestamp, identifier, settings, sourceId) => box("vttc", undefined, [
  sourceId !== null ? box("vsid", [i32(sourceId)]) : null,
  identifier !== null ? box("iden", [...textEncoder.encode(identifier)]) : null,
  timestamp !== null ? box("ctim", [...textEncoder.encode(formatSubtitleTimestamp(timestamp))]) : null,
  settings !== null ? box("sttg", [...textEncoder.encode(settings)]) : null,
  box("payl", [...textEncoder.encode(payload)])
]);
var vtta = (notes) => box("vtta", [...textEncoder.encode(notes)]);
var udta = (muxer) => {
  const boxes = [];
  const metadataFormat = muxer.format._options.metadataFormat ?? "auto";
  const metadataTags = muxer.output._metadataTags;
  if (metadataFormat === "mdir" || metadataFormat === "auto" && !muxer.isQuickTime) {
    const metaBox = metaMdir(metadataTags);
    if (metaBox)
      boxes.push(metaBox);
  } else if (metadataFormat === "mdta") {
    const metaBox = metaMdta(metadataTags);
    if (metaBox)
      boxes.push(metaBox);
  } else if (metadataFormat === "udta" || metadataFormat === "auto" && muxer.isQuickTime) {
    addQuickTimeMetadataTagBoxes(boxes, muxer.output._metadataTags);
  }
  if (boxes.length === 0) {
    return null;
  }
  return box("udta", undefined, boxes);
};
var addQuickTimeMetadataTagBoxes = (boxes, tags) => {
  for (const { key, value } of keyValueIterator(tags)) {
    switch (key) {
      case "title":
        {
          boxes.push(metadataTagStringBoxShort("©nam", value));
        }
        ;
        break;
      case "description":
        {
          boxes.push(metadataTagStringBoxShort("©des", value));
        }
        ;
        break;
      case "artist":
        {
          boxes.push(metadataTagStringBoxShort("©ART", value));
        }
        ;
        break;
      case "album":
        {
          boxes.push(metadataTagStringBoxShort("©alb", value));
        }
        ;
        break;
      case "albumArtist":
        {
          boxes.push(metadataTagStringBoxShort("albr", value));
        }
        ;
        break;
      case "genre":
        {
          boxes.push(metadataTagStringBoxShort("©gen", value));
        }
        ;
        break;
      case "date":
        {
          boxes.push(metadataTagStringBoxShort("©day", value.toISOString().slice(0, 10)));
        }
        ;
        break;
      case "comment":
        {
          boxes.push(metadataTagStringBoxShort("©cmt", value));
        }
        ;
        break;
      case "lyrics":
        {
          boxes.push(metadataTagStringBoxShort("©lyr", value));
        }
        ;
        break;
      case "raw":
        {}
        ;
        break;
      case "discNumber":
      case "discsTotal":
      case "trackNumber":
      case "tracksTotal":
      case "images":
        {}
        ;
        break;
      default:
        assertNever(key);
    }
  }
  if (tags.raw) {
    for (const key in tags.raw) {
      const value = tags.raw[key];
      if (value == null || key.length !== 4 || boxes.some((x) => x.type === key)) {
        continue;
      }
      if (typeof value === "string") {
        boxes.push(metadataTagStringBoxShort(key, value));
      } else if (value instanceof Uint8Array) {
        boxes.push(box(key, Array.from(value)));
      }
    }
  }
};
var metadataTagStringBoxShort = (name, value) => {
  const encoded = textEncoder.encode(value);
  return box(name, [
    u16(encoded.length),
    u16(getLanguageCodeInt("und")),
    Array.from(encoded)
  ]);
};
var DATA_BOX_MIME_TYPE_MAP = {
  "image/jpeg": 13,
  "image/png": 14,
  "image/bmp": 27
};
var generateMetadataPairs = (tags, isMdta) => {
  const pairs = [];
  for (const { key, value } of keyValueIterator(tags)) {
    switch (key) {
      case "title":
        {
          pairs.push({ key: isMdta ? "title" : "©nam", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "description":
        {
          pairs.push({ key: isMdta ? "description" : "©des", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "artist":
        {
          pairs.push({ key: isMdta ? "artist" : "©ART", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "album":
        {
          pairs.push({ key: isMdta ? "album" : "©alb", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "albumArtist":
        {
          pairs.push({ key: isMdta ? "album_artist" : "aART", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "comment":
        {
          pairs.push({ key: isMdta ? "comment" : "©cmt", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "genre":
        {
          pairs.push({ key: isMdta ? "genre" : "©gen", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "lyrics":
        {
          pairs.push({ key: isMdta ? "lyrics" : "©lyr", value: dataStringBoxLong(value) });
        }
        ;
        break;
      case "date":
        {
          pairs.push({
            key: isMdta ? "date" : "©day",
            value: dataStringBoxLong(value.toISOString().slice(0, 10))
          });
        }
        ;
        break;
      case "images":
        {
          for (const image of value) {
            if (image.kind !== "coverFront") {
              continue;
            }
            pairs.push({ key: "covr", value: box("data", [
              u32(DATA_BOX_MIME_TYPE_MAP[image.mimeType] ?? 0),
              u32(0),
              Array.from(image.data)
            ]) });
          }
        }
        ;
        break;
      case "trackNumber":
        {
          if (isMdta) {
            const string = tags.tracksTotal !== undefined ? `${value}/${tags.tracksTotal}` : value.toString();
            pairs.push({ key: "track", value: dataStringBoxLong(string) });
          } else {
            pairs.push({ key: "trkn", value: box("data", [
              u32(0),
              u32(0),
              u16(0),
              u16(value),
              u16(tags.tracksTotal ?? 0),
              u16(0)
            ]) });
          }
        }
        ;
        break;
      case "discNumber":
        {
          if (!isMdta) {
            pairs.push({ key: "disc", value: box("data", [
              u32(0),
              u32(0),
              u16(0),
              u16(value),
              u16(tags.discsTotal ?? 0),
              u16(0)
            ]) });
          }
        }
        ;
        break;
      case "tracksTotal":
      case "discsTotal":
        {}
        ;
        break;
      case "raw":
        {}
        ;
        break;
      default:
        assertNever(key);
    }
  }
  if (tags.raw) {
    for (const key in tags.raw) {
      const value = tags.raw[key];
      if (value == null || !isMdta && key.length !== 4 || pairs.some((x) => x.key === key)) {
        continue;
      }
      if (typeof value === "string") {
        pairs.push({ key, value: dataStringBoxLong(value) });
      } else if (value instanceof Uint8Array) {
        pairs.push({ key, value: box("data", [
          u32(0),
          u32(0),
          Array.from(value)
        ]) });
      } else if (value instanceof RichImageData) {
        pairs.push({ key, value: box("data", [
          u32(DATA_BOX_MIME_TYPE_MAP[value.mimeType] ?? 0),
          u32(0),
          Array.from(value.data)
        ]) });
      }
    }
  }
  return pairs;
};
var metaMdir = (tags) => {
  const pairs = generateMetadataPairs(tags, false);
  if (pairs.length === 0) {
    return null;
  }
  return fullBox("meta", 0, 0, undefined, [
    hdlr(false, "mdir", "", "appl"),
    box("ilst", undefined, pairs.map((pair) => box(pair.key, undefined, [pair.value])))
  ]);
};
var metaMdta = (tags) => {
  const pairs = generateMetadataPairs(tags, true);
  if (pairs.length === 0) {
    return null;
  }
  return box("meta", undefined, [
    hdlr(false, "mdta", ""),
    fullBox("keys", 0, 0, [
      u32(pairs.length)
    ], pairs.map((pair) => box("mdta", [
      ...textEncoder.encode(pair.key)
    ]))),
    box("ilst", undefined, pairs.map((pair, i) => {
      const boxName = String.fromCharCode(...u32(i + 1));
      return box(boxName, undefined, [pair.value]);
    }))
  ]);
};
var dataStringBoxLong = (value) => {
  return box("data", [
    u32(1),
    u32(0),
    ...textEncoder.encode(value)
  ]);
};
var videoCodecToBoxName = (codec, fullCodecString) => {
  switch (codec) {
    case "avc":
      return fullCodecString.startsWith("avc3") ? "avc3" : "avc1";
    case "hevc":
      return "hvc1";
    case "vp8":
      return "vp08";
    case "vp9":
      return "vp09";
    case "av1":
      return "av01";
  }
};
var VIDEO_CODEC_TO_CONFIGURATION_BOX = {
  avc: avcC,
  hevc: hvcC,
  vp8: vpcC,
  vp9: vpcC,
  av1: av1C
};
var audioCodecToBoxName = (codec, isQuickTime) => {
  switch (codec) {
    case "aac":
      return "mp4a";
    case "mp3":
      return "mp4a";
    case "opus":
      return "Opus";
    case "vorbis":
      return "mp4a";
    case "flac":
      return "fLaC";
    case "ulaw":
      return "ulaw";
    case "alaw":
      return "alaw";
    case "pcm-u8":
      return "raw ";
    case "pcm-s8":
      return "sowt";
  }
  if (isQuickTime) {
    switch (codec) {
      case "pcm-s16":
        return "sowt";
      case "pcm-s16be":
        return "twos";
      case "pcm-s24":
        return "in24";
      case "pcm-s24be":
        return "in24";
      case "pcm-s32":
        return "in32";
      case "pcm-s32be":
        return "in32";
      case "pcm-f32":
        return "fl32";
      case "pcm-f32be":
        return "fl32";
      case "pcm-f64":
        return "fl64";
      case "pcm-f64be":
        return "fl64";
    }
  } else {
    switch (codec) {
      case "pcm-s16":
        return "ipcm";
      case "pcm-s16be":
        return "ipcm";
      case "pcm-s24":
        return "ipcm";
      case "pcm-s24be":
        return "ipcm";
      case "pcm-s32":
        return "ipcm";
      case "pcm-s32be":
        return "ipcm";
      case "pcm-f32":
        return "fpcm";
      case "pcm-f32be":
        return "fpcm";
      case "pcm-f64":
        return "fpcm";
      case "pcm-f64be":
        return "fpcm";
    }
  }
};
var audioCodecToConfigurationBox = (codec, isQuickTime) => {
  switch (codec) {
    case "aac":
      return esds;
    case "mp3":
      return esds;
    case "opus":
      return dOps;
    case "vorbis":
      return esds;
    case "flac":
      return dfLa;
  }
  if (isQuickTime) {
    switch (codec) {
      case "pcm-s24":
        return wave;
      case "pcm-s24be":
        return wave;
      case "pcm-s32":
        return wave;
      case "pcm-s32be":
        return wave;
      case "pcm-f32":
        return wave;
      case "pcm-f32be":
        return wave;
      case "pcm-f64":
        return wave;
      case "pcm-f64be":
        return wave;
    }
  } else {
    switch (codec) {
      case "pcm-s16":
        return pcmC;
      case "pcm-s16be":
        return pcmC;
      case "pcm-s24":
        return pcmC;
      case "pcm-s24be":
        return pcmC;
      case "pcm-s32":
        return pcmC;
      case "pcm-s32be":
        return pcmC;
      case "pcm-f32":
        return pcmC;
      case "pcm-f32be":
        return pcmC;
      case "pcm-f64":
        return pcmC;
      case "pcm-f64be":
        return pcmC;
    }
  }
  return null;
};
var SUBTITLE_CODEC_TO_BOX_NAME = {
  webvtt: "wvtt"
};
var SUBTITLE_CODEC_TO_CONFIGURATION_BOX = {
  webvtt: vttC
};
var getLanguageCodeInt = (code) => {
  assert(code.length === 3);
  let language = 0;
  for (let i = 0;i < 3; i++) {
    language <<= 5;
    language += code.charCodeAt(i) - 96;
  }
  return language;
};

// ../node_modules/mediabunny/dist/modules/src/writer.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class Writer {
  constructor() {
    this.ensureMonotonicity = false;
    this.trackedWrites = null;
    this.trackedStart = -1;
    this.trackedEnd = -1;
  }
  start() {}
  maybeTrackWrites(data) {
    if (!this.trackedWrites) {
      return;
    }
    let pos = this.getPos();
    if (pos < this.trackedStart) {
      if (pos + data.byteLength <= this.trackedStart) {
        return;
      }
      data = data.subarray(this.trackedStart - pos);
      pos = 0;
    }
    const neededSize = pos + data.byteLength - this.trackedStart;
    let newLength = this.trackedWrites.byteLength;
    while (newLength < neededSize) {
      newLength *= 2;
    }
    if (newLength !== this.trackedWrites.byteLength) {
      const copy = new Uint8Array(newLength);
      copy.set(this.trackedWrites, 0);
      this.trackedWrites = copy;
    }
    this.trackedWrites.set(data, pos - this.trackedStart);
    this.trackedEnd = Math.max(this.trackedEnd, pos + data.byteLength);
  }
  startTrackingWrites() {
    this.trackedWrites = new Uint8Array(2 ** 10);
    this.trackedStart = this.getPos();
    this.trackedEnd = this.trackedStart;
  }
  stopTrackingWrites() {
    if (!this.trackedWrites) {
      throw new Error("Internal error: Can't get tracked writes since nothing was tracked.");
    }
    const slice = this.trackedWrites.subarray(0, this.trackedEnd - this.trackedStart);
    const result = {
      data: slice,
      start: this.trackedStart,
      end: this.trackedEnd
    };
    this.trackedWrites = null;
    return result;
  }
}
var ARRAY_BUFFER_INITIAL_SIZE = 2 ** 16;
var ARRAY_BUFFER_MAX_SIZE = 2 ** 32;

class BufferTargetWriter extends Writer {
  constructor(target) {
    super();
    this.pos = 0;
    this.maxPos = 0;
    this.target = target;
    this.supportsResize = "resize" in new ArrayBuffer(0);
    if (this.supportsResize) {
      try {
        this.buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE, { maxByteLength: ARRAY_BUFFER_MAX_SIZE });
      } catch {
        this.buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
        this.supportsResize = false;
      }
    } else {
      this.buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
    }
    this.bytes = new Uint8Array(this.buffer);
  }
  ensureSize(size) {
    let newLength = this.buffer.byteLength;
    while (newLength < size)
      newLength *= 2;
    if (newLength === this.buffer.byteLength)
      return;
    if (newLength > ARRAY_BUFFER_MAX_SIZE) {
      throw new Error(`ArrayBuffer exceeded maximum size of ${ARRAY_BUFFER_MAX_SIZE} bytes. Please consider using another` + ` target.`);
    }
    if (this.supportsResize) {
      this.buffer.resize(newLength);
    } else {
      const newBuffer = new ArrayBuffer(newLength);
      const newBytes = new Uint8Array(newBuffer);
      newBytes.set(this.bytes, 0);
      this.buffer = newBuffer;
      this.bytes = newBytes;
    }
  }
  write(data) {
    this.maybeTrackWrites(data);
    this.ensureSize(this.pos + data.byteLength);
    this.bytes.set(data, this.pos);
    this.target.onwrite?.(this.pos, this.pos + data.byteLength);
    this.pos += data.byteLength;
    this.maxPos = Math.max(this.maxPos, this.pos);
  }
  seek(newPos) {
    this.pos = newPos;
  }
  getPos() {
    return this.pos;
  }
  async flush() {}
  async finalize() {
    this.ensureSize(this.pos);
    this.target.buffer = this.buffer.slice(0, Math.max(this.maxPos, this.pos));
  }
  async close() {}
  getSlice(start, end) {
    return this.bytes.slice(start, end);
  }
}
var DEFAULT_CHUNK_SIZE = 2 ** 24;

// ../node_modules/mediabunny/dist/modules/src/target.js
var nodeAlias = (() => ({}));
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
class Target {
  constructor() {
    this._output = null;
    this.onwrite = null;
  }
}

class BufferTarget extends Target {
  constructor() {
    super(...arguments);
    this.buffer = null;
  }
  _createWriter() {
    return new BufferTargetWriter(this);
  }
}

// ../node_modules/mediabunny/dist/modules/src/isobmff/isobmff-muxer.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var GLOBAL_TIMESCALE = 1000;
var TIMESTAMP_OFFSET = 2082844800;
var getTrackMetadata = (trackData) => {
  const metadata = {};
  const track = trackData.track;
  if (track.metadata.name !== undefined) {
    metadata.name = track.metadata.name;
  }
  return metadata;
};
var intoTimescale = (timeInSeconds, timescale, round = true) => {
  const value = timeInSeconds * timescale;
  return round ? Math.round(value) : value;
};

class IsobmffMuxer extends Muxer {
  constructor(output, format) {
    super(output);
    this.auxTarget = new BufferTarget;
    this.auxWriter = this.auxTarget._createWriter();
    this.auxBoxWriter = new IsobmffBoxWriter(this.auxWriter);
    this.mdat = null;
    this.ftypSize = null;
    this.trackDatas = [];
    this.allTracksKnown = promiseWithResolvers();
    this.creationTime = Math.floor(Date.now() / 1000) + TIMESTAMP_OFFSET;
    this.finalizedChunks = [];
    this.nextFragmentNumber = 1;
    this.maxWrittenTimestamp = -Infinity;
    this.format = format;
    this.writer = output._writer;
    this.boxWriter = new IsobmffBoxWriter(this.writer);
    this.isQuickTime = format instanceof MovOutputFormat;
    const fastStartDefault = this.writer instanceof BufferTargetWriter ? "in-memory" : false;
    this.fastStart = format._options.fastStart ?? fastStartDefault;
    this.isFragmented = this.fastStart === "fragmented";
    if (this.fastStart === "in-memory" || this.isFragmented) {
      this.writer.ensureMonotonicity = true;
    }
    this.minimumFragmentDuration = format._options.minimumFragmentDuration ?? 1;
  }
  async start() {
    const release = await this.mutex.acquire();
    const holdsAvc = this.output._tracks.some((x) => x.type === "video" && x.source._codec === "avc");
    {
      if (this.format._options.onFtyp) {
        this.writer.startTrackingWrites();
      }
      this.boxWriter.writeBox(ftyp({
        isQuickTime: this.isQuickTime,
        holdsAvc,
        fragmented: this.isFragmented
      }));
      if (this.format._options.onFtyp) {
        const { data, start } = this.writer.stopTrackingWrites();
        this.format._options.onFtyp(data, start);
      }
    }
    this.ftypSize = this.writer.getPos();
    if (this.fastStart === "in-memory") {} else if (this.fastStart === "reserve") {
      for (const track of this.output._tracks) {
        if (track.metadata.maximumPacketCount === undefined) {
          throw new Error("All tracks must specify maximumPacketCount in their metadata when using" + " fastStart: 'reserve'.");
        }
      }
    } else if (this.isFragmented) {} else {
      if (this.format._options.onMdat) {
        this.writer.startTrackingWrites();
      }
      this.mdat = mdat(true);
      this.boxWriter.writeBox(this.mdat);
    }
    await this.writer.flush();
    release();
  }
  allTracksAreKnown() {
    for (const track of this.output._tracks) {
      if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) {
        return false;
      }
    }
    return true;
  }
  async getMimeType() {
    await this.allTracksKnown.promise;
    const codecStrings = this.trackDatas.map((trackData) => {
      if (trackData.type === "video") {
        return trackData.info.decoderConfig.codec;
      } else if (trackData.type === "audio") {
        return trackData.info.decoderConfig.codec;
      } else {
        const map = {
          webvtt: "wvtt"
        };
        return map[trackData.track.source._codec];
      }
    });
    return buildIsobmffMimeType({
      isQuickTime: this.isQuickTime,
      hasVideo: this.trackDatas.some((x) => x.type === "video"),
      hasAudio: this.trackDatas.some((x) => x.type === "audio"),
      codecStrings
    });
  }
  getVideoTrackData(track, packet, meta) {
    const existingTrackData = this.trackDatas.find((x) => x.track === track);
    if (existingTrackData) {
      return existingTrackData;
    }
    validateVideoChunkMetadata(meta);
    assert(meta);
    assert(meta.decoderConfig);
    const decoderConfig = { ...meta.decoderConfig };
    assert(decoderConfig.codedWidth !== undefined);
    assert(decoderConfig.codedHeight !== undefined);
    let requiresAnnexBTransformation = false;
    if (track.source._codec === "avc" && !decoderConfig.description) {
      const decoderConfigurationRecord = extractAvcDecoderConfigurationRecord(packet.data);
      if (!decoderConfigurationRecord) {
        throw new Error("Couldn't extract an AVCDecoderConfigurationRecord from the AVC packet. Make sure the packets are" + " in Annex B format (as specified in ITU-T-REC-H.264) when not providing a description, or" + " provide a description (must be an AVCDecoderConfigurationRecord as specified in ISO 14496-15)" + " and ensure the packets are in AVCC format.");
      }
      decoderConfig.description = serializeAvcDecoderConfigurationRecord(decoderConfigurationRecord);
      requiresAnnexBTransformation = true;
    } else if (track.source._codec === "hevc" && !decoderConfig.description) {
      const decoderConfigurationRecord = extractHevcDecoderConfigurationRecord(packet.data);
      if (!decoderConfigurationRecord) {
        throw new Error("Couldn't extract an HEVCDecoderConfigurationRecord from the HEVC packet. Make sure the packets" + " are in Annex B format (as specified in ITU-T-REC-H.265) when not providing a description, or" + " provide a description (must be an HEVCDecoderConfigurationRecord as specified in ISO 14496-15)" + " and ensure the packets are in HEVC format.");
      }
      decoderConfig.description = serializeHevcDecoderConfigurationRecord(decoderConfigurationRecord);
      requiresAnnexBTransformation = true;
    }
    const timescale = computeRationalApproximation(1 / (track.metadata.frameRate ?? 57600), 1e6).denominator;
    const newTrackData = {
      muxer: this,
      track,
      type: "video",
      info: {
        width: decoderConfig.codedWidth,
        height: decoderConfig.codedHeight,
        decoderConfig,
        requiresAnnexBTransformation
      },
      timescale,
      samples: [],
      sampleQueue: [],
      timestampProcessingQueue: [],
      timeToSampleTable: [],
      compositionTimeOffsetTable: [],
      lastTimescaleUnits: null,
      lastSample: null,
      finalizedChunks: [],
      currentChunk: null,
      compactlyCodedChunkTable: []
    };
    this.trackDatas.push(newTrackData);
    this.trackDatas.sort((a, b) => a.track.id - b.track.id);
    if (this.allTracksAreKnown()) {
      this.allTracksKnown.resolve();
    }
    return newTrackData;
  }
  getAudioTrackData(track, packet, meta) {
    const existingTrackData = this.trackDatas.find((x) => x.track === track);
    if (existingTrackData) {
      return existingTrackData;
    }
    validateAudioChunkMetadata(meta);
    assert(meta);
    assert(meta.decoderConfig);
    const decoderConfig = { ...meta.decoderConfig };
    let requiresAdtsStripping = false;
    if (track.source._codec === "aac" && !decoderConfig.description) {
      const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packet.data));
      if (!adtsFrame) {
        throw new Error("Couldn't parse ADTS header from the AAC packet. Make sure the packets are in ADTS format" + " (as specified in ISO 13818-7) when not providing a description, or provide a description" + " (must be an AudioSpecificConfig as specified in ISO 14496-3) and ensure the packets" + " are raw AAC data.");
      }
      const sampleRate = aacFrequencyTable[adtsFrame.samplingFrequencyIndex];
      const numberOfChannels = aacChannelMap[adtsFrame.channelConfiguration];
      if (sampleRate === undefined || numberOfChannels === undefined) {
        throw new Error("Invalid ADTS frame header.");
      }
      decoderConfig.description = buildAacAudioSpecificConfig({
        objectType: adtsFrame.objectType,
        sampleRate,
        numberOfChannels
      });
      requiresAdtsStripping = true;
    }
    const newTrackData = {
      muxer: this,
      track,
      type: "audio",
      info: {
        numberOfChannels: meta.decoderConfig.numberOfChannels,
        sampleRate: meta.decoderConfig.sampleRate,
        decoderConfig,
        requiresPcmTransformation: !this.isFragmented && PCM_AUDIO_CODECS.includes(track.source._codec),
        requiresAdtsStripping
      },
      timescale: meta.decoderConfig.sampleRate,
      samples: [],
      sampleQueue: [],
      timestampProcessingQueue: [],
      timeToSampleTable: [],
      compositionTimeOffsetTable: [],
      lastTimescaleUnits: null,
      lastSample: null,
      finalizedChunks: [],
      currentChunk: null,
      compactlyCodedChunkTable: []
    };
    this.trackDatas.push(newTrackData);
    this.trackDatas.sort((a, b) => a.track.id - b.track.id);
    if (this.allTracksAreKnown()) {
      this.allTracksKnown.resolve();
    }
    return newTrackData;
  }
  getSubtitleTrackData(track, meta) {
    const existingTrackData = this.trackDatas.find((x) => x.track === track);
    if (existingTrackData) {
      return existingTrackData;
    }
    validateSubtitleMetadata(meta);
    assert(meta);
    assert(meta.config);
    const newTrackData = {
      muxer: this,
      track,
      type: "subtitle",
      info: {
        config: meta.config
      },
      timescale: 1000,
      samples: [],
      sampleQueue: [],
      timestampProcessingQueue: [],
      timeToSampleTable: [],
      compositionTimeOffsetTable: [],
      lastTimescaleUnits: null,
      lastSample: null,
      finalizedChunks: [],
      currentChunk: null,
      compactlyCodedChunkTable: [],
      lastCueEndTimestamp: 0,
      cueQueue: [],
      nextSourceId: 0,
      cueToSourceId: new WeakMap
    };
    this.trackDatas.push(newTrackData);
    this.trackDatas.sort((a, b) => a.track.id - b.track.id);
    if (this.allTracksAreKnown()) {
      this.allTracksKnown.resolve();
    }
    return newTrackData;
  }
  async addEncodedVideoPacket(track, packet, meta) {
    const release = await this.mutex.acquire();
    try {
      const trackData = this.getVideoTrackData(track, packet, meta);
      let packetData = packet.data;
      if (trackData.info.requiresAnnexBTransformation) {
        const nalUnits = [...iterateNalUnitsInAnnexB(packetData)].map((loc) => packetData.subarray(loc.offset, loc.offset + loc.length));
        if (nalUnits.length === 0) {
          throw new Error("Failed to transform packet data. Make sure all packets are provided in Annex B format, as" + " specified in ITU-T-REC-H.264 and ITU-T-REC-H.265.");
        }
        packetData = concatNalUnitsInLengthPrefixed(nalUnits, 4);
      }
      const timestamp = this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, packet.type === "key");
      const internalSample = this.createSampleForTrack(trackData, packetData, timestamp, packet.duration, packet.type);
      await this.registerSample(trackData, internalSample);
    } finally {
      release();
    }
  }
  async addEncodedAudioPacket(track, packet, meta) {
    const release = await this.mutex.acquire();
    try {
      const trackData = this.getAudioTrackData(track, packet, meta);
      let packetData = packet.data;
      if (trackData.info.requiresAdtsStripping) {
        const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packetData));
        if (!adtsFrame) {
          throw new Error("Expected ADTS frame, didn't get one.");
        }
        const headerLength = adtsFrame.crcCheck === null ? MIN_ADTS_FRAME_HEADER_SIZE : MAX_ADTS_FRAME_HEADER_SIZE;
        packetData = packetData.subarray(headerLength);
      }
      const timestamp = this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, packet.type === "key");
      const internalSample = this.createSampleForTrack(trackData, packetData, timestamp, packet.duration, packet.type);
      if (trackData.info.requiresPcmTransformation) {
        await this.maybePadWithSilence(trackData, timestamp);
      }
      await this.registerSample(trackData, internalSample);
    } finally {
      release();
    }
  }
  async maybePadWithSilence(trackData, untilTimestamp) {
    const lastSample = last(trackData.samples);
    const lastEndTimestamp = lastSample ? lastSample.timestamp + lastSample.duration : 0;
    const delta = untilTimestamp - lastEndTimestamp;
    const deltaInTimescale = intoTimescale(delta, trackData.timescale);
    if (deltaInTimescale > 0) {
      const { sampleSize, silentValue } = parsePcmCodec(trackData.info.decoderConfig.codec);
      const samplesNeeded = deltaInTimescale * trackData.info.numberOfChannels;
      const data = new Uint8Array(sampleSize * samplesNeeded).fill(silentValue);
      const paddingSample = this.createSampleForTrack(trackData, new Uint8Array(data.buffer), lastEndTimestamp, delta, "key");
      await this.registerSample(trackData, paddingSample);
    }
  }
  async addSubtitleCue(track, cue, meta) {
    const release = await this.mutex.acquire();
    try {
      const trackData = this.getSubtitleTrackData(track, meta);
      this.validateAndNormalizeTimestamp(trackData.track, cue.timestamp, true);
      if (track.source._codec === "webvtt") {
        trackData.cueQueue.push(cue);
        await this.processWebVTTCues(trackData, cue.timestamp);
      } else {}
    } finally {
      release();
    }
  }
  async processWebVTTCues(trackData, until) {
    while (trackData.cueQueue.length > 0) {
      const timestamps = new Set([]);
      for (const cue of trackData.cueQueue) {
        assert(cue.timestamp <= until);
        assert(trackData.lastCueEndTimestamp <= cue.timestamp + cue.duration);
        timestamps.add(Math.max(cue.timestamp, trackData.lastCueEndTimestamp));
        timestamps.add(cue.timestamp + cue.duration);
      }
      const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
      const sampleStart = sortedTimestamps[0];
      const sampleEnd = sortedTimestamps[1] ?? sampleStart;
      if (until < sampleEnd) {
        break;
      }
      if (trackData.lastCueEndTimestamp < sampleStart) {
        this.auxWriter.seek(0);
        const box2 = vtte();
        this.auxBoxWriter.writeBox(box2);
        const body2 = this.auxWriter.getSlice(0, this.auxWriter.getPos());
        const sample2 = this.createSampleForTrack(trackData, body2, trackData.lastCueEndTimestamp, sampleStart - trackData.lastCueEndTimestamp, "key");
        await this.registerSample(trackData, sample2);
        trackData.lastCueEndTimestamp = sampleStart;
      }
      this.auxWriter.seek(0);
      for (let i = 0;i < trackData.cueQueue.length; i++) {
        const cue = trackData.cueQueue[i];
        if (cue.timestamp >= sampleEnd) {
          break;
        }
        inlineTimestampRegex.lastIndex = 0;
        const containsTimestamp = inlineTimestampRegex.test(cue.text);
        const endTimestamp = cue.timestamp + cue.duration;
        let sourceId = trackData.cueToSourceId.get(cue);
        if (sourceId === undefined && sampleEnd < endTimestamp) {
          sourceId = trackData.nextSourceId++;
          trackData.cueToSourceId.set(cue, sourceId);
        }
        if (cue.notes) {
          const box3 = vtta(cue.notes);
          this.auxBoxWriter.writeBox(box3);
        }
        const box2 = vttc(cue.text, containsTimestamp ? sampleStart : null, cue.identifier ?? null, cue.settings ?? null, sourceId ?? null);
        this.auxBoxWriter.writeBox(box2);
        if (endTimestamp === sampleEnd) {
          trackData.cueQueue.splice(i--, 1);
        }
      }
      const body = this.auxWriter.getSlice(0, this.auxWriter.getPos());
      const sample = this.createSampleForTrack(trackData, body, sampleStart, sampleEnd - sampleStart, "key");
      await this.registerSample(trackData, sample);
      trackData.lastCueEndTimestamp = sampleEnd;
    }
  }
  createSampleForTrack(trackData, data, timestamp, duration, type) {
    const sample = {
      timestamp,
      decodeTimestamp: timestamp,
      duration,
      data,
      size: data.byteLength,
      type,
      timescaleUnitsToNextSample: intoTimescale(duration, trackData.timescale)
    };
    return sample;
  }
  processTimestamps(trackData, nextSample) {
    if (trackData.timestampProcessingQueue.length === 0) {
      return;
    }
    if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
      let totalDuration = 0;
      for (let i = 0;i < trackData.timestampProcessingQueue.length; i++) {
        const sample = trackData.timestampProcessingQueue[i];
        const duration = intoTimescale(sample.duration, trackData.timescale);
        totalDuration += duration;
      }
      if (trackData.timeToSampleTable.length === 0) {
        trackData.timeToSampleTable.push({
          sampleCount: totalDuration,
          sampleDelta: 1
        });
      } else {
        const lastEntry = last(trackData.timeToSampleTable);
        lastEntry.sampleCount += totalDuration;
      }
      trackData.timestampProcessingQueue.length = 0;
      return;
    }
    const sortedTimestamps = trackData.timestampProcessingQueue.map((x) => x.timestamp).sort((a, b) => a - b);
    for (let i = 0;i < trackData.timestampProcessingQueue.length; i++) {
      const sample = trackData.timestampProcessingQueue[i];
      sample.decodeTimestamp = sortedTimestamps[i];
      if (!this.isFragmented && trackData.lastTimescaleUnits === null) {
        sample.decodeTimestamp = 0;
      }
      const sampleCompositionTimeOffset = intoTimescale(sample.timestamp - sample.decodeTimestamp, trackData.timescale);
      const durationInTimescale = intoTimescale(sample.duration, trackData.timescale);
      if (trackData.lastTimescaleUnits !== null) {
        assert(trackData.lastSample);
        const timescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
        const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
        assert(delta >= 0);
        trackData.lastTimescaleUnits += delta;
        trackData.lastSample.timescaleUnitsToNextSample = delta;
        if (!this.isFragmented) {
          let lastTableEntry = last(trackData.timeToSampleTable);
          assert(lastTableEntry);
          if (lastTableEntry.sampleCount === 1) {
            lastTableEntry.sampleDelta = delta;
            const entryBefore = trackData.timeToSampleTable[trackData.timeToSampleTable.length - 2];
            if (entryBefore && entryBefore.sampleDelta === delta) {
              entryBefore.sampleCount++;
              trackData.timeToSampleTable.pop();
              lastTableEntry = entryBefore;
            }
          } else if (lastTableEntry.sampleDelta !== delta) {
            lastTableEntry.sampleCount--;
            trackData.timeToSampleTable.push(lastTableEntry = {
              sampleCount: 1,
              sampleDelta: delta
            });
          }
          if (lastTableEntry.sampleDelta === durationInTimescale) {
            lastTableEntry.sampleCount++;
          } else {
            trackData.timeToSampleTable.push({
              sampleCount: 1,
              sampleDelta: durationInTimescale
            });
          }
          const lastCompositionTimeOffsetTableEntry = last(trackData.compositionTimeOffsetTable);
          assert(lastCompositionTimeOffsetTableEntry);
          if (lastCompositionTimeOffsetTableEntry.sampleCompositionTimeOffset === sampleCompositionTimeOffset) {
            lastCompositionTimeOffsetTableEntry.sampleCount++;
          } else {
            trackData.compositionTimeOffsetTable.push({
              sampleCount: 1,
              sampleCompositionTimeOffset
            });
          }
        }
      } else {
        trackData.lastTimescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
        if (!this.isFragmented) {
          trackData.timeToSampleTable.push({
            sampleCount: 1,
            sampleDelta: durationInTimescale
          });
          trackData.compositionTimeOffsetTable.push({
            sampleCount: 1,
            sampleCompositionTimeOffset
          });
        }
      }
      trackData.lastSample = sample;
    }
    trackData.timestampProcessingQueue.length = 0;
    assert(trackData.lastSample);
    assert(trackData.lastTimescaleUnits !== null);
    if (nextSample !== undefined && trackData.lastSample.timescaleUnitsToNextSample === 0) {
      assert(nextSample.type === "key");
      const timescaleUnits = intoTimescale(nextSample.timestamp, trackData.timescale, false);
      const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
      trackData.lastSample.timescaleUnitsToNextSample = delta;
    }
  }
  async registerSample(trackData, sample) {
    if (sample.type === "key") {
      this.processTimestamps(trackData, sample);
    }
    trackData.timestampProcessingQueue.push(sample);
    if (this.isFragmented) {
      trackData.sampleQueue.push(sample);
      await this.interleaveSamples();
    } else if (this.fastStart === "reserve") {
      await this.registerSampleFastStartReserve(trackData, sample);
    } else {
      await this.addSampleToTrack(trackData, sample);
    }
  }
  async addSampleToTrack(trackData, sample) {
    if (!this.isFragmented) {
      trackData.samples.push(sample);
      if (this.fastStart === "reserve") {
        const maximumPacketCount = trackData.track.metadata.maximumPacketCount;
        assert(maximumPacketCount !== undefined);
        if (trackData.samples.length > maximumPacketCount) {
          throw new Error(`Track #${trackData.track.id} has already reached the maximum packet count` + ` (${maximumPacketCount}). Either add less packets or increase the maximum packet count.`);
        }
      }
    }
    let beginNewChunk = false;
    if (!trackData.currentChunk) {
      beginNewChunk = true;
    } else {
      trackData.currentChunk.startTimestamp = Math.min(trackData.currentChunk.startTimestamp, sample.timestamp);
      const currentChunkDuration = sample.timestamp - trackData.currentChunk.startTimestamp;
      if (this.isFragmented) {
        const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData) => {
          if (trackData === otherTrackData) {
            return sample.type === "key";
          }
          const firstQueuedSample = otherTrackData.sampleQueue[0];
          if (firstQueuedSample) {
            return firstQueuedSample.type === "key";
          }
          return otherTrackData.track.source._closed;
        });
        if (currentChunkDuration >= this.minimumFragmentDuration && keyFrameQueuedEverywhere && sample.timestamp > this.maxWrittenTimestamp) {
          beginNewChunk = true;
          await this.finalizeFragment();
        }
      } else {
        beginNewChunk = currentChunkDuration >= 0.5;
      }
    }
    if (beginNewChunk) {
      if (trackData.currentChunk) {
        await this.finalizeCurrentChunk(trackData);
      }
      trackData.currentChunk = {
        startTimestamp: sample.timestamp,
        samples: [],
        offset: null,
        moofOffset: null
      };
    }
    assert(trackData.currentChunk);
    trackData.currentChunk.samples.push(sample);
    if (this.isFragmented) {
      this.maxWrittenTimestamp = Math.max(this.maxWrittenTimestamp, sample.timestamp);
    }
  }
  async finalizeCurrentChunk(trackData) {
    assert(!this.isFragmented);
    if (!trackData.currentChunk)
      return;
    trackData.finalizedChunks.push(trackData.currentChunk);
    this.finalizedChunks.push(trackData.currentChunk);
    let sampleCount = trackData.currentChunk.samples.length;
    if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
      sampleCount = trackData.currentChunk.samples.reduce((acc, sample) => acc + intoTimescale(sample.duration, trackData.timescale), 0);
    }
    if (trackData.compactlyCodedChunkTable.length === 0 || last(trackData.compactlyCodedChunkTable).samplesPerChunk !== sampleCount) {
      trackData.compactlyCodedChunkTable.push({
        firstChunk: trackData.finalizedChunks.length,
        samplesPerChunk: sampleCount
      });
    }
    if (this.fastStart === "in-memory") {
      trackData.currentChunk.offset = 0;
      return;
    }
    trackData.currentChunk.offset = this.writer.getPos();
    for (const sample of trackData.currentChunk.samples) {
      assert(sample.data);
      this.writer.write(sample.data);
      sample.data = null;
    }
    await this.writer.flush();
  }
  async interleaveSamples(isFinalCall = false) {
    assert(this.isFragmented);
    if (!isFinalCall && !this.allTracksAreKnown()) {
      return;
    }
    outer:
      while (true) {
        let trackWithMinTimestamp = null;
        let minTimestamp = Infinity;
        for (const trackData of this.trackDatas) {
          if (!isFinalCall && trackData.sampleQueue.length === 0 && !trackData.track.source._closed) {
            break outer;
          }
          if (trackData.sampleQueue.length > 0 && trackData.sampleQueue[0].timestamp < minTimestamp) {
            trackWithMinTimestamp = trackData;
            minTimestamp = trackData.sampleQueue[0].timestamp;
          }
        }
        if (!trackWithMinTimestamp) {
          break;
        }
        const sample = trackWithMinTimestamp.sampleQueue.shift();
        await this.addSampleToTrack(trackWithMinTimestamp, sample);
      }
  }
  async finalizeFragment(flushWriter = true) {
    assert(this.isFragmented);
    const fragmentNumber = this.nextFragmentNumber++;
    if (fragmentNumber === 1) {
      if (this.format._options.onMoov) {
        this.writer.startTrackingWrites();
      }
      const movieBox = moov(this);
      this.boxWriter.writeBox(movieBox);
      if (this.format._options.onMoov) {
        const { data, start } = this.writer.stopTrackingWrites();
        this.format._options.onMoov(data, start);
      }
    }
    const tracksInFragment = this.trackDatas.filter((x) => x.currentChunk);
    const moofBox = moof(fragmentNumber, tracksInFragment);
    const moofOffset = this.writer.getPos();
    const mdatStartPos = moofOffset + this.boxWriter.measureBox(moofBox);
    let currentPos = mdatStartPos + MIN_BOX_HEADER_SIZE;
    let fragmentStartTimestamp = Infinity;
    for (const trackData of tracksInFragment) {
      trackData.currentChunk.offset = currentPos;
      trackData.currentChunk.moofOffset = moofOffset;
      for (const sample of trackData.currentChunk.samples) {
        currentPos += sample.size;
      }
      fragmentStartTimestamp = Math.min(fragmentStartTimestamp, trackData.currentChunk.startTimestamp);
    }
    const mdatSize = currentPos - mdatStartPos;
    const needsLargeMdatSize = mdatSize >= 2 ** 32;
    if (needsLargeMdatSize) {
      for (const trackData of tracksInFragment) {
        trackData.currentChunk.offset += MAX_BOX_HEADER_SIZE - MIN_BOX_HEADER_SIZE;
      }
    }
    if (this.format._options.onMoof) {
      this.writer.startTrackingWrites();
    }
    const newMoofBox = moof(fragmentNumber, tracksInFragment);
    this.boxWriter.writeBox(newMoofBox);
    if (this.format._options.onMoof) {
      const { data, start } = this.writer.stopTrackingWrites();
      this.format._options.onMoof(data, start, fragmentStartTimestamp);
    }
    assert(this.writer.getPos() === mdatStartPos);
    if (this.format._options.onMdat) {
      this.writer.startTrackingWrites();
    }
    const mdatBox = mdat(needsLargeMdatSize);
    mdatBox.size = mdatSize;
    this.boxWriter.writeBox(mdatBox);
    this.writer.seek(mdatStartPos + (needsLargeMdatSize ? MAX_BOX_HEADER_SIZE : MIN_BOX_HEADER_SIZE));
    for (const trackData of tracksInFragment) {
      for (const sample of trackData.currentChunk.samples) {
        this.writer.write(sample.data);
        sample.data = null;
      }
    }
    if (this.format._options.onMdat) {
      const { data, start } = this.writer.stopTrackingWrites();
      this.format._options.onMdat(data, start);
    }
    for (const trackData of tracksInFragment) {
      trackData.finalizedChunks.push(trackData.currentChunk);
      this.finalizedChunks.push(trackData.currentChunk);
      trackData.currentChunk = null;
    }
    if (flushWriter) {
      await this.writer.flush();
    }
  }
  async registerSampleFastStartReserve(trackData, sample) {
    if (this.allTracksAreKnown()) {
      if (!this.mdat) {
        const moovBox = moov(this);
        const moovSize = this.boxWriter.measureBox(moovBox);
        const reservedSize = moovSize + this.computeSampleTableSizeUpperBound() + 4096;
        assert(this.ftypSize !== null);
        this.writer.seek(this.ftypSize + reservedSize);
        if (this.format._options.onMdat) {
          this.writer.startTrackingWrites();
        }
        this.mdat = mdat(true);
        this.boxWriter.writeBox(this.mdat);
        for (const trackData2 of this.trackDatas) {
          for (const sample2 of trackData2.sampleQueue) {
            await this.addSampleToTrack(trackData2, sample2);
          }
          trackData2.sampleQueue.length = 0;
        }
      }
      await this.addSampleToTrack(trackData, sample);
    } else {
      trackData.sampleQueue.push(sample);
    }
  }
  computeSampleTableSizeUpperBound() {
    assert(this.fastStart === "reserve");
    let upperBound = 0;
    for (const trackData of this.trackDatas) {
      const n = trackData.track.metadata.maximumPacketCount;
      assert(n !== undefined);
      upperBound += (4 + 4) * Math.ceil(2 / 3 * n);
      upperBound += 4 * n;
      upperBound += (4 + 4) * Math.ceil(2 / 3 * n);
      upperBound += (4 + 4 + 4) * Math.ceil(2 / 3 * n);
      upperBound += 4 * n;
      upperBound += 8 * n;
    }
    return upperBound;
  }
  async onTrackClose(track) {
    const release = await this.mutex.acquire();
    if (track.type === "subtitle" && track.source._codec === "webvtt") {
      const trackData = this.trackDatas.find((x) => x.track === track);
      if (trackData) {
        await this.processWebVTTCues(trackData, Infinity);
      }
    }
    if (this.allTracksAreKnown()) {
      this.allTracksKnown.resolve();
    }
    if (this.isFragmented) {
      await this.interleaveSamples();
    }
    release();
  }
  async finalize() {
    const release = await this.mutex.acquire();
    this.allTracksKnown.resolve();
    for (const trackData of this.trackDatas) {
      if (trackData.type === "subtitle" && trackData.track.source._codec === "webvtt") {
        await this.processWebVTTCues(trackData, Infinity);
      }
    }
    if (this.isFragmented) {
      await this.interleaveSamples(true);
      for (const trackData of this.trackDatas) {
        this.processTimestamps(trackData);
      }
      await this.finalizeFragment(false);
    } else {
      for (const trackData of this.trackDatas) {
        this.processTimestamps(trackData);
        await this.finalizeCurrentChunk(trackData);
      }
    }
    if (this.fastStart === "in-memory") {
      this.mdat = mdat(false);
      let mdatSize;
      for (let i = 0;i < 2; i++) {
        const movieBox2 = moov(this);
        const movieBoxSize = this.boxWriter.measureBox(movieBox2);
        mdatSize = this.boxWriter.measureBox(this.mdat);
        let currentChunkPos = this.writer.getPos() + movieBoxSize + mdatSize;
        for (const chunk of this.finalizedChunks) {
          chunk.offset = currentChunkPos;
          for (const { data } of chunk.samples) {
            assert(data);
            currentChunkPos += data.byteLength;
            mdatSize += data.byteLength;
          }
        }
        if (currentChunkPos < 2 ** 32)
          break;
        if (mdatSize >= 2 ** 32)
          this.mdat.largeSize = true;
      }
      if (this.format._options.onMoov) {
        this.writer.startTrackingWrites();
      }
      const movieBox = moov(this);
      this.boxWriter.writeBox(movieBox);
      if (this.format._options.onMoov) {
        const { data, start } = this.writer.stopTrackingWrites();
        this.format._options.onMoov(data, start);
      }
      if (this.format._options.onMdat) {
        this.writer.startTrackingWrites();
      }
      this.mdat.size = mdatSize;
      this.boxWriter.writeBox(this.mdat);
      for (const chunk of this.finalizedChunks) {
        for (const sample of chunk.samples) {
          assert(sample.data);
          this.writer.write(sample.data);
          sample.data = null;
        }
      }
      if (this.format._options.onMdat) {
        const { data, start } = this.writer.stopTrackingWrites();
        this.format._options.onMdat(data, start);
      }
    } else if (this.isFragmented) {
      const startPos = this.writer.getPos();
      const mfraBox = mfra(this.trackDatas);
      this.boxWriter.writeBox(mfraBox);
      const mfraBoxSize = this.writer.getPos() - startPos;
      this.writer.seek(this.writer.getPos() - 4);
      this.boxWriter.writeU32(mfraBoxSize);
    } else {
      assert(this.mdat);
      const mdatPos = this.boxWriter.offsets.get(this.mdat);
      assert(mdatPos !== undefined);
      const mdatSize = this.writer.getPos() - mdatPos;
      this.mdat.size = mdatSize;
      this.mdat.largeSize = mdatSize >= 2 ** 32;
      this.boxWriter.patchBox(this.mdat);
      if (this.format._options.onMdat) {
        const { data, start } = this.writer.stopTrackingWrites();
        this.format._options.onMdat(data, start);
      }
      const movieBox = moov(this);
      if (this.fastStart === "reserve") {
        assert(this.ftypSize !== null);
        this.writer.seek(this.ftypSize);
        if (this.format._options.onMoov) {
          this.writer.startTrackingWrites();
        }
        this.boxWriter.writeBox(movieBox);
        const remainingSpace = this.boxWriter.offsets.get(this.mdat) - this.writer.getPos();
        this.boxWriter.writeBox(free(remainingSpace));
      } else {
        if (this.format._options.onMoov) {
          this.writer.startTrackingWrites();
        }
        this.boxWriter.writeBox(movieBox);
      }
      if (this.format._options.onMoov) {
        const { data, start } = this.writer.stopTrackingWrites();
        this.format._options.onMoov(data, start);
      }
    }
    release();
  }
}

// ../node_modules/mediabunny/dist/modules/src/output-format.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class OutputFormat {
  getSupportedVideoCodecs() {
    return this.getSupportedCodecs().filter((codec) => VIDEO_CODECS.includes(codec));
  }
  getSupportedAudioCodecs() {
    return this.getSupportedCodecs().filter((codec) => AUDIO_CODECS.includes(codec));
  }
  getSupportedSubtitleCodecs() {
    return this.getSupportedCodecs().filter((codec) => SUBTITLE_CODECS.includes(codec));
  }
  _codecUnsupportedHint(codec) {
    return "";
  }
}

class IsobmffOutputFormat extends OutputFormat {
  constructor(options = {}) {
    if (!options || typeof options !== "object") {
      throw new TypeError("options must be an object.");
    }
    if (options.fastStart !== undefined && ![false, "in-memory", "reserve", "fragmented"].includes(options.fastStart)) {
      throw new TypeError("options.fastStart, when provided, must be false, 'in-memory', 'reserve', or 'fragmented'.");
    }
    if (options.minimumFragmentDuration !== undefined && (!Number.isFinite(options.minimumFragmentDuration) || options.minimumFragmentDuration < 0)) {
      throw new TypeError("options.minimumFragmentDuration, when provided, must be a non-negative number.");
    }
    if (options.onFtyp !== undefined && typeof options.onFtyp !== "function") {
      throw new TypeError("options.onFtyp, when provided, must be a function.");
    }
    if (options.onMoov !== undefined && typeof options.onMoov !== "function") {
      throw new TypeError("options.onMoov, when provided, must be a function.");
    }
    if (options.onMdat !== undefined && typeof options.onMdat !== "function") {
      throw new TypeError("options.onMdat, when provided, must be a function.");
    }
    if (options.onMoof !== undefined && typeof options.onMoof !== "function") {
      throw new TypeError("options.onMoof, when provided, must be a function.");
    }
    if (options.metadataFormat !== undefined && !["mdir", "mdta", "udta", "auto"].includes(options.metadataFormat)) {
      throw new TypeError("options.metadataFormat, when provided, must be either 'auto', 'mdir', 'mdta', or 'udta'.");
    }
    super();
    this._options = options;
  }
  getSupportedTrackCounts() {
    const max = 2 ** 32 - 1;
    return {
      video: { min: 0, max },
      audio: { min: 0, max },
      subtitle: { min: 0, max },
      total: { min: 1, max }
    };
  }
  get supportsVideoRotationMetadata() {
    return true;
  }
  _createMuxer(output) {
    return new IsobmffMuxer(output, this);
  }
}

class Mp4OutputFormat extends IsobmffOutputFormat {
  constructor(options) {
    super(options);
  }
  get _name() {
    return "MP4";
  }
  get fileExtension() {
    return ".mp4";
  }
  get mimeType() {
    return "video/mp4";
  }
  getSupportedCodecs() {
    return [
      ...VIDEO_CODECS,
      ...NON_PCM_AUDIO_CODECS,
      "pcm-s16",
      "pcm-s16be",
      "pcm-s24",
      "pcm-s24be",
      "pcm-s32",
      "pcm-s32be",
      "pcm-f32",
      "pcm-f32be",
      "pcm-f64",
      "pcm-f64be",
      ...SUBTITLE_CODECS
    ];
  }
  _codecUnsupportedHint(codec) {
    if (new MovOutputFormat().getSupportedCodecs().includes(codec)) {
      return " Switching to MOV will grant support for this codec.";
    }
    return "";
  }
}

class MovOutputFormat extends IsobmffOutputFormat {
  constructor(options) {
    super(options);
  }
  get _name() {
    return "MOV";
  }
  get fileExtension() {
    return ".mov";
  }
  get mimeType() {
    return "video/quicktime";
  }
  getSupportedCodecs() {
    return [
      ...VIDEO_CODECS,
      ...AUDIO_CODECS
    ];
  }
  _codecUnsupportedHint(codec) {
    if (new Mp4OutputFormat().getSupportedCodecs().includes(codec)) {
      return " Switching to MP4 will grant support for this codec.";
    }
    return "";
  }
}

// ../node_modules/mediabunny/dist/modules/src/encode.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var validateVideoEncodingConfig = (config) => {
  if (!config || typeof config !== "object") {
    throw new TypeError("Encoding config must be an object.");
  }
  if (!VIDEO_CODECS.includes(config.codec)) {
    throw new TypeError(`Invalid video codec '${config.codec}'. Must be one of: ${VIDEO_CODECS.join(", ")}.`);
  }
  if (!(config.bitrate instanceof Quality) && (!Number.isInteger(config.bitrate) || config.bitrate <= 0)) {
    throw new TypeError("config.bitrate must be a positive integer or a quality.");
  }
  if (config.keyFrameInterval !== undefined && (!Number.isFinite(config.keyFrameInterval) || config.keyFrameInterval < 0)) {
    throw new TypeError("config.keyFrameInterval, when provided, must be a non-negative number.");
  }
  if (config.sizeChangeBehavior !== undefined && !["deny", "passThrough", "fill", "contain", "cover"].includes(config.sizeChangeBehavior)) {
    throw new TypeError("config.sizeChangeBehavior, when provided, must be 'deny', 'passThrough', 'fill', 'contain'" + " or 'cover'.");
  }
  if (config.onEncodedPacket !== undefined && typeof config.onEncodedPacket !== "function") {
    throw new TypeError("config.onEncodedChunk, when provided, must be a function.");
  }
  if (config.onEncoderConfig !== undefined && typeof config.onEncoderConfig !== "function") {
    throw new TypeError("config.onEncoderConfig, when provided, must be a function.");
  }
  validateVideoEncodingAdditionalOptions(config.codec, config);
};
var validateVideoEncodingAdditionalOptions = (codec, options) => {
  if (!options || typeof options !== "object") {
    throw new TypeError("Encoding options must be an object.");
  }
  if (options.alpha !== undefined && !["discard", "keep"].includes(options.alpha)) {
    throw new TypeError("options.alpha, when provided, must be 'discard' or 'keep'.");
  }
  if (options.bitrateMode !== undefined && !["constant", "variable"].includes(options.bitrateMode)) {
    throw new TypeError("bitrateMode, when provided, must be 'constant' or 'variable'.");
  }
  if (options.latencyMode !== undefined && !["quality", "realtime"].includes(options.latencyMode)) {
    throw new TypeError("latencyMode, when provided, must be 'quality' or 'realtime'.");
  }
  if (options.fullCodecString !== undefined && typeof options.fullCodecString !== "string") {
    throw new TypeError("fullCodecString, when provided, must be a string.");
  }
  if (options.fullCodecString !== undefined && inferCodecFromCodecString(options.fullCodecString) !== codec) {
    throw new TypeError(`fullCodecString, when provided, must be a string that matches the specified codec (${codec}).`);
  }
  if (options.hardwareAcceleration !== undefined && !["no-preference", "prefer-hardware", "prefer-software"].includes(options.hardwareAcceleration)) {
    throw new TypeError("hardwareAcceleration, when provided, must be 'no-preference', 'prefer-hardware' or" + " 'prefer-software'.");
  }
  if (options.scalabilityMode !== undefined && typeof options.scalabilityMode !== "string") {
    throw new TypeError("scalabilityMode, when provided, must be a string.");
  }
  if (options.contentHint !== undefined && typeof options.contentHint !== "string") {
    throw new TypeError("contentHint, when provided, must be a string.");
  }
};
var buildVideoEncoderConfig = (options) => {
  const resolvedBitrate = options.bitrate instanceof Quality ? options.bitrate._toVideoBitrate(options.codec, options.width, options.height) : options.bitrate;
  return {
    codec: options.fullCodecString ?? buildVideoCodecString(options.codec, options.width, options.height, resolvedBitrate),
    width: options.width,
    height: options.height,
    bitrate: resolvedBitrate,
    bitrateMode: options.bitrateMode,
    alpha: options.alpha ?? "discard",
    framerate: options.framerate,
    latencyMode: options.latencyMode,
    hardwareAcceleration: options.hardwareAcceleration,
    scalabilityMode: options.scalabilityMode,
    contentHint: options.contentHint,
    ...getVideoEncoderConfigExtension(options.codec)
  };
};
var validateAudioEncodingConfig = (config) => {
  if (!config || typeof config !== "object") {
    throw new TypeError("Encoding config must be an object.");
  }
  if (!AUDIO_CODECS.includes(config.codec)) {
    throw new TypeError(`Invalid audio codec '${config.codec}'. Must be one of: ${AUDIO_CODECS.join(", ")}.`);
  }
  if (config.bitrate === undefined && (!PCM_AUDIO_CODECS.includes(config.codec) || config.codec === "flac")) {
    throw new TypeError("config.bitrate must be provided for compressed audio codecs.");
  }
  if (config.bitrate !== undefined && !(config.bitrate instanceof Quality) && (!Number.isInteger(config.bitrate) || config.bitrate <= 0)) {
    throw new TypeError("config.bitrate, when provided, must be a positive integer or a quality.");
  }
  if (config.onEncodedPacket !== undefined && typeof config.onEncodedPacket !== "function") {
    throw new TypeError("config.onEncodedChunk, when provided, must be a function.");
  }
  if (config.onEncoderConfig !== undefined && typeof config.onEncoderConfig !== "function") {
    throw new TypeError("config.onEncoderConfig, when provided, must be a function.");
  }
  validateAudioEncodingAdditionalOptions(config.codec, config);
};
var validateAudioEncodingAdditionalOptions = (codec, options) => {
  if (!options || typeof options !== "object") {
    throw new TypeError("Encoding options must be an object.");
  }
  if (options.bitrateMode !== undefined && !["constant", "variable"].includes(options.bitrateMode)) {
    throw new TypeError("bitrateMode, when provided, must be 'constant' or 'variable'.");
  }
  if (options.fullCodecString !== undefined && typeof options.fullCodecString !== "string") {
    throw new TypeError("fullCodecString, when provided, must be a string.");
  }
  if (options.fullCodecString !== undefined && inferCodecFromCodecString(options.fullCodecString) !== codec) {
    throw new TypeError(`fullCodecString, when provided, must be a string that matches the specified codec (${codec}).`);
  }
};
var buildAudioEncoderConfig = (options) => {
  const resolvedBitrate = options.bitrate instanceof Quality ? options.bitrate._toAudioBitrate(options.codec) : options.bitrate;
  return {
    codec: options.fullCodecString ?? buildAudioCodecString(options.codec, options.numberOfChannels, options.sampleRate),
    numberOfChannels: options.numberOfChannels,
    sampleRate: options.sampleRate,
    bitrate: resolvedBitrate,
    bitrateMode: options.bitrateMode,
    ...getAudioEncoderConfigExtension(options.codec)
  };
};

class Quality {
  constructor(factor) {
    this._factor = factor;
  }
  _toVideoBitrate(codec, width, height) {
    const pixels = width * height;
    const codecEfficiencyFactors = {
      avc: 1,
      hevc: 0.6,
      vp9: 0.6,
      av1: 0.4,
      vp8: 1.2
    };
    const referencePixels = 1920 * 1080;
    const referenceBitrate = 3000000;
    const scaleFactor = Math.pow(pixels / referencePixels, 0.95);
    const baseBitrate = referenceBitrate * scaleFactor;
    const codecAdjustedBitrate = baseBitrate * codecEfficiencyFactors[codec];
    const finalBitrate = codecAdjustedBitrate * this._factor;
    return Math.ceil(finalBitrate / 1000) * 1000;
  }
  _toAudioBitrate(codec) {
    if (PCM_AUDIO_CODECS.includes(codec) || codec === "flac") {
      return;
    }
    const baseRates = {
      aac: 128000,
      opus: 64000,
      mp3: 160000,
      vorbis: 64000
    };
    const baseBitrate = baseRates[codec];
    if (!baseBitrate) {
      throw new Error(`Unhandled codec: ${codec}`);
    }
    let finalBitrate = baseBitrate * this._factor;
    if (codec === "aac") {
      const validRates = [96000, 128000, 160000, 192000];
      finalBitrate = validRates.reduce((prev, curr) => Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
    } else if (codec === "opus" || codec === "vorbis") {
      finalBitrate = Math.max(6000, finalBitrate);
    } else if (codec === "mp3") {
      const validRates = [
        8000,
        16000,
        24000,
        32000,
        40000,
        48000,
        64000,
        80000,
        96000,
        112000,
        128000,
        160000,
        192000,
        224000,
        256000,
        320000
      ];
      finalBitrate = validRates.reduce((prev, curr) => Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
    }
    return Math.round(finalBitrate / 1000) * 1000;
  }
}
var QUALITY_HIGH = /* @__PURE__ */ new Quality(2);

// ../node_modules/mediabunny/dist/modules/src/media-source.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

class MediaSource {
  constructor() {
    this._connectedTrack = null;
    this._closingPromise = null;
    this._closed = false;
    this._timestampOffset = 0;
  }
  _ensureValidAdd() {
    if (!this._connectedTrack) {
      throw new Error("Source is not connected to an output track.");
    }
    if (this._connectedTrack.output.state === "canceled") {
      throw new Error("Output has been canceled.");
    }
    if (this._connectedTrack.output.state === "finalizing" || this._connectedTrack.output.state === "finalized") {
      throw new Error("Output has been finalized.");
    }
    if (this._connectedTrack.output.state === "pending") {
      throw new Error("Output has not started.");
    }
    if (this._closed) {
      throw new Error("Source is closed.");
    }
  }
  async _start() {}
  async _flushAndClose(forceClose) {}
  close() {
    if (this._closingPromise) {
      return;
    }
    const connectedTrack = this._connectedTrack;
    if (!connectedTrack) {
      throw new Error("Cannot call close without connecting the source to an output track.");
    }
    if (connectedTrack.output.state === "pending") {
      throw new Error("Cannot call close before output has been started.");
    }
    this._closingPromise = (async () => {
      await this._flushAndClose(false);
      this._closed = true;
      if (connectedTrack.output.state === "finalizing" || connectedTrack.output.state === "finalized") {
        return;
      }
      connectedTrack.output._muxer.onTrackClose(connectedTrack);
    })();
  }
  async _flushOrWaitForOngoingClose(forceClose) {
    return this._closingPromise ??= (async () => {
      await this._flushAndClose(forceClose);
      this._closed = true;
    })();
  }
}

class VideoSource extends MediaSource {
  constructor(codec) {
    super();
    this._connectedTrack = null;
    if (!VIDEO_CODECS.includes(codec)) {
      throw new TypeError(`Invalid video codec '${codec}'. Must be one of: ${VIDEO_CODECS.join(", ")}.`);
    }
    this._codec = codec;
  }
}
class VideoEncoderWrapper {
  constructor(source, encodingConfig) {
    this.source = source;
    this.encodingConfig = encodingConfig;
    this.ensureEncoderPromise = null;
    this.encoderInitialized = false;
    this.encoder = null;
    this.muxer = null;
    this.lastMultipleOfKeyFrameInterval = -1;
    this.codedWidth = null;
    this.codedHeight = null;
    this.resizeCanvas = null;
    this.customEncoder = null;
    this.customEncoderCallSerializer = new CallSerializer;
    this.customEncoderQueueSize = 0;
    this.alphaEncoder = null;
    this.splitter = null;
    this.splitterCreationFailed = false;
    this.alphaFrameQueue = [];
    this.error = null;
    this.errorNeedsNewStack = true;
  }
  async add(videoSample, shouldClose, encodeOptions) {
    try {
      this.checkForEncoderError();
      this.source._ensureValidAdd();
      if (this.codedWidth !== null && this.codedHeight !== null) {
        if (videoSample.codedWidth !== this.codedWidth || videoSample.codedHeight !== this.codedHeight) {
          const sizeChangeBehavior = this.encodingConfig.sizeChangeBehavior ?? "deny";
          if (sizeChangeBehavior === "passThrough") {} else if (sizeChangeBehavior === "deny") {
            throw new Error(`Video sample size must remain constant. Expected ${this.codedWidth}x${this.codedHeight},` + ` got ${videoSample.codedWidth}x${videoSample.codedHeight}. To allow the sample size to` + ` change over time, set \`sizeChangeBehavior\` to a value other than 'strict' in the` + ` encoding options.`);
          } else {
            let canvasIsNew = false;
            if (!this.resizeCanvas) {
              if (typeof document !== "undefined") {
                this.resizeCanvas = document.createElement("canvas");
                this.resizeCanvas.width = this.codedWidth;
                this.resizeCanvas.height = this.codedHeight;
              } else {
                this.resizeCanvas = new OffscreenCanvas(this.codedWidth, this.codedHeight);
              }
              canvasIsNew = true;
            }
            const context = this.resizeCanvas.getContext("2d", {
              alpha: isFirefox()
            });
            assert(context);
            if (!canvasIsNew) {
              if (isFirefox()) {
                context.fillStyle = "black";
                context.fillRect(0, 0, this.codedWidth, this.codedHeight);
              } else {
                context.clearRect(0, 0, this.codedWidth, this.codedHeight);
              }
            }
            videoSample.drawWithFit(context, { fit: sizeChangeBehavior });
            if (shouldClose) {
              videoSample.close();
            }
            videoSample = new VideoSample(this.resizeCanvas, {
              timestamp: videoSample.timestamp,
              duration: videoSample.duration,
              rotation: videoSample.rotation
            });
            shouldClose = true;
          }
        }
      } else {
        this.codedWidth = videoSample.codedWidth;
        this.codedHeight = videoSample.codedHeight;
      }
      if (!this.encoderInitialized) {
        if (!this.ensureEncoderPromise) {
          this.ensureEncoder(videoSample);
        }
        if (!this.encoderInitialized) {
          await this.ensureEncoderPromise;
        }
      }
      assert(this.encoderInitialized);
      const keyFrameInterval = this.encodingConfig.keyFrameInterval ?? 5;
      const multipleOfKeyFrameInterval = Math.floor(videoSample.timestamp / keyFrameInterval);
      const finalEncodeOptions = {
        ...encodeOptions,
        keyFrame: encodeOptions?.keyFrame || keyFrameInterval === 0 || multipleOfKeyFrameInterval !== this.lastMultipleOfKeyFrameInterval
      };
      this.lastMultipleOfKeyFrameInterval = multipleOfKeyFrameInterval;
      if (this.customEncoder) {
        this.customEncoderQueueSize++;
        const clonedSample = videoSample.clone();
        const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample, finalEncodeOptions)).then(() => this.customEncoderQueueSize--).catch((error) => this.error ??= error).finally(() => {
          clonedSample.close();
        });
        if (this.customEncoderQueueSize >= 4) {
          await promise;
        }
      } else {
        assert(this.encoder);
        const videoFrame = videoSample.toVideoFrame();
        if (!this.alphaEncoder) {
          this.encoder.encode(videoFrame, finalEncodeOptions);
          videoFrame.close();
        } else {
          const frameDefinitelyHasNoAlpha = !!videoFrame.format && !videoFrame.format.includes("A");
          if (frameDefinitelyHasNoAlpha || this.splitterCreationFailed) {
            this.alphaFrameQueue.push(null);
            this.encoder.encode(videoFrame, finalEncodeOptions);
            videoFrame.close();
          } else {
            const width = videoFrame.displayWidth;
            const height = videoFrame.displayHeight;
            if (!this.splitter) {
              try {
                this.splitter = new ColorAlphaSplitter(width, height);
              } catch (error) {
                console.error("Due to an error, only color data will be encoded.", error);
                this.splitterCreationFailed = true;
                this.alphaFrameQueue.push(null);
                this.encoder.encode(videoFrame, finalEncodeOptions);
                videoFrame.close();
              }
            }
            if (this.splitter) {
              const colorFrame = this.splitter.extractColor(videoFrame);
              const alphaFrame = this.splitter.extractAlpha(videoFrame);
              this.alphaFrameQueue.push(alphaFrame);
              this.encoder.encode(colorFrame, finalEncodeOptions);
              colorFrame.close();
              videoFrame.close();
            }
          }
        }
        if (shouldClose) {
          videoSample.close();
        }
        if (this.encoder.encodeQueueSize >= 4) {
          await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
        }
      }
      await this.muxer.mutex.currentPromise;
    } finally {
      if (shouldClose) {
        videoSample.close();
      }
    }
  }
  ensureEncoder(videoSample) {
    const encoderError = new Error;
    this.ensureEncoderPromise = (async () => {
      const encoderConfig = buildVideoEncoderConfig({
        width: videoSample.codedWidth,
        height: videoSample.codedHeight,
        ...this.encodingConfig,
        framerate: this.source._connectedTrack?.metadata.frameRate
      });
      this.encodingConfig.onEncoderConfig?.(encoderConfig);
      const MatchingCustomEncoder = customVideoEncoders.find((x) => x.supports(this.encodingConfig.codec, encoderConfig));
      if (MatchingCustomEncoder) {
        this.customEncoder = new MatchingCustomEncoder;
        this.customEncoder.codec = this.encodingConfig.codec;
        this.customEncoder.config = encoderConfig;
        this.customEncoder.onPacket = (packet, meta) => {
          if (!(packet instanceof EncodedPacket)) {
            throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
          }
          if (meta !== undefined && (!meta || typeof meta !== "object")) {
            throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
          }
          this.encodingConfig.onEncodedPacket?.(packet, meta);
          this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
            this.error ??= error;
            this.errorNeedsNewStack = false;
          });
        };
        await this.customEncoder.init();
      } else {
        if (typeof VideoEncoder === "undefined") {
          throw new Error("VideoEncoder is not supported by this browser.");
        }
        encoderConfig.alpha = "discard";
        if (this.encodingConfig.alpha === "keep") {
          encoderConfig.latencyMode = "quality";
        }
        const hasOddDimension = encoderConfig.width % 2 === 1 || encoderConfig.height % 2 === 1;
        if (hasOddDimension && (this.encodingConfig.codec === "avc" || this.encodingConfig.codec === "hevc")) {
          throw new Error(`The dimensions ${encoderConfig.width}x${encoderConfig.height} are not supported for codec` + ` '${this.encodingConfig.codec}'; both width and height must be even numbers. Make sure to` + ` round your dimensions to the nearest even number.`);
        }
        const support = await VideoEncoder.isConfigSupported(encoderConfig);
        if (!support.supported) {
          throw new Error(`This specific encoder configuration (${encoderConfig.codec}, ${encoderConfig.bitrate} bps,` + ` ${encoderConfig.width}x${encoderConfig.height}, hardware acceleration:` + ` ${encoderConfig.hardwareAcceleration ?? "no-preference"}) is not supported by this browser.` + ` Consider using another codec or changing your video parameters.`);
        }
        const colorChunkQueue = [];
        const nullAlphaChunkQueue = [];
        let encodedAlphaChunkCount = 0;
        let alphaEncoderQueue = 0;
        const addPacket = (colorChunk, alphaChunk, meta) => {
          const sideData = {};
          if (alphaChunk) {
            const alphaData = new Uint8Array(alphaChunk.byteLength);
            alphaChunk.copyTo(alphaData);
            sideData.alpha = alphaData;
          }
          const packet = EncodedPacket.fromEncodedChunk(colorChunk, sideData);
          this.encodingConfig.onEncodedPacket?.(packet, meta);
          this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
            this.error ??= error;
            this.errorNeedsNewStack = false;
          });
        };
        this.encoder = new VideoEncoder({
          output: (chunk, meta) => {
            if (!this.alphaEncoder) {
              addPacket(chunk, null, meta);
              return;
            }
            const alphaFrame = this.alphaFrameQueue.shift();
            assert(alphaFrame !== undefined);
            if (alphaFrame) {
              this.alphaEncoder.encode(alphaFrame, {
                keyFrame: chunk.type === "key"
              });
              alphaEncoderQueue++;
              alphaFrame.close();
              colorChunkQueue.push({ chunk, meta });
            } else {
              if (alphaEncoderQueue === 0) {
                addPacket(chunk, null, meta);
              } else {
                nullAlphaChunkQueue.push(encodedAlphaChunkCount + alphaEncoderQueue);
                colorChunkQueue.push({ chunk, meta });
              }
            }
          },
          error: (error) => {
            error.stack = encoderError.stack;
            this.error ??= error;
          }
        });
        this.encoder.configure(encoderConfig);
        if (this.encodingConfig.alpha === "keep") {
          this.alphaEncoder = new VideoEncoder({
            output: (chunk, meta) => {
              alphaEncoderQueue--;
              const colorChunk = colorChunkQueue.shift();
              assert(colorChunk !== undefined);
              addPacket(colorChunk.chunk, chunk, colorChunk.meta);
              encodedAlphaChunkCount++;
              while (nullAlphaChunkQueue.length > 0 && nullAlphaChunkQueue[0] === encodedAlphaChunkCount) {
                nullAlphaChunkQueue.shift();
                const colorChunk2 = colorChunkQueue.shift();
                assert(colorChunk2 !== undefined);
                addPacket(colorChunk2.chunk, null, colorChunk2.meta);
              }
            },
            error: (error) => {
              error.stack = encoderError.stack;
              this.error ??= error;
            }
          });
          this.alphaEncoder.configure(encoderConfig);
        }
      }
      assert(this.source._connectedTrack);
      this.muxer = this.source._connectedTrack.output._muxer;
      this.encoderInitialized = true;
    })();
  }
  async flushAndClose(forceClose) {
    if (!forceClose)
      this.checkForEncoderError();
    if (this.customEncoder) {
      if (!forceClose) {
        this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
      }
      await this.customEncoderCallSerializer.call(() => this.customEncoder.close());
    } else if (this.encoder) {
      if (!forceClose) {
        await this.encoder.flush();
        await this.alphaEncoder?.flush();
      }
      if (this.encoder.state !== "closed") {
        this.encoder.close();
      }
      if (this.alphaEncoder && this.alphaEncoder.state !== "closed") {
        this.alphaEncoder.close();
      }
      this.alphaFrameQueue.forEach((x) => x?.close());
      this.splitter?.close();
    }
    if (!forceClose)
      this.checkForEncoderError();
  }
  getQueueSize() {
    if (this.customEncoder) {
      return this.customEncoderQueueSize;
    } else {
      return this.encoder?.encodeQueueSize ?? 0;
    }
  }
  checkForEncoderError() {
    if (this.error) {
      if (this.errorNeedsNewStack) {
        this.error.stack = new Error().stack;
      }
      throw this.error;
    }
  }
}

class ColorAlphaSplitter {
  constructor(initialWidth, initialHeight) {
    this.lastFrame = null;
    if (typeof OffscreenCanvas !== "undefined") {
      this.canvas = new OffscreenCanvas(initialWidth, initialHeight);
    } else {
      this.canvas = document.createElement("canvas");
      this.canvas.width = initialWidth;
      this.canvas.height = initialHeight;
    }
    const gl = this.canvas.getContext("webgl2", {
      alpha: true
    });
    if (!gl) {
      throw new Error("Couldn't acquire WebGL 2 context.");
    }
    this.gl = gl;
    this.colorProgram = this.createColorProgram();
    this.alphaProgram = this.createAlphaProgram();
    this.vao = this.createVAO();
    this.sourceTexture = this.createTexture();
    this.alphaResolutionLocation = this.gl.getUniformLocation(this.alphaProgram, "u_resolution");
    this.gl.useProgram(this.colorProgram);
    this.gl.uniform1i(this.gl.getUniformLocation(this.colorProgram, "u_sourceTexture"), 0);
    this.gl.useProgram(this.alphaProgram);
    this.gl.uniform1i(this.gl.getUniformLocation(this.alphaProgram, "u_sourceTexture"), 0);
  }
  createVertexShader() {
    return this.createShader(this.gl.VERTEX_SHADER, `#version 300 es
			in vec2 a_position;
			in vec2 a_texCoord;
			out vec2 v_texCoord;
			
			void main() {
				gl_Position = vec4(a_position, 0.0, 1.0);
				v_texCoord = a_texCoord;
			}
		`);
  }
  createColorProgram() {
    const vertexShader = this.createVertexShader();
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `#version 300 es
			precision highp float;
			
			uniform sampler2D u_sourceTexture;
			in vec2 v_texCoord;
			out vec4 fragColor;
			
			void main() {
				vec4 source = texture(u_sourceTexture, v_texCoord);
				fragColor = vec4(source.rgb, 1.0);
			}
		`);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    return program;
  }
  createAlphaProgram() {
    const vertexShader = this.createVertexShader();
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, `#version 300 es
			precision highp float;
			
			uniform sampler2D u_sourceTexture;
			uniform vec2 u_resolution; // The width and height of the canvas
			in vec2 v_texCoord;
			out vec4 fragColor;

			// This function determines the value for a single byte in the YUV stream
			float getByteValue(float byteOffset) {
				float width = u_resolution.x;
				float height = u_resolution.y;

				float yPlaneSize = width * height;

				if (byteOffset < yPlaneSize) {
					// This byte is in the luma plane. Find the corresponding pixel coordinates to sample from
					float y = floor(byteOffset / width);
					float x = mod(byteOffset, width);
					
					// Add 0.5 to sample the center of the texel
					vec2 sampleCoord = (vec2(x, y) + 0.5) / u_resolution;
					
					// The luma value is the alpha from the source texture
					return texture(u_sourceTexture, sampleCoord).a;
				} else {
					// Write a fixed value for chroma and beyond
					return 128.0 / 255.0;
				}
			}
			
			void main() {
				// Each fragment writes 4 bytes (R, G, B, A)
				float pixelIndex = floor(gl_FragCoord.y) * u_resolution.x + floor(gl_FragCoord.x);
				float baseByteOffset = pixelIndex * 4.0;

				vec4 result;
				for (int i = 0; i < 4; i++) {
					float currentByteOffset = baseByteOffset + float(i);
					result[i] = getByteValue(currentByteOffset);
				}
				
				fragColor = result;
			}
		`);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    return program;
  }
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", this.gl.getShaderInfoLog(shader));
    }
    return shader;
  }
  createVAO() {
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao);
    const vertices = new Float32Array([
      -1,
      -1,
      0,
      1,
      1,
      -1,
      1,
      1,
      -1,
      1,
      0,
      0,
      1,
      1,
      1,
      0
    ]);
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    const positionLocation = this.gl.getAttribLocation(this.colorProgram, "a_position");
    const texCoordLocation = this.gl.getAttribLocation(this.colorProgram, "a_texCoord");
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);
    return vao;
  }
  createTexture() {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    return texture;
  }
  updateTexture(sourceFrame) {
    if (this.lastFrame === sourceFrame) {
      return;
    }
    if (sourceFrame.displayWidth !== this.canvas.width || sourceFrame.displayHeight !== this.canvas.height) {
      this.canvas.width = sourceFrame.displayWidth;
      this.canvas.height = sourceFrame.displayHeight;
    }
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, sourceFrame);
    this.lastFrame = sourceFrame;
  }
  extractColor(sourceFrame) {
    this.updateTexture(sourceFrame);
    this.gl.useProgram(this.colorProgram);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    return new VideoFrame(this.canvas, {
      timestamp: sourceFrame.timestamp,
      duration: sourceFrame.duration ?? undefined,
      alpha: "discard"
    });
  }
  extractAlpha(sourceFrame) {
    this.updateTexture(sourceFrame);
    this.gl.useProgram(this.alphaProgram);
    this.gl.uniform2f(this.alphaResolutionLocation, this.canvas.width, this.canvas.height);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    const { width, height } = this.canvas;
    const chromaSamples = Math.ceil(width / 2) * Math.ceil(height / 2);
    const yuvSize = width * height + chromaSamples * 2;
    const requiredHeight = Math.ceil(yuvSize / (width * 4));
    let yuv = new Uint8Array(4 * width * requiredHeight);
    this.gl.readPixels(0, 0, width, requiredHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, yuv);
    yuv = yuv.subarray(0, yuvSize);
    assert(yuv[width * height] === 128);
    assert(yuv[yuv.length - 1] === 128);
    const init = {
      format: "I420",
      codedWidth: width,
      codedHeight: height,
      timestamp: sourceFrame.timestamp,
      duration: sourceFrame.duration ?? undefined,
      transfer: [yuv.buffer]
    };
    return new VideoFrame(yuv, init);
  }
  close() {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.gl = null;
  }
}
class CanvasSource extends VideoSource {
  constructor(canvas, encodingConfig) {
    if (!(typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) && !(typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas)) {
      throw new TypeError("canvas must be an HTMLCanvasElement or OffscreenCanvas.");
    }
    validateVideoEncodingConfig(encodingConfig);
    super(encodingConfig.codec);
    this._encoder = new VideoEncoderWrapper(this, encodingConfig);
    this._canvas = canvas;
  }
  add(timestamp, duration = 0, encodeOptions) {
    if (!Number.isFinite(timestamp) || timestamp < 0) {
      throw new TypeError("timestamp must be a non-negative number.");
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError("duration must be a non-negative number.");
    }
    const sample = new VideoSample(this._canvas, { timestamp, duration });
    return this._encoder.add(sample, true, encodeOptions);
  }
  _flushAndClose(forceClose) {
    return this._encoder.flushAndClose(forceClose);
  }
}

class MediaStreamVideoTrackSource extends VideoSource {
  get errorPromise() {
    this._errorPromiseAccessed = true;
    return this._promiseWithResolvers.promise;
  }
  get paused() {
    return this._paused;
  }
  constructor(track, encodingConfig) {
    if (!(track instanceof MediaStreamTrack) || track.kind !== "video") {
      throw new TypeError("track must be a video MediaStreamTrack.");
    }
    validateVideoEncodingConfig(encodingConfig);
    encodingConfig = {
      ...encodingConfig,
      latencyMode: "realtime"
    };
    super(encodingConfig.codec);
    this._abortController = null;
    this._workerTrackId = null;
    this._workerListener = null;
    this._promiseWithResolvers = promiseWithResolvers();
    this._errorPromiseAccessed = false;
    this._paused = false;
    this._lastSampleTimestamp = null;
    this._pauseOffset = 0;
    this._encoder = new VideoEncoderWrapper(this, encodingConfig);
    this._track = track;
  }
  async _start() {
    if (!this._errorPromiseAccessed) {
      console.warn("Make sure not to ignore the `errorPromise` field on MediaStreamVideoTrackSource, so that any internal" + " errors get bubbled up properly.");
    }
    this._abortController = new AbortController;
    let firstVideoFrameTimestamp = null;
    let errored = false;
    const onVideoFrame = (videoFrame) => {
      if (errored) {
        videoFrame.close();
        return;
      }
      const currentTimestamp = videoFrame.timestamp / 1e6;
      if (this._paused) {
        const frameSeen = firstVideoFrameTimestamp !== null;
        if (frameSeen) {
          if (this._lastSampleTimestamp !== null) {
            const timeDelta = currentTimestamp - this._lastSampleTimestamp;
            this._pauseOffset -= timeDelta;
          }
          this._lastSampleTimestamp = currentTimestamp;
        }
        videoFrame.close();
        return;
      }
      if (firstVideoFrameTimestamp === null) {
        firstVideoFrameTimestamp = currentTimestamp;
        const muxer = this._connectedTrack.output._muxer;
        if (muxer.firstMediaStreamTimestamp === null) {
          muxer.firstMediaStreamTimestamp = performance.now() / 1000;
          this._timestampOffset = -firstVideoFrameTimestamp;
        } else {
          this._timestampOffset = performance.now() / 1000 - muxer.firstMediaStreamTimestamp - firstVideoFrameTimestamp;
        }
      }
      this._lastSampleTimestamp = currentTimestamp;
      if (this._encoder.getQueueSize() >= 4) {
        videoFrame.close();
        return;
      }
      const sample = new VideoSample(videoFrame, {
        timestamp: currentTimestamp + this._pauseOffset
      });
      this._encoder.add(sample, true).catch((error) => {
        errored = true;
        this._abortController?.abort();
        this._promiseWithResolvers.reject(error);
        if (this._workerTrackId !== null) {
          sendMessageToMediaStreamTrackProcessorWorker({
            type: "stopTrack",
            trackId: this._workerTrackId
          });
        }
      });
    };
    if (typeof MediaStreamTrackProcessor !== "undefined") {
      const processor = new MediaStreamTrackProcessor({ track: this._track });
      const consumer = new WritableStream({ write: onVideoFrame });
      processor.readable.pipeTo(consumer, {
        signal: this._abortController.signal
      }).catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        this._promiseWithResolvers.reject(error);
      });
    } else {
      const supportedInWorker = await mediaStreamTrackProcessorIsSupportedInWorker();
      if (supportedInWorker) {
        this._workerTrackId = nextMediaStreamTrackProcessorWorkerId++;
        sendMessageToMediaStreamTrackProcessorWorker({
          type: "videoTrack",
          trackId: this._workerTrackId,
          track: this._track
        });
        this._workerListener = (event) => {
          const message = event.data;
          if (message.type === "videoFrame" && message.trackId === this._workerTrackId) {
            onVideoFrame(message.videoFrame);
          } else if (message.type === "error" && message.trackId === this._workerTrackId) {
            this._promiseWithResolvers.reject(message.error);
          }
        };
        mediaStreamTrackProcessorWorker.addEventListener("message", this._workerListener);
      } else {
        throw new Error("MediaStreamTrackProcessor is required but not supported by this browser.");
      }
    }
  }
  pause() {
    this._paused = true;
  }
  resume() {
    this._paused = false;
  }
  async _flushAndClose(forceClose) {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._workerTrackId !== null) {
      assert(this._workerListener);
      sendMessageToMediaStreamTrackProcessorWorker({
        type: "stopTrack",
        trackId: this._workerTrackId
      });
      await new Promise((resolve) => {
        const listener = (event) => {
          const message = event.data;
          if (message.type === "trackStopped" && message.trackId === this._workerTrackId) {
            assert(this._workerListener);
            mediaStreamTrackProcessorWorker.removeEventListener("message", this._workerListener);
            mediaStreamTrackProcessorWorker.removeEventListener("message", listener);
            resolve();
          }
        };
        mediaStreamTrackProcessorWorker.addEventListener("message", listener);
      });
    }
    await this._encoder.flushAndClose(forceClose);
  }
}

class AudioSource extends MediaSource {
  constructor(codec) {
    super();
    this._connectedTrack = null;
    if (!AUDIO_CODECS.includes(codec)) {
      throw new TypeError(`Invalid audio codec '${codec}'. Must be one of: ${AUDIO_CODECS.join(", ")}.`);
    }
    this._codec = codec;
  }
}
class AudioEncoderWrapper {
  constructor(source, encodingConfig) {
    this.source = source;
    this.encodingConfig = encodingConfig;
    this.ensureEncoderPromise = null;
    this.encoderInitialized = false;
    this.encoder = null;
    this.muxer = null;
    this.lastNumberOfChannels = null;
    this.lastSampleRate = null;
    this.isPcmEncoder = false;
    this.outputSampleSize = null;
    this.writeOutputValue = null;
    this.customEncoder = null;
    this.customEncoderCallSerializer = new CallSerializer;
    this.customEncoderQueueSize = 0;
    this.lastEndSampleIndex = null;
    this.error = null;
    this.errorNeedsNewStack = true;
  }
  async add(audioSample, shouldClose) {
    try {
      this.checkForEncoderError();
      this.source._ensureValidAdd();
      if (this.lastNumberOfChannels !== null && this.lastSampleRate !== null) {
        if (audioSample.numberOfChannels !== this.lastNumberOfChannels || audioSample.sampleRate !== this.lastSampleRate) {
          throw new Error(`Audio parameters must remain constant. Expected ${this.lastNumberOfChannels} channels at` + ` ${this.lastSampleRate} Hz, got ${audioSample.numberOfChannels} channels at` + ` ${audioSample.sampleRate} Hz.`);
        }
      } else {
        this.lastNumberOfChannels = audioSample.numberOfChannels;
        this.lastSampleRate = audioSample.sampleRate;
      }
      if (!this.encoderInitialized) {
        if (!this.ensureEncoderPromise) {
          this.ensureEncoder(audioSample);
        }
        if (!this.encoderInitialized) {
          await this.ensureEncoderPromise;
        }
      }
      assert(this.encoderInitialized);
      {
        const startSampleIndex = Math.round(audioSample.timestamp * audioSample.sampleRate);
        const endSampleIndex = Math.round((audioSample.timestamp + audioSample.duration) * audioSample.sampleRate);
        if (this.lastEndSampleIndex === null) {
          this.lastEndSampleIndex = endSampleIndex;
        } else {
          const sampleDiff = startSampleIndex - this.lastEndSampleIndex;
          if (sampleDiff >= 64) {
            const fillSample = new AudioSample({
              data: new Float32Array(sampleDiff * audioSample.numberOfChannels),
              format: "f32-planar",
              sampleRate: audioSample.sampleRate,
              numberOfChannels: audioSample.numberOfChannels,
              numberOfFrames: sampleDiff,
              timestamp: this.lastEndSampleIndex / audioSample.sampleRate
            });
            await this.add(fillSample, true);
          }
          this.lastEndSampleIndex += audioSample.numberOfFrames;
        }
      }
      if (this.customEncoder) {
        this.customEncoderQueueSize++;
        const clonedSample = audioSample.clone();
        const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample)).then(() => this.customEncoderQueueSize--).catch((error) => this.error ??= error).finally(() => {
          clonedSample.close();
        });
        if (this.customEncoderQueueSize >= 4) {
          await promise;
        }
        await this.muxer.mutex.currentPromise;
      } else if (this.isPcmEncoder) {
        await this.doPcmEncoding(audioSample, shouldClose);
      } else {
        assert(this.encoder);
        const audioData = audioSample.toAudioData();
        this.encoder.encode(audioData);
        audioData.close();
        if (shouldClose) {
          audioSample.close();
        }
        if (this.encoder.encodeQueueSize >= 4) {
          await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
        }
        await this.muxer.mutex.currentPromise;
      }
    } finally {
      if (shouldClose) {
        audioSample.close();
      }
    }
  }
  async doPcmEncoding(audioSample, shouldClose) {
    assert(this.outputSampleSize);
    assert(this.writeOutputValue);
    const { numberOfChannels, numberOfFrames, sampleRate, timestamp } = audioSample;
    const CHUNK_SIZE = 2048;
    const outputs = [];
    for (let frame = 0;frame < numberOfFrames; frame += CHUNK_SIZE) {
      const frameCount = Math.min(CHUNK_SIZE, audioSample.numberOfFrames - frame);
      const outputSize = frameCount * numberOfChannels * this.outputSampleSize;
      const outputBuffer = new ArrayBuffer(outputSize);
      const outputView = new DataView(outputBuffer);
      outputs.push({ frameCount, view: outputView });
    }
    const allocationSize = audioSample.allocationSize({ planeIndex: 0, format: "f32-planar" });
    const floats = new Float32Array(allocationSize / Float32Array.BYTES_PER_ELEMENT);
    for (let i = 0;i < numberOfChannels; i++) {
      audioSample.copyTo(floats, { planeIndex: i, format: "f32-planar" });
      for (let j = 0;j < outputs.length; j++) {
        const { frameCount, view: view2 } = outputs[j];
        for (let k = 0;k < frameCount; k++) {
          this.writeOutputValue(view2, (k * numberOfChannels + i) * this.outputSampleSize, floats[j * CHUNK_SIZE + k]);
        }
      }
    }
    if (shouldClose) {
      audioSample.close();
    }
    const meta = {
      decoderConfig: {
        codec: this.encodingConfig.codec,
        numberOfChannels,
        sampleRate
      }
    };
    for (let i = 0;i < outputs.length; i++) {
      const { frameCount, view: view2 } = outputs[i];
      const outputBuffer = view2.buffer;
      const startFrame = i * CHUNK_SIZE;
      const packet = new EncodedPacket(new Uint8Array(outputBuffer), "key", timestamp + startFrame / sampleRate, frameCount / sampleRate);
      this.encodingConfig.onEncodedPacket?.(packet, meta);
      await this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta);
    }
  }
  ensureEncoder(audioSample) {
    const encoderError = new Error;
    this.ensureEncoderPromise = (async () => {
      const { numberOfChannels, sampleRate } = audioSample;
      const encoderConfig = buildAudioEncoderConfig({
        numberOfChannels,
        sampleRate,
        ...this.encodingConfig
      });
      this.encodingConfig.onEncoderConfig?.(encoderConfig);
      const MatchingCustomEncoder = customAudioEncoders.find((x) => x.supports(this.encodingConfig.codec, encoderConfig));
      if (MatchingCustomEncoder) {
        this.customEncoder = new MatchingCustomEncoder;
        this.customEncoder.codec = this.encodingConfig.codec;
        this.customEncoder.config = encoderConfig;
        this.customEncoder.onPacket = (packet, meta) => {
          if (!(packet instanceof EncodedPacket)) {
            throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
          }
          if (meta !== undefined && (!meta || typeof meta !== "object")) {
            throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
          }
          this.encodingConfig.onEncodedPacket?.(packet, meta);
          this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta).catch((error) => {
            this.error ??= error;
            this.errorNeedsNewStack = false;
          });
        };
        await this.customEncoder.init();
      } else if (PCM_AUDIO_CODECS.includes(this.encodingConfig.codec)) {
        this.initPcmEncoder();
      } else {
        if (typeof AudioEncoder === "undefined") {
          throw new Error("AudioEncoder is not supported by this browser.");
        }
        const support = await AudioEncoder.isConfigSupported(encoderConfig);
        if (!support.supported) {
          throw new Error(`This specific encoder configuration (${encoderConfig.codec}, ${encoderConfig.bitrate} bps,` + ` ${encoderConfig.numberOfChannels} channels, ${encoderConfig.sampleRate} Hz) is not` + ` supported by this browser. Consider using another codec or changing your audio parameters.`);
        }
        this.encoder = new AudioEncoder({
          output: (chunk, meta) => {
            if (this.encodingConfig.codec === "aac" && meta?.decoderConfig) {
              let needsDescriptionOverwrite = false;
              if (!meta.decoderConfig.description || meta.decoderConfig.description.byteLength < 2) {
                needsDescriptionOverwrite = true;
              } else {
                const audioSpecificConfig = parseAacAudioSpecificConfig(toUint8Array(meta.decoderConfig.description));
                needsDescriptionOverwrite = audioSpecificConfig.objectType === 0;
              }
              if (needsDescriptionOverwrite) {
                const objectType = Number(last(encoderConfig.codec.split(".")));
                meta.decoderConfig.description = buildAacAudioSpecificConfig({
                  objectType,
                  numberOfChannels: meta.decoderConfig.numberOfChannels,
                  sampleRate: meta.decoderConfig.sampleRate
                });
              }
            }
            const packet = EncodedPacket.fromEncodedChunk(chunk);
            this.encodingConfig.onEncodedPacket?.(packet, meta);
            this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta).catch((error) => {
              this.error ??= error;
              this.errorNeedsNewStack = false;
            });
          },
          error: (error) => {
            error.stack = encoderError.stack;
            this.error ??= error;
          }
        });
        this.encoder.configure(encoderConfig);
      }
      assert(this.source._connectedTrack);
      this.muxer = this.source._connectedTrack.output._muxer;
      this.encoderInitialized = true;
    })();
  }
  initPcmEncoder() {
    this.isPcmEncoder = true;
    const codec = this.encodingConfig.codec;
    const { dataType, sampleSize, littleEndian } = parsePcmCodec(codec);
    this.outputSampleSize = sampleSize;
    switch (sampleSize) {
      case 1:
        {
          if (dataType === "unsigned") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setUint8(byteOffset, clamp((value + 1) * 127.5, 0, 255));
          } else if (dataType === "signed") {
            this.writeOutputValue = (view2, byteOffset, value) => {
              view2.setInt8(byteOffset, clamp(Math.round(value * 128), -128, 127));
            };
          } else if (dataType === "ulaw") {
            this.writeOutputValue = (view2, byteOffset, value) => {
              const int16 = clamp(Math.floor(value * 32767), -32768, 32767);
              view2.setUint8(byteOffset, toUlaw(int16));
            };
          } else if (dataType === "alaw") {
            this.writeOutputValue = (view2, byteOffset, value) => {
              const int16 = clamp(Math.floor(value * 32767), -32768, 32767);
              view2.setUint8(byteOffset, toAlaw(int16));
            };
          } else {
            assert(false);
          }
        }
        ;
        break;
      case 2:
        {
          if (dataType === "unsigned") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setUint16(byteOffset, clamp((value + 1) * 32767.5, 0, 65535), littleEndian);
          } else if (dataType === "signed") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setInt16(byteOffset, clamp(Math.round(value * 32767), -32768, 32767), littleEndian);
          } else {
            assert(false);
          }
        }
        ;
        break;
      case 3:
        {
          if (dataType === "unsigned") {
            this.writeOutputValue = (view2, byteOffset, value) => setUint24(view2, byteOffset, clamp((value + 1) * 8388607.5, 0, 16777215), littleEndian);
          } else if (dataType === "signed") {
            this.writeOutputValue = (view2, byteOffset, value) => setInt24(view2, byteOffset, clamp(Math.round(value * 8388607), -8388608, 8388607), littleEndian);
          } else {
            assert(false);
          }
        }
        ;
        break;
      case 4:
        {
          if (dataType === "unsigned") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setUint32(byteOffset, clamp((value + 1) * 2147483647.5, 0, 4294967295), littleEndian);
          } else if (dataType === "signed") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setInt32(byteOffset, clamp(Math.round(value * 2147483647), -2147483648, 2147483647), littleEndian);
          } else if (dataType === "float") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setFloat32(byteOffset, value, littleEndian);
          } else {
            assert(false);
          }
        }
        ;
        break;
      case 8:
        {
          if (dataType === "float") {
            this.writeOutputValue = (view2, byteOffset, value) => view2.setFloat64(byteOffset, value, littleEndian);
          } else {
            assert(false);
          }
        }
        ;
        break;
      default:
        {
          assertNever(sampleSize);
          assert(false);
        }
        ;
    }
  }
  async flushAndClose(forceClose) {
    if (!forceClose)
      this.checkForEncoderError();
    if (this.customEncoder) {
      if (!forceClose) {
        this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
      }
      await this.customEncoderCallSerializer.call(() => this.customEncoder.close());
    } else if (this.encoder) {
      if (!forceClose) {
        await this.encoder.flush();
      }
      if (this.encoder.state !== "closed") {
        this.encoder.close();
      }
    }
    if (!forceClose)
      this.checkForEncoderError();
  }
  getQueueSize() {
    if (this.customEncoder) {
      return this.customEncoderQueueSize;
    } else if (this.isPcmEncoder) {
      return 0;
    } else {
      return this.encoder?.encodeQueueSize ?? 0;
    }
  }
  checkForEncoderError() {
    if (this.error) {
      if (this.errorNeedsNewStack) {
        this.error.stack = new Error().stack;
      }
      throw this.error;
    }
  }
}
class MediaStreamAudioTrackSource extends AudioSource {
  get errorPromise() {
    this._errorPromiseAccessed = true;
    return this._promiseWithResolvers.promise;
  }
  get paused() {
    return this._paused;
  }
  constructor(track, encodingConfig) {
    if (!(track instanceof MediaStreamTrack) || track.kind !== "audio") {
      throw new TypeError("track must be an audio MediaStreamTrack.");
    }
    validateAudioEncodingConfig(encodingConfig);
    super(encodingConfig.codec);
    this._abortController = null;
    this._audioContext = null;
    this._scriptProcessorNode = null;
    this._promiseWithResolvers = promiseWithResolvers();
    this._errorPromiseAccessed = false;
    this._paused = false;
    this._lastSampleTimestamp = null;
    this._pauseOffset = 0;
    this._encoder = new AudioEncoderWrapper(this, encodingConfig);
    this._track = track;
  }
  async _start() {
    if (!this._errorPromiseAccessed) {
      console.warn("Make sure not to ignore the `errorPromise` field on MediaStreamVideoTrackSource, so that any internal" + " errors get bubbled up properly.");
    }
    this._abortController = new AbortController;
    let firstAudioDataTimestamp = null;
    let errored = false;
    const onAudioSample = (audioSample) => {
      if (errored) {
        audioSample.close();
        return;
      }
      const currentTimestamp = audioSample.timestamp;
      if (this._paused) {
        const dataSeen = firstAudioDataTimestamp !== null;
        if (dataSeen) {
          if (this._lastSampleTimestamp !== null) {
            const timeDelta = currentTimestamp - this._lastSampleTimestamp;
            this._pauseOffset -= timeDelta;
          }
          this._lastSampleTimestamp = currentTimestamp;
        }
        audioSample.close();
        return;
      }
      if (firstAudioDataTimestamp === null) {
        firstAudioDataTimestamp = audioSample.timestamp;
        const muxer = this._connectedTrack.output._muxer;
        if (muxer.firstMediaStreamTimestamp === null) {
          muxer.firstMediaStreamTimestamp = performance.now() / 1000;
          this._timestampOffset = -firstAudioDataTimestamp;
        } else {
          this._timestampOffset = performance.now() / 1000 - muxer.firstMediaStreamTimestamp - firstAudioDataTimestamp;
        }
      }
      this._lastSampleTimestamp = currentTimestamp;
      if (this._encoder.getQueueSize() >= 4) {
        audioSample.close();
        return;
      }
      audioSample.setTimestamp(currentTimestamp + this._pauseOffset);
      this._encoder.add(audioSample, true).catch((error) => {
        errored = true;
        this._abortController?.abort();
        this._promiseWithResolvers.reject(error);
        this._audioContext?.suspend();
      });
    };
    if (typeof MediaStreamTrackProcessor !== "undefined") {
      const processor = new MediaStreamTrackProcessor({ track: this._track });
      const consumer = new WritableStream({
        write: (audioData) => onAudioSample(new AudioSample(audioData))
      });
      processor.readable.pipeTo(consumer, {
        signal: this._abortController.signal
      }).catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        this._promiseWithResolvers.reject(error);
      });
    } else {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this._audioContext = new AudioContext({ sampleRate: this._track.getSettings().sampleRate });
      const sourceNode = this._audioContext.createMediaStreamSource(new MediaStream([this._track]));
      this._scriptProcessorNode = this._audioContext.createScriptProcessor(4096);
      if (this._audioContext.state === "suspended") {
        await this._audioContext.resume();
      }
      sourceNode.connect(this._scriptProcessorNode);
      this._scriptProcessorNode.connect(this._audioContext.destination);
      let totalDuration = 0;
      this._scriptProcessorNode.onaudioprocess = (event) => {
        const iterator = AudioSample._fromAudioBuffer(event.inputBuffer, totalDuration);
        totalDuration += event.inputBuffer.duration;
        for (const audioSample of iterator) {
          onAudioSample(audioSample);
        }
      };
    }
  }
  pause() {
    this._paused = true;
  }
  resume() {
    this._paused = false;
  }
  async _flushAndClose(forceClose) {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._audioContext) {
      assert(this._scriptProcessorNode);
      this._scriptProcessorNode.disconnect();
      await this._audioContext.suspend();
    }
    await this._encoder.flushAndClose(forceClose);
  }
}
var mediaStreamTrackProcessorWorkerCode = () => {
  const sendMessage = (message, transfer) => {
    if (transfer) {
      self.postMessage(message, { transfer });
    } else {
      self.postMessage(message);
    }
  };
  sendMessage({
    type: "support",
    supported: typeof MediaStreamTrackProcessor !== "undefined"
  });
  const abortControllers = new Map;
  const activeTracks = new Map;
  self.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "videoTrack":
        {
          activeTracks.set(message.trackId, message.track);
          const processor = new MediaStreamTrackProcessor({ track: message.track });
          const consumer = new WritableStream({
            write: (videoFrame) => {
              if (!activeTracks.has(message.trackId)) {
                videoFrame.close();
                return;
              }
              sendMessage({
                type: "videoFrame",
                trackId: message.trackId,
                videoFrame
              }, [videoFrame]);
            }
          });
          const abortController = new AbortController;
          abortControllers.set(message.trackId, abortController);
          processor.readable.pipeTo(consumer, {
            signal: abortController.signal
          }).catch((error) => {
            if (error instanceof DOMException && error.name === "AbortError")
              return;
            sendMessage({
              type: "error",
              trackId: message.trackId,
              error
            });
          });
        }
        ;
        break;
      case "stopTrack":
        {
          const abortController = abortControllers.get(message.trackId);
          if (abortController) {
            abortController.abort();
            abortControllers.delete(message.trackId);
          }
          const track = activeTracks.get(message.trackId);
          track?.stop();
          activeTracks.delete(message.trackId);
          sendMessage({
            type: "trackStopped",
            trackId: message.trackId
          });
        }
        ;
        break;
      default:
        assertNever(message);
    }
  });
};
var nextMediaStreamTrackProcessorWorkerId = 0;
var mediaStreamTrackProcessorWorker = null;
var initMediaStreamTrackProcessorWorker = () => {
  const blob = new Blob([`(${mediaStreamTrackProcessorWorkerCode.toString()})()`], { type: "application/javascript" });
  const url2 = URL.createObjectURL(blob);
  mediaStreamTrackProcessorWorker = new Worker(url2);
};
var mediaStreamTrackProcessorIsSupportedInWorkerCache = null;
var mediaStreamTrackProcessorIsSupportedInWorker = async () => {
  if (mediaStreamTrackProcessorIsSupportedInWorkerCache !== null) {
    return mediaStreamTrackProcessorIsSupportedInWorkerCache;
  }
  if (!mediaStreamTrackProcessorWorker) {
    initMediaStreamTrackProcessorWorker();
  }
  return new Promise((resolve) => {
    assert(mediaStreamTrackProcessorWorker);
    const listener = (event) => {
      const message = event.data;
      if (message.type === "support") {
        mediaStreamTrackProcessorIsSupportedInWorkerCache = message.supported;
        mediaStreamTrackProcessorWorker.removeEventListener("message", listener);
        resolve(message.supported);
      }
    };
    mediaStreamTrackProcessorWorker.addEventListener("message", listener);
  });
};
var sendMessageToMediaStreamTrackProcessorWorker = (message, transfer) => {
  assert(mediaStreamTrackProcessorWorker);
  if (transfer) {
    mediaStreamTrackProcessorWorker.postMessage(message, transfer);
  } else {
    mediaStreamTrackProcessorWorker.postMessage(message);
  }
};

class SubtitleSource extends MediaSource {
  constructor(codec) {
    super();
    this._connectedTrack = null;
    if (!SUBTITLE_CODECS.includes(codec)) {
      throw new TypeError(`Invalid subtitle codec '${codec}'. Must be one of: ${SUBTITLE_CODECS.join(", ")}.`);
    }
    this._codec = codec;
  }
}

// ../node_modules/mediabunny/dist/modules/src/output.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var ALL_TRACK_TYPES = ["video", "audio", "subtitle"];
var validateBaseTrackMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    throw new TypeError("metadata must be an object.");
  }
  if (metadata.languageCode !== undefined && !isIso639Dash2LanguageCode(metadata.languageCode)) {
    throw new TypeError("metadata.languageCode, when provided, must be a three-letter, ISO 639-2/T language code.");
  }
  if (metadata.name !== undefined && typeof metadata.name !== "string") {
    throw new TypeError("metadata.name, when provided, must be a string.");
  }
  if (metadata.disposition !== undefined) {
    validateTrackDisposition(metadata.disposition);
  }
  if (metadata.maximumPacketCount !== undefined && (!Number.isInteger(metadata.maximumPacketCount) || metadata.maximumPacketCount < 0)) {
    throw new TypeError("metadata.maximumPacketCount, when provided, must be a non-negative integer.");
  }
};

class Output {
  constructor(options) {
    this.state = "pending";
    this._tracks = [];
    this._startPromise = null;
    this._cancelPromise = null;
    this._finalizePromise = null;
    this._mutex = new AsyncMutex;
    this._metadataTags = {};
    if (!options || typeof options !== "object") {
      throw new TypeError("options must be an object.");
    }
    if (!(options.format instanceof OutputFormat)) {
      throw new TypeError("options.format must be an OutputFormat.");
    }
    if (!(options.target instanceof Target)) {
      throw new TypeError("options.target must be a Target.");
    }
    if (options.target._output) {
      throw new Error("Target is already used for another output.");
    }
    options.target._output = this;
    this.format = options.format;
    this.target = options.target;
    this._writer = options.target._createWriter();
    this._muxer = options.format._createMuxer(this);
  }
  addVideoTrack(source, metadata = {}) {
    if (!(source instanceof VideoSource)) {
      throw new TypeError("source must be a VideoSource.");
    }
    validateBaseTrackMetadata(metadata);
    if (metadata.rotation !== undefined && ![0, 90, 180, 270].includes(metadata.rotation)) {
      throw new TypeError(`Invalid video rotation: ${metadata.rotation}. Has to be 0, 90, 180 or 270.`);
    }
    if (!this.format.supportsVideoRotationMetadata && metadata.rotation) {
      throw new Error(`${this.format._name} does not support video rotation metadata.`);
    }
    if (metadata.frameRate !== undefined && (!Number.isFinite(metadata.frameRate) || metadata.frameRate <= 0)) {
      throw new TypeError(`Invalid video frame rate: ${metadata.frameRate}. Must be a positive number.`);
    }
    this._addTrack("video", source, metadata);
  }
  addAudioTrack(source, metadata = {}) {
    if (!(source instanceof AudioSource)) {
      throw new TypeError("source must be an AudioSource.");
    }
    validateBaseTrackMetadata(metadata);
    this._addTrack("audio", source, metadata);
  }
  addSubtitleTrack(source, metadata = {}) {
    if (!(source instanceof SubtitleSource)) {
      throw new TypeError("source must be a SubtitleSource.");
    }
    validateBaseTrackMetadata(metadata);
    this._addTrack("subtitle", source, metadata);
  }
  setMetadataTags(tags) {
    validateMetadataTags(tags);
    if (this.state !== "pending") {
      throw new Error("Cannot set metadata tags after output has been started or canceled.");
    }
    this._metadataTags = tags;
  }
  _addTrack(type, source, metadata) {
    if (this.state !== "pending") {
      throw new Error("Cannot add track after output has been started or canceled.");
    }
    if (source._connectedTrack) {
      throw new Error("Source is already used for a track.");
    }
    const supportedTrackCounts = this.format.getSupportedTrackCounts();
    const presentTracksOfThisType = this._tracks.reduce((count, track2) => count + (track2.type === type ? 1 : 0), 0);
    const maxCount = supportedTrackCounts[type].max;
    if (presentTracksOfThisType === maxCount) {
      throw new Error(maxCount === 0 ? `${this.format._name} does not support ${type} tracks.` : `${this.format._name} does not support more than ${maxCount} ${type} track` + `${maxCount === 1 ? "" : "s"}.`);
    }
    const maxTotalCount = supportedTrackCounts.total.max;
    if (this._tracks.length === maxTotalCount) {
      throw new Error(`${this.format._name} does not support more than ${maxTotalCount} tracks` + `${maxTotalCount === 1 ? "" : "s"} in total.`);
    }
    const track = {
      id: this._tracks.length + 1,
      output: this,
      type,
      source,
      metadata
    };
    if (track.type === "video") {
      const supportedVideoCodecs = this.format.getSupportedVideoCodecs();
      if (supportedVideoCodecs.length === 0) {
        throw new Error(`${this.format._name} does not support video tracks.` + this.format._codecUnsupportedHint(track.source._codec));
      } else if (!supportedVideoCodecs.includes(track.source._codec)) {
        throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported` + ` video codecs are: ${supportedVideoCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
      }
    } else if (track.type === "audio") {
      const supportedAudioCodecs = this.format.getSupportedAudioCodecs();
      if (supportedAudioCodecs.length === 0) {
        throw new Error(`${this.format._name} does not support audio tracks.` + this.format._codecUnsupportedHint(track.source._codec));
      } else if (!supportedAudioCodecs.includes(track.source._codec)) {
        throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported` + ` audio codecs are: ${supportedAudioCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
      }
    } else if (track.type === "subtitle") {
      const supportedSubtitleCodecs = this.format.getSupportedSubtitleCodecs();
      if (supportedSubtitleCodecs.length === 0) {
        throw new Error(`${this.format._name} does not support subtitle tracks.` + this.format._codecUnsupportedHint(track.source._codec));
      } else if (!supportedSubtitleCodecs.includes(track.source._codec)) {
        throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported` + ` subtitle codecs are: ${supportedSubtitleCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
      }
    }
    this._tracks.push(track);
    source._connectedTrack = track;
  }
  async start() {
    const supportedTrackCounts = this.format.getSupportedTrackCounts();
    for (const trackType of ALL_TRACK_TYPES) {
      const presentTracksOfThisType = this._tracks.reduce((count, track) => count + (track.type === trackType ? 1 : 0), 0);
      const minCount = supportedTrackCounts[trackType].min;
      if (presentTracksOfThisType < minCount) {
        throw new Error(minCount === supportedTrackCounts[trackType].max ? `${this.format._name} requires exactly ${minCount} ${trackType}` + ` track${minCount === 1 ? "" : "s"}.` : `${this.format._name} requires at least ${minCount} ${trackType}` + ` track${minCount === 1 ? "" : "s"}.`);
      }
    }
    const totalMinCount = supportedTrackCounts.total.min;
    if (this._tracks.length < totalMinCount) {
      throw new Error(totalMinCount === supportedTrackCounts.total.max ? `${this.format._name} requires exactly ${totalMinCount} track` + `${totalMinCount === 1 ? "" : "s"}.` : `${this.format._name} requires at least ${totalMinCount} track` + `${totalMinCount === 1 ? "" : "s"}.`);
    }
    if (this.state === "canceled") {
      throw new Error("Output has been canceled.");
    }
    if (this._startPromise) {
      console.warn("Output has already been started.");
      return this._startPromise;
    }
    return this._startPromise = (async () => {
      this.state = "started";
      this._writer.start();
      const release = await this._mutex.acquire();
      await this._muxer.start();
      const promises = this._tracks.map((track) => track.source._start());
      await Promise.all(promises);
      release();
    })();
  }
  getMimeType() {
    return this._muxer.getMimeType();
  }
  async cancel() {
    if (this._cancelPromise) {
      console.warn("Output has already been canceled.");
      return this._cancelPromise;
    } else if (this.state === "finalizing" || this.state === "finalized") {
      console.warn("Output has already been finalized.");
      return;
    }
    return this._cancelPromise = (async () => {
      this.state = "canceled";
      const release = await this._mutex.acquire();
      const promises = this._tracks.map((x) => x.source._flushOrWaitForOngoingClose(true));
      await Promise.all(promises);
      await this._writer.close();
      release();
    })();
  }
  async finalize() {
    if (this.state === "pending") {
      throw new Error("Cannot finalize before starting.");
    }
    if (this.state === "canceled") {
      throw new Error("Cannot finalize after canceling.");
    }
    if (this._finalizePromise) {
      console.warn("Output has already been finalized.");
      return this._finalizePromise;
    }
    return this._finalizePromise = (async () => {
      this.state = "finalizing";
      const release = await this._mutex.acquire();
      const promises = this._tracks.map((x) => x.source._flushOrWaitForOngoingClose(false));
      await Promise.all(promises);
      await this._muxer.finalize();
      await this._writer.flush();
      await this._writer.finalize();
      this.state = "finalized";
      release();
    })();
  }
}

// ../node_modules/mediabunny/dist/modules/src/index.js
/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// mp4_mediabunny.ts
async function mp4(canvas, audioStream, frameRate = 30) {
  const output = new Output({
    format: new Mp4OutputFormat,
    target: new BufferTarget
  });
  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    bitrate: QUALITY_HIGH
  });
  output.addVideoTrack(videoSource, { frameRate });
  if (audioStream && audioStream.getAudioTracks().length > 0) {
    const audioTrack = audioStream.getAudioTracks()[0];
    audioTrack.enabled = true;
    const audioSource = new MediaStreamAudioTrackSource(audioTrack, {
      codec: "aac",
      bitrate: 128000
    });
    output.addAudioTrack(audioSource);
  }
  await output.start();
  let framesAdded = 0;
  const intervalId = setInterval(() => {
    const timestampInSeconds = framesAdded / frameRate;
    const durationInSeconds = 1 / frameRate;
    videoSource.add(timestampInSeconds, durationInSeconds);
    framesAdded++;
  }, 1000 / frameRate);
  return async (name) => {
    clearInterval(intervalId);
    await output.finalize();
    const buffer = output.target.buffer;
    const blob = new Blob([buffer], { type: "video/mp4" });
    const a = document.createElement("a");
    a.download = name;
    const url2 = URL.createObjectURL(blob);
    a.href = url2;
    a.click();
    URL.revokeObjectURL(url2);
  };
}
async function mp4FromStream(stream) {
  const output = new Output({
    format: new Mp4OutputFormat,
    target: new BufferTarget
  });
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    const videoSource = new MediaStreamVideoTrackSource(videoTrack, {
      codec: "avc",
      bitrate: QUALITY_HIGH
    });
    output.addVideoTrack(videoSource);
  }
  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    const audioSource = new MediaStreamAudioTrackSource(audioTrack, {
      codec: "aac",
      bitrate: 128000
    });
    output.addAudioTrack(audioSource);
  }
  await output.start();
  return async (name) => {
    stream.getTracks().forEach((track) => track.stop());
    await output.finalize();
    const buffer = output.target.buffer;
    const blob = new Blob([buffer], { type: "video/mp4" });
    const url2 = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url2;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url2);
  };
}
globalThis.mp4 = mp4;
globalThis.mp4FromStream = mp4FromStream;
export {
  mp4FromStream,
  mp4
};
