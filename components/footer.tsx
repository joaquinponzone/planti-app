export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 pt-12 text-center text-sm text-gray-600 dark:text-gray-400">
      <p>
      © {currentYear} • Made with ♥️ by{" "}
        <a
          href="https://github.com/joaquinponzone"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-900 transition-colors"
        >
          @joaquinponzone
        </a>
      </p>
    </footer>
  );
} 