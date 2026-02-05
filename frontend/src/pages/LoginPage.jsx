import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router";
import { LogInIcon, UserPlusIcon } from "lucide-react";

function LoginPage() {
    const { login } = useUser();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert("Please enter your name");
            return;
        }

        // Create user and login
        login({
            fullName: formData.name,
            email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '_')}@meeting.local`,
        });

        // Redirect to dashboard
        navigate("/dashboard");
    };

    const handleQuickLogin = () => {
        const randomId = Math.floor(Math.random() * 1000);
        login({
            fullName: `Guest User ${randomId}`,
            email: `guest${randomId}@meeting.local`,
        });
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="card bg-base-100 shadow-2xl">
                    <div className="card-body">
                        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Welcome to Meeting Platform
                        </h1>
                        <p className="text-center text-base-content/70 mb-6">
                            Enter your details to get started
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Your Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email (Optional)</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className="input input-bordered w-full"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full gap-2">
                                <LogInIcon className="size-5" />
                                Join Meeting Platform
                            </button>
                        </form>

                        <div className="divider">OR</div>

                        <button onClick={handleQuickLogin} className="btn btn-ghost w-full gap-2">
                            <UserPlusIcon className="size-5" />
                            Continue as Guest
                        </button>
                    </div>
                </div>

                <p className="text-center text-sm text-base-content/60 mt-4">
                    No account needed • Start collaborating instantly
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
