import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductCategory, ProductCategoryDropdownDto, CreateProductCategoryRequest, UpdateProductCategoryRequest } from '../models/product-category.model';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {
  private apiUrl = `${environment.apiUrl}/productcategory`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ productCategories: ProductCategory[] }> {
    return this.http.get<{ productCategories: ProductCategory[] }>(this.apiUrl);
  }

  getById(id: string): Observable<{ productCategory: ProductCategory | null }> {
    return this.http.get<{ productCategory: ProductCategory | null }>(`${this.apiUrl}/${id}`);
  }

  getDropdownList(): Observable<{ productCategories: ProductCategoryDropdownDto[] }> {
    return this.http.get<{ productCategories: ProductCategoryDropdownDto[] }>(`${this.apiUrl}/dropdown-list`);
  }

  create(request: CreateProductCategoryRequest): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(this.apiUrl, request);
  }

  update(id: string, request: UpdateProductCategoryRequest): Observable<ProductCategory> {
    return this.http.put<ProductCategory>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
