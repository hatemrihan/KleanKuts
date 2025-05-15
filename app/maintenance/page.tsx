export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-5xl font-serif mb-8">ELEVE</h1>
        <h2 className="text-3xl font-medium mb-6">Site Under Maintenance</h2>
        <p className="text-lg mb-6">
          We're currently performing scheduled maintenance to improve your shopping experience.
          <br />
          Please check back soon!
        </p>
        <div className="w-16 h-1 bg-amber-500 mx-auto my-8"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Thank you for your patience
        </p>
      </div>
    </div>
  );
} 