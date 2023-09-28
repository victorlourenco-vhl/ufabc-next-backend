export type Graduation = {
  locked: boolean;
  curso: string;
  grade: string;
  mandatory_credits_number: number;
  limited_credits_number: number;
  free_credits_number: number;
  credits_total: number;
  creditsBreakdown: {
    year: number;
    quad: number;
    choosableCredits: number;
  }[];
};
