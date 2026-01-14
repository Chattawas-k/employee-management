export type SalesReasonType = 'pendingDecision' | 'failedClose';

export interface SalesReasonDto {
  id: string;
  type: SalesReasonType;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export interface GetSalesReasonsResponse {
  reasons: SalesReasonDto[];
}

export interface CreateSalesReasonRequest {
  type: SalesReasonType;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateSalesReasonRequest extends CreateSalesReasonRequest {
  id: string;
}

