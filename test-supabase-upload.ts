import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../modules/storage/storage.service';

async function main() {
  const configService = new ConfigService();

  const storageService = new StorageService(configService);

  const filePath = path.resolve(__dirname, '../../../../', 'payform.jpeg');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const remotePath = `organization-logos/${Date.now()}-payform.jpeg`;

  console.log('Uploading', filePath, 'to', remotePath);

  try {
    const publicUrl = await storageService.uploadFile(remotePath, fileBuffer, 'image/jpeg');
    console.log('Upload successful. Public URL:', publicUrl);
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

main();
