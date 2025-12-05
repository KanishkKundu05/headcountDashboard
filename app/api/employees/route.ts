import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyEmployees, mapApifyEmployeesToFiltered } from "@/lib/api/apify-client";
import { ApiError } from "@/lib/types/apify";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyUrl = searchParams.get("companyUrl");

  if (!companyUrl) {
    const error: ApiError = {
      message: "Missing required query parameter: companyUrl",
      statusCode: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  if (!isValidLinkedinCompanyUrl(companyUrl)) {
    const error: ApiError = {
      message: "Invalid LinkedIn company URL. Expected URL starting with https://www.linkedin.com/company/",
      statusCode: 400,
      details: { companyUrl },
    };
    return NextResponse.json(error, { status: 400 });
  }

  try {
    const items = await fetchCompanyEmployees(companyUrl);
    const employees = mapApifyEmployeesToFiltered(items, companyUrl);

    return NextResponse.json({ employees });
  } catch (error) {
    const apiError = toApiError(error);
    const status = apiError.statusCode ?? 500;
    return NextResponse.json(apiError, { status });
  }
}

function isValidLinkedinCompanyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.linkedin.com" &&
      parsed.pathname.startsWith("/company/")
    );
  } catch {
    return false;
  }
}

function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ApiError;
  }

  return {
    message: "Unexpected server error",
    details: error,
  };
}


