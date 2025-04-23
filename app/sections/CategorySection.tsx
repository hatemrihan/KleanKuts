interface Category {
  _id: string;
  name: string;
}

interface CategorySectionProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function CategorySection({ categories, selectedCategories, onCategoryChange }: CategorySectionProps) {
  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Categories</h2>
        <select
          multiple
          value={selectedCategories}
          onChange={onCategoryChange}
          className="w-full p-2 border rounded"
        >
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 