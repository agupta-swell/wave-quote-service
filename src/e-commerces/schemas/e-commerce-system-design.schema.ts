import { Document, Schema } from 'mongoose';
import { ECommerceConfig, ECommerceConfigSchema } from './e-commerce-config.schema';
import { ECommerceProduct, ECommerceProductSchema } from './e-commerce-product.schema';

export const E_COMMERCE_SYSTEM_DESIGN = Symbol('E_COMMERCE_SYSTEM_DESIGN').toString();

export interface IEcomSystemDesignProductSchema {
  number_of_modules: number;
  number_of_batteries: number;
  total_labor_cost: number;
  total_cost: number;
  ecom_config_snapshot: ECommerceConfig;
  ecom_config_snapshotDate: Date;
  ecom_products_snapshot: ECommerceProduct;
  ecom_products_snapshotDate: Date;
}

export const EcomSystemDesignProductSchema = new Schema<IEcomSystemDesignProductSchema>({
  number_of_modules: Number,
  number_of_batteries: Number,
  total_labor_cost: Number,
  total_cost: Number,
  ecom_config_snapshot: ECommerceConfigSchema,
  ecom_config_snapshotDate: Date,
  ecom_products_snapshot: ECommerceProductSchema,
  ecom_products_snapshotDate: Date,
});

export interface ECommerceSystemDesign extends Document {
  e_com_reference_id: string;
  system_design_product: IEcomSystemDesignProductSchema;

  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const ECommerceSystemDesignSchema = new Schema<ECommerceSystemDesign>({
  e_com_reference_id: String,
  system_design_product: EcomSystemDesignProductSchema,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
