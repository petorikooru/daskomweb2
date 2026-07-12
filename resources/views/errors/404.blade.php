<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LMS Daskom</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .unreachable {
            position: relative;
            transition: transform 0.2s ease-in-out;
        }
    </style>
</head>
<body class="bg-[#0a480a] min-h-screen flex justify-center items-center relative">
    <div class="bg-[#0a480a] min-h-screen flex flex-col justify-center items-center text-center">
        <img src="{{ asset('assets/daskomLogoLandscape-BqygLiwT.svg') }}" alt="Daskom Logo" class="w-64 mb-6">
        <h4 class="text-gray-300 text-4xl font-extrabold">Gak ketemu nih laman nya</h4>
        <p class="text-gray-300 text-lg mt-2">Balik Aja yuk 😊🙏</p>
        
        <!-- Go Back Button -->
        <button onclick="window.history.back()" 
            class="mt-4 px-6 py-2 bg-white text-[#0a480a] font-semibold rounded-lg shadow-md hover:bg-gray-200 transition">
            Balik Deh
        </button>

        <!-- Runaway Button -->
        <button id="runawayButton" 
            class="mt-4 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md cursor-pointer unreachable">
            Lanjut Aja
        </button>
    </div>

    <script>
        const runawayButton = document.getElementById('runawayButton');

        runawayButton.addEventListener('mouseenter', function() {
            const maxX = window.innerWidth / 2;
            const maxY = window.innerHeight / 2;

            const offsetX = (Math.random() - 0.5) * maxX;
            const offsetY = (Math.random() - 0.5) * maxY;

            runawayButton.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });

        runawayButton.addEventListener('click', function() {
            window.location.href = "https://www.youtube.com/watch?v=xvFZjo5PgG0";
        });
    </script>
</body>
</html>
