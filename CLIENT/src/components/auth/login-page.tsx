import React, { useState } from "react";

interface LoginPageProps {
  onLogin: (role: string) => void;
  onNavigateToSignup: () => void;
}

interface ApiResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    department?: string;
    studentId?: string;
    yearCourse?: string;
    subject?: string;
  };
}

export function LoginPage({ onLogin, onNavigateToSignup }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear errors when user starts typing
    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = { email: "", password: "", general: "" };
    let isValid = true;

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
      isValid = false;
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      console.log('Login attempt with:', { email: formData.email.trim().toLowerCase() });
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data: ApiResponse = await response.json();
      console.log('Login response:', data);

      if (data.success && data.user && data.token) {
        // Store token securely in sessionStorage (more secure than localStorage)
        if (data.token) {
          sessionStorage.setItem("authToken", data.token);
          sessionStorage.setItem("userData", JSON.stringify(data.user));
          // Store expiration time
          const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
          sessionStorage.setItem("tokenExpiration", expirationTime.toString());
          console.log('Token stored in sessionStorage:', data.token);
        }

        // Call onLogin with the user's role
        onLogin(data.user.role);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: data.message || "Login failed. Please try again.",
        }));
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors((prev) => ({
        ...prev,
        general: "Network error. Please check your connection and try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md flex flex-col items-center">
        <div className="w-20 h-20 mb-4 bg-gradient-to-br from-green-500 to-lime-500 rounded-full flex items-center justify-center">
          <img src="/actslogo.png" alt="ACTS Logo" className="w-19 h-19" />
        </div>

        <h2 className="text-3xl text-gray-800 mb-2">FeedB-ACTS System</h2>
        <p className="text-gray-600 text-sm mb-6 text-center">
          Sign in to access your dashboard
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              className={`border rounded-lg w-full p-2 placeholder-gray-400 focus:ring-2 focus:outline-none text-base ${
                errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-green-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className={`border rounded-lg w-full p-2 pr-12 placeholder-gray-400 focus:ring-2 focus:outline-none text-base ${
                  errors.password
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-green-400"
                }`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              >
                {showPassword ? (
                  // Eye with slash (hide password)
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  // Eye (show password)
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium text-center flex items-center justify-center min-h-[44px] text-base"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {errors.general && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {errors.general}
          </div>
        )}

        <div className="my-4 flex items-center w-full">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-400 text-sm mx-2">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <p className="text-gray-600 text-sm">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onNavigateToSignup}
            className="text-green-600 font-medium hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
