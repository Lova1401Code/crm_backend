import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordHasherService {
  hash(plain: string): string {
    return bcrypt.hashSync(plain, 10);
  }

  compare(plain: string, hashed: string): boolean {
    return bcrypt.compareSync(plain, hashed);
  }
}