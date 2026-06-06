window.addEventListener("load", () => {
    console.log("Loader script executing..."); // Check if script runs

    const loader = document.getElementById("loader");
    const fillElement = document.getElementById("loader-fill");
    const percentageElement = document.getElementById("loader-percentage");
    const mainContent = document.getElementById("main-content");

    // ** Check if elements were found **
    if (!loader) { console.error("Loader element (#loader) not found!"); return; }
    if (!fillElement) { console.error("Fill element (#loader-fill) not found!"); return; }
    if (!percentageElement) { console.error("Percentage element (#loader-percentage) not found!"); return; }
    if (!mainContent) { console.error("Main content element (#main-content) not found!"); return; }

    console.log("Loader elements found.");

    let progress = 0;
    const totalDuration = 2500; // Total loading time in ms
    const intervalTime = 50;  // Update interval in ms
    let interval; // Declare interval variable

    // Function to run the progress update
    function runProgress() {
        progress += (intervalTime / totalDuration) * 100;
        // console.log("Progress:", progress); // Uncomment for detailed progress logging

        if (progress >= 100) {
            progress = 100;
            clearInterval(interval); // Stop the interval
            console.log("Progress complete.");

            // Set final state
            fillElement.style.width = `${progress}%`;
            percentageElement.textContent = `loading... ${Math.round(progress)}%`;

            // Start fade out
            setTimeout(() => {
                console.log("Fading out loader...");
                loader.style.opacity = 0;
                // After fade out, hide loader & show main content
                setTimeout(() => {
                    console.log("Hiding loader, showing main content.");
                    loader.style.display = "none";
                    mainContent.style.opacity = 1;

                    // Animate title letters
                    const title = document.querySelector(".animated-title");
                    if (title) {
                        console.log("Animating title.");
                        const text = title.textContent;
                        title.textContent = '';
                        text.split('').forEach((char, i) => {
                            if (char.trim() === '') char = '\u00A0';
                            const span = document.createElement('span');
                            span.textContent = char;
                            span.style.animationDelay = `${i * 0.1}s`;
                            title.appendChild(span);
                        });
                    } else {
                        console.warn("Animated title element not found.");
                    }

                }, 1000); // Wait for fade out (1s matches CSS transition)
            }, 200); // Short delay before fading

        } else {
            // Update fill width and percentage text
            fillElement.style.width = `${progress}%`;
            percentageElement.textContent = `loading... ${Math.round(progress)}%`;
        }
    }

    // Start the interval
    console.log("Starting progress interval.");
    interval = setInterval(runProgress, intervalTime);
});