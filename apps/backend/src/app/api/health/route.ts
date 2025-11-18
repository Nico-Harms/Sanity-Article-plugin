import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/database/connection';
import { createCorsResponse, createCorsPreflightResponse } from '@/lib/cors';

/*===============================================
|=          HEALTH CHECK API           =
===============================================*/

export async function OPTIONS() {
  return createCorsPreflightResponse();
}

export async function GET(_request: NextRequest) {
  try {
    // Test MongoDB connection
    const db = await connectToDatabase();
    
    // Test database access by listing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Check if configs collection exists
    const hasConfigsCollection = collectionNames.includes('configs');

    // Count documents in configs collection if it exists
    let configCount = 0;
    if (hasConfigsCollection) {
      configCount = await db.collection('configs').countDocuments();
    }

    return createCorsResponse({
      status: 'healthy',
      database: {
        connected: true,
        name: db.databaseName,
        collections: collectionNames,
        hasConfigsCollection,
        configCount,
      },
      backend: {
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'localhost',
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] Health check failed:', error);
    return createCorsResponse(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false,
        },
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}

