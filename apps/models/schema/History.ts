import { addUserEnrollmentsToQueue } from '@ufabcnext/queue';
import { History } from '@ufabcnext/types';
import { Model, Schema, model, models } from 'mongoose';

const historySchema = new Schema<History>(
  {
    ra: Number,
    disciplinas: Object,
    coefficients: Object,
    curso: String,
    grade: String,
  },
  { timestamps: true },
);

historySchema.index({ curso: 1, grade: 1 });

historySchema.method('updateEnrollments', async function () {
  // Call cron job here
  // app.agenda.now('updateUserEnrollments', this.toObject({ virtuals: true }))
});

historySchema.pre('findOneAndUpdate', async function () {
  //why does the legacy code pass things that aren't in the schema?
  //also, the updateUserEnrollments cron job in the legacy code doesn't use the mandatory_credits_number, limited_credits_number, free_credits_number, credits_total properties
  //and why are we getting the values from getUpdate() instead of this.toObject({ virtuals: true })?
  //TODO: find out what the hell is going on here
  // calls cron job here
  // const {
  //   ra,
  //   disciplinas,
  //   curso,
  //   grade,
  //   mandatory_credits_number,
  //   limited_credits_number,
  //   free_credits_number,
  //   credits_total,
  // } = this.getUpdate();
  // app.agenda.now('updateUserEnrollments', [
  //   ra,
  //   disciplinas,
  //   curso,
  //   grade,
  //   mandatory_credits_number,
  //   limited_credits_number,
  //   free_credits_number,
  //   credits_total,
  // ]);
});

historySchema.post('save', async function () {
  await addUserEnrollmentsToQueue(this.toObject({ virtuals: true }));
});

export const HistoryModel: Model<History> =
  models['histories'] || model<History>('histories', historySchema);
