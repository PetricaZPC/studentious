import Head from 'next/head';

/**
 * Placeholder contact & help page.
 */
export default function ContactAndHelp() {
  return (
    <>
      <Head>
        <title>Contact & Help | Studentious</title>
      </Head>

      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Contact & Help</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            If you need assistance, contact the team at <a className="text-blue-600" href="mailto:support@studentious.com">support@studentious.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
