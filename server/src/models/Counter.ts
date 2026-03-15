// server/src/models/Counter.ts
import { Schema, model, Document } from "mongoose";

interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const getNextSequence = async (name: string): Promise<number> => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true },
  );
  return counter!.seq;
};

const Counter = model<ICounter>("Counter", counterSchema);
export default Counter;