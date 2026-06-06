document.addEventListener("DOMContentLoaded", () => {
    console.log("Settings script loaded.");

    const toggleButton = document.getElementById("theme-toggle");
    const toggleKnob = document.getElementById("theme-toggle-knob");
    const clearMemoryBtn = document.getElementById("clear-memory-btn");
    const htmlElement = document.documentElement;

    if (!toggleButton || !toggleKnob) {
        console.error("Theme toggle elements not found!");
    }

    // Function to visually update the toggle button's state
    const updateToggleVisuals = (isDark) => {
        if (!toggleButton || !toggleKnob) return;

        console.log("Updating visuals. isDark:", isDark); // Log visual update attempt

        if (isDark) {
            // Apply dark state visuals to button background
            toggleButton.classList.remove("bg-gray-200");
            toggleButton.classList.add("bg-indigo-600");
            toggleButton.setAttribute('aria-checked', 'true');
            // ** Directly set transform for knob **
            toggleKnob.style.transform = 'translateX(1.25rem)'; // Equivalent to translate-x-5
        } else {
            // Apply light state visuals to button background
            toggleButton.classList.remove("bg-indigo-600");
            toggleButton.classList.add("bg-gray-200");
            toggleButton.setAttribute('aria-checked', 'false');
            // ** Directly set transform for knob **
            toggleKnob.style.transform = 'translateX(0rem)'; // Equivalent to translate-x-0
        }
    };

    // Function to apply the theme (updates <html>, localStorage, and toggle UI)
    const applyTheme = (isDark) => {
        console.log("Applying theme:", isDark ? "Dark" : "Light");
        try {
            // Update <html> class
            if (isDark) {
                htmlElement.classList.add("dark");
            } else {
                htmlElement.classList.remove("dark");
            }
            // Update localStorage
            localStorage.setItem("theme", isDark ? "dark" : "light");
            // Update the toggle button's appearance
            updateToggleVisuals(isDark); // Call visual update
            console.log("Theme applied. localStorage:", localStorage.getItem('theme'), " | <html> class:", htmlElement.className);
        } catch (error) {
            console.error("Error applying theme:", error);
        }
    };

    // Determine and apply initial theme ONCE after script loads
    const initializeTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        let initialIsDark;

        if (storedTheme !== null) {
            initialIsDark = storedTheme === 'dark';
            console.log("Theme found in localStorage:", storedTheme);
        } else {
            initialIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            console.log("No theme in localStorage, using OS preference:", initialIsDark ? "Dark" : "Light");
            localStorage.setItem('theme', initialIsDark ? 'dark' : 'light');
        }

        // Apply theme based on determination (updates <html>, localStorage, toggle visuals)
        applyTheme(initialIsDark);
    };

    // Initialize the theme state when the script runs
    initializeTheme();

    // Add click listener to the toggle button (if it exists)
    if (toggleButton) {
        toggleButton.addEventListener("click", () => {
            const currentIsDark = htmlElement.classList.contains('dark');
            const wantsDark = !currentIsDark; // Calculate the desired opposite state
            console.log("Toggle clicked. Current dark:", currentIsDark, " | Wants Dark:", wantsDark);
            applyTheme(wantsDark); // Apply the toggled theme
        });
    }

    // --- Clear Memory Logic --- (Remains the same)
    if (!clearMemoryBtn) {
        console.error("Clear memory button not found!");
    } else {
        clearMemoryBtn.addEventListener("click", async () => {
            const isConfirmed = confirm(/*...*/);
            if (isConfirmed) {
                try {
                    const response = await fetch("/clear-memory", { method: "POST" });
                    if (response.ok) { alert("✅ Vendor memory cleared."); }
                    else { alert("❌ Error clearing memory."); }
                } catch (error) { alert("❌ Network error."); console.error(error); }
            }
        });
    }
});