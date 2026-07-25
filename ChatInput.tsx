@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --animate-gradient: gradient 15s ease infinite;
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
}

@layer utilities {
  .bg-animated-gradient {
    background-size: 300% 300%;
    animation: gradient 15s ease infinite;
  }
}
