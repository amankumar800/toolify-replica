import { ToolForm } from '@/components/admin/ToolForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewToolPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-blue-600">
                    <Link href="/admin/tools">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Add New Tool</h1>
            </div>

            <ToolForm />
        </div>
    );
}
