export interface Flavor {
  id: string;
  name: string;
  short_code: string;
  ingredients?: string;
}

export interface Size {
  id: string;
  size: string;
  unit: string;
  pack_type: string;
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
  mesh_size: string | null;
  name_arabic: string | null;
  nutritional_values: string | null;
  barcode: string | null;
  sfda_reg_no: string | null;
  shelf_life_months: number | null;
  storage_instructions: string | null;
  flavor: Flavor;
  size: Size;
  inventory?: { quantity: number };
}

export interface ProductFlavor {
  id: string;
  flavor: Flavor;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  product_flavors: ProductFlavor[];
  variants: Variant[];
  variants_count?: { active: number; inactive: number; total: number };
}

export interface Batch {
  id: string;
  batch_id: string;
  quantity: number;
  manufacturing_date: string | null;
  expiry_date: string | null;
  packaging_state: string;
  location: string;
  notes: string | null;
  created_at: string;
}
