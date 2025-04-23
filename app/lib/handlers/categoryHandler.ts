import dbConnect from "../mongodb";
import { Category } from '../../../models/category';
import { CategoryRequest } from '../../../types/category';
import { NextResponse } from "next/server";

export async function getCategories() {
    try {
        await dbConnect();
        const categories = await Category.find();
        return { success: true, data: categories };
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return { success: false, error: error.message || 'Failed to fetch categories' };
    }
}

export async function createCategory(data: any) {
    try {
        await dbConnect();
        const category = await Category.create(data); 
        
        return { success: true, data: category };
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Failed to create category' };
    }
}

export async function updateCategory(id: string, data: Partial<CategoryRequest>) {
    try {
        await dbConnect();

        // Validate the ID
        if (!id) {
            return { success: false, error: "Category ID is required" };
        }

        // Check if category exists
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return { success: false, error: "Category not found" };
        }

        // If parent is being updated, validate it
        if (data.parent) {
            // Check if parent exists
            const parentCategory = await Category.findById(data.parent);
            if (!parentCategory) {
                return { success: false, error: "Parent category not found" };
            }
            // Prevent circular references
            if (data.parent === id) {
                return { success: false, error: "Category cannot be its own parent" };
            }
        }

        // Generate slug if name is being updated
        if (data.name) {
            data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { 
                ...data,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!updatedCategory) {
            return { success: false, error: "Category not found" };
        }

        return { 
            success: true, 
            data: updatedCategory,
            message: "Category updated successfully"
        };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteCategory(id: string, permanent: boolean = false) {
    try {
        await dbConnect();

        if (permanent) {
            const result = await Category.findByIdAndDelete(id);
            if (!result) {
                return { success: false, error: 'Category not found' };
            }
        } else {
            const result = await Category.findByIdAndUpdate(id, {
                deleted: true,
                deletedAt: new Date()
            });
            if (!result) {
                return { success: false, error: 'Category not found' };
            }
        }

        return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

export async function restoreCategory(id: string) {
    try {
        await dbConnect();

        const result = await Category.findByIdAndUpdate(id, {
            $unset: { deleted: "", deletedAt: "" }
        });

        if (!result) {
            return { success: false, error: 'Category not found' };
        }

        return { success: true, message: 'Category restored successfully' };
    } catch (error) {
        console.error('Error restoring category:', error);
        return { success: false, error: 'Failed to restore category' };
    }
}

export async function getCategory(id: string) {
    try {
        await dbConnect();
        const category = await Category.findById(id);
        
        if (!category) {
            return { success: false, error: 'Category not found' };
        }
        
        return { success: true, data: category };
    } catch (error) {
        console.error('Error fetching category:', error);
        return { success: false, error: 'Failed to fetch category' };
    }
} 