import connectToDatabase from '@/lib/mongodb';
import { MilkEntry } from '@/models/MilkEntry';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();

        const { id } = params;
        if (!id) {
            return Response.json({ error: 'Milk Entry ID is required' }, { status: 400 });
        }

        const body = await req.json();
        const updatedEntry = await MilkEntry.findByIdAndUpdate(id, body, { new: true });

        if (!updatedEntry) {
            return Response.json({ error: 'Milk Entry not found' }, { status: 404 });
        }

        return Response.json({ message: 'Milk Entry updated successfully', entry: updatedEntry }, { status: 200 });
    } catch (error: any) {
        console.error('PUT Milk Entry Error:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();

        const { id } = params;
        if (!id) {
            return Response.json({ error: 'Milk Entry ID is required' }, { status: 400 });
        }

        const deletedEntry = await MilkEntry.findByIdAndDelete(id);

        if (!deletedEntry) {
            return Response.json({ error: 'Milk Entry not found' }, { status: 404 });
        }

        return Response.json({ message: 'Milk Entry deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('DELETE Milk Entry Error:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
