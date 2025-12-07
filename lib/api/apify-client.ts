import {
  ApifyEmployeeItem,
  ApiError,
  FilteredEmployee,
  ApifyEmployeePosition,
} from "../types/apify";

const APIFY_BASE_URL =
  "https://api.apify.com/v2/acts/harvestapi~linkedin-company-employees/run-sync-get-dataset-items";

interface FetchCompanyEmployeesOptions {
  signal?: AbortSignal;
}

export async function fetchCompanyEmployees(
  companyUrl: string,
  options: FetchCompanyEmployeesOptions = {},
): Promise<ApifyEmployeeItem[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    const error: ApiError = {
      message: "Apify API token is not configured (APIFY_API_TOKEN env var is missing)",
      statusCode: 500,
    };
    throw error;
  }

  const url = new URL(APIFY_BASE_URL);
  url.searchParams.set("token", token);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companies: [companyUrl],
        profileScraperMode: "Short ($4 per 1k)",
      }),
      signal: options.signal ?? controller.signal,
    });

    if (!response.ok) {
      let details: unknown;
      try {
        details = await response.json();
      } catch {
        details = await response.text();
      }

      const error: ApiError = {
        message: "Failed to fetch employees from Apify",
        statusCode: response.status,
        details,
      };
      throw error;
    }

    const data = (await response.json()) as unknown;

    if (!Array.isArray(data)) {
      const error: ApiError = {
        message: "Unexpected Apify response format: expected an array",
        details: data,
      };
      throw error;
    }

    return data as ApifyEmployeeItem[];
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      const timeoutError: ApiError = {
        message: "Request to Apify timed out",
      };
      throw timeoutError;
    }

    if (isApiError(error)) {
      throw error;
    }

    const wrappedError: ApiError = {
      message: "Unexpected error while fetching employees from Apify",
      details: error,
    };
    throw wrappedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function mapApifyEmployeesToFiltered(
  items: ApifyEmployeeItem[],
  companyUrl: string,
): FilteredEmployee[] {
  return items
    .map((item) => {
      const firstName = item.firstName ?? "";
      const lastName = item.lastName ?? "";
      const pictureUrl = item.pictureUrl ?? "";

      const position = resolveCurrentPositionForCompany(item, companyUrl);

      return {
        firstName,
        lastName,
        pictureUrl,
        currentTitle: position?.title ?? null,
        currentStartMonth: position?.startedOn?.month ?? null,
        currentStartYear: position?.startedOn?.year ?? null,
      };
    })
    .filter((employee) => {
      // Filter out employees without a start date (likely fake profiles)
      return employee.currentStartMonth != null && employee.currentStartYear != null;
    });
}

function resolveCurrentPositionForCompany(
  item: ApifyEmployeeItem,
  companyUrl: string,
): ApifyEmployeePosition | null {
  const positions = item.currentPositions ?? [];
  if (positions.length === 0) {
    return null;
  }

  const normalizedCompanyUrl = normalizeLinkedinCompanyUrl(companyUrl);

  const matchingPosition = positions.find((pos) => {
    if (!pos.current) return false;

    if (pos.companyLinkedinUrl) {
      return (
        normalizeLinkedinCompanyUrl(pos.companyLinkedinUrl) ===
          normalizedCompanyUrl
      );
    }

    return false;
  });

  return matchingPosition ?? positions[0] ?? null;
}

function normalizeLinkedinCompanyUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("linkedin.com")) {
      u.search = "";
      u.hash = "";
      return u.toString().replace(/\/$/, "");
    }
    return url.replace(/\/$/, "");
  } catch {
    return url.replace(/\/$/, "");
  }
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}


