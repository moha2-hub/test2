// Import the Neon client
import { neon, neonConfig } from "@neondatabase/serverless"

// Configure Neon client

// Database connection string
const DATABASE_URL =
  "postgresql://neondb_owner:npg_E5KhirvO0MHI@ep-fragrant-surf-a4ejben8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

// Create a SQL client with the connection string
const sql = neon(DATABASE_URL)

// Mock database implementation for preview environment
const mockQuery = async <T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> => {
  console.log("Mock query:", sqlQuery, params)

  // Return mock data based on the query
  if (sqlQuery.includes("SELECT * FROM users WHERE email")) {
    return [
      {
        id: 1,
        username: "demo_user",
        email: "demo@example.com",
        password_hash: "demo_password",
        role: "customer",
        points: 1000,
        reserved_points: 0,
        created_at: new Date().toISOString(),
      },
    ] as T[]
  }

  if (sqlQuery.includes("SELECT * FROM users WHERE id")) {
    return [
      {
        id: 1,
        username: "demo_user",
        email: "demo@example.com",
        role: "customer",
        points: 1000,
        reserved_points: 0,
        created_at: new Date().toISOString(),
      },
    ] as T[]
  }

  if (sqlQuery.includes("SELECT * FROM products")) {
    return [
      {
        id: 1,
        name: "Sample Product",
        description: "This is a sample product",
        price: 100,
        image_url: "/placeholder.svg?height=200&width=200",
        active: true,
        category: "bots",
        type: "service",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Another Product",
        description: "Another sample product",
        price: 200,
        image_url: "/placeholder.svg?height=200&width=200",
        active: true,
        category: "resources",
        type: "item",
        created_at: new Date().toISOString(),
      },
    ] as T[]
  }

  if (sqlQuery.includes("SELECT * FROM castles")) {
    return [
      {
        id: 1,
        user_id: 1,
        name: "Demo Castle",
        igg_id: "123456789",
        castle_id: "C123456",
        login_credentials: "demo@example.com\npassword123",
        created_at: new Date().toISOString(),
      },
    ] as T[]
  }

  if (sqlQuery.includes("SELECT * FROM orders")) {
    return [
      {
        id: 1,
        customer_id: 1,
        seller_id: null,
        product_id: 1,
        castle_id: 1,
        status: "pending",
        amount: 100,
        quantity: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as T[]
  }

  if (sqlQuery.includes("INSERT") || sqlQuery.includes("UPDATE") || sqlQuery.includes("DELETE")) {
    return [{ id: Math.floor(Math.random() * 1000) }] as T[]
  }

  return [] as T[]
}

// Query function that uses the Neon client with the correct API
export async function query<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
  try {
    // Use the .query() method for parameterized queries
    const result = await sql.query(sqlQuery, params)
    return result as T[]
  } catch (error) {
    console.error("Database query error:", error)

    // In development or preview, fall back to mock data
    if (process.env.NODE_ENV !== "production") {
      console.warn("Falling back to mock database")
      return mockQuery<T>(sqlQuery, params)
    }

    throw error
  }
}

// Export the client creation function for direct use if needed
export const createDbClient = () => {
  return {
    query: async (sqlQuery: string, params: any[] = []) => {
      return query(sqlQuery, params)
    },
    end: async () => {
      // No need to explicitly end with the Neon serverless driver
    },
  }
}
