"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-gray-700)]"
          >
            {label}
            {props.required && <span className="text-[var(--color-error)] ms-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-[var(--color-gray-400)]">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full rounded-[var(--radius-lg)] border bg-white text-[var(--color-foreground)] text-sm",
              "placeholder:text-[var(--color-gray-400)] transition-all duration-[var(--transition-fast)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] focus:border-transparent",
              "disabled:bg-[var(--color-gray-50)] disabled:cursor-not-allowed",
              error
                ? "border-[var(--color-error)] focus:ring-[var(--color-error)]"
                : "border-[var(--color-border)] hover:border-[var(--color-gray-400)]",
              leftAddon ? "ps-10" : "ps-4",
              rightAddon ? "pe-10" : "pe-4",
              "py-2.5",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {rightAddon && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--color-gray-400)]">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-gray-700)]">
            {label}
            {props.required && <span className="text-[var(--color-error)] ms-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-[var(--radius-lg)] border px-4 py-2.5 bg-white text-sm resize-y min-h-24",
            "placeholder:text-[var(--color-gray-400)] transition-all duration-[var(--transition-fast)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] focus:border-transparent",
            error ? "border-[var(--color-error)]" : "border-[var(--color-border)] hover:border-[var(--color-gray-400)]",
            className,
          ].filter(Boolean).join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
