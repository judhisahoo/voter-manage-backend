import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VoterData extends Document {
  @Prop({ required: true, unique: true, index: true })
  epic_no: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true, index: true })
  name: string;

  @Prop()
  name_in_regional_lang: string;

  @Prop()
  age: string;

  @Prop()
  relation_type: string;

  @Prop()
  relation_name: string;

  @Prop()
  relation_name_in_regional_lang: string;

  @Prop()
  father_name: string;

  @Prop({ index: true })
  gender: string;

  @Prop({ index: true })
  state: string;

  @Prop({ index: true })
  district: string;

  @Prop()
  city: string;

  @Prop()
  pincode: string;

  @Prop()
  country: string;

  @Prop()
  address_line: string;

  @Prop()
  assembly_constituency_number: string;

  @Prop()
  assembly_constituency: string;

  @Prop()
  parliamentary_constituency_number: string;

  @Prop()
  parliamentary_constituency: string;

  @Prop()
  part_number: string;

  @Prop()
  part_name: string;

  @Prop()
  serial_number: string;

  @Prop()
  polling_station: string;

  @Prop()
  address: string;

  @Prop()
  photo: string;

  @Prop()
  responseType: number;

  @Prop({ default: false })
  isDisabled: boolean;

  @Prop()
  disabledBy: string;

  @Prop()
  disabledAt: Date;

  @Prop({ default: 'api' })
  dataSource: string; // 'api', 'cache', 'database'
}

export const VoterDataSchema = SchemaFactory.createForClass(VoterData);

VoterDataSchema.index({ name: 'text', epic_no: 'text' });
VoterDataSchema.index({ state: 1, district: 1 });
VoterDataSchema.index({ isDisabled: 1, createdAt: -1 });
