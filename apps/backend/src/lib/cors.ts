import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
};

export const corsHeaders = CORS_HEADERS;

export function createCorsResponse(
  data: any,
  status: number = 200
): NextResponse {
  const response = new NextResponse(JSON.stringify(data ?? {}), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });

  return response;
}

export function createCorsPreflightResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
    },
  });
}
