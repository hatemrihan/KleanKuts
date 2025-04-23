import { NextResponse } from 'next/server';
import { getCategories, createCategory } from '../../../lib/handlers/categoryHandler';

// GET all categories
export async function GET(req: Request) {
  const { success, data, error } = await getCategories();
  
  if (!success) {
    return NextResponse.json({ error }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST new category
export async function POST(req: Request) {
  const body = await req.json();
  const { success, data, error } = await createCategory(body);
  
  if (!success) {
    return NextResponse.json({ error }, { status: 400 });
  }
  
  return NextResponse.json(data);
} 