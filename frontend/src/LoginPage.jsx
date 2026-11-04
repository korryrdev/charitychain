import { useState } from "react";

function LoginPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password || (isRegistering && !name)) {
      alert("Please complete all required fields.");
      return;
    }

    if (isRegistering) {
      alert("Account created successfully.");
    }

    onLogin();
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>{isRegistering ? "Create your account" : "Welcome back"}</h1>

        <p>
          {isRegistering
            ? "Register to track your donations and impact."
            : "Sign in to continue to ChainAid."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button className="primary-button" type="submit">
            {isRegistering ? "Register" : "Sign in"}
          </button>
        </form>

        <p className="login-switch">
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            className="text-button"
            type="button"
            onClick={() => setIsRegistering((current) => !current)}
          >
            {isRegistering ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;