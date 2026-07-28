"use client";

import { Fragment, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  useGetAdminCategoriesQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
} from "../../store/api/admin/categoriesApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import type { AdminCategoryDto } from "../../lib/types-admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryManager() {
  const { data: categories, isLoading } = useGetAdminCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateAdminCategoryMutation();
  const [updateCategory] = useUpdateAdminCategoryMutation();
  const [deleteCategory] = useDeleteAdminCategoryMutation();

  const [editing, setEditing] = useState<AdminCategoryDto | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <Spinner label="Loading categories" />;

  const topLevel = categories?.filter((c) => !c.parentId) ?? [];

  function startEdit(category: AdminCategoryDto) {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setParentId(category.parentId ?? "");
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setSlug("");
    setParentId("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await updateCategory({ id: editing.id, input: { name, slug, parentId: parentId || undefined } }).unwrap();
      } else {
        await createCategory({ name, slug, parentId: parentId || undefined }).unwrap();
      }
      resetForm();
    } catch (err) {
      setError((err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? "Something went wrong");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id).unwrap();
    } catch (err) {
      setError((err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? "Could not delete category");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {topLevel.map((category) => (
                <Fragment key={category.id}>
                  <CategoryRow category={category} onEdit={startEdit} onDelete={handleDelete} />
                  {categories
                    ?.filter((c) => c.parentId === category.id)
                    .map((child) => <CategoryRow key={child.id} category={child} indent onEdit={startEdit} onDelete={handleDelete} />)}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex h-fit flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">{editing ? "Edit category" : "New category"}</h2>
        <Input
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!editing) setSlug(slugify(e.target.value));
          }}
          required
        />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Parent category (optional)
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">None (top-level)</option>
            {topLevel
              .filter((c) => c.id !== editing?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" isLoading={isCreating} size="sm">
            {editing ? "Save" : "Create"}
          </Button>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function CategoryRow({
  category,
  indent,
  onEdit,
  onDelete,
}: {
  category: AdminCategoryDto;
  indent?: boolean;
  onEdit: (c: AdminCategoryDto) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-b border-slate-50 last:border-none">
      <td className="px-4 py-2 text-slate-800">
        {indent && <span className="mr-2 text-slate-300">↳</span>}
        {category.name}
      </td>
      <td className="px-4 py-2 text-slate-500">{category.slug}</td>
      <td className="px-4 py-2 text-slate-500">{category.isActive ? "Active" : "Inactive"}</td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onEdit(category)} aria-label="Edit" className="text-slate-400 hover:text-slate-700">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onDelete(category.id)} aria-label="Delete" className="text-slate-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
