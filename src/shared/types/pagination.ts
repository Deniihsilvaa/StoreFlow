export type PaginationQuery = {
  page: number;
  limit: number;
};

export type PaginationMeta = PaginationQuery & {
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

