import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { diskStorage } from 'multer';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const documentStorage = diskStorage({
  destination: (_request, _file, callback) => {
    const directory = resolve(process.cwd(), process.env.UPLOAD_DIR ?? '../../data/uploads');
    mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename: (_request, file, callback) => {
    // Never persist a user-controlled filename as a filesystem path.
    callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
  },
});

