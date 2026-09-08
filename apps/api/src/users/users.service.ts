import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { User } from './user.entity';

const scrypt = promisify(scryptCallback);

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (await this.repository.count()) return;

    const username = this.config.get('ADMIN_USERNAME', 'maxiaofei').trim().toLowerCase();
    const password = this.config.get('ADMIN_PASSWORD', 'maxiaofei1024');
    const displayName = this.config.get('ADMIN_DISPLAY_NAME', '马小飞').trim();
    const passwordHash = await this.hashPassword(password);
    await this.repository.save(this.repository.create({ username, displayName, passwordHash }));
    this.logger.warn(`Initial administrator "${username}" created. Change ADMIN_PASSWORD before public deployment.`);
  }

  findByUsername(username: string) {
    return this.repository.findOneBy({ username: username.trim().toLowerCase() });
  }

  async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [algorithm, salt, stored] = encoded.split('$');
    if (algorithm !== 'scrypt' || !salt || !stored) return false;
    const expected = Buffer.from(stored, 'hex');
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derived.toString('hex')}`;
  }
}
