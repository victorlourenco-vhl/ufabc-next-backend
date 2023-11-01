import { type InferSchemaType, Schema, model } from 'mongoose';
// import { addUserEnrollmentsToQueue } from '@next/queue';

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
        // app.agenda.now('updateUserEnrollments', this.toObject({ virtuals: true }))
      },
    },
    timestamps: true,
  },
);

historySchema.index({ curso: 'asc', grade: 'asc' });

historySchema.pre('findOneAndUpdate', async function () {
  //why does the legacy code pass things that aren't in the schema?
  //also, the updateUserEnrollments cron job in the legacy code doesn't use the mandatory_credits_number, limited_credits_number, free_credits_number, credits_total properties
  //and why are we getting the values from getUpdate() instead of this.toObject({ virtuals: true })?
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
  // await addUserEnrollmentsToQueue(this.toObject({ virtuals: true }));
});

export type History = InferSchemaType<typeof historySchema>;
export const HistoryModel = model('histories', historySchema);
