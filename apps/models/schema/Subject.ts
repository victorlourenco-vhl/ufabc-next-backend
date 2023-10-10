import { Model, Schema, model, models } from 'mongoose';
import { startCase, camelCase } from 'lodash';
import { Subject } from '@ufabcnext/types';

const subjectSchema = new Schema<Subject>(
  {
    name: {
      type: String,
      required: true,
    },
    search: String,
    creditos: Number,
  },
  { timestamps: true },
);

subjectSchema.pre('save', function () {
  this.search = startCase(camelCase(this.name));
});

export const SubjectModel: Model<Subject> =
  models['subjects'] || model<Subject>('subjects', subjectSchema);
