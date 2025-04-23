import dbConnect from "../mongodb";
import { Product } from '../../models/product';
import { Product as ProductType } from '../../../types/product';
import { NextResponse } from "next/server";

export async function updateProduct(id: string, data: Partial<ProductType>) {
    try {
        await dbConnect();
        // ... rest of the function
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

export async function deleteProduct(id: string, permanent: boolean = false) {
    try {
        await dbConnect();
        // ... rest of the function
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

export async function restoreProduct(id: string) {
    try {
        await dbConnect();
        // ... rest of the function
    } catch (error) {
        console.error('Error restoring product:', error);
        throw error;
    }
}

export async function getProduct(id: string) {
    try {
        await dbConnect();
        // ... rest of the function
    } catch (error) {
        console.error('Error getting product:', error);
        throw error;
    }
} 