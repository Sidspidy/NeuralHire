import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-md z-10">
                <div className="glass rounded-xl p-8 shadow-2xl border-white/5">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Neural Recruiter
                        </h1>
                        <p className="text-text-secondary mt-2">AI-Powered Hiring Platform</p>
                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
