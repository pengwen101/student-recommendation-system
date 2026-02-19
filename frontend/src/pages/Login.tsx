const Login = () => {
    const handleGoogleLogin = () => {
        // Redirect browser to FastAPI backend
        window.location.href = "http://localhost:8000/login";
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>Welcome to Student Portal</h1>
            <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Sign in with Google
            </button>
        </div>
    );
};

export default Login;