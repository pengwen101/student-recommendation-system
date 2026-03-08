const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8000/student/login";
    };

    return (
        <div className="h-screen flex justify-center items-center">
            <div className="w-3/4 flex flex-col justify-center items-center gap-6 text-center">
                <h1>Welcome to Student Resource Recommendation System</h1>
                <button className="px-4 py-2 rounded-full cursor-pointer" onClick={handleGoogleLogin}>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;