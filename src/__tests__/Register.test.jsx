import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthContext } from "../contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import Register from "../pages/Register";
import { vi } from "vitest";

// 👇 Define this before mocking
const mockNavigate = vi.fn();

// 👇 Mock BEFORE importing component that uses it
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("Register Page", () => {
    it("renders Register form", () => {
        render(
                <AuthContext.Provider value={{ register: vi.fn(), user: null }}>
                    <Register />
                </AuthContext.Provider>
        );

        expect(screen.getAllByText(/register/i).length).toBeGreaterThan(0);

    });
});
