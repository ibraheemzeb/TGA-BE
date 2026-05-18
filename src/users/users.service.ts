import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  private assertDbReady() {
    if (this.connection.readyState !== 1) {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message:
          'Database is not connected. Check MONGODB_URI and Atlas IP whitelist (Network Access).',
      });
    }
  }

  async create(input: {
    name: string;
    department: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    this.assertDbReady();
    const normalized = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const department = input.department.trim();
    const existing = await this.userModel.findOne({ email: normalized }).exec();
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_IN_USE',
        message: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    try {
      return await this.userModel.create({
        name,
        department,
        email: normalized,
        passwordHash,
        roles: ['user'],
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: number }).code === 11000
      ) {
        throw new ConflictException({
          code: 'EMAIL_IN_USE',
          message: 'An account with this email already exists',
        });
      }
      throw err;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    this.assertDbReady();
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    this.assertDbReady();
    return this.userModel.findById(id).exec();
  }

  async validatePassword(
    user: UserDocument,
    password: string,
  ): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async assertValidCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    const valid = await this.validatePassword(user, password);
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    return user;
  }
}
