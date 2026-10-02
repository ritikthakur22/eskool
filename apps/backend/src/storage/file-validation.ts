import { BadRequestException } from '@nestjs/common';

const signatures: Record<string, (buffer: Buffer) => boolean> = {
  'application/pdf': buffer => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  'image/jpeg': buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': buffer => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': buffer => buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
};

export function assertFileSignature(file: { buffer?: Buffer; mimetype: string }) {
  const check = signatures[file.mimetype];
  if (!check || !file.buffer || !check(file.buffer)) {
    throw new BadRequestException('The uploaded file content does not match its permitted type.');
  }
}
