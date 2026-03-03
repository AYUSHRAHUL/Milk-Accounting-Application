import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return Response.json({ error: 'Email and password are required' }, { status: 400 });
        }

        await connectToDatabase();

        // Find the user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        // SECURITY NOTE: In production, verify against a bcrypt hashed password
        if (user.password !== password) {
            return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Return the successful user state
        return Response.json({
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Login Error:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
