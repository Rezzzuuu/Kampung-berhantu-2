document.addEventListener("DOMContentLoaded", () => {
    const enterBtn = document.getElementById('enter-btn');
    const introContent = document.getElementById('intro-content');
    const gateImage = document.getElementById('gate-image');
    const fadeOverlay = document.getElementById('fade-overlay');

    enterBtn.addEventListener('click', () => {
        // 1. Disable button
        enterBtn.style.pointerEvents = 'none';

        // GSAP Timeline
        const tl = gsap.timeline({
            onComplete: () => {
                // === CHANGE IS HERE ===
                // Instead of unhiding a div, we redirect to the new file
                window.location.href = "menu.html"; 
            }
        });

        tl
        // 2. Fade out text
        .to(introContent, {
            duration: 0.5,
            opacity: 0,
            ease: "power2.in"
        })
        // 3. Zoom gate & fade to black
        .to(gateImage, {
            duration: 2.5,
            scale: 4, 
            z: 500,   
            ease: "power3.inOut"
        }, "-=0.3") 
        .to(fadeOverlay, {
            duration: 2.5,
            opacity: 1, 
            ease: "power3.inOut"
        }, "<"); 
    });
});