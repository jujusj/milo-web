const fs = require("fs");
const zlib = require("zlib");

const [, , inputPath, outputPath, thresholdArg] = process.argv;
const threshold = Number(thresholdArg || 34);

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/remove-png-background.js <input.png> <output.png> [threshold]");
  process.exit(1);
}

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const input = fs.readFileSync(inputPath);

if (!input.subarray(0, 8).equals(signature)) {
  throw new Error(`${inputPath} is not a PNG file`);
}

const chunks = readChunks(input);
const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
if (!ihdr) throw new Error("Missing IHDR chunk");

const width = ihdr.data.readUInt32BE(0);
const height = ihdr.data.readUInt32BE(4);
const bitDepth = ihdr.data[8];
const colorType = ihdr.data[9];
const interlace = ihdr.data[12];

if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
  throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace}`);
}

const channels = colorType === 6 ? 4 : 3;
const bytesPerPixel = channels;
const lineLength = width * channels;
const idat = Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data));
const raw = zlib.inflateSync(idat);
const pixels = unfilter(raw, width, height, lineLength, bytesPerPixel);
const rgba = toRgba(pixels, width, height, channels);
const background = sampleBackground(rgba, width, height);
const transparent = floodBackground(rgba, width, height, background, threshold);

for (let index = 0; index < transparent.length; index += 1) {
  if (transparent[index]) rgba[index * 4 + 3] = 0;
}

const scanlines = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) {
  const sourceStart = y * width * 4;
  const targetStart = y * (width * 4 + 1);
  scanlines[targetStart] = 0;
  rgba.copy(scanlines, targetStart + 1, sourceStart, sourceStart + width * 4);
}

const outputChunks = [
  makeChunk("IHDR", makeIhdr(width, height)),
  makeChunk("IDAT", zlib.deflateSync(scanlines, { level: 9 })),
  makeChunk("IEND", Buffer.alloc(0))
];

fs.writeFileSync(outputPath, Buffer.concat([signature, ...outputChunks]));

function readChunks(buffer) {
  const parsed = [];
  let offset = 8;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    parsed.push({ type, data });
    offset += length + 12;
    if (type === "IEND") break;
  }

  return parsed;
}

function unfilter(raw, width, height, rowLength, bpp) {
  const result = Buffer.alloc(width * height * bpp);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[sourceOffset];
    sourceOffset += 1;
    const row = raw.subarray(sourceOffset, sourceOffset + rowLength);
    sourceOffset += rowLength;
    const outputOffset = y * rowLength;
    const previousOffset = outputOffset - rowLength;

    for (let x = 0; x < rowLength; x += 1) {
      const left = x >= bpp ? result[outputOffset + x - bpp] : 0;
      const up = y > 0 ? result[previousOffset + x] : 0;
      const upLeft = y > 0 && x >= bpp ? result[previousOffset + x - bpp] : 0;
      let value = row[x];

      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter: ${filter}`);

      result[outputOffset + x] = value & 255;
    }
  }

  return result;
}

function toRgba(pixels, width, height, channels) {
  const rgba = Buffer.alloc(width * height * 4);

  for (let source = 0, target = 0; target < rgba.length; source += channels, target += 4) {
    rgba[target] = pixels[source];
    rgba[target + 1] = pixels[source + 1];
    rgba[target + 2] = pixels[source + 2];
    rgba[target + 3] = channels === 4 ? pixels[source + 3] : 255;
  }

  return rgba;
}

function sampleBackground(rgba, width, height) {
  const samples = [
    0,
    (width - 1) * 4,
    (width * (height - 1)) * 4,
    (width * height - 1) * 4
  ];
  const color = [0, 0, 0];

  for (const offset of samples) {
    color[0] += rgba[offset];
    color[1] += rgba[offset + 1];
    color[2] += rgba[offset + 2];
  }

  return color.map((value) => Math.round(value / samples.length));
}

function floodBackground(rgba, width, height, background, tolerance) {
  const total = width * height;
  const seen = new Uint8Array(total);
  const queue = [];

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x, 0);
    enqueueIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(0, y);
    enqueueIfBackground(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueueIfBackground(x - 1, y);
    if (x + 1 < width) enqueueIfBackground(x + 1, y);
    if (y > 0) enqueueIfBackground(x, y - 1);
    if (y + 1 < height) enqueueIfBackground(x, y + 1);
  }

  return seen;

  function enqueueIfBackground(x, y) {
    const index = y * width + x;
    if (seen[index]) return;
    if (!isBackground(index)) return;
    seen[index] = 1;
    queue.push(index);
  }

  function isBackground(index) {
    const offset = index * 4;
    const distance =
      Math.abs(rgba[offset] - background[0]) +
      Math.abs(rgba[offset + 1] - background[1]) +
      Math.abs(rgba[offset + 2] - background[2]);
    return distance <= tolerance;
  }
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function makeIhdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  const chunkType = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([chunkType, data])), 0);
  return Buffer.concat([length, chunkType, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
