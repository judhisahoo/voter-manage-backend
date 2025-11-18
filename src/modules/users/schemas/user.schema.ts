import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";


export enum UserRole {
  ADMIN = 'admin',
  SUPPORT =  'support',
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  INACTIVE = 'inactive',
}

@Schema({timestamps:true})

export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email:string;

  @Prop({ required: true }) //, select: false 
  password: string;

  @Prop({ enum: UserRole, default: UserRole.SUPPORT })
  role: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop()
  lastLogin: Date;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });
