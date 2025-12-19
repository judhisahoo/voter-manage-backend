// src/modules/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserStatus } from './schemas/user.schema';
import { EmailService } from '../email/email.service';
import bcrypt from 'bcryptjs';
import { console } from 'inspector';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
  ) {}

  async create(userData: any) {
    const existingUser = await this.findByEmail(userData.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await this.userModel.create({ ...userData, password: hashedPassword });
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name, userData.password);
    
    return user;
  }

  async findAll() {
    return this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string, includePassword = false) {
    const query = this.userModel.findOne({ email });
    /*if (!includePassword) {
      query.select('-password');
    }*/
    return query.exec();
  }

  async update(id: string, updateData: any) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
    
    const userData = await this.userModel.findById(id).select('-password').exec();

    return { message: 'User data updated successfully', user: userData };
  }

  async updateStatus(id: string, status: UserStatus) {
    console.log('updateStatus in userService ::', id, status);
    return this.userModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .select('-password')
      .exec();
  }

  async updateLastLogin(id: string) {
    return this.userModel
      .findByIdAndUpdate(id, { lastLogin: new Date() })
      .exec();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId).select('+password').exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async delete(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}