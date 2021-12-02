import { Document, Schema } from 'mongoose';
import { IProjectSubtotal4 } from 'src/quotes/interfaces';

export const ProjectSubtotal4DataSchema = new Schema<Document & IProjectSubtotal4>(
  {
    cost: Number,
    margin_percentage: Number,
    net_margin: Number,
    net_cost: Number,
  },
  {
    _id: false,
  },
);
