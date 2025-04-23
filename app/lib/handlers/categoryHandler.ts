import { mongooseConnect } from "../mongoose";
import { Category } from '../../models/category';
import { CategoryRequest } from '../../../types/category';
import { NextResponse } from "next/server";
import dbConnect from '../mongodb';

export async function getCategories() {
    try {
        await dbConnect();
        const categories = await Category.find({ deleted: { $ne: true } });
        return { success: true, data: categories };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return { success: false, error: 'Failed to fetch categories' };
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
        await mongooseConnect();

        // Validate the ID
        if (!id) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Check if category exists
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // If parent is being updated, validate it
        if (data.parent) {
            // Check if parent exists
            const parentCategory = await Category.findById(data.parent);
            if (!parentCategory) {
                return NextResponse.json(
                    { error: "Parent category not found" },
                    { status: 400 }
                );
            }
            // Prevent circular references
            if (data.parent === id) {
                return NextResponse.json(
                    { error: "Category cannot be its own parent" },
                    { status: 400 }
                );
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
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            message: "Category updated successfully",
            category: updatedCategory
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

export async function deleteCategory(id: string, permanent: boolean = false) {
    try {
        await mongooseConnect();

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
        await mongooseConnect();

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
        await mongooseConnect();
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