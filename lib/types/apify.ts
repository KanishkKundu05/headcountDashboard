export interface ApifyEmployeePosition {
  companyName?: string;
  title?: string;
  current?: boolean;
  companyLinkedinUrl?: string;
  companyId?: string;
  tenureAtPosition?: {
    numMonths?: number | null;
  };
  tenureAtCompany?: {
    numMonths?: number | null;
  };
  startedOn?: {
    month?: number;
    year?: number;
  };
}

export interface ApifyEmployeeItem {
  id: string;
  linkedinUrl?: string;
  firstName?: string;
  lastName?: string;
  summary?: string;
  openProfile?: boolean;
  premium?: boolean;
  currentPositions?: ApifyEmployeePosition[];
  pictureUrl?: string;
  location?: {
    linkedinText?: string;
  };
  _meta?: {
    pagination?: {
      totalElements?: number;
      totalPages?: number;
      pageNumber?: number;
      previousElements?: number;
      pageSize?: number;
    };
  };
  // Allow additional properties we don't explicitly care about
  [key: string]: unknown;
}

export interface FilteredEmployee {
  firstName: string;
  lastName: string;
  pictureUrl: string;
  currentTitle: string | null;
  currentStartMonth: number | null;
  currentStartYear: number | null;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: unknown;
}


