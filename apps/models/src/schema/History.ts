import { addUserEnrollmentsToQueue } from '@next/queue';
import {
  type InferSchemaType,
  Schema,
  type UpdateQuery,
  model,
} from 'mongoose';

const historySchema = new Schema(
  {
    ra: Number,
    disciplinas: Object,
    coefficients: Object,
    curso: String,
    grade: String,
  },
  {
    methods: {
      async updateEnrollments() {
        // TODO: get the models here, this jobs needs some
        await addUserEnrollmentsToQueue(this.toObject({ virtuals: true }));
      },
    },
    timestamps: true,
  },
);

historySchema.index({ curso: 'asc', grade: 'asc' });

historySchema.pre('findOneAndUpdate', async function () {
  //why does the legacy code pass things that aren't in the schema?
  //also, the updateUserEnrollments cron job in the legacy code doesn't use the mandatory_credits_number, limited_credits_number, free_credits_number, credits_total properties
  // calls cron job here
  const update: UpdateQuery<History> | null = this.getUpdate();
  if (!update) {
    // if theres nothing to update, do nothing
    return;
  }
  const updateJob = {
    ra: update.ra,
    disciplinas: update.disciplinas,
    curso: update.curso,
    grade: update.grade,
    mandatory_credits_number: update.mandatory_credits_number,
    limited_credits_number: update.limited_credits_number,
    free_credits_number: update.free_credits_number,
    credits_total: update.credits_total,
  };

  // @ts-expect-error cause i don't know why is wrong
  await addUserEnrollmentsToQueue(updateJob);
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

export type History = InferSchemaType<typeof historySchema>;
export const HistoryModel = model('histories', historySchema);
