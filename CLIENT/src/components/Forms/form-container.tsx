import React from "react";
import actslogo from "../Images/actslogo.png";

interface FormContainerProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onSubmit: (e: React.FormEvent) => void;
  footerText: string;
  footerLink: string;
  onFooterClick: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function FormContainer({
  title,
  subtitle,
  buttonText,
  onSubmit,
  footerText,
  footerLink,
  onFooterClick,
  children,
  isLoading = false,
}: FormContainerProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl flex flex-col items-center">
        <div className="w-20 h-20 mb-4 bg-gradient-to-br from-green-500 to-lime-500 rounded-full flex items-center justify-center">
          <img src={actslogo} alt="ACTS Logo" className="w-[4.75rem] h-[4.75rem]" />
        </div>

        <h2 className="text-3xl text-gray-800 mb-2">
          {title}
        </h2>
        <p className="text-gray-600 text-sm mb-6 text-center">
          {subtitle}
        </p>

        <form onSubmit={onSubmit} className="w-full space-y-4">
          {children}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed transition font-medium text-center flex items-center justify-center"
          >
            {isLoading ? "Loading..." : buttonText}
          </button>
        </form>

        <div className="my-4 flex items-center w-full">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-400 text-sm mx-2">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <p className="text-gray-600 text-sm">
          {footerText}{" "}
          <button
            type="button"
            onClick={onFooterClick}
            className="text-green-600 font-medium hover:underline"
          >
            {footerLink}
          </button>
        </p>
      </div>
    </div>
  );
}
