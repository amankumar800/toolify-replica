import Link from 'next/link';
import { getAllTools } from '@/lib/services/admin.service';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { deleteToolAction } from '@/app/admin/actions';

export default async function ToolsPage() {
    const tools = await getAllTools();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Manage Tools</h2>
                <Button asChild>
                    <Link href="/admin/tools/new">
                        <Plus className="w-4 h-4 mr-2" /> Add Tool
                    </Link>
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Pricing</th>
                            <th className="px-6 py-4 font-medium">Categories</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tools.map(tool => (
                            <tr key={tool.id} className="group hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{tool.name}</div>
                                    <a href={`/tool/${tool.slug}`} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                        View Live <ExternalLink className="w-3 h-3" />
                                    </a>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{tool.pricing}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="flex gap-2 flex-wrap">
                                        {tool.categories?.slice(0, 2).map(cat => (
                                            <span key={cat} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/admin/tools/${tool.id}/edit`}>
                                                <Pencil className="w-4 h-4 text-gray-500" />
                                            </Link>
                                        </Button>

                                        <form action={async () => {
                                            'use server';
                                            await deleteToolAction(tool.id);
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
