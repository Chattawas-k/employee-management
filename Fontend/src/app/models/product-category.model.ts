export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdDate: string;
  updatedDate?: string;
}

export interface ProductCategoryDropdownDto {
  id: string;
  name: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateProductCategoryRequest {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}
