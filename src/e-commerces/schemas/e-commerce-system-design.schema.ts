import { Document, Schema } from 'mongoose';
import { ECommerceConfig, ECommerceConfigSchema } from './e-commerce-config.schema';
import { ECommerceProduct, ECommerceProductSchemaWithoutId } from './e-commerce-product.schema';

export const E_COMMERCE_SYSTEM_DESIGN = Symbol('E_COMMERCE_SYSTEM_DESIGN').toString();

export interface IEcomSystemDesignProductSchema {
  numberOfModules: number;
  numberOfBatteries: number;
  totalLaborCost: number;
  totalCost: number;
  ecomConfigSnapshot: ECommerceConfig;
  ecomConfigSnapshotDate: Date;
  ecomProductsSnapshot: ECommerceProduct[];
  ecomProductsSnapshotDate: Date;
}

export const EcomSystemDesignProductSchema = new Schema<Document<IEcomSystemDesignProductSchema>>({
  number_of_modules: Number,
  number_of_batteries: Number,
  total_labor_cost: Number,
  total_cost: Number,
  ecom_config_snapshot: ECommerceConfigSchema,
  ecom_config_snapshot_date: Date,
  ecom_products_snapshot: [ECommerceProductSchemaWithoutId],
  ecom_products_snapshot_date: Date,
});

export interface ECommerceSystemDesign extends Document {
  eComVisitId: string;
  systemDesignProduct: IEcomSystemDesignProductSchema;

  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export const ECommerceSystemDesignSchema = new Schema<ECommerceSystemDesign>({
  e_com_reference_id: String,
  system_design_product: EcomSystemDesignProductSchema,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
