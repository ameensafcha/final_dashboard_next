export interface Size {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
  is_active: boolean;
}

export interface Flavor {
  id: string;
  name: string;
  short_code: string;
}

export interface Product {
  id: string;
  name: string;
  product_flavors: { flavor: Flavor }[];
  variants?: Variant[];
}

export interface Variant {
  id: string;
  product_id: string;
  flavor_id: string;
  size_id: string;
  price: number;
  description: string | null;
  sku: string;
  is_active: boolean;
  grade: string;
  name_arabic: string | null;
  barcode: string | null;
  sfda_reg_no: string | null;
  shelf_life_months: number | null;
  storage_instructions: string | null;
  nutritional_values: string | null;
  product: Product;
  flavor: Flavor;
  size: Size;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VariantFormData {
  product_id: string;
  flavor_id: string;
  size_id: string;
  grade: string;
  price: string;
  description: string;
  sku: string;
  is_active: boolean;
  name_arabic: string;
  barcode: string;
  sfda_reg_no: string;
  shelf_life_months: number | null;
  storage_instructions: string;
  nutritional_values: string;
}

export interface GenerateFormData {
  product_id: string;
  grade: string;
  flavor_ids: string[];
  size_ids: string[];
}
