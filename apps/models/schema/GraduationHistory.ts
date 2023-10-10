import { GraduationHistory } from '@ufabcnext/types';
import { Model, Schema, model, models } from 'mongoose';

const graduationSchema = new Schema<GraduationHistory>(
  {
    ra: Number,
    coefficients: Object,

    disciplinas: Object,

    curso: String,
    grade: String,
    graduation: {
      type: Schema.Types.ObjectId,
      ref: 'graduation',
    },
  },
  { timestamps: true },
);

export const GraduationHistoryModel: Model<GraduationHistory> =
  models['historiesgraduations'] ||
  model<GraduationHistory>('historiesgraduations', graduationSchema);
