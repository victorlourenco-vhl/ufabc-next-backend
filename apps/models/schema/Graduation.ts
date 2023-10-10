import { Graduation } from '@ufabcnext/types';
import { Model, Schema, model, models } from 'mongoose';

const graduationSchema = new Schema<Graduation>(
  {
    locked: {
      type: Boolean,
      default: false,
    },

    curso: String,
    grade: String,

    mandatory_credits_number: Number,
    limited_credits_number: Number,
    free_credits_number: Number,
    credits_total: Number,

    creditsBreakdown: [
      {
        year: Number,
        quad: Number,
        choosableCredits: Number,
      },
    ],
  },
  { timestamps: true },
);

graduationSchema.index({ curso: 1, grade: 1 });

export const GraduationModel: Model<Graduation> =
  models['graduations'] || model<Graduation>('graduations', graduationSchema);
