import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchForm from "../src/components/SearchForm.jsx";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SearchForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default placeholder", () => {
    render(<SearchForm />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchForm placeholder="Find products..." />);
    expect(screen.getByPlaceholderText("Find products...")).toBeInTheDocument();
  });

  it("applies maxWidth style", () => {
    const { container } = render(<SearchForm maxWidth="600px" />);
    const wrapper = container.firstChild;
    expect(wrapper.style.maxWidth).toBe("600px");
  });

  it("shows results area when user types", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchForm searchKey="test-key" apiUrl="https://api.example.com" />);
    const input = screen.getByPlaceholderText("Search");

    await user.type(input, "longboard");

    // Results area should appear (even if empty)
    expect(input.closest("div").parentElement.querySelector(".absolute")).toBeInTheDocument();
  });

  it("does not trigger search with fewer than 3 words", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchForm searchKey="test-key" apiUrl="https://api.example.com" />);
    const input = screen.getByPlaceholderText("Search");

    await user.type(input, "board");
    await act(() => vi.advanceTimersByTime(600));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("triggers search after debounce with 3+ words", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: "sess-123" }),
    });

    // Mock EventSource as a class
    class MockEventSource {
      constructor() { this.onmessage = null; this.onerror = null; }
      close() {}
    }
    global.EventSource = MockEventSource;

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchForm searchKey="test-key" apiUrl="https://api.example.com" />);
    const input = screen.getByPlaceholderText("Search");

    await user.type(input, "blue longboard for beginners");
    await act(() => vi.advanceTimersByTime(600));

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/shop/flow/execute",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Search-Key": "test-key",
        }),
      })
    );

    delete global.EventSource;
  });

  it("sends search key in X-Search-Key header, not in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: "sess-456" }),
    });

    class MockES { constructor() { this.onmessage = null; this.onerror = null; } close() {} }
    global.EventSource = MockES;

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchForm searchKey="secret-key-123" apiUrl="https://api.example.com" />);
    const input = screen.getByPlaceholderText("Search");

    await user.type(input, "red surfboard for kids");
    await act(() => vi.advanceTimersByTime(600));

    // Verify the fetch URL does NOT contain the search key
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).not.toContain("secret-key-123");
    // Verify it IS in the header
    expect(fetchCall[1].headers["X-Search-Key"]).toBe("secret-key-123");

    delete global.EventSource;
  });

  it("hides results on click outside", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <div>
        <SearchForm searchKey="test-key" />
        <div data-testid="outside">Outside area</div>
      </div>
    );
    const input = screen.getByPlaceholderText("Search");
    await user.type(input, "test");

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));

    // Results should be hidden
    await waitFor(() => {
      const resultsPanel = input.closest("div").parentElement.querySelector(".absolute");
      expect(resultsPanel).toBeNull();
    });
  });

  it("triggers search on Enter with 3+ words", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: "sess-789" }),
    });
    class MockES2 { constructor() { this.onmessage = null; this.onerror = null; } close() {} }
    global.EventSource = MockES2;

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchForm searchKey="test-key" apiUrl="https://api.example.com" />);
    const input = screen.getByPlaceholderText("Search");

    await user.type(input, "blue board for beginners{Enter}");

    expect(mockFetch).toHaveBeenCalled();

    delete global.EventSource;
  });

  it("does not trigger search on Enter with <3 words", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SearchForm searchKey="test-key" apiUrl="https://api.example.com" />);
    const input = screen.getByPlaceholderText("Search");

    await user.type(input, "board{Enter}");

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
